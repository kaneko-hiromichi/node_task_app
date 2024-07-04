// app.js

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const db = require('./database'); // データベースの設定をインポート

app.use(bodyParser.urlencoded({ extended: true })); // URLエンコードされたデータを解析
app.use(bodyParser.json()); // JSONデータを解析

app.use(express.static('public'));

app.set('view engine', 'ejs');


let todos = []; 

// ToDoリストの表示
app.get('/', (req, res) => {
    db.all("SELECT * FROM todos", 
        [], 
        (err, rows) => {
      if (err) {
        console.error(err.message);
        res.status(500).send("データベースエラー");
      } else {
        res.render('top', { todos: rows });
      }
    });
  });

// 新しいToDoを追加
app.post('/add', (req, res) => {
    const task = req.body.todo;
    db.run(
        "INSERT INTO todos (task) VALUES (?)", 
        [task], 
        (err) => {
      if (err) {
        console.error(err.message);
        res.status(500).send("データベースエラー");
      } else {
        res.redirect('/');
      }
    });
});

app.post('/delete', (req, res) => {
    const id = req.body.num;
    db.run('DELETE FROM todos WHERE id = ?', 
        [id], 
        (err) => {
      if (err) {
        console.error(err.message);
        res.status(500).send("データベースエラー");
      } else {
        res.redirect('/');
      }
    });
  });
  



// サーバーの起動
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
