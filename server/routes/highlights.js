const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const { user_book_id, page_number, content } = req.body;
    if (user_book_id == null || !content || !String(content).trim()) {
      return res.status(400).json({ error: 'user_book_id and content are required' });
    }
    const [owns] = await pool.query(
      `SELECT user_book_id FROM user_book WHERE user_book_id = ? AND user_id = ?`,
      [user_book_id, req.user.user_id]
    );
    if (!owns.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    const [result] = await pool.query(
      `INSERT INTO highlight (user_book_id, page_number, content) VALUES (?, ?, ?)`,
      [user_book_id, page_number != null ? parseInt(page_number, 10) : null, String(content).trim()]
    );
    const [rows] = await pool.query(`SELECT * FROM highlight WHERE highlight_id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/note/:highlight_id', async (req, res) => {
  try {
    const highlight_id = parseInt(req.params.highlight_id, 10);
    if (Number.isNaN(highlight_id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const [result] = await pool.query(
      `DELETE h FROM highlight h
       INNER JOIN user_book ub ON h.user_book_id = ub.user_book_id
       WHERE h.highlight_id = ? AND ub.user_id = ?`,
      [highlight_id, req.user.user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:user_book_id', async (req, res) => {
  try {
    const user_book_id = parseInt(req.params.user_book_id, 10);
    if (Number.isNaN(user_book_id)) {
      return res.status(400).json({ error: 'Invalid user_book_id' });
    }
    const [owns] = await pool.query(
      `SELECT user_book_id FROM user_book WHERE user_book_id = ? AND user_id = ?`,
      [user_book_id, req.user.user_id]
    );
    if (!owns.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    const [rows] = await pool.query(
      `SELECT highlight_id, user_book_id, page_number, content, created_at
       FROM highlight WHERE user_book_id = ? ORDER BY created_at DESC`,
      [user_book_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
