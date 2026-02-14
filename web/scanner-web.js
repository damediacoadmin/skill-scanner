// Browser-compatible version of SkillScanner
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
  }

  scan(content, filename = 'unknown') {
    const results = {
      file: filename,
      findings: [],
      score: 100,
    };

    for (const [category, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        // Reset lastIndex for global regexes
        pattern.lastIndex = 0;
        
        const matches = [];
        let match;
        while ((match = pattern.exec(content)) !== null && matches.length < 10) {
          matches.push(match[0]);
        }
        
        if (matches.length > 0) {
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
}
