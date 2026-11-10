import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function serverlessApiPlugin() {
  return {
    name: 'serverless-api-routes',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        if (parsedUrl.pathname === '/api/health') {
          try {
            const { default: handler } = await server.ssrLoadModule('/api/health.ts');
            return handler(req, res);
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err?.message || String(err) }));
          }
        }
        if (parsedUrl.pathname === '/api/carparkavailability') {
          try {
            const { default: handler } = await server.ssrLoadModule('/api/carparkavailability.ts');
            return handler(req, res);
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err?.message || String(err) }));
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), serverlessApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
