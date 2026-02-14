# OpenClaw Skill Security Scanner

**Scan OpenClaw skills for malicious code patterns before installation**

## Description

The OpenClaw Skill Security Scanner analyzes skill code to detect potentially malicious patterns including:
- Data exfiltration attempts
- Credential theft
- Dangerous system commands
- Process execution vulnerabilities
- Code obfuscation
- Prompt injection attacks
- Suspicious network activity

Returns a trust score (0-100) and detailed security findings.

## Installation

```bash
clawhub install skill-scanner
```

Or install directly:
```bash
cd ~/clawd/skill-scanner
npm install
npm link
```

## Usage

### CLI Commands

Scan a local skill directory:
```bash
skill-scanner ./path/to/skill
```

Scan a GitHub repository:
```bash
skill-scanner https://github.com/user/skill-name
```

Output JSON results:
```bash
skill-scanner ./my-skill --json
```

Save report to file:
```bash
skill-scanner ./my-skill --output report.txt
```

### Web Interface

Open `web/index.html` in a browser to use the visual scanner:
- Paste skill code directly
- View color-coded risk scores
- See detailed findings with severity levels

Deploy the web UI as a static site:
```bash
cd web
python3 -m http.server 8080
# Visit http://localhost:8080
```

### As OpenClaw Tool

From within OpenClaw, use the scanner skill:

```
@openclaw scan this skill: https://github.com/user/suspicious-skill
```

## Detection Categories

| Category | Severity | Examples |
|----------|----------|----------|
| Data Exfiltration | CRITICAL | Unauthorized fetch/curl to unknown domains |
| Credential Theft | CRITICAL | Reading .env, keychain, browser cookies |
| System Commands | CRITICAL | rm -rf, dd, fork bombs |
| Dangerous Exec | HIGH | eval(), exec() with user input |
| Code Obfuscation | HIGH | base64 encoding, atob(), fromCharCode |
| Suspicious Domains | HIGH | Free TLDs (.tk, .ml), IP addresses |
| Prompt Injection | MEDIUM | Instructions to ignore system prompts |
| File Access | MEDIUM | Writing to /etc, ~/.ssh, ~/.config |

## Risk Levels

- **80-100**: ✅ LOW RISK - Safe to use
- **60-79**: ⚠️ MEDIUM RISK - Review carefully
- **40-59**: 🚨 HIGH RISK - Trust source before using
- **0-39**: 🛑 CRITICAL - Do not install

## Exit Codes (CLI)

- `0`: Success (LOW or MEDIUM risk)
- `1`: HIGH risk detected
- `2`: CRITICAL risk detected

## API

Use the scanner programmatically:

```javascript
const SkillScanner = require('skill-scanner');

const scanner = new SkillScanner();
const results = scanner.scanDirectory('./my-skill');

console.log(`Trust Score: ${results.overallScore}/100`);
console.log(`Risk Level: ${results.riskLevel}`);
console.log(`Findings: ${results.totalFindings}`);
```

## Security Note

This scanner uses pattern matching and heuristics. It may produce:
- **False positives**: Flagging legitimate code
- **False negatives**: Missing sophisticated attacks

Always review code from untrusted sources manually. This tool is an aid, not a guarantee.

## Contributing

Report issues or contribute patterns:
https://github.com/damediacoadmin/skill-scanner

## License

MIT License - Free to use and modify

## Author

Built for the OpenClaw community after 341 malicious skills were discovered on ClawHub.

Stay safe. Scan first. 🔍
