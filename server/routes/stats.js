const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/summary', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const [rows] = await pool.query(
      `SELECT
        COUNT(*) AS total_books,
        SUM(CASE WHEN status = 'reading' THEN 1 ELSE 0 END) AS reading,
        SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) AS finished,
        SUM(CASE WHEN status = 'want_to_read' THEN 1 ELSE 0 END) AS want_to_read,
        COALESCE(ROUND(AVG(user_rating), 1), 0) AS avg_rating
      FROM user_book
      WHERE user_id = ?`,
      [user_id]
    );
    const row = rows[0];
    res.json({
      total_books: Number(row.total_books),
      reading: Number(row.reading),
      finished: Number(row.finished),
      want_to_read: Number(row.want_to_read),
      avg_rating: Number(row.avg_rating),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/books-per-month', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        MONTH(finished_at) AS month,
        COUNT(*) AS books_finished
      FROM user_book
      WHERE user_id = ?
        AND status = 'finished'
        AND YEAR(finished_at) = YEAR(CURDATE())
      GROUP BY MONTH(finished_at)
      ORDER BY month`,
      [req.user.user_id]
    );
    res.json(rows.map((r) => ({ month: Number(r.month), books_finished: Number(r.books_finished) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/genre-breakdown', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        g.name AS genre,
        COUNT(DISTINCT ub.book_id) AS book_count
      FROM user_book ub
      INNER JOIN book_genre bg ON ub.book_id = bg.book_id
      INNER JOIN genre g ON bg.genre_id = g.genre_id
      WHERE ub.user_id = ?
      GROUP BY g.genre_id, g.name
      ORDER BY book_count DESC
      LIMIT 8`,
      [req.user.user_id]
    );
    res.json(rows.map((r) => ({ genre: r.genre, book_count: Number(r.book_count) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reading-streak', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT session_date
      FROM reading_session rs
      INNER JOIN user_book ub ON rs.user_book_id = ub.user_book_id
      WHERE ub.user_id = ?
      GROUP BY session_date
      ORDER BY session_date DESC`,
      [req.user.user_id]
    );
    const dates = rows.map((r) => {
      const d = r.session_date;
      if (d instanceof Date) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      return String(d).slice(0, 10);
    });
    res.json({ session_dates: dates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/activity', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        rs.session_date,
        SUM(rs.pages_read) AS pages
      FROM reading_session rs
      INNER JOIN user_book ub ON rs.user_book_id = ub.user_book_id
      WHERE ub.user_id = ?
        AND rs.session_date >= DATE_SUB(CURDATE(), INTERVAL 112 DAY)
      GROUP BY rs.session_date
      ORDER BY rs.session_date`,
      [req.user.user_id]
    );
    res.json(
      rows.map((r) => {
        let sd = r.session_date;
        if (sd instanceof Date) {
          const y = sd.getFullYear();
          const m = String(sd.getMonth() + 1).padStart(2, '0');
          const day = String(sd.getDate()).padStart(2, '0');
          sd = `${y}-${m}-${day}`;
        } else {
          sd = String(sd).slice(0, 10);
        }
        return {
          session_date: sd,
          pages: Number(r.pages),
        };
      })
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/top-rated', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.title, b.cover_image_url, ub.user_rating,
       GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS authors
      FROM user_book ub
      INNER JOIN book b ON ub.book_id = b.book_id
      LEFT JOIN book_author ba ON b.book_id = ba.book_id
      LEFT JOIN author a ON ba.author_id = a.author_id
      WHERE ub.user_id = ? AND ub.user_rating IS NOT NULL
      GROUP BY b.book_id, b.title, b.cover_image_url, ub.user_rating, ub.finished_at
      ORDER BY ub.user_rating DESC, ub.finished_at DESC
      LIMIT 5`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent-sessions', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT rs.session_id, rs.session_date, rs.pages_read, rs.duration_minutes, b.title
       FROM reading_session rs
       INNER JOIN user_book ub ON rs.user_book_id = ub.user_book_id
       INNER JOIN book b ON ub.book_id = b.book_id
       WHERE ub.user_id = ?
       ORDER BY rs.session_date DESC, rs.logged_at DESC
       LIMIT 12`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pages-this-year', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(rs.pages_read), 0) AS pages
 FROM reading_session rs
       INNER JOIN user_book ub ON rs.user_book_id = ub.user_book_id
       WHERE ub.user_id = ? AND YEAR(rs.session_date) = YEAR(CURDATE())`,
      [req.user.user_id]
    );
    res.json({ pages: Number(rows[0].pages) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
