# FlowOps AI Deployment Guide

This guide documents the production deployment setup for the FlowOps AI monorepo.

## Backend: Render Web Service

Create a new Render **Web Service** connected to:

```text
https://github.com/Ridanshi/Gharpayy
```

Use these settings:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Runtime | `Node` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start` |
| Health Check Path | `/health` |

Do not use `npm run dev` on Render. The dev script uses `tsx watch`, which is intended for local development and can cause unreliable production behavior.

### Backend Environment Variables

Set these in Render:

```env
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=<long-random-production-secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-domain.vercel.app
```

Important:

- `MONGODB_URI` must be a MongoDB Atlas URI.
- Do not use `mongodb://127.0.0.1`.
- Ensure MongoDB Atlas Network Access allows Render. For quick submission demos, allow `0.0.0.0/0`; for production, restrict this later.

## Frontend: Vercel

Create a new Vercel project connected to the same repository.

Use these settings:

| Setting | Value |
| --- | --- |
| Root Directory | `client` |
| Framework Preset | `Vite` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Frontend Environment Variables

Set this in Vercel:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

After deploying the frontend, copy the Vercel URL and update the Render backend `CLIENT_URL` variable.

## Deployment Order

1. Create MongoDB Atlas cluster and database.
2. Deploy backend on Render with Atlas `MONGODB_URI`.
3. Confirm backend health:

   ```text
   https://your-render-service.onrender.com/health
   ```

4. Deploy frontend on Vercel with `VITE_API_URL`.
5. Update backend `CLIENT_URL` to the Vercel frontend origin.
6. Redeploy backend after changing `CLIENT_URL`.
7. Log in using demo credentials.

## Expected Health Response

```json
{
  "ok": true,
  "service": "flowops-api"
}
```

## Common Render Failure Fixes

### MongoDB connects to localhost

Cause: `MONGODB_URI` is missing or set to local MongoDB.

Fix: set `MONGODB_URI` to MongoDB Atlas in Render.

### No open ports detected

Cause: the API crashed before calling `app.listen`, usually because MongoDB failed.

Fix: check the `MONGODB_URI`, Atlas network access, and `JWT_SECRET`.

### CORS error from frontend

Cause: Render `CLIENT_URL` does not match the deployed frontend origin.

Fix: set `CLIENT_URL` to your exact Vercel app URL and redeploy the backend.
