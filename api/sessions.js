import { handleApiRequest } from '../server/apiRouter.js';

export default async function handler(req, res) {
  // Ensure the URL path matches /api/sessions
  if (!req.url || req.url === '/' || req.url === '') {
    req.url = '/api/sessions';
  } else if (!req.url.startsWith('/api/')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return handleApiRequest(req, res);
}
