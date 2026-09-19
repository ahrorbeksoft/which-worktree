import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"));

const args = process.argv.slice(2);
const passthroughArgs = args.filter((a) => a.startsWith("--"));
let target = args.find((a) => !a.startsWith("--"));

async function main() {
  console.log(`=== ${manifest.name} Release & Publish Tool ===`);

  // 1. Check npm auth
  console.log("\nChecking npm login status...");
  const whoami = spawnSync("npm", ["whoami"], { stdio: "pipe", encoding: "utf8" });
  if (whoami.status !== 0) {
    console.log("⚠️ NPM login expired or not found. Launching npm login...");
    const login = spawnSync("npm", ["login"], { stdio: "inherit" });
    if (login.status !== 0) {
      console.error("❌ npm login failed. Exiting.");
      process.exit(1);
    }
  } else {
    console.log(`\u001b[32m✅ Logged in as: ${whoami.stdout.trim()}\u001b[0m`);
  }

  // 2. Select version bump type (arg or prompt; "current" skips the bump)
  console.log(`Current version: ${manifest.version}`);
  if (!target) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    target = await new Promise((resolve) => {
      rl.question(
        "\nSelect version increment (patch, minor, major, explicit version e.g. 1.0.2, or 'current' to publish as-is): ",
        (answer) => {
          rl.close();
          resolve(answer.trim());
        }
      );
    });
  }

  // 3. Apply versioning — npm version also creates a git commit + tag in a repo
  if (target && target !== "current") {
    console.log(`\n> Applying version bump: ${target}...`);
    const versionArgs = ["version", target];
    if (!existsSync(join(rootDir, ".git"))) versionArgs.push("--no-git-tag-version");
    const versionResult = spawnSync("npm", versionArgs, { cwd: rootDir, stdio: "inherit" });
    if (versionResult.status !== 0) {
      console.error("❌ Version bump failed.");
      process.exit(versionResult.status ?? 1);
    }
  }

  // 4. Publish
  const isDryRun = passthroughArgs.includes("--dry-run");
  console.log(`\n> Publishing ${manifest.name}${isDryRun ? " (dry run)" : ""}...`);
  const publishResult = spawnSync("npm", ["publish", "--access", "public", ...passthroughArgs], {
    cwd: rootDir,
    stdio: "inherit"
  });
  if (publishResult.status !== 0) {
    console.error(`❌ Failed to publish ${manifest.name}.`);
    process.exit(publishResult.status ?? 1);
  }

  console.log(`\n\u001b[32m🎉 ${manifest.name} published successfully!\u001b[0m`);
}

main().catch((err) => {
  console.error("Unhandled error in publish script:", err);
  process.exit(1);
});
