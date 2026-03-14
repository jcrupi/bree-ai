# Playbook: Security (OWASP Top 10 & CWE)

## Purpose
To provide a specialized framework for identifying, validating, and remediating software vulnerabilities based on the OWASP Top 10 project and Common Weakness Enumeration (CWE) patterns.

## Core Directives
- **Security First**: All documentation and code reviews must prioritize the identification of security flaws.
- **Evidence Based**: vulnerabilities must be linked to specific code patterns or architectural decisions.
- **Actionable Remediation**: Every finding must include a clear path to mitigation.

## OWASP Top 10 (2021) Categories
1. **A01:2021-Broken Access Control**: Ensure users cannot act outside of their intended permissions.
2. **A02:2021-Cryptographic Failures**: Protect data in transit and at rest.
3. **A03:2021-Injection**: Prevent untrusted data from being interpreted as commands (SQL, NoSQL, OS, etc.).
4. **A04:2021-Insecure Design**: Focus on design patterns that are inherently flawed.
5. **A05:2021-Security Misconfiguration**: Ensure components are hardened and default settings are optimized.
6. **A06:2021-Vulnerable and Outdated Components**: Keep dependencies and runtime environments current.
7. **A07:2021-Identification and Authentication Failures**: Confirm user identity and session integrity.
8. **A08:2021-Software and Data Integrity Failures**: Protect against malicious code injection during build/deployment.
9. **A09:2021-Security Logging and Monitoring Failures**: Ensure critical events are audited for incident response.
10. **A10:2021-Server-Side Request Forgery (SSRF)**: Prevent servers from making unintended requests to internal/external systems.

## CWE Pattern Recognition
- **CWE-79 (XSS)**: Improper Neutralization of Input During Web Page Generation.
- **CWE-89 (SQLi)**: Improper Neutralization of Special Elements used in an SQL Command.
- **CWE-22 (Path Traversal)**: Improper Limitation of a Pathname to a Restricted Directory.
- **CWE-502 (Insecure Deserialization)**: Deserialization of Untrusted Data.
- **CWE-352 (CSRF)**: Cross-Site Request Forgery.

## Verification Workflow
- **Identify**: Locate the code or design pattern.
- **Match**: Map the pattern to an OWASP or CWE category.
- **Impact**: Assess the severity (Critical, High, Medium, Low).
- **Resolve**: Propose a fix using industry best practices (e.g., parameterized queries, input validation, principle of least privilege).
