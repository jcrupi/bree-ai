# Algos: Security Pattern Detection

## Algorithm: Injection Detection (A03:2021)
1. **Source**: Identify inputs (request params, form data, file uploads).
2. **Sink**: Identify sensitive functions (db query exec, eval, shell exec).
3. **Check**: Determine if input is sanitized or parameterized before reaching the sink.
4. **Pattern**:
   - `SELECT * FROM users WHERE name = ' + user_input + '` -> **FAIL (SQLi)**
   - `db.execute("SELECT * FROM users WHERE name = ?", [user_input])` -> **PASS**

## Algorithm: Broken Access Control (A01:2021)
1. **Action**: Identify restricted resources (admin panels, PII data).
2. **Context**: Determine the current user's session/role.
3. **Logic**: Check if the code verifies ownership or role-based permissions before granting access.
4. **Pattern**:
   - `fetch('/api/user/' + id)` without checking `session.userId == id` -> **FAIL (IDOR)**

## Algorithm: XSS Prevention (CWE-79)
1. **Source**: Untrusted user text.
2. **Display**: Rendered in HTML/JS.
3. **Mitigation**: Verify if modern framework auto-escaping is used or explicit encoding is implemented.
4. **Pattern**:
   - `innerHTML = user_input` -> **FAIL**
   - `textContent = user_input` or React `{user_input}` -> **PASS**

## Algorithm: Cryptographic Failures (A02:2021)
1. **Sensitive Data**: Passwords, SSNs, PHI.
2. **Storage**: Check for hashing (Argon2, bcrypt) or encryption (AES-256).
3. **Pattern**:
   - `md5(password)` -> **FAIL**
   - `bcrypt.hash(password, salt)` -> **PASS**
