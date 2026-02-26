import matter from "gray-matter";
import { prisma } from "@/lib/prisma";

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

const GITHUB_API_BASE = "https://api.github.com";

async function fetchWithAuth(url: string, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(process.env.GITHUB_TOKEN && { Authorization: `token ${process.env.GITHUB_TOKEN}` }),
      },
      signal: controller.signal,
      next: { revalidate: 300 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("GitHub API request timeout");
    }
    throw error;
  }
}

export interface SyncProgress {
  status: "scanning" | "processing" | "saving" | "complete" | "error";
  message: string;
  currentPath?: string;
  skillsFound?: number;
  totalSkills?: number;
}

export async function syncRepository(
  repoId: string,
  onProgress?: (progress: SyncProgress) => void,
) {
  const repo = await prisma.repository.findUnique({
    where: { id: repoId },
  });

  if (!repo) throw new Error("Repository not found");

  // Store repo info in local variables to avoid closure issues
  const repoOwner = repo.owner;
  const repoName = repo.name;

  // Fetch repository info from GitHub (including stars)
  if (repo.sourceType === "GITHUB") {
    try {
      const repoInfo = (await fetchWithAuth(
        `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}`,
      )) as { stargazers_count: number };

      await prisma.repository.update({
        where: { id: repoId },
        data: { stars: repoInfo.stargazers_count || 0 },
      });
    } catch (error) {
      console.error("Error fetching repo stars:", error);
    }
  }

  const skills: Array<{
    name: string;
    slug: string;
    description: string | null;
    readmeContent: string | null;
    folderPath: string | null;
  }> = [];

  const skillsFolderPath = repo.skillsFolder || "skills";

  // Check if a directory contains SKILL.md
  async function checkSkillInFolder(folderPath: string): Promise<boolean> {
    try {
      const contents = (await fetchWithAuth(
        `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/contents/${folderPath}`,
      )) as GitHubRepoContent[];

      const hasSkillMd = contents.some((item) => item.name === "SKILL.md" && item.type === "file");
      return hasSkillMd;
    } catch {
      return false;
    }
  }

  // Recursively scan for folders containing SKILL.md
  async function scanFolder(path: string) {
    onProgress?.({
      status: "scanning",
      message: "Scanning repository...",
      currentPath: path,
      skillsFound: skills.length,
    });

    try {
      const contents = (await fetchWithAuth(
        `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/contents/${path}`,
      )) as GitHubRepoContent[];

      for (const item of contents) {
        if (item.type === "dir") {
          // Check if this folder contains SKILL.md
          const skillPath = item.path;
          const hasSkill = await checkSkillInFolder(skillPath);

          if (hasSkill) {
            // This folder is a skill
            const skillName = item.name;

            onProgress?.({
              status: "processing",
              message: `Processing skill: ${skillName}`,
              currentPath: skillPath,
              skillsFound: skills.length,
            });

            try {
              const fileContent = (await fetchWithAuth(
                `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/contents/${skillPath}/SKILL.md`,
              )) as GitHubFileContent;

              if (fileContent.content) {
                const decodedContent = Buffer.from(fileContent.content, "base64").toString("utf-8");
                const { content: cleanContent, description } = parseMarkdown(decodedContent);

                // Avoid duplicates by folderPath
                if (!skills.find((s) => s.folderPath === skillPath)) {
                  skills.push({
                    name: skillName,
                    slug: skillName,
                    description,
                    readmeContent: cleanContent,
                    folderPath: skillPath,
                  });
                }
              }
            } catch {
              // Error reading file
            }
          } else {
            // No SKILL.md in this folder, continue scanning recursively
            await scanFolder(item.path);
          }
        }
      }
    } catch {
      // Folder not found, skip
    }
  }

  // Start scanning from the configured skills folder
  await scanFolder(skillsFolderPath);

  // Also try scanning root directory if skills folder doesn't exist or is empty
  if (skills.length === 0 && repo.sourceType === "GITHUB") {
    onProgress?.({
      status: "scanning",
      message: "Scanning root directory...",
      currentPath: "",
      skillsFound: skills.length,
    });

    try {
      const rootContents = (await fetchWithAuth(
        `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/contents`,
      )) as GitHubRepoContent[];

      for (const item of rootContents) {
        if (item.type === "file" && item.name === "SKILL.md") {
          const skillName = repoName; // Use repo name for root-level SKILL.md

          onProgress?.({
            status: "processing",
            message: `Processing skill: ${skillName}`,
            currentPath: "SKILL.md",
            skillsFound: skills.length,
          });

          const fileContent = (await fetchWithAuth(
            `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/contents/SKILL.md`,
          )) as GitHubFileContent;

          if (fileContent.content) {
            const decodedContent = Buffer.from(fileContent.content, "base64").toString("utf-8");
            const { content: cleanContent, description } = parseMarkdown(decodedContent);

            skills.push({
              name: skillName,
              slug: skillName,
              description,
              readmeContent: cleanContent,
              folderPath: "",
            });
          }
        }
      }
    } catch {
      // Error scanning root
    }
  }

  // Upsert skills to database
  onProgress?.({
    status: "saving",
    message: `Saving ${skills.length} skills to database...`,
    skillsFound: skills.length,
  });

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: {
        repositoryId_slug: {
          repositoryId: repo.id,
          slug: skill.slug,
        },
      },
      create: {
        repositoryId: repo.id,
        name: skill.name,
        slug: skill.slug,
        description: skill.description,
        readmeContent: skill.readmeContent,
        command: `npx skills add ${repo.url} --skill ${skill.name}`,
        folderPath: skill.folderPath,
      },
      update: {
        description: skill.description,
        readmeContent: skill.readmeContent,
        command: `npx skills add ${repo.url} --skill ${skill.name}`,
        lastSyncedAt: new Date(),
      },
    });
  }

  // Update repository sync time
  await prisma.repository.update({
    where: { id: repoId },
    data: { lastSyncedAt: new Date() },
  });

  onProgress?.({
    status: "complete",
    message: `Sync complete! Found ${skills.length} skills.`,
    skillsFound: skills.length,
  });

  return { synced: skills.length };
}

function extractDescription(content: string): string | null {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      return trimmed.slice(0, 200);
    }
  }
  return null;
}

function parseMarkdown(rawContent: string): { content: string; description: string | null } {
  const { data, content } = matter(rawContent);

  // Extract description from frontmatter or first non-heading line
  let description: string | null = null;

  if (data.description) {
    description = data.description;
  } else {
    description = extractDescription(content);
  }

  return { content, description };
}

export async function createRepository(data: {
  owner: string;
  name: string;
  url: string;
  description?: string;
  skillsFolder?: string;
  sourceType?: "GITHUB" | "GITLAB" | "SELF_HOSTED";
}) {
  const fullName = `${data.owner}/${data.name}`;

  // Check if repository already exists
  const existing = await prisma.repository.findUnique({
    where: { fullName },
  });

  if (existing) {
    return existing;
  }

  return prisma.repository.create({
    data: {
      owner: data.owner,
      name: data.name,
      fullName,
      url: data.url,
      description: data.description,
      skillsFolder: data.skillsFolder || "skills",
      sourceType: data.sourceType || "GITHUB",
    },
  });
}
