# Security policy

## Reporting a vulnerability

Report suspected vulnerabilities through [GitHub private vulnerability reporting](https://github.com/Zaheer-verse/expense-management-system/security/advisories/new), when enabled. If it is unavailable, open an issue asking the maintainer for a private reporting channel without including vulnerability details.

Include the affected version or commit, minimal reproduction, impact, and suggested mitigation. Redact credentials and personal data. Do not submit real secrets, session cookies, or customer data in public issues, pull requests, or logs.

## Files and credentials

Keep real environment values, credentials, private keys, database contents, and local diagnostic files outside Git. Commit only placeholder examples. Review staged changes before pushing; ignore rules do not remove files already tracked or erase Git history.

If a credential has been exposed, revoke or rotate it at the provider first. Removing a file or changing repository visibility does not invalidate the credential. Review affected history, logs, artifacts, releases, forks, and deployments before publishing.

## Maintenance

Security fixes target the current default branch. The secret scanning workflow checks fetched Git history with redacted output; it is a detection aid, not a guarantee that all sensitive data or vulnerabilities are absent. Dependency changes require review and relevant application checks.
