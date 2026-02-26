import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Parse GitHub URL and extract owner, name, and skills folder path
function parseGitHubUrl(url: string): {
  owner: string;
  name: string;
  skillsFolder: string;
  sourceType: string;
} | null {
  // Handle various GitHub URL formats
  // https://github.com/owner/repo
  // https://github.com/owner/repo/
  // https://github.com/owner/repo/tree/main/skills
  // https://github.com/owner/repo/tree/main/some-folder
  // https://github.com/owner/repo/blob/main/skills/skill-name/SKILL.md
  // https://github.com/owner/repo/blob/main/scientific-skills/research-grants/SKILL.md

  // Normalize blob to tree
  const normalizedUrl = url.replace("/blob/", "/tree/");

  const patterns = [
    // Standard repo: https://github.com/owner/repo
    /github\.com\/([^/]+)\/([^/]+?)(?:\/|$)/,
    // Tree path: https://github.com/owner/repo/tree/branch/path
    /github\.com\/([^/]+)\/([^/]+?)\/tree\/[^/]+\/(.+)/,
  ];

  for (const pattern of patterns) {
    const match = normalizedUrl.match(pattern);
    if (match) {
      const owner = match[1];
      const name = match[2].replace(/\.git$/, "");
      let skillsFolder = "skills";

      // Check if URL contains a path after the repo name
      if (match[3]) {
        const pathParts = match[3].split("/");
        // The path could be:
        // 1. skills (folder name)
        // 2. skill-name (specific skill folder)
        // 3. skills/skill-name (nested)
        skillsFolder = pathParts[0];
      }

      return {
        owner,
        name,
        skillsFolder,
        sourceType: "GITHUB",
      };
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url, skillsFolder } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Parse the URL
    const parsed = parseGitHubUrl(url);

    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL. Please provide a valid GitHub repository URL." },
        { status: 400 },
      );
    }

    // Use user-provided skillsFolder or default to parsed value
    const finalSkillsFolder = skillsFolder?.trim() || parsed.skillsFolder;

    // Check if repository already exists
    const existingRepo = await prisma.repository.findFirst({
      where: {
        OR: [{ fullName: `${parsed.owner}/${parsed.name}` }, { url: url }],
      },
    });

    if (existingRepo) {
      return NextResponse.json(
        { error: "Repository already exists in the system" },
        { status: 409 },
      );
    }

    // Check if there's already a pending submission
    const existingSubmission = await prisma.repositorySubmission.findUnique({
      where: { url },
    });

    if (existingSubmission) {
      if (existingSubmission.status === "PENDING") {
        return NextResponse.json({ error: "This URL is already pending review" }, { status: 409 });
      } else if (existingSubmission.status === "REJECTED") {
        // Allow re-submission for rejected ones
        const submission = await prisma.repositorySubmission.update({
          where: { id: existingSubmission.id },
          data: {
            status: "PENDING",
            submittedById: session.user.id,
          },
        });
        return NextResponse.json(submission, { status: 201 });
      }
    }

    // Create submission
    const submission = await prisma.repositorySubmission.create({
      data: {
        url,
        owner: parsed.owner,
        name: parsed.name,
        skillsFolder: finalSkillsFolder,
        sourceType: parsed.sourceType,
        submittedById: session.user.id,
        status: "PENDING",
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's submissions
  const submissions = await prisma.repositorySubmission.findMany({
    where: { submittedById: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(submissions);
}
