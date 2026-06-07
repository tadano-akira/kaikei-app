# 簡易会計アプリ

フリーランス・小規模事業者向けの経費・売上管理アプリ。

## 技術構成

| 項目 | 技術 |
|------|------|
| フロントエンド | React 18 + TypeScript |
| ビルド | Vite |
| UI | CSS Variables（Tailwind は未使用、インラインスタイル） |
| 認証 | Firebase Authentication（Google） |
| DB | Firestore |
| ホスティング | GitHub Pages |
| CI/CD | GitHub Actions |

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/yourname/kaikei-app.git
cd kaikei-app
npm install
```

### 2. Firebase プロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクト作成
2. Authentication → Google ログインを有効化
3. Firestore → データベース作成（本番モード）
4. プロジェクト設定 → ウェブアプリを追加 → 設定値をコピー

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
2. Settings → Secrets に上記の環境変数を登録
3. `main` ブランチに push すると自動デプロイ

### 6. vite.config.ts の base を修正

```ts
base: '/your-repo-name/',  // GitHubリポジトリ名に合わせる
```

## 現在の実装状況

- [x] 経費一覧（モックデータ）
- [x] 経費入力フォーム（新規・編集）
- [x] 経費詳細・削除
- [ ] Firebase 認証連携
- [ ] Firestore データ保存
- [ ] 売上管理
- [ ] ダッシュボード
- [ ] 税金試算

## ディレクトリ構成

```
src/
├── types/        # TypeScript型定義
├── constants/    # 定数・計算ユーティリティ
├── lib/          # Firebase設定・モックデータ
├── hooks/        # カスタムフック（useExpenses）
├── components/   # 共通コンポーネント（ExpenseForm）
├── pages/        # 画面コンポーネント
└── App.tsx       # ルーティング
```
