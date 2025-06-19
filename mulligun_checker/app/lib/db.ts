import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'wiki.db')
const db = new Database(dbPath)

// initialize tables if not exists
// users: id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT
// articles: id INTEGER PRIMARY KEY, title TEXT, content TEXT, author_id INTEGER, created_at TEXT, updated_at TEXT
// comments: id INTEGER PRIMARY KEY, article_id INTEGER, author_id INTEGER, content TEXT, created_at TEXT

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
);
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  content TEXT,
  author_id INTEGER,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER,
  author_id INTEGER,
  content TEXT,
  created_at TEXT
);
`)

export default db
