# Learning Case: Insecure API Endpoint (SQLi & IDOR)

## Documentation/Code Snippet
The following Node.js/Express snippet is being audited for security flaws:

```javascript
app.get('/api/v1/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const token = req.headers['authorization'];

  // Check if token exists
  if (!token) return res.status(401).send('Unauthorized');

  // Fetch order data directly from query
  const query = `SELECT * FROM orders WHERE id = ${orderId}`;
  const order = await db.raw(query);

  if (order) {
    res.json(order);
  } else {
    res.status(404).send('Order not found');
  }
});
```

## Expected Analysis Findings

### 1. CWE-89: SQL Injection
- **Pattern**: The `orderId` is concatenated directly into a raw SQL string.
- **Vulnerability**: An attacker can provide an `orderId` like `1 OR 1=1` to exfiltrate all orders.
- **Remediation**: Use parameterized queries (e.g., `db.raw('SELECT * FROM orders WHERE id = ?', [orderId])`).

### 2. A01:2021: Broken Access Control (IDOR)
- **Vulnerability**: While the API checks for the existence of a token, it does *not* verify if the authenticated user has permission to view the specific `orderId`. Any user with a valid token can view any other user's order.
- **Remediation**: Filter the query by the user's ID extracted from the token (e.g., `WHERE id = ? AND userId = ?`).

### 3. A09:2021: Security Logging and Monitoring Failures
- **Vulnerability**: There is no logging implemented for failed authentication attempts or 404 responses.
- **Remediation**: Implement structured logging for security-relevant events.
