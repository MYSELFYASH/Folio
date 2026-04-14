const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

const router = express.Router();

function userPublic(row) {
  if (!row) return null;
  return {
    user_id: row.user_id,
    username: row.username,
    email: row.email,
    preferred_genres: row.preferred_genres,
    yearly_goal: row.yearly_goal,
    created_at: row.created_at,
  };
}

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO user (username, email, password_hash) VALUES (?, ?, ?)`,
      [username.trim(), email.trim().toLowerCase(), password_hash]
    );
    const user_id = result.insertId;
    const [rows] = await pool.query(
      `SELECT user_id, username, email, preferred_genres, yearly_goal, created_at FROM user WHERE user_id = ?`,
      [user_id]
    );
    const user = rows[0];
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: userPublic(user) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const [rows] = await pool.query(
      `SELECT user_id, username, email, password_hash, preferred_genres, yearly_goal, created_at FROM user WHERE email = ? OR username = ?`,
      [email.trim().toLowerCase(), email.trim()]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const row = rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = userPublic(row);
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const authMiddleware = require('../middleware/auth');
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { preferred_genres, password } = req.body;
    const user_id = req.user.user_id;

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      await pool.query(`UPDATE user SET password_hash = ? WHERE user_id = ?`, [password_hash, user_id]);
    }

    if (preferred_genres !== undefined) {
      await pool.query(`UPDATE user SET preferred_genres = ? WHERE user_id = ?`, [preferred_genres, user_id]);
    }

    const [rows] = await pool.query(
      `SELECT user_id, username, email, preferred_genres, yearly_goal, created_at FROM user WHERE user_id = ?`,
      [user_id]
    );
    res.json(userPublic(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
