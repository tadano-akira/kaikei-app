# CLAUDE.md - kaikei-app プロジェクト引き継ぎドキュメント

## プロジェクト概要

フリーランス・小規模事業者向けの個人用ツール集。
会計管理（経費・売上・税金試算）と日常ツール（ToDo・メモ・テキストエディタ・日報）を統合したWebアプリ。

- **公開URL**: https://tadano-akira.github.io/kaikei-app/
- **リポジトリ**: https://github.com/tadano-akira/kaikei-app
- **利用者**: 本人のみ（マルチユーザー非対応）
- **認証**: Googleログイン（Firebase Authentication）

---

## 技術構成

| 項目 | 技術 |
|------|------|
| フロントエンド | React 18 + TypeScript |
| ビルド | Vite |
| UI | CSS Variables（インラインスタイル、Tailwind未使用） |
| 認証 | Firebase Authentication（Google） |
| DB | Firestore |
| ホスティング | GitHub Pages |
| CI/CD | GitHub Actions（mainブランチpushで自動デプロイ） |

---

## ディレクトリ構成

```
src/
├── types/          # TypeScript型定義
│   └── index.ts    # Expense・Todo・Memo・Notepad・DailyReport型
├── constants/
│   └── index.ts    # 勘定科目・税計算・フォーマット関数
├── lib/
│   ├── firebase.ts # Firebase初期化（環境変数で接続）
│   └── mockData.ts # 開発用モックデータ（現在は未使用）
├── hooks/
│   ├── useAuth.ts          # Google認証
│   ├── useExpenses.ts      # 経費CRUD・Firestore連携
│   ├── useTodos.ts         # ToDoCRUD・Firestore連携
│   ├── useMemos.ts         # メモCRUD・Firestore連携
│   ├── useNotepad.ts       # テキスト保存・Firestore連携
│   └── useDailyReports.ts  # 日報CRUD・Firestore連携
├── components/
│   └── ExpenseForm.tsx     # 経費入力・編集フォーム
├── pages/
│   ├── LoginPage.tsx       # Googleログイン画面
│   ├── ExpenseList.tsx     # 経費一覧
│   ├── ExpenseDetail.tsx   # 経費詳細・削除
│   ├── TodoPage.tsx        # ToDoリスト
│   ├── MemoPage.tsx        # 簡易メモ
│   ├── NotepadPage.tsx     # テキストエディタ
│   └── DailyReportPage.tsx # 日報
└── App.tsx                 # ルーティング・タブ管理（5タブ）
```

---

## Firestoreデータ構造

```
users/{userId}/
  ├── expenses/{year}/items/{docId}
  │     date, category, amountWithTax, taxRate, amountWithoutTax,
  │     taxAmount, payee, expenseType, purpose, memo, createdAt, updatedAt
  ├── todos/{docId}
  │     text, priority, done, createdAt, updatedAt
  ├── memos/{docId}
  │     title, category, body, createdAt, updatedAt
  ├── notepad/main
  │     content, updatedAt
  └── dailyReports/{docId}
        date, done, plan, note, createdAt, updatedAt
```

### Firestoreセキュリティルール

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

---

## 環境変数

`.env.local`（git管理外）に以下を設定：

