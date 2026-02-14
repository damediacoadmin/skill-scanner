#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

class SkillScanner {
  constructor() {
    this.patterns = {
      // Data exfiltration patterns
      exfiltration: [
        /fetch\s*\(\s*['"`]https?:\/\/(?!.*(?:localhost|127\.0\.0\.1|github\.com|githubusercontent\.com))[^'"`]+['"`]/gi,
        /curl\s+.*https?:\/\/(?!.*(?:localhost|127\.0\.0\.1|github\.com))/gi,
        /axios\.(get|post)\s*\(\s*['"`]https?:\/\/(?!.*(?:localhost|127\.0\.0\.1|github\.com))[^'"`]+['"`]/gi,
        /XMLHttpRequest.*open\s*\(\s*['"`](GET|POST)['"`]\s*,\s*['"`]https?:\/\//gi,
      ],
      
      // Credential theft
      credentials: [
        /process\.env\.(PASSWORD|SECRET|KEY|TOKEN|API_KEY)/gi,
        /fs\.readFile.*\.(env|password|secret|credentials)/gi,
        /keychain|security\s+find-(generic|internet)-password/gi,
        /\/Library\/Keychains/gi,
        /chrome.*cookies|firefox.*cookies|browser.*password/gi,
        /localStorage\.(getItem|setItem).*\b(token|password|secret|key)\b/gi,
      ],
      
      // Dangerous system commands
      systemCommands: [
        /rm\s+-rf\s+[\/~\$]/gi,
        /dd\s+if=.*of=/gi,
        /:\(\)\s*{\s*:\s*\|\s*:\s*&\s*}\s*;/gi, // fork bomb
        /mkfs\./gi,
        /\/dev\/(null|zero|random|sda)/gi,
        /> \/dev\/(sda|hda)/gi,
      ],
      
      // Process execution with user input
      dangerousExec: [
        /exec\s*\(\s*['"`]\$\{/gi,
        /spawn\s*\(\s*['"`]?sh['"`]?.*\$\{/gi,
        /child_process\.exec.*process\.argv/gi,
        /eval\s*\(/gi,
        /Function\s*\(\s*['"`]/gi,
        /new\s+Function/gi,
      ],
      
      // Obfuscation
      obfuscation: [
        /atob\s*\(/gi,
        /Buffer\.from\s*\(.*['"`]base64['"`]/gi,
        /fromCharCode/gi,
        /\\x[0-9a-f]{2}/gi,
        /\\u[0-9a-f]{4}/gi,
        /eval\s*\(\s*atob/gi,
      ],
      
      // Prompt injection in SKILL.md
      promptInjection: [
        /ignore\s+(previous|all)\s+(instructions|prompts)/gi,
        /disregard.*instructions/gi,
        /you\s+are\s+now/gi,
        /new\s+instructions:/gi,
        /system\s*:\s*you\s+must/gi,
        /override.*rules/gi,
      ],
      
      // File system access
      fileAccess: [
        /fs\.(unlink|rmdir|rm).*\/(?!node_modules|\.skill-scanner-temp)/gi,
        /fs\.writeFile.*\/etc\//gi,
        /fs\.writeFile.*~\/.ssh/gi,
        /fs\.writeFile.*~\/.config/gi,
        /require\s*\(\s*['"`]child_process['"`]\s*\)/gi,
      ],
      
      // Network access to suspicious TLDs
      suspiciousDomains: [
        /https?:\/\/[^'"`\s]*\.(tk|ml|ga|cf|gq|xyz|top)\//gi,
        /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/gi,
      ],
    };
    
    this.findings = [];
    this.totalScore = 100;
  }

  scan(content, filename = 'unknown') {
    const results = {
      file: filename,
      findings: [],
      score: 100,
    };

    for (const [category, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          const severity = this.getSeverity(category);
          const deduction = severity === 'CRITICAL' ? 30 : severity === 'HIGH' ? 20 : severity === 'MEDIUM' ? 10 : 5;
          
          results.score -= deduction;
          results.findings.push({
            category,
            severity,
            pattern: pattern.source.slice(0, 80),
            matches: matches.slice(0, 3), // Limit to first 3 matches
            deduction,
          });
        }
      }
    }

    results.score = Math.max(0, results.score);
    return results;
  }

  getSeverity(category) {
    const severityMap = {
      exfiltration: 'CRITICAL',
      credentials: 'CRITICAL',
      systemCommands: 'CRITICAL',
      dangerousExec: 'HIGH',
      obfuscation: 'HIGH',
      suspiciousDomains: 'HIGH',
      promptInjection: 'MEDIUM',
      fileAccess: 'MEDIUM',
    };
    return severityMap[category] || 'LOW';
  }

  scanDirectory(dirPath) {
    const results = {
      path: dirPath,
      files: [],
      overallScore: 100,
      totalFindings: 0,
    };

    const filesToScan = this.findFiles(dirPath);
    
    for (const file of filesToScan) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const scanResult = this.scan(content, path.relative(dirPath, file));
        results.files.push(scanResult);
        results.totalFindings += scanResult.findings.length;
      } catch (err) {
        console.error(`Error scanning ${file}: ${err.message}`);
      }
    }

    // Calculate overall score (weighted average, with SKILL.md having 2x weight)
    let totalWeight = 0;
    let weightedScore = 0;

    for (const file of results.files) {
      const weight = file.file === 'SKILL.md' ? 2 : 1;
      weightedScore += file.score * weight;
      totalWeight += weight;
    }

    results.overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 100;
    results.riskLevel = this.getRiskLevel(results.overallScore);

    return results;
  }

  findFiles(dirPath) {
    const files = [];
    const extensions = ['.js', '.ts', '.py', '.sh', '.md'];

    const walk = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            if (item !== 'node_modules' && item !== '.git') {
              walk(fullPath);
            }
          } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (extensions.includes(ext) || item === 'SKILL.md') {
              files.push(fullPath);
            }
          }
        }
      } catch (err) {
        console.error(`Error reading directory ${dir}: ${err.message}`);
      }
    };

    walk(dirPath);
    return files;
  }

  getRiskLevel(score) {
    if (score >= 80) return 'LOW';
    if (score >= 60) return 'MEDIUM';
    if (score >= 40) return 'HIGH';
    return 'CRITICAL';
  }

  formatReport(results) {
    let report = '\n';
    report += '═══════════════════════════════════════════════\n';
    report += '   OpenClaw Skill Security Scanner Report\n';
    report += '═══════════════════════════════════════════════\n\n';
    report += `📂 Path: ${results.path}\n`;
    report += `🎯 Overall Score: ${results.overallScore}/100\n`;
    report += `⚠️  Risk Level: ${results.riskLevel}\n`;
    report += `📊 Total Findings: ${results.totalFindings}\n`;
    report += `📄 Files Scanned: ${results.files.length}\n\n`;

    if (results.totalFindings === 0) {
      report += '✅ No security issues detected!\n\n';
    } else {
      report += '═══════════════════════════════════════════════\n';
      report += '   Detailed Findings\n';
      report += '═══════════════════════════════════════════════\n\n';

      for (const file of results.files) {
        if (file.findings.length > 0) {
          report += `📄 ${file.file} (Score: ${file.score}/100)\n`;
          report += '─────────────────────────────────────────────\n';

          for (const finding of file.findings) {
            report += `  • ${finding.severity}: ${finding.category}\n`;
            report += `    Pattern: ${finding.pattern}\n`;
            report += `    Matches: ${finding.matches.length}\n`;
            if (finding.matches.length > 0) {
              report += `    Example: ${finding.matches[0].slice(0, 100)}...\n`;
            }
            report += `    Score Impact: -${finding.deduction}\n\n`;
          }
        }
      }
    }

    report += '═══════════════════════════════════════════════\n';
    report += this.getRecommendations(results);
    report += '═══════════════════════════════════════════════\n';

    return report;
  }

  getRecommendations(results) {
    let recommendations = '\n📋 Recommendations:\n\n';
    
    if (results.overallScore >= 80) {
      recommendations += '✅ This skill appears safe to use.\n';
    } else if (results.overallScore >= 60) {
      recommendations += '⚠️  Review findings carefully before using.\n';
    } else if (results.overallScore >= 40) {
      recommendations += '🚨 High risk - significant security concerns found.\n';
      recommendations += '   Only use if you fully trust the source.\n';
    } else {
      recommendations += '🛑 CRITICAL RISK - DO NOT INSTALL\n';
      recommendations += '   Multiple severe security issues detected.\n';
    }

    return recommendations;
  }
}

module.exports = SkillScanner;
