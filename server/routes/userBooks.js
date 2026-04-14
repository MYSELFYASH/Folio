const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { status, genre, sort, search } = req.query;

    let orderClause = 'ORDER BY ub.added_at DESC';
    if (sort === 'added_asc') orderClause = 'ORDER BY ub.added_at ASC';
    else if (sort === 'title_asc') orderClause = 'ORDER BY b.title ASC';
    else if (sort === 'title_desc') orderClause = 'ORDER BY b.title DESC';
    else if (sort === 'completion_desc') {
      orderClause = `ORDER BY CASE WHEN b.total_pages > 0 THEN (ub.current_page / b.total_pages) ELSE 0 END DESC`;
    }

    const params = [user_id];
    let where = 'WHERE ub.user_id = ?';

    if (status && ['want_to_read', 'reading', 'finished'].includes(status)) {
      where += ' AND ub.status = ?';
      params.push(status);
    }

    if (genre && String(genre).trim()) {
      where += ` AND b.book_id IN (
        SELECT bgf.book_id FROM book_genre bgf
        INNER JOIN genre gf ON bgf.genre_id = gf.genre_id
        WHERE gf.name = ?
      )`;
      params.push(String(genre).trim());
    }

    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      where += ` AND (
        b.title LIKE ? OR EXISTS (
          SELECT 1 FROM book_author bax
          INNER JOIN author ax ON bax.author_id = ax.author_id
          WHERE bax.book_id = b.book_id AND ax.name LIKE ?
        )
      )`;
      params.push(term, term);
    }

    const sql = `
      SELECT
        ub.user_book_id,
        ub.status,
        ub.user_rating,
        ub.review,
        ub.current_page,
        ub.started_at,
        ub.finished_at,
        ub.added_at,
        b.book_id,
        b.isbn,
        b.title,
        b.cover_image_url,
        b.total_pages,
        b.publication_year,
        b.avg_online_rating,
        GROUP_CONCAT(DISTINCT a.name ORDER BY a.name SEPARATOR ', ') AS authors,
        GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', ') AS genres,
        CASE
          WHEN b.total_pages > 0
          THEN ROUND((ub.current_page / b.total_pages) * 100, 1)
          ELSE 0
        END AS completion_percentage
      FROM user_book ub
      INNER JOIN book b ON ub.book_id = b.book_id
      LEFT JOIN book_author ba ON b.book_id = ba.book_id
      LEFT JOIN author a ON ba.author_id = a.author_id
      LEFT JOIN book_genre bg ON b.book_id = bg.book_id
      LEFT JOIN genre g ON bg.genre_id = g.genre_id
      ${where}
      GROUP BY ub.user_book_id, ub.status, ub.user_rating, ub.review, ub.current_page,
               ub.started_at, ub.finished_at, ub.added_at,
               b.book_id, b.isbn, b.title, b.cover_image_url, b.total_pages,
               b.publication_year, b.avg_online_rating
      ${orderClause}
    `;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { book_id, status } = req.body;
    if (book_id == null) {
      return res.status(400).json({ error: 'book_id is required' });
    }
    const st = status && ['want_to_read', 'reading', 'finished'].includes(status) ? status : 'want_to_read';
    const user_id = req.user.user_id;

    const today = new Date().toISOString().slice(0, 10);
    let started_at = null;
    let finished_at = null;
    if (st === 'reading') started_at = today;
    if (st === 'finished') finished_at = today;

    const [result] = await pool.query(
      `INSERT INTO user_book (user_id, book_id, status, started_at, finished_at) VALUES (?, ?, ?, ?, ?)`,
      [user_id, book_id, st, started_at, finished_at]
    );
    res.status(201).json({ user_book_id: result.insertId, book_id, status: st });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Book already in your library' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const user_book_id = parseInt(req.params.id, 10);
    if (Number.isNaN(user_book_id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const [owns] = await pool.query(
      `SELECT user_book_id FROM user_book WHERE user_book_id = ? AND user_id = ?`,
      [user_book_id, req.user.user_id]
    );
    if (!owns.length) {
      return res.status(404).json({ error: 'Not found' });
    }

    const allowed = ['status', 'user_rating', 'review', 'current_page', 'started_at', 'finished_at'];
    const updates = [];
    const params = [];
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates.push(`${key} = ?`);
        params.push(req.body[key]);
      }
    }
    if (!updates.length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    params.push(user_book_id, req.user.user_id);
    await pool.query(
      `UPDATE user_book SET ${updates.join(', ')} WHERE user_book_id = ? AND user_id = ?`,
      params
    );
    const [rows] = await pool.query(
      `SELECT ub.*, b.title FROM user_book ub JOIN book b ON ub.book_id = b.book_id WHERE ub.user_book_id = ?`,
      [user_book_id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const user_book_id = parseInt(req.params.id, 10);
    if (Number.isNaN(user_book_id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const [result] = await pool.query(
      `DELETE FROM user_book WHERE user_book_id = ? AND user_id = ?`,
      [user_book_id, req.user.user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/detail', async (req, res) => {
  try {
    const user_book_id = parseInt(req.params.id, 10);
    if (Number.isNaN(user_book_id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const [rows] = await pool.query(
      `SELECT ub.*, b.*,
        CASE WHEN b.total_pages > 0 THEN ROUND((ub.current_page / b.total_pages) * 100, 1) ELSE 0 END AS completion_percentage
       FROM user_book ub
       INNER JOIN book b ON ub.book_id = b.book_id
       WHERE ub.user_book_id = ? AND ub.user_id = ?`,
      [user_book_id, req.user.user_id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    const row = rows[0];
    const book_id = row.book_id;
    const [authors] = await pool.query(
      `SELECT a.name FROM author a INNER JOIN book_author ba ON a.author_id = ba.author_id WHERE ba.book_id = ? ORDER BY a.name`,
      [book_id]
    );
    const [genres] = await pool.query(
      `SELECT g.name FROM genre g INNER JOIN book_genre bg ON g.genre_id = bg.genre_id WHERE bg.book_id = ? ORDER BY g.name`,
      [book_id]
    );
    const [ratings] = await pool.query(`SELECT * FROM online_rating WHERE book_id = ?`, [book_id]);
    const [sessionAgg] = await pool.query(
      `SELECT COUNT(*) AS total_sessions, COALESCE(SUM(pages_read),0) AS total_pages_logged FROM reading_session WHERE user_book_id = ?`,
      [user_book_id]
    );
    res.json({
      user_book_id: row.user_book_id,
      status: row.status,
      user_rating: row.user_rating,
      review: row.review,
      current_page: row.current_page,
      started_at: row.started_at,
      finished_at: row.finished_at,
      added_at: row.added_at,
      completion_percentage: Number(row.completion_percentage),
      book_id: row.book_id,
      title: row.title,
      isbn: row.isbn,
      description: row.description,
      cover_image_url: row.cover_image_url,
      total_pages: row.total_pages,
      publication_year: row.publication_year,
      avg_online_rating: row.avg_online_rating,
      authors: authors.map((a) => a.name),
      genres: genres.map((g) => g.name),
      online_ratings: ratings,
      total_sessions: sessionAgg[0].total_sessions,
      total_pages_logged: Number(sessionAgg[0].total_pages_logged),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
