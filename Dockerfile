# ベースとなるNode.jsのイメージを指定
FROM node:14

# アプリを実行するディレクトリを作る
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 必要なパッケージをインストール
RUN npm install

# ソースコードをコピー
COPY . .

# アプリが動くポートを指定
EXPOSE 3000


# アプリを起動するコマンド
CMD ["node", "app.js"]
# 必要なパッケージをインストール
RUN npm cache clean --force
RUN npm install
