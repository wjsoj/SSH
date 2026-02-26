import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface GitHubRepoContent {
  name: string;
  path: string;
  type: "dir" | "file";
  sha: string;
}

interface GitHubFileContent {
  content: string;
  encoding: string;
}

interface GitHubRepository {
  stargazers_count: number;
  description: string | null;
}

const GITHUB_API_BASE = "https://api.github.com";

async function fetchWithAuth(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      ...(process.env.GITHUB_TOKEN && { Authorization: `token ${process.env.GITHUB_TOKEN}` }),
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} - ${url}`);
  }
  return response.json();
}

function extractDescription(content: string): string | null {
  const lines = content.split("\n");

  // Skip YAML frontmatter if present
  let startIndex = 0;
  if (lines[0]?.trim() === "---") {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]?.trim() === "---") {
        startIndex = i + 1;
        break;
      }
    }
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    // Skip empty lines, headings, and horizontal rules
    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      trimmed === "---" ||
      trimmed === "***" ||
      trimmed === "___"
    ) {
      continue;
    }
    return trimmed.slice(0, 200);
  }
  return null;
}

async function syncSkillsToDatabase(
  repoId: string,
  owner: string,
  name: string,
  skillsFolder: string,
  defaultDescription?: string,
) {
  // Fetch repository info to get stars and description
  let repoStars = 0;
  let repoDescription: string | null = null;
  try {
    const repoInfo = (await fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${owner}/${name}`,
    )) as GitHubRepository;
    repoStars = repoInfo.stargazers_count;
    repoDescription = repoInfo.description;
  } catch (error) {
    console.error("Error fetching repo info:", error);
  }

  const skills: Array<{
    name: string;
    slug: string;
    description: string | null;
    readmeContent: string | null;
    folderPath: string | null;
  }> = [];

  // Try skills folder first
  try {
    const contents = (await fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${owner}/${name}/contents/${skillsFolder}`,
    )) as GitHubRepoContent[];

    for (const item of contents) {
      if (item.type === "dir") {
        try {
          const readmeContent = (await fetchWithAuth(
            `${GITHUB_API_BASE}/repos/${owner}/${name}/contents/${item.path}/SKILL.md`,
          )) as GitHubFileContent;

          if (readmeContent.content) {
            const decodedContent = Buffer.from(readmeContent.content, "base64").toString("utf-8");
            const description = extractDescription(decodedContent);

            skills.push({
              name: item.name,
              slug: item.name,
              description,
              readmeContent: decodedContent,
              folderPath: `${skillsFolder}/${item.name}`,
            });
          }
        } catch {
          // SKILL.md not found in this folder
        }
      }
    }
  } catch {
    console.log(`Skills folder "${skillsFolder}" not found at root, trying subdirectories...`);
  }

  // Also scan subdirectories for SKILL.md (for agent-skills case)
  try {
    const rootContents = (await fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${owner}/${name}/contents`,
    )) as GitHubRepoContent[];

    for (const item of rootContents) {
      if (item.type === "dir" && item.name !== ".git" && item.name !== skillsFolder) {
        try {
          const readmeContent = (await fetchWithAuth(
            `${GITHUB_API_BASE}/repos/${owner}/${name}/contents/${item.name}/SKILL.md`,
          )) as GitHubFileContent;

          if (readmeContent.content) {
            const decodedContent = Buffer.from(readmeContent.content, "base64").toString("utf-8");
            const description = extractDescription(decodedContent);

            // Avoid duplicates
            if (!skills.find((s) => s.name === item.name)) {
              skills.push({
                name: item.name,
                slug: item.name,
                description,
                readmeContent: decodedContent,
                folderPath: item.name,
              });
            }
          }
        } catch {
          // SKILL.md not found
        }
      }
    }
  } catch (error) {
    console.error("Error scanning root:", error);
  }

  console.log(`Found ${skills.length} skills for ${owner}/${name}`);

  // Upsert skills to database
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: {
        repositoryId_slug: {
          repositoryId: repoId,
          slug: skill.slug,
        },
      },
      create: {
        repositoryId: repoId,
        name: skill.name,
        slug: skill.slug,
        description: skill.description,
        readmeContent: skill.readmeContent,
        command: `npx skills add https://github.com/${owner}/${name} --skill ${skill.name}`,
        folderPath: skill.folderPath,
      },
      update: {
        description: skill.description,
        readmeContent: skill.readmeContent,
        command: `npx skills add https://github.com/${owner}/${name} --skill ${skill.name}`,
        lastSyncedAt: new Date(),
      },
    });
  }

  // Update repository with stars and description
  await prisma.repository.update({
    where: { id: repoId },
    data: {
      description: repoDescription || defaultDescription || null,
      stars: repoStars,
      lastSyncedAt: new Date(),
    },
  });

  return skills.length;
}

async function main() {
  console.log("Starting database seed...");

  const repositories = [
    {
      owner: "vercel-labs",
      name: "skills",
      url: "https://github.com/vercel-labs/skills",
      description: "Official Vercel skills repository with various AI agent skills",
      skillsFolder: "skills",
    },
    {
      owner: "vercel-labs",
      name: "agent-skills",
      url: "https://github.com/vercel-labs/agent-skills",
      description: "Vercel agent skills in subdirectories",
      skillsFolder: "skills",
    },
  ];

  for (const repoData of repositories) {
    console.log(`\nProcessing ${repoData.owner}/${repoData.name}...`);

    // Create or get repository
    const repo = await prisma.repository.upsert({
      where: { fullName: `${repoData.owner}/${repoData.name}` },
      create: {
        owner: repoData.owner,
        name: repoData.name,
        fullName: `${repoData.owner}/${repoData.name}`,
        url: repoData.url,
        description: repoData.description,
        skillsFolder: repoData.skillsFolder,
        sourceType: "GITHUB",
      },
      update: {
        description: repoData.description,
        lastSyncedAt: new Date(),
      },
    });

    console.log(`Repository created/updated: ${repo.fullName}`);

    // Sync skills from GitHub
    const count = await syncSkillsToDatabase(
      repo.id,
      repoData.owner,
      repoData.name,
      repoData.skillsFolder,
      repoData.description,
    );
    console.log(`Synced ${count} skills`);
  }

  // Display summary
  const repoCount = await prisma.repository.count();
  const skillCount = await prisma.skill.count();

  console.log(`\n=== Seed Complete ===`);
  console.log(`Repositories: ${repoCount}`);
  console.log(`Skills: ${skillCount}`);

  // List all skills
  const allSkills = await prisma.skill.findMany({
    include: { repository: true },
  });

  console.log("\n=== Skills List ===");
  for (const skill of allSkills) {
    console.log(`- ${skill.repository.owner}/${skill.repository.name}/${skill.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
