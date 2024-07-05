const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const session = require('express-session');
// express-session の設定
app.use(session({
  secret: 'your_secret_key', // セッションIDの署名に使われるキー
  resave: false, // セッションが変更されていなくても再保存するかどうか
  saveUninitialized: true, // 新しいセッションを初期化して保存するかどうか
  cookie: { secure: false } // trueの場合、HTTPSを使う必要があります
}));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static('public'));

app.set('view engine', 'ejs');

// 日本時間を取得する関数
function getJapanTime() {
  const now = new Date();
  const options = {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  return new Intl.DateTimeFormat('ja-JP', options).format(now);
}

//ログイン画面
app.get('/login',(req,res)=>{
    res.render('login');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("ログインエラー");
    } else if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(400).send("無効なメールアドレスまたはパスワード");
    } else {
      console.log('ログインに成功しました')
      req.session.userId = user.id;
      res.redirect('/index');
    }
  });
});



//アカウント作成画面
app.get('/register',(req,res)=>{
    res.render('register');
});

//アカウント作成処理
const bcrypt = require('bcrypt');  //ハッシュ化にかかわるライブラリ【bcrypt】

app.post('/register', async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  
  try {
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ハッシュ化されたパスワードをデータベースに保存
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      (err) => {
        if (err) {
          console.error(err.message);
          res.status(500).send("データベースエラー");
        } else {
          res.redirect('/login');
        }
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send("ハッシュ化エラー");
  }
});



// タスクの表示
app.get('/index', (req, res) => {
  db.all("SELECT * FROM todos", [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("データベースエラー");
    } else {
      res.render('index', { todos: rows });
    }
  });
});

// 新しいタスクを追加
app.post('/add', (req, res) => {
  const task = req.body.todo;
  const createdAt = getJapanTime();
  db.run("INSERT INTO todos (task, created_at) VALUES (?, ?)", [task, createdAt], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("データベースエラー");
    } else {
      res.redirect('/index');
    }
  });
});

// タスクの削除
app.post('/delete', (req, res) => {
  const id = req.body.id;
  db.run('DELETE FROM todos WHERE id = ?', [id], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("データベースエラー");
    } else {
      res.redirect('/index');
    }
  });
});

// タスクの進行具合を更新
app.post('/status_update', (req, res) => {
  const id = req.body.id;
  const status = req.body.status;
  db.run('UPDATE todos SET status = ? WHERE id = ?', [status, id], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("データベースエラー");
    } else {
      res.redirect('/index');
    }
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
