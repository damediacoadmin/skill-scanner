#!/usr/bin/env node
const SkillScanner = require('./scanner');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);

function printUsage() {
  console.log(`
OpenClaw Skill Security Scanner
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage:
  skill-scanner <path>          Scan a local skill directory
  skill-scanner <github-url>    Clone and scan a GitHub repository
  skill-scanner --help          Show this help message

Examples:
  skill-scanner ./my-skill
  skill-scanner https://github.com/user/skill-name
  skill-scanner ~/clawd/skills/example-skill

Options:
  --json                        Output results as JSON
  --output <file>               Save report to file
  `);
}

async function main() {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const target = args[0];
  const isGitHub = target.startsWith('http://github.com') || target.startsWith('https://github.com');
  const jsonOutput = args.includes('--json');
  const outputIndex = args.indexOf('--output');
  const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : null;

  let scanPath;
  let tempDir = null;

  try {
    if (isGitHub) {
      console.log(`🔍 Cloning repository: ${target}`);
      tempDir = path.join(process.cwd(), '.skill-scanner-temp', Date.now().toString());
      fs.mkdirSync(tempDir, { recursive: true });
      
      execSync(`git clone --depth 1 ${target} ${tempDir}`, { 
        stdio: 'inherit',
        timeout: 30000 
      });
      scanPath = tempDir;
    } else {
      scanPath = path.resolve(target);
      if (!fs.existsSync(scanPath)) {
        console.error(`❌ Error: Path does not exist: ${scanPath}`);
        process.exit(1);
      }
    }

    console.log(`\n🔍 Scanning: ${scanPath}\n`);

    const scanner = new SkillScanner();
    const results = scanner.scanDirectory(scanPath);

    if (jsonOutput) {
      const json = JSON.stringify(results, null, 2);
      console.log(json);
      
      if (outputFile) {
        fs.writeFileSync(outputFile, json);
        console.log(`\n✅ Report saved to: ${outputFile}`);
      }
    } else {
      const report = scanner.formatReport(results);
      console.log(report);
      
      if (outputFile) {
        fs.writeFileSync(outputFile, report);
        console.log(`✅ Report saved to: ${outputFile}`);
      }
    }

    // Exit code based on risk level
    if (results.riskLevel === 'CRITICAL') {
      process.exit(2);
    } else if (results.riskLevel === 'HIGH') {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    // Cleanup temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.warn(`⚠️  Could not cleanup temp directory: ${tempDir}`);
      }
    }
  }
}

main();
