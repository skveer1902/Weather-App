import Database from 'better-sqlite3';


let db;


export function getDb() {
if (!db) {
db = new Database('weather.db');
db.pragma('journal_mode = WAL');


db.exec(`
CREATE TABLE IF NOT EXISTS locations (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
lat REAL NOT NULL,
lon REAL NOT NULL,
createdAt TEXT DEFAULT (datetime('now'))
);
`);
}
return db;
}