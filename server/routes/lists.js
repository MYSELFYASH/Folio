const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const [lists] = await pool.query(
      `SELECT bl.*, COUNT(bli.book_id) AS item_count
       FROM book_list bl
       LEFT JOIN book_list_item bli ON bl.list_id = bli.list_id
       WHERE bl.user_id = ?
       GROUP BY bl.list_id
       ORDER BY bl.created_at DESC`,
      [user_id]
    );
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, is_public } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const [result] = await pool.query(
      `INSERT INTO book_list (user_id, name, description, is_public) VALUES (?, ?, ?, ?)`,
      [req.user.user_id, String(name).trim(), description || null, Boolean(is_public)]
    );
    const [rows] = await pool.query(`SELECT * FROM book_list WHERE list_id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const list_id = parseInt(req.params.id, 10);
    if (Number.isNaN(list_id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const [lists] = await pool.query(`SELECT * FROM book_list WHERE list_id = ? AND user_id = ?`, [
      list_id,
      req.user.user_id,
    ]);
    if (!lists.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    const [items] = await pool.query(
      `SELECT bli.*, b.title, b.cover_image_url, b.book_id,
 GROUP_CONCAT(DISTINCT a.name ORDER BY a.name SEPARATOR ', ') AS authors
       FROM book_list_item bli
       INNER JOIN book b ON bli.book_id = b.book_id
       LEFT JOIN book_author ba ON b.book_id = ba.book_id
       LEFT JOIN author a ON ba.author_id = a.author_id
       WHERE bli.list_id = ?
       GROUP BY bli.list_id, bli.book_id, bli.sort_order, bli.added_at, b.title, b.cover_image_url
       ORDER BY bli.sort_order ASC, bli.added_at ASC`,
      [list_id]
    );
    res.json({ list: lists[0], items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const list_id = parseInt(req.params.id, 10);
    if (Number.isNaN(list_id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const [owns] = await pool.query(`SELECT list_id FROM book_list WHERE list_id = ? AND user_id = ?`, [
      list_id,
      req.user.user_id,
    ]);
    if (!owns.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    const { name, description, is_public } = req.body;
    const updates = [];
    const params = [];
    if (name != null) {
      updates.push('name = ?');
      params.push(String(name).trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (is_public !== undefined) {
      updates.push('is_public = ?');
      params.push(Boolean(is_public));
    }
    if (!updates.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    params.push(list_id);
    await pool.query(`UPDATE book_list SET ${updates.join(', ')} WHERE list_id = ?`, params);
    const [rows] = await pool.query(`SELECT * FROM book_list WHERE list_id = ?`, [list_id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const list_id = parseInt(req.params.id, 10);
    if (Number.isNaN(list_id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const [result] = await pool.query(`DELETE FROM book_list WHERE list_id = ? AND user_id = ?`, [
      list_id,
      req.user.user_id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/items', async (req, res) => {
  try {
    const list_id = parseInt(req.params.id, 10);
    if (Number.isNaN(list_id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const { book_id, sort_order } = req.body;
    if (book_id == null) {
      return res.status(400).json({ error: 'book_id is required' });
    }
    const [owns] = await pool.query(`SELECT list_id FROM book_list WHERE list_id = ? AND user_id = ?`, [
      list_id,
      req.user.user_id,
    ]);
    if (!owns.length) {
      return res.status(404).json({ error: 'List not found' });
    }
    await pool.query(
      `INSERT INTO book_list_item (list_id, book_id, sort_order) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order)`,
      [list_id, book_id, sort_order != null ? parseInt(sort_order, 10) : 0]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/items/:book_id', async (req, res) => {
  try {
    const list_id = parseInt(req.params.id, 10);
    const book_id = parseInt(req.params.book_id, 10);
    if (Number.isNaN(list_id) || Number.isNaN(book_id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const [owns] = await pool.query(`SELECT list_id FROM book_list WHERE list_id = ? AND user_id = ?`, [
      list_id,
      req.user.user_id,
    ]);
    if (!owns.length) {
      return res.status(404).json({ error: 'List not found' });
    }
    await pool.query(`DELETE FROM book_list_item WHERE list_id = ? AND book_id = ?`, [list_id, book_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
