#!/usr/bin/env bun
/**
 * Interactive script to promote a user to ADMIN by GitHub username.
 * Usage: bun scripts/make-admin.ts
 */

import { createInterface } from "node:readline";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

async function main() {
  const username = (await ask("GitHub username: ")).trim();
  if (!username) {
    console.error("No username provided.");
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    where: { name: { equals: username } },
    select: { id: true, name: true, email: true, role: true },
  });

  if (users.length === 0) {
    console.error(`No user found with name "${username}".`);
    process.exit(1);
  }

  if (users.length > 1) {
    console.log("Multiple matches:");
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      console.log(`  [${i}] ${u.name} <${u.email}> (${u.role})`);
    }
    const idx = Number(await ask("Select index: "));
    if (Number.isNaN(idx) || !users[idx]) {
      console.error("Invalid selection.");
      process.exit(1);
    }
    await promote(users[idx]);
  } else {
    await promote(users[0]);
  }
}

async function promote(user: {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}) {
  if (user.role === "ADMIN") {
    console.log(`${user.name} <${user.email}> is already ADMIN.`);
    process.exit(0);
  }

  const confirm = (await ask(`Promote ${user.name} <${user.email}> to ADMIN? [y/N] `))
    .trim()
    .toLowerCase();
  if (confirm !== "y") {
    console.log("Aborted.");
    process.exit(0);
  }

  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  console.log(`Done. ${user.name} is now ADMIN.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    rl.close();
    prisma.$disconnect();
  });
