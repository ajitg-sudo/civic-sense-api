Civic Sense API — local notes

Do NOT store secrets here.
Put credentials in `.env` only (see `.env.example` if present).

Google OAuth:
- Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in `.env`
- Set GOOGLE_CALLBACK_URL (e.g. http://localhost:8080/auth/google/callback)

Example profile cover URL shape:
http://localhost:8080/users/profile/cover-photo/<userId>
