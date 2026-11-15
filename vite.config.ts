import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { rollupOptions: { input: 'app.html' } },
  plugins: [{
    name: 'development-entry',
    configureServer(server) {
      // The published index stays compiled; development uses the source entry.
      server.middlewares.use((request, _response, next) => {
        if (request.url === '/' || request.url?.startsWith('/?')) request.url = request.url.replace('/', '/app.html');
        next();
      });
    },
  }],
});
