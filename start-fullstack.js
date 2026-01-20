const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Charger l'app backend
const backendApp = require('./dist/app').default;

const app = express();

// Utiliser le backend (API)
app.use(backendApp);

// Servir le frontend Next.js (build statique ou SSR)
const frontendDir = path.join(__dirname, '../frontend/.next');
const frontendStatic = path.join(__dirname, '../frontend/out');
const frontendPublic = path.join(__dirname, '../frontend/public');

// Si build statique Next.js ("next export")
app.use(express.static(frontendStatic));
app.use(express.static(frontendPublic));

// Proxy fallback pour SSR (si pas de build statique)
app.use(
  '/',
  createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    ws: true,
    logLevel: 'warn',
    onProxyReq: (proxyReq, req, res) => {
      // Optionnel: log ou custom header
    },
  })
);

const PORT = process.env.PORT || 10000;

// Health check endpoint for Render
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', port: PORT });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('==============================');
  console.log('Fullstack server running on port ' + PORT);
  console.log('Health check: http://localhost:' + PORT + '/healthz');
  console.log('If you are on Render, this port should be auto-detected.');
  console.log('==============================');
});