CREATE DATABASE IF NOT EXISTS folio_db;
USE folio_db;

-- Users
CREATE TABLE user (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  preferred_genres VARCHAR(255),
  yearly_goal INT DEFAULT 12,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Publishers (normalized — 3NF)
CREATE TABLE publisher (
  publisher_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  country VARCHAR(80)
);

-- Authors (normalized — 3NF)
CREATE TABLE author (
  author_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  bio TEXT
);

-- Genres (normalized — 1NF fix)
CREATE TABLE genre (
  genre_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
);

-- Books (shared catalog — one row per real-world book)
CREATE TABLE book (
  book_id INT AUTO_INCREMENT PRIMARY KEY,
  isbn VARCHAR(20),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url VARCHAR(500),
  total_pages INT,
  publication_year SMALLINT UNSIGNED,
  publisher_id INT,
  avg_online_rating DECIMAL(3,1),
  last_synced_at TIMESTAMP,
  FOREIGN KEY (publisher_id) REFERENCES publisher(publisher_id) ON DELETE SET NULL,
  INDEX idx_title (title),
  INDEX idx_isbn (isbn)
);

-- Many-to-many: books and authors
CREATE TABLE book_author (
  book_id INT NOT NULL,
  author_id INT NOT NULL,
  PRIMARY KEY (book_id, author_id),
  FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES author(author_id) ON DELETE CASCADE
);

-- Many-to-many: books and genres
CREATE TABLE book_genre (
  book_id INT NOT NULL,
  genre_id INT NOT NULL,
  PRIMARY KEY (book_id, genre_id),
  FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genre(genre_id) ON DELETE CASCADE
);

-- User's personal book shelf (the core junction table)
CREATE TABLE user_book (
  user_book_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  status ENUM('want_to_read', 'reading', 'finished') DEFAULT 'want_to_read',
  user_rating TINYINT CHECK (user_rating BETWEEN 1 AND 5),
  review TEXT,
  current_page INT DEFAULT 0,
  started_at DATE,
  finished_at DATE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_book (user_id, book_id),
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
);

-- Reading sessions (core progress tracking feature)
CREATE TABLE reading_session (
  session_id INT AUTO_INCREMENT PRIMARY KEY,
  user_book_id INT NOT NULL,
  session_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  pages_read INT NOT NULL CHECK (pages_read > 0),
  duration_minutes INT,
  note VARCHAR(255),
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_book_id) REFERENCES user_book(user_book_id) ON DELETE CASCADE,
  INDEX idx_session_date (session_date)
);

-- Highlights and notes
CREATE TABLE highlight (
  highlight_id INT AUTO_INCREMENT PRIMARY KEY,
  user_book_id INT NOT NULL,
  page_number INT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_book_id) REFERENCES user_book(user_book_id) ON DELETE CASCADE
);

-- Reading goals
CREATE TABLE goal (
  goal_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  goal_type ENUM('books_per_year', 'books_per_month', 'pages_per_month') NOT NULL,
  target_value INT NOT NULL,
  current_value INT DEFAULT 0,
  genre_id INT,
  year SMALLINT UNSIGNED NOT NULL,
  status ENUM('active', 'completed', 'failed') DEFAULT 'active',
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genre(genre_id) ON DELETE SET NULL
);

-- Online ratings from external sources
CREATE TABLE online_rating (
  rating_id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  source_name VARCHAR(50) NOT NULL,
  score DECIMAL(3,1),
  votes_count INT,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
);

-- User-created lists (favourites, TBR, custom)
CREATE TABLE book_list (
  list_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- Many-to-many: lists and books
CREATE TABLE book_list_item (
  list_id INT NOT NULL,
  book_id INT NOT NULL,
  sort_order INT DEFAULT 0,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (list_id, book_id),
  FOREIGN KEY (list_id) REFERENCES book_list(list_id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
);

-- Recommendations (pre-computed per user)
CREATE TABLE recommendation (
  rec_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  score DECIMAL(4,2),
  reason VARCHAR(255),
  is_seen BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
);

-- Reading progress view (computed — avoids repeated calculations)
CREATE OR REPLACE VIEW reading_progress AS
SELECT
  ub.user_book_id,
  ub.user_id,
  ub.book_id,
  b.title,
  b.total_pages,
  ub.current_page,
  CASE
    WHEN b.total_pages > 0
    THEN ROUND((ub.current_page / b.total_pages) * 100, 1)
    ELSE 0
  END AS completion_percentage,
  ub.status,
  ub.started_at,
  ub.finished_at,
  COUNT(rs.session_id) AS total_sessions,
  COALESCE(SUM(rs.pages_read), 0) AS total_pages_logged,
  COALESCE(SUM(rs.duration_minutes), 0) AS total_minutes
FROM user_book ub
JOIN book b ON ub.book_id = b.book_id
LEFT JOIN reading_session rs ON rs.user_book_id = ub.user_book_id
GROUP BY ub.user_book_id, ub.user_id, ub.book_id, b.title,
         b.total_pages, ub.current_page, ub.status,
         ub.started_at, ub.finished_at;
