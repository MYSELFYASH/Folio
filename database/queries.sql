-- ============================================================
-- FOLIO — DOCUMENTED SQL QUERIES
-- For DBMS Lab Submission
-- ============================================================

-- 1. REGISTER A NEW USER (INSERT)
-- Hashes are produced by the application (bcrypt); example placeholder below.
INSERT INTO user (username, email, password_hash)
VALUES ('arjun_k', 'arjun@example.com', '$2b$10$...');

-- 2. ADD A BOOK TO USER'S LIBRARY (INSERT)
INSERT INTO user_book (user_id, book_id, status, started_at)
VALUES (1, 5, 'reading', CURDATE());

-- 3. LOG A READING SESSION (INSERT + UPDATE via transaction)
START TRANSACTION;
INSERT INTO reading_session (user_book_id, pages_read, session_date, duration_minutes)
VALUES (12, 42, CURDATE(), 55);
UPDATE user_book SET current_page = current_page + 42 WHERE user_book_id = 12;
COMMIT;

-- 4. GET USER'S LIBRARY WITH PROGRESS (SELECT + JOIN + GROUP BY)
SELECT ub.user_book_id, b.title, ub.status,
       ROUND((ub.current_page / b.total_pages) * 100, 1) AS pct,
       GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS authors
FROM user_book ub
JOIN book b ON ub.book_id = b.book_id
LEFT JOIN book_author ba ON b.book_id = ba.book_id
LEFT JOIN author a ON ba.author_id = a.author_id
WHERE ub.user_id = 1
GROUP BY ub.user_book_id, b.title, ub.status, ub.current_page, b.total_pages;

-- 5. UPDATE READING STATUS (UPDATE)
UPDATE user_book SET status = 'finished', finished_at = CURDATE()
WHERE user_book_id = 12 AND user_id = 1;

-- 6. RATE AND REVIEW A BOOK (UPDATE)
UPDATE user_book SET user_rating = 5, review = 'Excellent read.'
WHERE user_book_id = 12 AND user_id = 1;

-- 7. BOOKS FINISHED PER MONTH THIS YEAR (AGGREGATION)
SELECT MONTH(finished_at) AS month, COUNT(*) AS books_finished
FROM user_book
WHERE user_id = 1 AND status = 'finished' AND YEAR(finished_at) = YEAR(CURDATE())
GROUP BY MONTH(finished_at);

-- 8. GENRE BREAKDOWN (JOIN + GROUP BY + ORDER BY)
SELECT g.name, COUNT(DISTINCT ub.book_id) AS total
FROM user_book ub
JOIN book_genre bg ON ub.book_id = bg.book_id
JOIN genre g ON bg.genre_id = g.genre_id
WHERE ub.user_id = 1
GROUP BY g.name ORDER BY total DESC;

-- 9. TOP RATED BOOKS (SUBQUERY + ORDER BY)
SELECT b.title, ub.user_rating
FROM user_book ub JOIN book b ON ub.book_id = b.book_id
WHERE ub.user_id = 1 AND ub.user_rating = (
  SELECT MAX(user_rating) FROM user_book WHERE user_id = 1
);

-- 10. READING STREAK CALCULATION (DATE ARITHMETIC)
SELECT session_date, SUM(pages_read) AS pages_that_day
FROM reading_session rs
JOIN user_book ub ON rs.user_book_id = ub.user_book_id
WHERE ub.user_id = 1
GROUP BY session_date
ORDER BY session_date DESC;

-- 11. DELETE A BOOK FROM LIBRARY (DELETE + CASCADE)
DELETE FROM user_book WHERE user_book_id = 12 AND user_id = 1;
-- reading_session and highlight rows cascade automatically

-- 12. SEARCH BOOKS BY TITLE OR AUTHOR (LIKE + JOIN)
SELECT DISTINCT b.book_id, b.title, b.cover_image_url,
       GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS authors
FROM book b
LEFT JOIN book_author ba ON b.book_id = ba.book_id
LEFT JOIN author a ON ba.author_id = a.author_id
WHERE b.title LIKE '%atomic%' OR a.name LIKE '%atomic%'
GROUP BY b.book_id, b.title, b.cover_image_url;

-- 13. RECOMMENDED BOOKS (SUBQUERY + NOT IN)
SELECT b.book_id, b.title, b.avg_online_rating
FROM book b
JOIN book_genre bg ON b.book_id = bg.book_id
WHERE bg.genre_id IN (
  SELECT bg2.genre_id FROM user_book ub
  JOIN book_genre bg2 ON ub.book_id = bg2.book_id
  WHERE ub.user_id = 1 AND ub.user_rating >= 4
  GROUP BY bg2.genre_id ORDER BY COUNT(*) DESC LIMIT 3
)
AND b.book_id NOT IN (SELECT book_id FROM user_book WHERE user_id = 1)
ORDER BY b.avg_online_rating DESC LIMIT 10;

-- 14. READING ACTIVITY HEATMAP (GROUP BY DATE)
SELECT rs.session_date, SUM(rs.pages_read) AS pages
FROM reading_session rs
JOIN user_book ub ON rs.user_book_id = ub.user_book_id
WHERE ub.user_id = 1
  AND rs.session_date >= DATE_SUB(CURDATE(), INTERVAL 112 DAY)
GROUP BY rs.session_date ORDER BY rs.session_date;

-- 15. UPDATE GOAL PROGRESS WHEN BOOK IS FINISHED (UPDATE)
UPDATE goal SET current_value = current_value + 1
WHERE user_id = 1 AND goal_type = 'books_per_year'
  AND year = YEAR(CURDATE()) AND status = 'active';
