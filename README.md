# kaikei-app

フリーランス・小規模事業者向けの個人用ツール集。
経費・売上管理に加え、ToDo・メモ・テキストエディタ・日報機能を統合。
Google認証でログインし、Firestoreにデータを保存。スマホ・PCどこからでも同じデータにアクセスできる。

**公開URL**: https://tadano-akira.github.io/kaikei-app/

---

## 機能一覧

| 機能 | 説明 |
|------|------|
| 経費管理 | 経費の入力・一覧・編集・削除。税自動計算、固定費/変動費分類 |
| ToDoリスト | タスク管理。優先度設定・完了管理・フィルター |
| 簡易メモ | コマンド・スクリプト・プロンプト等をカテゴリ別に保存 |
| テキストエディタ | シンプルなテキスト入力。クラウド保存・txt出力対応 |
| 日報 | 日付別の作業記録。今日やったこと・明日の予定・所感 |

---

## 技術構成

| 項目 | 技術 |
|------|------|
| フロントエンド | React 18 + TypeScript |
| ビルド | Vite |
| UI | CSS Variables（インラインスタイル） |
| 認証 | Firebase Authentication（Google） |
| DB | Firestore |
| ホスティング | GitHub Pages |
| CI/CD | GitHub Actions |

---

## 実装状況

### 会計機能
- [x] 経費入力フォーム（新規・編集）
- [x] 経費一覧（月別グループ・サマリー表示）
- [x] 経費詳細・削除
- [x] Firestore連携（リアルタイム同期）
- [ ] 売上管理
- [ ] ダッシュボード・月次サマリー
- [ ] 税金試算（所得税・住民税・消費税）
- [ ] CSVエクスポート

### ツール機能
- [x] ToDoリスト（優先度・フィルター・完了管理）
- [x] 簡易メモ（カテゴリ別・コピー機能）
- [x] テキストエディタ（保存ボタン方式・txt出力）
- [x] 日報（日付別・編集・削除）

---

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/tadano-akira/kaikei-app.git
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

### 4. ローカル起動

```bash
npm run dev
```

### 5. GitHub Pages にデプロイ

1. GitHubリポジトリの Settings → Pages → Source を「GitHub Actions」に変更
2. Settings → Secrets に上記の環境変数を6つ登録
3. `main` ブランチに push すると自動デプロイ

### 6. vite.config.ts の base を修正

```ts
base: '/your-repo-name/',  // GitHubリポジトリ名に合わせる
```

### 7. Firebase の承認済みドメインに追加

Firebase Console → Authentication → Settings → 承認済みドメイン に以下を追加:

```
your-github-username.github.io
```

---

## ディレクトリ構成

```
src/
├── types/          # TypeScript型定義（Expense・Todo・Memo・DailyReport等）
├── constants/      # 定数・税計算・フォーマットユーティリティ
├── lib/            # Firebase設定
├── hooks/          # カスタムフック
│   ├── useAuth.ts
│   ├── useExpenses.ts
│   ├── useTodos.ts
│   ├── useMemos.ts
│   ├── useNotepad.ts
│   └── useDailyReports.ts
├── components/     # 共通コンポーネント（ExpenseForm）
├── pages/          # 画面コンポーネント
│   ├── LoginPage.tsx
│   ├── ExpenseList.tsx
│   ├── ExpenseDetail.tsx
│   ├── TodoPage.tsx
│   ├── MemoPage.tsx
│   ├── NotepadPage.tsx
│   └── DailyReportPage.tsx
└── App.tsx         # ルーティング・タブ管理
```

---

## Firestoreデータ構造

```
users/{userId}/
  ├── expenses/{year}/items/{docId}   # 経費データ
  ├── todos/{docId}                   # ToDoデータ
  ├── memos/{docId}                   # メモデータ
  ├── notepad/main                    # テキストエディタ（1ドキュメント）
  └── dailyReports/{docId}            # 日報データ
```
