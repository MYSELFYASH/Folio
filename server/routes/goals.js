const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // Dynamically sync 'books_per_year' goals with actual finished books in 'user_book'
    // This catches updates from PATCH status changes, manual additions, and session logs.
    const [goalsToSync] = await pool.query(
      `SELECT goal_id, year, target_value, goal_type FROM goal WHERE user_id = ? AND goal_type = 'books_per_year'`,
      [user_id]
    );

    for (const g of goalsToSync) {
      const [c] = await pool.query(
        `SELECT COUNT(*) AS n FROM user_book
         WHERE user_id = ? AND status = 'finished' AND YEAR(finished_at) = ?`,
        [user_id, g.year]
      );
      const computedValue = Number(c[0].n);
      const newStatus = computedValue >= g.target_value ? 'completed' : 'active';
      await pool.query(
        `UPDATE goal SET current_value = ?, status = ? WHERE goal_id = ?`,
        [computedValue, newStatus, g.goal_id]
      );
    }

    const [rows] = await pool.query(`SELECT * FROM goal WHERE user_id = ? ORDER BY year DESC, goal_id DESC`, [
      user_id,
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { goal_type, target_value, year, genre_id } = req.body;
    if (!goal_type || target_value == null || year == null) {
      return res.status(400).json({ error: 'goal_type, target_value, and year are required' });
    }
    if (!['books_per_year', 'books_per_month', 'pages_per_month'].includes(goal_type)) {
      return res.status(400).json({ error: 'Invalid goal_type' });
    }
    const user_id = req.user.user_id;
    const y = parseInt(year, 10);

    let current_value = 0;
    if (goal_type === 'books_per_year') {
      const [c] = await pool.query(
        `SELECT COUNT(*) AS n FROM user_book
 WHERE user_id = ? AND status = 'finished' AND YEAR(finished_at) = ?`,
        [user_id, y]
      );
      current_value = Number(c[0].n);
    }

    const [result] = await pool.query(
      `INSERT INTO goal (user_id, goal_type, target_value, current_value, genre_id, year, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [user_id, goal_type, parseInt(target_value, 10), current_value, genre_id || null, y]
    );

    let status = 'active';
    if (goal_type === 'books_per_year' && current_value >= parseInt(target_value, 10)) {
      status = 'completed';
      await pool.query(`UPDATE goal SET status = 'completed' WHERE goal_id = ?`, [result.insertId]);
    }

    const [rows] = await pool.query(`SELECT * FROM goal WHERE goal_id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const goal_id = parseInt(req.params.id, 10);
    if (Number.isNaN(goal_id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    if (req.body.target_value == null) {
      return res.status(400).json({ error: 'target_value is required' });
    }
    const [owns] = await pool.query(`SELECT goal_id FROM goal WHERE goal_id = ? AND user_id = ?`, [
      goal_id,
      req.user.user_id,
    ]);
    if (!owns.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    await pool.query(`UPDATE goal SET target_value = ? WHERE goal_id = ?`, [
      parseInt(req.body.target_value, 10),
      goal_id,
    ]);
    await pool.query(
      `UPDATE goal SET status = CASE WHEN current_value >= target_value AND goal_type = 'books_per_year' THEN 'completed' ELSE status END
       WHERE goal_id = ?`,
      [goal_id]
    );
    const [rows] = await pool.query(`SELECT * FROM goal WHERE goal_id = ?`, [goal_id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
