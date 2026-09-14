import { handleApiRequest } from '../server/apiRouter.js';

export default async function handler(req, res) {
  return handleApiRequest(req, res);
}
