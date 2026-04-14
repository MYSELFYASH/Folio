-- Folio seed data — run after schema.sql
-- Password for all demo users: password123 (bcrypt 10 rounds)

USE folio_db;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE recommendation;
TRUNCATE TABLE book_list_item;
TRUNCATE TABLE book_list;
TRUNCATE TABLE online_rating;
TRUNCATE TABLE highlight;
TRUNCATE TABLE reading_session;
TRUNCATE TABLE goal;
TRUNCATE TABLE user_book;
TRUNCATE TABLE book_genre;
TRUNCATE TABLE book_author;
TRUNCATE TABLE book;
TRUNCATE TABLE genre;
TRUNCATE TABLE author;
TRUNCATE TABLE publisher;
TRUNCATE TABLE user;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO user (user_id, username, email, password_hash, preferred_genres, yearly_goal) VALUES
(1, 'demo_reader', 'demo@folio.local', '$2b$10$iQXqFQ6Ektqk3ju7kMYVYeX/j5MtBVAeL158u1SIAgZYe2gHj265G', 'Fiction, Sci-Fi', 24),
(2, 'page_turner', 'page@folio.local', '$2b$10$iQXqFQ6Ektqk3ju7kMYVYeX/j5MtBVAeL158u1SIAgZYe2gHj265G', 'History, Non-fiction', 12),
(3, 'night_owl', 'owl@folio.local', '$2b$10$iQXqFQ6Ektqk3ju7kMYVYeX/j5MtBVAeL158u1SIAgZYe2gHj265G', 'Tech, Design', 18);

INSERT INTO publisher (publisher_id, name, country) VALUES
(1, 'Penguin Books', 'United Kingdom'),
(2, 'HarperCollins', 'United States'),
(3, "O'Reilly Media", 'United States'),
(4, 'Picador', 'United Kingdom'),
(5, 'Vintage', 'United States'),
(6, 'MIT Press', 'United States');

INSERT INTO author (author_id, name, bio) VALUES
(1, 'George Orwell', 'English novelist and essayist.'),
(2, 'Jane Austen', 'English novelist known for social commentary.'),
(3, 'Isaac Asimov', 'American writer and professor of biochemistry.'),
(4, 'James Clear', 'Author focused on habits and decision making.'),
(5, 'Yuval Noah Harari', 'Israeli historian and author.'),
(6, 'Don Norman', 'Cognitive scientist and usability expert.'),
(7, 'Robert C. Martin', 'Software engineer and author.'),
(8, 'Walter Isaacson', 'American author and journalist.'),
(9, 'Daniel Kahneman', 'Psychologist and Nobel laureate.'),
(10, 'Marcus Aurelius', 'Roman emperor and Stoic philosopher.');

INSERT INTO genre (genre_id, name) VALUES
(1, 'Fiction'), (2, 'Non-fiction'), (3, 'Sci-Fi'), (4, 'Tech'),
(5, 'Design'), (6, 'History'), (7, 'Psychology'), (8, 'Philosophy');

