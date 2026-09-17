import { defineConfig } from 'vite';
import { handleApiRequest } from './server/apiRouter.js';

export default defineConfig({
  plugins: [
    {
      name: 'sku-api-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          handleApiRequest(req, res, next);
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          handleApiRequest(req, res, next);
        });
      }
    }
  ],
  server: {
    port: 5173,
    // Serve index.html for all non-API routes (History API / SPA routing)
    historyApiFallback: {
      rewrites: [
        // Pass /api/* to the express middleware
        { from: /^\/api\//, to: '/api' },
        // All other routes → index.html
        { from: /./, to: '/index.html' }
      ]
    }
  }
});
