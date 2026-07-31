# Security notes

- Initial passwords are compatibility seeds only and must be changed after installation.
- Never commit `.env`, database files, backup files or real customer data.
- Keep the API behind HTTPS and a reverse proxy.
- Use one API worker while SQLite and in-process restore locking are in use.
- Administrative authorization is enforced by the backend; hidden navigation alone is not a security boundary.
- Invoice creation and wallet top-up requests use idempotency protection so transport retries do not duplicate financial records.
- Backup uploads are treated as untrusted input and must pass size, SQLite-header, integrity and application-schema checks before replacement.
- Report security concerns privately to the project owner; do not include customer data in bug reports.
