// Vercel serverless entry point. Vercel maps requests to /api/* to this
// function (see the rewrite in vercel.json) and hands them to our existing
// Express app, which already has every /api/... route registered.
// Locally and on Cloud Run, server.ts is run directly instead (see its
// `if (!process.env.VERCEL)` guard) — this file is Vercel-only glue.
import app from '../server';

export default app;
