# Deployment Guide

## 1) Deploy Backend (Express)

Deploy the backend folder as a Node service on Render, Railway, Fly.io, or VM.

- Root directory: backend
- Build command: npm install
- Start command: npm start
- Port: use platform-provided PORT env var (already supported in server.js)

After deploy, copy backend URL, for example:
- https://offbeat-api.onrender.com

Check health endpoint:
- GET /api/health should return {"status":"ok"}

## 2) Deploy Frontend (Netlify)

Netlify uses root netlify.toml with:
- base = frontend
- command = npm run build
- publish = dist

Set Netlify environment variable:
- VITE_API_URL = https://your-backend-domain

Then trigger a new deploy.

## 3) Verify Production

- Open frontend site.
- Confirm search/trending/lyrics requests are sent to your backend domain (not localhost).
- Test direct page refresh on any route; SPA redirect is handled by netlify.toml.

## 4) Common Failure Cases

- Netlify 404 page: wrong publish folder or missing redirects.
- API calls fail in production: missing or invalid VITE_API_URL.
- CORS errors: backend CORS must allow frontend origin (currently backend allows all origins).