INSERT INTO book (book_id, isbn, title, description, cover_image_url, total_pages, publication_year, publisher_id, avg_online_rating, last_synced_at) VALUES
(1, '9780451524935', '1984', 'Dystopian social science fiction novel.', 'http://books.google.com/books/content?id=kotPYEqx7pmMC&printsec=frontcover&img=1&zoom=1', 328, 1949, 1, 4.2, NOW()),
(2, '9780141439518', 'Pride and Prejudice', 'Classic romance examining manners and marriage.', 'http://books.google.com/books/content?id=s1gVAAAAYAAJ&printsec=frontcover&img=1&zoom=1', 432, 1813, 1, 4.5, NOW()),
(3, '9780553293357', 'Foundation', 'First novel in the Foundation series.', 'http://books.google.com/books/content?id=p4V-AQAACAAJ&printsec=frontcover&img=1&zoom=1', 255, 1951, 2, 4.3, NOW()),
(4, '9780735211292', 'Atomic Habits', 'Tiny changes, remarkable results.', 'http://books.google.com/books/content?id=XfFvDwAAQBAJ&printsec=frontcover&img=1&zoom=1', 320, 2018, 2, 4.8, NOW()),
(5, '9780062316097', 'Sapiens', 'A brief history of humankind.', 'http://books.google.com/books/content?id=FmyBAwAAQBAJ&printsec=frontcover&img=1&zoom=1', 464, 2011, 2, 4.6, NOW()),
(6, '9780465050659', 'The Design of Everyday Things', 'Fundamentals of human-centered design.', 'http://books.google.com/books/content?id=nVQPAQAAMAAJ&printsec=frontcover&img=1&zoom=1', 368, 2013, 6, 4.4, NOW()),
(7, '9780132350884', 'Clean Code', 'A handbook of agile software craftsmanship.', 'http://books.google.com/books/content?id=hjEFCAAAQBAJ&printsec=frontcover&img=1&zoom=1', 464, 2008, 3, 4.5, NOW()),
(8, '9781476727653', 'Steve Jobs', 'Biography of Apple co-founder.', 'http://books.google.com/books/content?id=I3n_Z3e5K7sC&printsec=frontcover&img=1&zoom=1', 630, 2011, 2, 4.6, NOW()),
(9, '9780374533557', 'Thinking, Fast and Slow', 'Two systems that drive the way we think.', 'http://books.google.com/books/content?id=Zu11wH8lTnkC&printsec=frontcover&img=1&zoom=1', 499, 2011, 4, 4.4, NOW()),
(10, '9780812968255', 'Meditations', 'Spiritual reflections and exercises.', 'http://books.google.com/books/content?id=4YwRDAAAQBAJ&printsec=frontcover&img=1&zoom=1', 254, 180, 5, 4.3, NOW()),
(11, '9780316769488', 'The Catcher in the Rye', 'Coming-of-age story narrated by Holden Caulfield.', NULL, 277, 1951, 4, 4.1, NOW()),
(12, '9780061120084', 'To Kill a Mockingbird', 'Novel of racial injustice and childhood.', NULL, 336, 1960, 2, 4.3, NOW()),
(13, '9780441013593', 'Dune', 'Epic science fiction novel.', NULL, 688, 1965, 2, 4.4, NOW()),
(14, '9780316017930', 'Outliers', 'Success and opportunity.', NULL, 309, 2008, 4, 4.2, NOW()),
(15, '9780143127741', 'The Sense of Style', 'Writing guide by Steven Pinker.', NULL, 368, 2014, 1, 4.0, NOW()),
(16, '9780201633610', 'Design Patterns', 'Elements of reusable object-oriented software.', NULL, 395, 1994, 3, 4.3, NOW()),
(17, '9780143127550', 'The Information', 'A history, a theory, a flood.', NULL, 544, 2011, 1, 4.1, NOW()),
(18, '9780375703760', 'The Blind Assassin', 'Novel by Margaret Atwood.', NULL, 536, 2000, 4, 4.0, NOW()),
(19, '9780140449334', 'The Republic', 'Platonic dialogue on justice.', NULL, 416, 2000, 1, 4.2, NOW()),
(20, '9780062315007', 'Homo Deus', 'A brief history of tomorrow.', NULL, 464, 2015, 2, 4.5, NOW()),
(21, '9781617294136', 'Deep Learning', 'Foundations of deep learning.', NULL, 800, 2016, 3, 4.3, NOW()),
(22, '9781449339611', 'Learning SQL', 'Generate, manipulate, and retrieve data.', NULL, 352, 2009, 3, 4.1, NOW()),
(23, '9780312424404', 'The Road', 'Post-apocalyptic novel by Cormac McCarthy.', NULL, 287, 2006, 4, 4.0, NOW()),
(24, '9780143128560', 'Guns, Germs, and Steel', 'Human societies over 13,000 years.', NULL, 496, 1997, 1, 4.2, NOW()),
(25, '9780375704026', 'Oryx and Crake', 'Speculative fiction by Margaret Atwood.', NULL, 400, 2003, 4, 4.1, NOW()),
(26, '9780316219280', 'The Martian', 'Survival story on Mars.', NULL, 384, 2011, 4, 4.4, NOW()),
(27, '9780062657759', 'Educated', 'Memoir by Tara Westover.', NULL, 352, 2018, 2, 4.5, NOW()),
(28, '9780735211299', 'Digital Minimalism', 'Choosing a focused life.', NULL, 304, 2019, 2, 4.2, NOW()),
(29, '9780262033848', 'Introduction to Algorithms', 'Classic algorithms textbook.', NULL, 1312, 2009, 6, 4.5, NOW()),
(30, '9780134685991', 'Effective Java', 'Best practices for the Java platform.', NULL, 416, 2017, 3, 4.6, NOW()),
(31, '9780143118752', 'The Black Swan', 'Impact of highly improbable events.', NULL, 444, 2007, 1, 4.0, NOW()),
(32, '9780316769174', 'Franny and Zooey', 'Stories by J.D. Salinger.', NULL, 202, 1961, 4, 4.0, NOW()),
(33, '9780062457714', 'The Subtle Art of Not Giving a F*ck', 'Counterintuitive approach to living.', NULL, 224, 2016, 2, 4.0, NOW()),
(34, '9780316381992', 'Dark Matter', 'Science thriller by Blake Crouch.', NULL, 352, 2016, 4, 4.2, NOW()),
(35, '9780143124304', 'The Master Algorithm', 'Quest for the ultimate learning machine.', NULL, 352, 2015, 1, 4.0, NOW()),
(36, '9780262531969', 'Structure and Interpretation of Computer Programs', 'Foundational CS text.', NULL, 657, 1996, 6, 4.5, NOW()),
(37, '9780316479830', 'The Three-Body Problem', 'Hard science fiction novel.', NULL, 400, 2014, 4, 4.2, NOW()),
(38, '9780143127749', 'How to Read a Book', 'Classic guide to reading well.', NULL, 426, 1940, 1, 4.1, NOW()),
(39, '9780060883289', 'One Hundred Years of Solitude', 'Magical realism masterpiece.', NULL, 417, 1967, 2, 4.3, NOW()),
(40, '9780316017939', 'Blink', 'Power of thinking without thinking.', NULL, 296, 2005, 4, 4.0, NOW());

