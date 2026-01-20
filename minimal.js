const express = require('express');
const app = express();
const PORT = 4000;

app.use(require('cors')({ origin: 'http://localhost:3000' }));
app.use(require('express').json());

app.get('/api/health', (req, res) => {
  console.log('✅ /health appelé');
  res.json({ status: 'OK', port: PORT });
});

app.post('/api/auth/register', (req, res) => {
  console.log('📝 Register:', req.body.email);
  res.json({
    success: true,
    token: 'test-token',
    user: { email: req.body.email, plan: 'BAS' }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend minimal sur http://localhost:${PORT}`);
});