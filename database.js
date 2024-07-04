const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./todos.db');

db.serialize(() => {
  // テーブルが存在しない場合に作成
  db.run("CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, task TEXT)");

  // カラムの存在をチェック
  db.all("PRAGMA table_info(todos)", (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      const columnExists = rows.some(column => column.name === 'created_at');
      if (!columnExists) {
        // created_at カラムが存在しない場合に追加
        db.run("ALTER TABLE todos ADD COLUMN created_at TEXT", (err) => {
          if (err) {
            console.error(err.message);
          } else {
            console.log('created_at カラムを追加しました');
          }
        });
      }
    }
  });
});

module.exports = db;
