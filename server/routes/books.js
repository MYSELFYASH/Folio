const express = require('express');
const axios = require('axios');
const pool = require('../db/connection');
const router = express.Router();

function mapGoogleVolume(vol) {
  const info = vol.volumeInfo || {};
  const ids = vol.id ? { google_id: vol.id } : {};
  const imageLinks = info.imageLinks || {};
  const cover =
    imageLinks.extraLarge ||
    imageLinks.large ||
    imageLinks.medium ||
    imageLinks.thumbnail ||
    imageLinks.smallThumbnail ||
    null;
  const industry = (info.industryIdentifiers || []).find((i) => i.type === 'ISBN_13') ||
    (info.industryIdentifiers || []).find((i) => i.type === 'ISBN_10');
  return {
    ...ids,
    title: info.title || 'Untitled',
    authors: info.authors || [],
    publisher: info.publisher || null,
    published_year: info.publishedDate ? parseInt(String(info.publishedDate).slice(0, 4), 10) || null : null,
    page_count: info.pageCount || null,
    cover_url: cover,
    description: info.description || null,
    avg_rating: info.averageRating != null ? Number(info.averageRating) : null,
    genre: info.categories && info.categories[0] ? info.categories[0] : null,
    isbn: industry ? industry.identifier.replace(/-/g, '') : null,
  };
}

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || !String(q).trim()) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=8`;
    const { data } = await axios.get(url);
    const items = data.items || [];
    const mapped = items.map(mapGoogleVolume);
    res.json(mapped);
  } catch (err) {
    console.error('SEARCH ERROR:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

async function findOrCreatePublisher(conn, name, country = null) {
  if (!name) return null;
  const [existing] = await conn.query(`SELECT publisher_id FROM publisher WHERE name = ? LIMIT 1`, [name]);
  if (existing.length) return existing[0].publisher_id;
  const [ins] = await conn.query(`INSERT INTO publisher (name, country) VALUES (?, ?)`, [name, country]);
  return ins.insertId;
}

async function findOrCreateAuthor(conn, name) {
  const [existing] = await conn.query(`SELECT author_id FROM author WHERE name = ? LIMIT 1`, [name]);
  if (existing.length) return existing[0].author_id;
  const [ins] = await conn.query(`INSERT INTO author (name) VALUES (?)`, [name]);
  return ins.insertId;
}

async function findOrCreateGenre(conn, name) {
  if (!name) return null;
  const [existing] = await conn.query(`SELECT genre_id FROM genre WHERE name = ? LIMIT 1`, [name]);
  if (existing.length) return existing[0].genre_id;
  const [ins] = await conn.query(`INSERT INTO genre (name) VALUES (?)`, [name]);
  return ins.insertId;
}

router.post('/', async (req, res) => {
  const body = req.body || {};
  const title = (body.title || '').trim();
  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }
  const authors = Array.isArray(body.authors) ? body.authors : body.author ? [body.author] : [];
  const firstAuthor = authors[0] ? String(authors[0]).trim() : null;
  const isbn = body.isbn ? String(body.isbn).replace(/-/g, '') : null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (isbn) {
      const [byIsbn] = await conn.query(`SELECT book_id FROM book WHERE isbn = ? LIMIT 1`, [isbn]);
      if (byIsbn.length) {
        await conn.commit();
        return res.json({ book_id: byIsbn[0].book_id, existing: true });
      }
    }

    if (firstAuthor) {
      const [byTitleAuthor] = await conn.query(
        `SELECT b.book_id FROM book b
         INNER JOIN book_author ba ON b.book_id = ba.book_id
         INNER JOIN author a ON ba.author_id = a.author_id
         WHERE b.title = ? AND a.name = ?
         LIMIT 1`,
        [title, firstAuthor]
      );
      if (byTitleAuthor.length) {
        await conn.commit();
        return res.json({ book_id: byTitleAuthor[0].book_id, existing: true });
      }
    }

    const publisher_id = await findOrCreatePublisher(conn, body.publisher || null, null);
    const [bookIns] = await conn.query(
      `INSERT INTO book (isbn, title, description, cover_image_url, total_pages, publication_year, publisher_id, avg_online_rating, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        isbn,
        title,
        body.description || null,
        body.cover_url || body.cover_image_url || null,
        body.page_count != null ? parseInt(body.page_count, 10) : body.total_pages != null ? parseInt(body.total_pages, 10) : null,
        body.published_year || body.publication_year || null,
        publisher_id,
        body.avg_rating != null ? Number(body.avg_rating) : null,
      ]
    );
    const book_id = bookIns.insertId;

    for (const name of authors) {
      if (!name || !String(name).trim()) continue;
      const author_id = await findOrCreateAuthor(conn, String(name).trim());
      await conn.query(`INSERT IGNORE INTO book_author (book_id, author_id) VALUES (?, ?)`, [book_id, author_id]);
    }

    if (!authors.length && firstAuthor) {
      const author_id = await findOrCreateAuthor(conn, firstAuthor);
      await conn.query(`INSERT IGNORE INTO book_author (book_id, author_id) VALUES (?, ?)`, [book_id, author_id]);
    }

    const genreName = body.genre || null;
    const genre_id = await findOrCreateGenre(conn, genreName);
    if (genre_id) {
      await conn.query(`INSERT IGNORE INTO book_genre (book_id, genre_id) VALUES (?, ?)`, [book_id, genre_id]);
    }

    await conn.commit();
    res.status(201).json({ book_id, existing: false });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

router.get('/:id', async (req, res) => {
  try {
    const book_id = parseInt(req.params.id, 10);
    if (Number.isNaN(book_id)) {
      return res.status(400).json({ error: 'Invalid book id' });
    }
    const [books] = await pool.query(`SELECT * FROM book WHERE book_id = ?`, [book_id]);
    if (!books.length) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const b = books[0];
    const [authors] = await pool.query(
      `SELECT a.author_id, a.name FROM author a
       INNER JOIN book_author ba ON a.author_id = ba.author_id
       WHERE ba.book_id = ? ORDER BY a.name`,
      [book_id]
    );
    const [genres] = await pool.query(
      `SELECT g.genre_id, g.name FROM genre g
       INNER JOIN book_genre bg ON g.genre_id = bg.genre_id
       WHERE bg.book_id = ? ORDER BY g.name`,
      [book_id]
    );
    let publisher = null;
    if (b.publisher_id) {
      const [pubs] = await pool.query(`SELECT * FROM publisher WHERE publisher_id = ?`, [b.publisher_id]);
      publisher = pubs[0] || null;
    }
    const [ratings] = await pool.query(`SELECT * FROM online_rating WHERE book_id = ? ORDER BY fetched_at DESC`, [book_id]);
    res.json({
      ...b,
      authors,
      genres,
      publisher,
      online_ratings: ratings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
