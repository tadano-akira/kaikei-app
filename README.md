# ひとり帳

フリーランス・小規模事業者向けの個人用ツール集。
経費・売上管理に加え、月次ダッシュボード・税金試算・ToDo・メモ・テキストエディタ・日報機能を統合。
Google認証でログインし、Firestoreにデータを保存。スマホ・PCどこからでも同じデータにアクセスできる。PWAに対応しており、ホーム画面へのインストールが可能。

**公開URL**: https://tadano-akira.github.io/kaikei-app/

> **注意**: 現在は個人用途に限定して運用しています。利用希望の方はこのリポジトリを fork し、ご自身の Firebase アカウントを使って環境を構築・ホスティングしてください。セットアップ手順は下記を参照してください。

---

## 機能一覧

| 機能 | 説明 |
|------|------|
| 経費管理 | 経費の入力・一覧（月別）・編集・削除。税自動計算、固定費/変動費分類、証票URL登録 |
| 売上管理 | 売上の入力・一覧（月別）・編集・削除。ステータス管理（見込み/請求済/入金済） |
| 月次ダッシュボード | 今月サマリー（売上・経費・利益・経費予算）・年間累計・税金概算 |
| 税金試算（詳細） | 所得税・住民税・消費税の計算明細。控除内訳・粗利を表示 |
| 設定 | 目標経費率・住民税率・消費税区分・各種所得控除を設定 |
| CSVエクスポート | 経費・売上データをCSV形式でダウンロード（Excel対応） |
| ToDoリスト | タスク管理。優先度設定・完了管理・フィルター |
| 簡易メモ | コマンド・スクリプト・プロンプト等をカテゴリ別に保存 |
| テキストエディタ | シンプルなテキスト入力。クラウド保存・txt出力対応 |
| 日報 | 日付別の作業記録。今日やったこと・明日の予定・所感 |
| REST API | Claude・ChatGPT等のAIツールから全データを操作できるHTTP API |
| 通信安定性ガード | 通信不安定・オフライン時に保存操作を停止。リトライしても重複を作らない冪等書き込み |

---

## 技術構成

| 項目 | 技術 |
|------|------|
| フロントエンド | React 18 + TypeScript |
| ビルド | Vite |
| UI | インラインスタイル（CSS Variables） |
| 認証 | Firebase Authentication（Google） |
| DB | Firestore |
| REST API | Firebase Cloud Functions（Gen 2）+ Express.js |
| ホスティング | GitHub Pages |
| CI/CD | GitHub Actions |
| PWA | vite-plugin-pwa |
| 通信状態監視 | `navigator.onLine` + favicon への HEAD 疎通確認（30秒間隔ポーリング） |

---

## 実装状況

### 会計機能
- [x] 経費入力フォーム（新規・編集・証票URL登録）
- [x] 経費一覧（月別・サマリー表示）
- [x] 経費詳細・削除
- [x] 売上管理（ステータス別・月別一覧）
- [x] 月次ダッシュボード（今月・年間累計）
- [x] 税金試算（所得税・住民税・消費税・粗利）
- [x] 設定画面（目標経費率・税率・所得控除）
- [x] CSVエクスポート（経費・売上）

### ツール機能
- [x] ToDoリスト（優先度・フィルター・完了管理）
- [x] 簡易メモ（カテゴリ別・コピー機能）
- [x] テキストエディタ（保存ボタン方式・txt出力）
- [x] 日報（日付別・編集・削除）

### 通信安定性
- [x] ネットワーク状態の監視・バナー表示（オフライン / 不安定）
- [x] 保存前の疎通確認と保存操作のブロック
- [x] 書き込みの多重実行防止（アプリ全体で直列化）
- [x] クライアント採番IDによる冪等な新規作成（リトライ時の重複防止）
- [x] ゲストデータ移行の冪等化（再実行しても重複しない）

### REST API
- [x] 全リソースのCRUD（経費・売上・設定・ToDo・メモ・ノートパッド・日報）
- [x] APIキー認証（`x-api-key` ヘッダー）
- [x] OpenAPI仕様公開（`GET /api/openapi.json`）
- [x] Claude / ChatGPT のツール呼び出しから操作可能

---

## セットアップ

### 1. リポジトリを fork & クローン

```bash
git clone https://github.com/YOUR_USERNAME/kaikei-app.git
cd kaikei-app
npm install
```

### 2. Firebase プロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクト作成
2. Authentication → Google ログインを有効化
3. Firestore → データベース作成（本番モード）
4. Firestore → ルールを以下に設定して公開

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. プロジェクト設定 → ウェブアプリを追加 → 設定値をコピー

### 3. 環境変数を設定

`.env.local` をプロジェクトルートに作成（git管理外）:

