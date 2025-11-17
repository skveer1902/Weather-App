// lib/db.js
import Database from 'better-sqlite3';
import path from 'path';

let db;

export function getDb() {
  if (!db) {
    const filename = path.join(process.cwd(), 'weather.db');
    db = new Database(filename);
    db.pragma('journal_mode = WAL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        createdAt TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS weather_queries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        locationName TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        units TEXT NOT NULL,
        payload TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now'))
      );
    `);
  }
  return db;
}
