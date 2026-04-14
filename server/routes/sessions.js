const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function toDateOnly(d) {
  if (!d) return new Date().toISOString().slice(0, 10);
  if (typeof d === 'string') return d.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

router.post('/', async (req, res) => {
  const { user_book_id, pages_read, session_date, duration_minutes, note } = req.body;
  if (user_book_id == null || pages_read == null) {
    return res.status(400).json({ error: 'user_book_id and pages_read are required' });
  }
  const pages = parseInt(pages_read, 10);
  if (Number.isNaN(pages) || pages < 1) {
    return res.status(400).json({ error: 'pages_read must be a positive integer' });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const dateStr = toDateOnly(session_date);
    const dur =
      duration_minutes != null && duration_minutes !== '' ? parseInt(duration_minutes, 10) : null;

    await conn.query(
      `INSERT INTO reading_session
       (user_book_id, pages_read, session_date, duration_minutes, note)
       VALUES (?, ?, ?, ?, ?)`,
      [user_book_id, pages, dateStr, Number.isNaN(dur) ? null : dur, note || null]
    );

    const [rows] = await conn.query(
      `SELECT ub.current_page, ub.user_id, b.total_pages, ub.status, b.title
       FROM user_book ub
       INNER JOIN book b ON ub.book_id = b.book_id
       WHERE ub.user_book_id = ?`,
      [user_book_id]
    );

    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'User book not found' });
    }

    const { current_page, total_pages, status, user_id, title } = rows[0];

    if (user_id !== req.user.user_id) {
      await conn.rollback();
      return res.status(403).json({ error: 'Forbidden' });
    }

    const cap = total_pages && total_pages > 0 ? total_pages : 99999;
    const new_page = Math.min((current_page || 0) + pages, cap);
    const just_finished = total_pages && total_pages > 0 && new_page >= total_pages && status !== 'finished';

    if (just_finished) {
      await conn.query(
        `UPDATE user_book
         SET current_page = ?, status = 'finished', finished_at = CURDATE()
         WHERE user_book_id = ?`,
        [new_page, user_book_id]
      );

      await conn.query(
        `UPDATE goal
         SET current_value = current_value + 1
         WHERE user_id = ? AND goal_type = 'books_per_year'
           AND year = YEAR(CURDATE()) AND status = 'active'`,
        [user_id]
      );

      await conn.query(
        `UPDATE goal SET status = 'completed'
         WHERE user_id = ? AND goal_type = 'books_per_year'
           AND year = YEAR(CURDATE()) AND current_value >= target_value`,
        [user_id]
      );
    } else {
      await conn.query(
        `UPDATE user_book SET current_page = ?,
         status = CASE WHEN status = 'want_to_read' THEN 'reading' ELSE status END,
         started_at = CASE WHEN started_at IS NULL THEN CURDATE() ELSE started_at END
         WHERE user_book_id = ?`,
        [new_page, user_book_id]
      );
    }

    await conn.commit();
    res.json({ success: true, new_page, just_finished, book_title: title });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Path uses /book/:id to avoid ambiguity with DELETE /:session_id (both numeric IDs).
router.get('/book/:user_book_id', async (req, res) => {
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
    const [sessions] = await pool.query(
      `SELECT session_id, user_book_id, session_date, pages_read, duration_minutes, note, logged_at
       FROM reading_session WHERE user_book_id = ? ORDER BY session_date DESC, logged_at DESC`,
      [user_book_id]
    );

    let cumulative = 0;
    const ordered = [...sessions].reverse();
    const withCumulative = ordered.map((s) => {
      cumulative += s.pages_read;
      return { ...s, cumulative_pages: cumulative };
    }).reverse();

    res.json(withCumulative);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:session_id', async (req, res) => {
  const session_id = parseInt(req.params.session_id, 10);
  if (Number.isNaN(session_id)) {
    return res.status(400).json({ error: 'Invalid session_id' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT rs.pages_read, rs.user_book_id, ub.user_id, ub.current_page
       FROM reading_session rs
       INNER JOIN user_book ub ON rs.user_book_id = ub.user_book_id
       WHERE rs.session_id = ?`,
      [session_id]
    );
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Session not found' });
    }
    const { pages_read, user_book_id, user_id, current_page } = rows[0];
    if (user_id !== req.user.user_id) {
      await conn.rollback();
      return res.status(403).json({ error: 'Forbidden' });
    }
    const newPage = Math.max(0, (current_page || 0) - pages_read);
    await conn.query(`UPDATE user_book SET current_page = ? WHERE user_book_id = ?`, [newPage, user_book_id]);
    await conn.query(`DELETE FROM reading_session WHERE session_id = ?`, [session_id]);
    await conn.commit();
    res.json({ success: true, new_page: newPage });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
