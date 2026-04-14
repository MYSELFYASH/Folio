const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const userBooksRoutes = require('./routes/userBooks');
const sessionsRoutes = require('./routes/sessions');
const goalsRoutes = require('./routes/goals');
const listsRoutes = require('./routes/lists');
const statsRoutes = require('./routes/stats');
const highlightsRoutes = require('./routes/highlights');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    const pool = require('./db/connection');
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'connected' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/user-books', userBooksRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/highlights', highlightsRoutes);

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Folio API listening on http://localhost:${PORT}`);
});
