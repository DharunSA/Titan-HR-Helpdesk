# Titan Employee Dashboard

React + Node.js + Express + MongoDB employee management dashboard with role-based access control.

## Project Structure

- `Titan/` - React frontend
- `server/` - Express + Mongoose backend
- `server/models/Auth.js` - user auth model
- `server/routes/authRoutes.js` - login, session, password change, admin registration
- `server/controllers/authController.js` - auth request handlers

## Environment Setup

Create a `.env` file in `server/` with:

```bash
PORT=5000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
```

The frontend currently targets `http://localhost:5000` for API calls.

## Auth Flow

Phase 1 uses a simple JWT access-token flow:

- Login returns a 1-hour JWT access token.
- The token is stored in `localStorage`.
- The frontend sends the token on every API request.
- `GET /api/auth/me` is the canonical source of truth for the current logged-in user.
- If a request returns `401` or `403`, the frontend clears the session and sends the user back to login.

This keeps the auth model simple for now and avoids refresh-token complexity.

## Running The App

Backend:

```bash
cd server
npm install
npm run dev
```

Frontend:

```bash
cd Titan
npm install
npm run dev
```

## Seed Admin User

Use the seed script to create a first admin account and employee logins for existing employee records:

```bash
cd server
node seedUsers.js
```

## Manual Verification Checklist

Use this checklist to confirm phase 1 is working:

1. Sign in with the seeded admin account.
2. Confirm the dashboard loads and the user menu shows the signed-in user.
3. Open `/employees` and confirm only admin users can access it.
4. Sign in as an employee and confirm admin-only buttons and navigation are hidden.
5. Wait for the JWT to expire or remove the token from `localStorage`.
6. Confirm the next protected request returns you to the login page.
7. Confirm `/api/auth/me` returns the same user data after reload.

## Notes

- Google sign-in is still a placeholder in the UI.
- Refresh tokens are intentionally not part of phase 1.
- Server-side role checks remain the source of truth for authorization.
