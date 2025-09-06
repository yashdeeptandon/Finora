import express from 'express';
import authRoutes from './modules/auth/auth.routes.js';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.send('OK');
});

app.use('/v1/auth', authRoutes);

export default app;
