const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const db = require('./database');

app.use(session({
  secret: 'your_secret_key', // セッションIDの署名に使われるキー。十分に長くてランダムな文字列を使用する
  resave: false, // セッションが変更されていなくても再保存しない
  saveUninitialized: false, // 新しいセッションを初期化して保存しない
  cookie: {
    secure: true, // HTTPSを使用してクッキーを送信する
    httpOnly: true, // クッキーをJavaScriptからアクセスできないようにする
    sameSite: 'strict', // クロスサイトのリクエストでクッキーが送信されないようにする
    maxAge: 60000 // セッションの有効期限（ミリ秒単位）
  }
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
    second: '2-digit',
    hour12: false // 24時間表示
  };

  const formatter = new Intl.DateTimeFormat('ja-JP', options);
  const parts = formatter.formatToParts(now);

  const dateParts = {};
  parts.forEach(({ type, value }) => {
    dateParts[type] = value;
  });

  return `${dateParts.year}/${dateParts.month}/${dateParts.day} ${dateParts.hour}:${dateParts.minute}:${dateParts.second}`;
}


// ログインページを表示
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// ログイン機能
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
      if (err) {
          console.error(err.message);
          res.status(500).send("ログインエラー");
      } else if (!user || !(await bcrypt.compare(password, user.password))) {
          res.render('login', { error: 'メールアドレスまたはパスワードが正しくありません。' });
      } else {
          req.session.userId = user.id; // セッションにユーザーIDを保存
          req.session.username = user.username; // ユーザー名も保存
          res.redirect('/index');
      }
  });
});





//アカウント作成画面
app.get('/register',(req,res)=>{
  res.render('register', { register_error: null });
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
          res.render('register', { register_error: 'そのアドレスは既に使用されています' });
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
  if (!req.session.userId) {
      return res.redirect('/login'); // ログインしていない場合はログインページへリダイレクト
  }

  db.all("SELECT * FROM todos WHERE userId = ?", [req.session.userId], (err, todos) => {
      if (err) {
          console.error(err.message);
          res.status(500).send("データベースエラー");
      } else {
          res.render('index', { todos: todos, username: req.session.username });
      }
  });
});

// 新しいタスクを追加
app.post('/add', (req, res) => {
  const task = req.body.todo;
  const createdAt = getJapanTime();
  const userId = req.session.userId; // セッションからユーザーIDを取得

  db.run("INSERT INTO todos (task, created_at, userId) VALUES (?, ?, ?)", [task, createdAt, userId], (err) => {
      if (err) {
          console.error(err.message);
          res.status(500).send("データベースエラー");
      } else {
          res.redirect('/index');
      }
  });
});

// タスクの更新
app.post('/update_task', (req, res) => {
  const { id, task } = req.body;

  db.run("UPDATE todos SET task = ? WHERE id = ?", [task, id], (err) => {
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
//ステータスが更新されたら/status_updateにpostされる
app.post('/status_update', (req, res) => {
  const id = req.body.id;  //更新するタスクのidを取得 どのタスクを更新するかのキー(where)
  const status = req.body.status;  //更新後のステータスを取得
  db.run('UPDATE todos SET status = ? WHERE id = ?', [status, id], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("データベースエラー");
    } else {
      res.redirect('/index');  //更新が正常に完了したら/indexにリダイレクト
    }
  });
});

// ログアウト
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {  //req.session.destroy(()=>{}) sessionの削除
    if (err) {
      return res.status(500).send("ログアウトエラー");
    }
    res.redirect('/login'); // ログインページにリダイレクト
  });
});





app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