INSERT INTO book_author (book_id, author_id) VALUES
(1,1),(2,2),(3,3),(4,4),(5,5),(6,6),(7,7),(8,8),(9,9),(10,10),
(11,1),(12,2),(13,3),(14,4),(15,5),(16,7),(17,5),(18,2),(19,10),(20,5),
(21,7),(22,7),(23,1),(24,5),(25,2),(26,3),(27,4),(28,4),(29,7),(30,7),
(31,5),(32,1),(33,4),(34,3),(35,7),(36,7),(37,3),(38,6),(39,8),(40,4);

INSERT INTO book_genre (book_id, genre_id) VALUES
(1,1),(1,3),(2,1),(3,3),(4,2),(4,7),(5,2),(5,6),(6,5),(6,2),(7,4),(8,2),(8,6),(9,7),(10,8),
(11,1),(12,1),(13,3),(14,2),(14,7),(15,2),(16,4),(17,2),(18,1),(19,8),(20,2),(21,4),(22,4),
(23,1),(24,6),(25,3),(26,3),(27,2),(28,2),(29,4),(30,4),(31,2),(32,1),(33,2),(33,7),(34,3),
(35,4),(36,4),(37,3),(38,2),(39,1),(40,7);

-- 34 user books for demo user 1 (books 1–34)
INSERT INTO user_book (user_book_id, user_id, book_id, status, user_rating, review, current_page, started_at, finished_at) VALUES
(1, 1, 1, 'finished', 5, 'Timeless.', 328, '2025-06-01', '2026-01-15'),
(2, 1, 2, 'finished', 5, 'Wonderful.', 432, '2025-08-10', '2026-02-20'),
(3, 1, 3, 'reading', NULL, NULL, 120, '2026-03-01', NULL),
(4, 1, 4, 'finished', 5, 'Life changing.', 320, '2025-11-01', '2026-03-10'),
(5, 1, 5, 'want_to_read', NULL, NULL, 0, NULL, NULL),
(6, 1, 6, 'reading', NULL, NULL, 200, '2026-02-15', NULL),
(7, 1, 7, 'finished', 4, 'Dense but great.', 464, '2025-09-01', '2026-04-01'),
(8, 1, 8, 'want_to_read', NULL, NULL, 0, NULL, NULL),
(9, 1, 9, 'finished', 5, 'Essential.', 499, '2025-10-01', '2026-01-05'),
(10, 1, 10, 'reading', NULL, NULL, 90, '2026-04-01', NULL),
(11, 1, 11, 'finished', 4, NULL, 277, '2025-07-01', '2025-12-01'),
(12, 1, 12, 'want_to_read', NULL, NULL, 0, NULL, NULL),
(13, 1, 13, 'reading', NULL, NULL, 400, '2026-01-20', NULL),
(14, 1, 14, 'finished', 4, NULL, 309, '2025-12-01', '2026-02-01'),
(15, 1, 15, 'want_to_read', NULL, NULL, 0, NULL, NULL),
(16, 1, 16, 'reading', NULL, NULL, 50, '2026-04-05', NULL),
(17, 1, 17, 'finished', 4, NULL, 544, '2025-05-01', '2025-11-15'),
(18, 1, 18, 'want_to_read', NULL, NULL, 0, NULL, NULL),
(19, 1, 19, 'reading', NULL, NULL, 30, '2026-03-20', NULL),
(20, 1, 20, 'finished', 5, NULL, 464, '2025-04-01', '2026-03-25'),
(21, 1, 21, 'want_to_read', NULL, NULL, 0, NULL, NULL),
(22, 1, 22, 'finished', 4, 'Great for SQL class.', 352, '2025-08-20', '2026-02-28'),
(23, 1, 23, 'reading', NULL, NULL, 100, '2026-02-01', NULL),
(24, 1, 24, 'want_to_read', NULL, NULL, 0, NULL, NULL),
(25, 1, 25, 'finished', 4, NULL, 400, '2025-11-10', '2026-04-05'),
(26, 1, 26, 'reading', NULL, NULL, 150, '2026-03-15', NULL),
(27, 1, 27, 'finished', 5, NULL, 352, '2025-09-15', '2026-01-30'),
(28, 1, 28, 'want_to_read', NULL, NULL, 0, NULL, NULL),
(29, 1, 29, 'reading', NULL, NULL, 80, '2026-01-10', NULL),
(30, 1, 30, 'finished', 5, NULL, 416, '2025-06-15', '2025-12-20'),
(31, 1, 31, 'want_to_read', NULL, NULL, 0, NULL, NULL),
(32, 1, 32, 'reading', NULL, NULL, 60, '2026-04-08', NULL),
(33, 1, 33, 'finished', 3, 'Okay.', 224, '2025-12-05', '2026-02-15'),
(34, 1, 34, 'reading', NULL, NULL, 200, '2026-03-05', NULL);

