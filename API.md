# ひとり帳 REST API

Firebase Cloud Functions (Gen 2) で実装したREST API。
ClaudeやChatGPTなどのAIツールから、経費・売上・設定・ToDo・メモ・ノートパッド・日報を操作できる。

---

## 接続情報

| 項目 | 値 |
|---|---|
| ベースURL | `https://us-central1-kaikei-ap.cloudfunctions.net/api` |
| 認証方式 | APIキー（リクエストヘッダー） |
| ヘッダー名 | `x-api-key` |
| APIキー | `.env.local` の `KAIKEI_API_KEY` を参照 |

すべてのエンドポイント（OpenAPI仕様を除く）に `x-api-key` ヘッダーが必要。

---

## OpenAPI仕様

AIツールに読み込ませる仕様書を以下のURLで公開している（認証不要）。

```
GET /api/openapi.json
```

---

## エンドポイント一覧

### 経費

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/expenses?year=2026` | 経費一覧（年指定、省略時は今年） |
| POST | `/api/expenses` | 経費を追加 |
| PUT | `/api/expenses/:id?year=2026` | 経費を更新 |
| DELETE | `/api/expenses/:id?year=2026` | 経費を削除 |

**POST / PUT のリクエストボディ**

```json
{
  "date": "2026-08-01",
  "category": "通信費",
  "amountWithTax": 5500,
  "taxRate": 10,
  "payee": "NTT",
  "expenseType": "固定費",
  "purpose": "業務用回線（任意）",
  "memo": "メモ（任意）"
}
```

- `category`: 通信費 / 消耗品費 / 地代家賃 / 外注費 / 旅費交通費 / 接待交際費 / 会議費 / 広告宣伝費 / 水道光熱費 / 新聞図書費 / ソフトウェア利用料 / 機材購入 / 雑費
- `taxRate`: 0 / 8 / 10
- `expenseType`: 固定費 / 変動費
- `amountWithoutTax`・`taxAmount` はAPIが自動計算する（指定不要）

---

### 売上

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/sales?year=2026` | 売上一覧（年指定、省略時は今年） |
| POST | `/api/sales` | 売上を追加 |
| PUT | `/api/sales/:id?year=2026` | 売上を更新 |
| DELETE | `/api/sales/:id?year=2026` | 売上を削除 |

**POST / PUT のリクエストボディ**

```json
{
  "date": "2026-08-01",
  "paymentDueDate": "2026-09-30",
  "paymentDate": "2026-09-25",
  "status": "入金済",
  "client": "株式会社〇〇",
  "amount": 330000,
  "memo": "メモ（任意）"
}
```

- `status`: 見込み / 請求済 / 入金済
- `paymentDate` は任意（入金前は省略可）

---

### 設定

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/settings` | 設定を取得 |
| PUT | `/api/settings` | 設定を更新（差分マージ） |

---

### ToDo

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/todos` | ToDo一覧 |
| POST | `/api/todos` | ToDoを追加 |
| PUT | `/api/todos/:id` | ToDoを更新（完了フラグ含む） |
| DELETE | `/api/todos/:id` | ToDoを削除 |

**POST のリクエストボディ**

```json
{
  "text": "確定申告の準備",
  "priority": "high",
  "done": false
}
```

- `priority`: high / medium / low
- 完了にするには `PUT` で `{ "done": true }` を送る

---

### メモ

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/memos` | メモ一覧 |
| POST | `/api/memos` | メモを追加 |
| PUT | `/api/memos/:id` | メモを更新 |
| DELETE | `/api/memos/:id` | メモを削除 |

**POST のリクエストボディ**

```json
{
  "title": "Dockerコンテナ起動コマンド",
  "category": "command",
  "body": "docker compose up -d"
}
```

- `category`: command / script / prompt / other

---

### ノートパッド

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/notepad` | テキスト内容を取得 |
| PUT | `/api/notepad` | テキスト内容を上書き保存 |

**PUT のリクエストボディ**

```json
{
  "content": "テキストの内容..."
}
```

---

### 日報

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/daily-reports` | 日報一覧 |
| POST | `/api/daily-reports` | 日報を追加 |
| PUT | `/api/daily-reports/:id` | 日報を更新 |
| DELETE | `/api/daily-reports/:id` | 日報を削除 |

**POST のリクエストボディ**

```json
{
  "date": "2026-08-01",
  "done": "今日やったこと",
  "plan": "明日やること",
  "note": "所感"
}
```

---

## AIツールとの連携方法

### Claude（claude.ai）

プロジェクトの指示欄やシステムプロンプトに以下を貼り付ける：

```
あなたは「ひとり帳」というフリーランス向け会計アプリのデータにアクセスできます。
Base URL: https://us-central1-kaikei-ap.cloudfunctions.net/api
認証: x-api-key ヘッダーに APIキーを付与
OpenAPI仕様: {Base URL}/api/openapi.json
```

APIキーはチャット上で伝えるか、プロジェクト知識として登録する。

### ChatGPT（GPTs / Actions）

1. GPTs の編集画面 → Actions → 「Create new action」
2. Schema の URL に以下を入力してインポート：
   ```
   https://us-central1-kaikei-ap.cloudfunctions.net/api/api/openapi.json
   ```
3. Authentication を「API Key」に設定、Header name を `x-api-key` に設定
4. APIキーを入力して保存

---

## curlでの動作確認例

```bash
# 経費一覧（2026年）
curl -H "x-api-key: <APIキー>" \
  "https://us-central1-kaikei-ap.cloudfunctions.net/api/api/expenses?year=2026"

# 経費を追加
curl -X POST \
  -H "x-api-key: <APIキー>" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-08-01","category":"通信費","amountWithTax":5500,"taxRate":10,"payee":"NTT","expenseType":"固定費"}' \
  "https://us-central1-kaikei-ap.cloudfunctions.net/api/api/expenses"

# ToDoを完了にする
curl -X PUT \
  -H "x-api-key: <APIキー>" \
  -H "Content-Type: application/json" \
  -d '{"done":true}' \
  "https://us-central1-kaikei-ap.cloudfunctions.net/api/api/todos/<id>"
```

---

## 実装メモ

- Firebase Cloud Functions Gen 2（Cloud Runベース）で動作
- Express.js でルーティング
- Firebase Admin SDK（サービスアカウント権限）で Firestore に直接アクセスするため、Firestoreセキュリティルールをバイパスする
- APIキーとユーザーIDは Firebase Secret Manager（`KAIKEI_API_KEY` / `KAIKEI_USER_ID`）で管理
- 経費・売上は Firestore の年別サブコレクション構造に対応（`year` クエリパラメータで年を指定、省略時は今年）
- ソースは `functions/src/index.ts`、デプロイは `firebase deploy --only functions --project kaikei-ap`
