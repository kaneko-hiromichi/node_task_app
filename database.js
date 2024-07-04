const sqlite3 = require('sqlite3').verbose();

// データベースファイルの指定（存在しない場合は自動的に作成されます）
const db = new sqlite3.Database('./todos.db');

// テーブルの作成
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, task TEXT)");
});

module.exports = db;
