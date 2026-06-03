## 2026-06-03
- For admin DELETE routes, validate `ADMIN_PASSWORD` presence first and reject empty env values before comparing headers.
- Dynamic route params should be validated as positive integers before hitting the DB.
