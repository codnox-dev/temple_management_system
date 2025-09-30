# Google Sign-In (Admins)

The admin system uses Google Identity Services for authentication.

- Frontend obtains a Google ID token using the Google button on the Login page.
- Backend verifies the ID token at `POST /api/auth/google` and issues a server JWT.
- Existing role/permission middleware and protected endpoints continue to work unchanged.

Setup:
- Set `VITE_GOOGLE_CLIENT_ID` in Netlify/`.env`.
- Link admin accounts by setting `google_email` in the Admins collection.
- Optionally set `DEFAULT_ADMIN_GOOGLE_EMAIL` on the backend to link the bootstrap admin.

Security tips:
- Keep `ACCESS_TOKEN_EXPIRE_MINUTES` short (e.g., 7).
- Enable `JWT_BIND_TO_CLIENT=true` to bind tokens to IP/UA (proxy-aware).
- Monitor logs for failed or denied Google login attempts.