```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

GitHub ActionsのSecretsにも同じ6つを登録済み。

---

## 実装済み機能

### 会計機能
- [x] 経費入力フォーム（新規・編集）
  - 勘定科目選択（11種）
  - 税率選択（0%・8%・10%）→ 税抜・消費税を自動計算
  - 固定費/変動費の分類
  - 利用目的・メモ（「＋詳細」で折りたたみ表示）
- [x] 経費一覧（月別グループ・サマリーバー）
- [x] 経費詳細・削除（削除確認ダイアログあり）
- [x] Firestore連携（リアルタイム同期）

### ツール機能
- [x] ToDoリスト（優先度高・中・低、完了管理、フィルター）
- [x] 簡易メモ（コマンド・スクリプト・プロンプト・その他、コピー機能）
- [x] テキストエディタ（保存ボタン方式、txt出力）
- [x] 日報（今日やったこと・明日やること・所感、日付別管理）

---

## 未実装機能（今後の開発予定）

### 会計機能（優先度高）
- [ ] 売上管理（Sprint 6相当）
  - 売上入力（売上発生日・入金予定日・入金日・ステータス・請求先・金額）
  - ステータス管理（見込み / 請求済 / 入金済）
- [ ] 設定画面（Sprint 7相当）
  - 目標経費率
  - 住民税率（デフォルト10%）
  - 消費税事業区分（第1〜6種）
  - 消費税特例係数（年度ごと：2026年=0.3など）
  - 所得控除（社会保険料・扶養・生命保険・iDeCo・小規模企業共済）
- [ ] 月次ダッシュボード（Sprint 8相当）
  - 今月売上・今月経費・当月利益・経費予算・残予算・予想税額
- [ ] 税金試算（Sprint 9相当）
  - 所得税（累進課税・各種控除考慮）
  - 住民税
  - 消費税（簡易課税・特例係数対応）
- [ ] 年次集計・グラフ（Sprint 10相当）
- [ ] 証票画像アップロード（Sprint 11相当、Firebase Storage使用）
- [ ] CSVエクスポート（Sprint 11相当）
- [ ] PWA最終調整（Sprint 12相当）

---

## 税金試算仕様（設計済み・未実装）

### 前提
- 青色申告・電子申告（e-Tax）前提
- 青色申告控除：**65万円固定**
- 基礎控除：**48万円固定**（合計所得2,400万円以下前提）

### 所得税計算式
```
課税所得 = 売上 - 経費 - 青色申告控除(65万) - 各種控除合計
所得税 = 課税所得 × 累進税率 - 税額控除額
```

### 所得税速算表
| 課税所得 | 税率 | 控除額 |
|---------|------|--------|
| 195万円以下 | 5% | 0円 |
| 195万〜330万 | 10% | 97,500円 |
| 330万〜695万 | 20% | 427,500円 |
| 695万〜900万 | 23% | 636,000円 |
| 900万〜1,800万 | 33% | 1,536,000円 |
| 1,800万〜4,000万 | 40% | 2,796,000円 |
| 4,000万超 | 45% | 4,796,000円 |

### 消費税計算式
```
# 通常時（簡易課税）
納付消費税 = 預かり消費税 × (1 - みなし仕入率)

# 特例適用時
納付消費税 = 預かり消費税 × 特例係数
```

### 簡易課税みなし仕入率
| 事業区分 | 業種 | みなし仕入率 |
|---------|------|------------|
| 第1種 | 卸売業 | 90% |
| 第2種 | 小売業 | 80% |
| 第3種 | 製造業等 | 70% |
| 第4種 | その他 | 60% |
| 第5種 | サービス業等 | 50% |
| 第6種 | 不動産業 | 40% |

---

## 開発フロー

```bash
# ローカル開発
npm run dev

# 本番デプロイ（mainへのpushで自動実行）
git add .
git commit -m "feat: 機能名"
git push
```

### コミットメッセージ規則
- `feat:` 新機能追加
- `fix:` バグ修正
- `refactor:` 動作変更なしのコード整理
- `style:` UIの見た目の変更
- `docs:` ドキュメント変更

---

## 注意事項・既知の事項

- `manifest.webmanifest`のSyntax errorがコンソールに出るが動作に影響なし（PWAアイコン未設置のため）
- 経費データは年度別にFirestoreのサブコレクションで管理（`expenses/{year}/items/`）
- テキストエディタのみ保存ボタン方式（他はリアルタイム保存）
- 税額表示はあくまで概算。確定申告はCSVエクスポート後にe-Taxで実施する想定

---

## 要件定義書・工程表

詳細な要件定義と開発工程表は以下のファイルを参照：
- `requirements.md`（要件定義書）
- `sprint_plan.md`（Sprint 1〜12の工程表）
