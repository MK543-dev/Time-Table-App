import type { IncomingMessage, ServerResponse } from 'http';
import app from '../server';

// Vercel serverless entry point.
// When Vercel rewrites /api/(.*) -> /api, Vercel sets req.url to "/api"
// and stores the original requested path in x-matched-path or x-vercel-matched-path.
export default function handler(req: IncomingMessage, res: ServerResponse) {
  const matchedPath = (req.headers['x-matched-path'] || req.headers['x-vercel-matched-path']) as string | undefined;
  if (matchedPath && matchedPath.startsWith('/api') && (req.url === '/api' || req.url === '/api/')) {
    req.url = matchedPath;
  }
  return (app as any)(req, res);
}