```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

### 4. vite.config.ts の base を修正

```ts
base: '/your-repo-name/',  // GitHubリポジトリ名に合わせる
```

### 5. ローカル起動

```bash
npm run dev
```

### 6. GitHub Pages にデプロイ

1. GitHubリポジトリの Settings → Pages → Source を「GitHub Actions」に変更
2. Settings → Secrets に上記の環境変数を6つ登録
3. `main` ブランチに push すると自動デプロイ

### 7. Firebase の承認済みドメインに追加

Firebase Console → Authentication → Settings → 承認済みドメイン に以下を追加:

```
your-github-username.github.io
```

---

## ディレクトリ構成

```
src/
├── types/          # TypeScript型定義（Expense・Sales・Settings等）
├── constants/      # 定数・税計算・フォーマットユーティリティ
├── lib/            # Firebase設定・通信状態管理（network.ts）・ゲストデータ移行
├── hooks/          # カスタムフック
│   ├── useAuth.ts
│   ├── useExpenses.ts
│   ├── useSales.ts
│   ├── useSettings.ts
│   ├── useTodos.ts
│   ├── useMemos.ts
│   ├── useNotepad.ts
│   ├── useDailyReports.ts
│   └── useNetworkStatus.ts
├── components/     # 共通コンポーネント（ExpenseForm・SalesForm）
├── pages/          # 画面コンポーネント
│   ├── LoginPage.tsx
│   ├── ExpenseList.tsx / ExpenseDetail.tsx
│   ├── SalesList.tsx / SalesDetail.tsx
│   ├── DashboardPage.tsx
│   ├── TaxDetailPage.tsx
│   ├── SettingsPage.tsx
│   ├── TodoPage.tsx
│   ├── MemoPage.tsx
│   ├── NotepadPage.tsx
│   └── DailyReportPage.tsx
└── App.tsx         # ルーティング・タブ管理

functions/          # Firebase Cloud Functions（REST API）
└── src/
    └── index.ts    # Express.js による全APIエンドポイント実装
```

---

## REST API

Claude・ChatGPT等のAIツールや外部スクリプトからデータを操作できるHTTP APIを提供している。
詳細は [API.md](API.md) を参照。

### エンドポイント一覧

| リソース | GET | POST | PUT | DELETE |
|---|---|---|---|---|
| 経費 | `/api/expenses?year=` | `/api/expenses` | `/api/expenses/:id` | `/api/expenses/:id` |
| 売上 | `/api/sales?year=` | `/api/sales` | `/api/sales/:id` | `/api/sales/:id` |
| 設定 | `/api/settings` | — | `/api/settings` | — |
| ToDo | `/api/todos` | `/api/todos` | `/api/todos/:id` | `/api/todos/:id` |
| メモ | `/api/memos` | `/api/memos` | `/api/memos/:id` | `/api/memos/:id` |
| ノートパッド | `/api/notepad` | — | `/api/notepad` | — |
| 日報 | `/api/daily-reports` | `/api/daily-reports` | `/api/daily-reports/:id` | `/api/daily-reports/:id` |

### 認証

すべてのリクエストに `x-api-key` ヘッダーが必要。APIキーは `.env.local` に保存（git管理外）。

### AIツールへの組み込み

- **Claude**: プロジェクト指示にベースURLとAPIキーを記載するだけで利用可能
- **ChatGPT（GPTs）**: Actions の Schema URL に `/api/openapi.json` を指定してインポート

### デプロイ

```bash
firebase deploy --only functions --project <PROJECT_ID>
```

---

## 通信安定性ガード

通信が不安定な回線・モバイル環境での利用を想定し、保存操作（Firestore への書き込み）に対して次のガードをかけている。実装は [src/lib/network.ts](src/lib/network.ts) と [src/hooks/useNetworkStatus.ts](src/hooks/useNetworkStatus.ts)。

### ネットワーク状態

`online` / `checking` / `offline` / `unstable` の4状態を管理する。

- `navigator.onLine` と `online` / `offline` イベントを購読する。
- 併せて `favicon.png` へ `HEAD` リクエストを投げ、実際の疎通を確認する。タイムアウトは3秒。
- 30秒間隔でポーリングし、状態変化を `CustomEvent` でアプリ全体に配信する。
- 非ゲストで `online` 以外のとき、画面上部に警告バナーを表示する。

### 保存操作のガード

すべての作成・更新・削除は `runNetworkAction()` を経由する。

- 実行前に疎通確認する。失敗した場合は書き込まず、エラーを投げる。
- モジュール単位のフラグで書き込みを直列化する。実行中の別書き込みは弾く。
- フォームは保存中ボタンを disabled にし、失敗時はエラーメッセージを表示する。

### 冪等な書き込み

- 新規作成は `addDoc` を使わない。クライアントで採番した UUID をドキュメントIDに指定して `setDoc` する。
- 採番したIDは保存成功まで保持する。通信失敗でリトライしても同じドキュメントに書くため、重複が発生しない。
- ゲストデータの Firestore 移行も、ローカルIDをそのままドキュメントIDに使う。移行を再実行しても重複しない。

---

## Firestoreデータ構造

```
users/{userId}/
  ├── expenses/{year}/items/{docId}   # 経費データ
  ├── sales/{year}/items/{docId}      # 売上データ
  ├── settings/main                   # 設定データ
  ├── todos/{docId}                   # ToDoデータ
  ├── memos/{docId}                   # メモデータ
  ├── notepad/main                    # テキストエディタ（1ドキュメント）
  └── dailyReports/{docId}            # 日報データ
```