INSERT INTO user_book (user_id, book_id, status, current_page, started_at, finished_at) VALUES
(2, 35, 'reading', 100, '2026-03-01', NULL),
(2, 36, 'want_to_read', 0, NULL, NULL),
(3, 37, 'finished', 400, '2025-10-01', '2026-01-01'),
(3, 38, 'reading', 50, '2026-02-01', NULL);

-- 15 reading sessions for user 1 (spread over ~4 months)
INSERT INTO reading_session (user_book_id, session_date, pages_read, duration_minutes, note) VALUES
(3, '2026-01-10', 25, 40, NULL),
(3, '2026-01-18', 30, 45, NULL),
(3, '2026-02-02', 40, 50, 'Great chapter'),
(6, '2026-02-20', 35, 30, NULL),
(6, '2026-03-05', 50, 60, NULL),
(7, '2026-03-28', 42, 55, NULL),
(10, '2026-04-02', 15, 20, NULL),
(13, '2026-02-01', 60, 70, NULL),
(13, '2026-03-12', 45, NULL, NULL),
(16, '2026-04-06', 25, 35, NULL),
(19, '2026-03-25', 20, 25, NULL),
(23, '2026-02-10', 40, 40, NULL),
(26, '2026-03-18', 35, 45, NULL),
(29, '2026-01-25', 30, 40, NULL),
(32, '2026-04-09', 20, 30, NULL);

-- Re-sync current_page for user_books that have sessions (sessions added after manual current_page — keep as-is or adjust)
-- Demo data: current_page values set for library UI; sessions add realistic history.

INSERT INTO highlight (user_book_id, page_number, content) VALUES
(1, 42, 'Who controls the past controls the future.'),
(4, 12, 'You do not rise to the level of your goals.'),
(9, 88, 'System 1 operates automatically and quickly.');

-- Active yearly goal: 7 books finished in 2026 from seed (ids1,2,4,7,9,14,20,22,25,27,33 — count those with finished_at in 2026)
-- Finished in 2026: 1,2,4,7,9,14,20,22,25,27,33 = 11; adjust target24, current 11
INSERT INTO goal (goal_id, user_id, goal_type, target_value, current_value, genre_id, year, status) VALUES
(1, 1, 'books_per_year', 24, 11, NULL, 2026, 'active');

INSERT INTO online_rating (book_id, source_name, score, votes_count) VALUES
(1, 'Open Library', 4.2, 1200),
(3, 'Open Library', 4.3, 890),
(13, 'Open Library', 4.4, 2400);

INSERT INTO book_list (list_id, user_id, name, description, is_public) VALUES
(1, 1, 'Favourites', 'All-time favourites', FALSE),
(2, 1, 'Summer reads', 'Beach and patio picks', FALSE);

INSERT INTO book_list_item (list_id, book_id, sort_order) VALUES
(1, 1, 1), (1, 2, 2), (1, 4, 3), (1, 9, 4),
(2, 13, 1), (2, 26, 2), (2, 34, 3), (2, 37, 4);

ALTER TABLE user AUTO_INCREMENT = 4;
ALTER TABLE publisher AUTO_INCREMENT = 7;
ALTER TABLE author AUTO_INCREMENT = 11;
ALTER TABLE genre AUTO_INCREMENT = 9;
ALTER TABLE book AUTO_INCREMENT = 41;
ALTER TABLE user_book AUTO_INCREMENT = 100;
ALTER TABLE reading_session AUTO_INCREMENT = 100;
ALTER TABLE highlight AUTO_INCREMENT = 10;
ALTER TABLE goal AUTO_INCREMENT = 10;
ALTER TABLE online_rating AUTO_INCREMENT = 10;
ALTER TABLE book_list AUTO_INCREMENT = 10;
ALTER TABLE recommendation AUTO_INCREMENT = 1;
