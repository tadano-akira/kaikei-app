# CLAUDE.md - kaikei-app プロジェクト引き継ぎドキュメント

## プロジェクト概要

フリーランス・小規模事業者向けの個人用ツール集。
会計管理（経費・売上・税金試算）と日常ツール（ToDo・メモ・テキストエディタ・日報）を統合したWebアプリ。

- **公開URL**: https://tadano-akira.github.io/kaikei-app/
- **リポジトリ**: https://github.com/tadano-akira/kaikei-app
- **利用者**: 本人のみ（マルチユーザー非対応）
- **認証**: Googleログイン（Firebase Authentication）、またはログイン不要のゲストモード（localStorage）

---

## 技術構成

| 項目 | 技術 |
|------|------|
| フロントエンド | React 18 + TypeScript |
| ビルド | Vite |
| UI | CSS Variables（インラインスタイル、Tailwind未使用） |
| 認証 | Firebase Authentication（Google）／ゲストモード（localStorage） |
| DB | Firestore（ログイン時）／localStorage（ゲストモード時） |
| ホスティング | GitHub Pages |
| CI/CD | GitHub Actions（mainブランチpushで自動デプロイ） |

---

## ディレクトリ構成

```
src/
├── types/          # TypeScript型定義
│   └── index.ts    # Expense・Sales・Settings・Todo・Memo・Notepad・DailyReport型
├── constants/
│   └── index.ts    # 勘定科目・税計算・フォーマット関数
├── lib/
│   ├── firebase.ts    # Firebase初期化（環境変数で接続）
│   ├── localStore.ts  # ゲストモード用localStorage共通ユーティリティ・キー定数
│   ├── migration.ts   # ゲスト→ログイン時のFirestore一括移行・破棄処理
│   └── mockData.ts    # 開発用モックデータ（現在は未使用）
├── hooks/
│   ├── useAuth.ts          # Google認証・AuthMode（loading/guest/loggedIn）管理
│   ├── useExpenses.ts      # 経費CRUD（isGuest対応：Firestore/localStorage切替）
│   ├── useSales.ts         # 売上CRUD（isGuest対応）
│   ├── useSettings.ts      # 設定の取得・保存（isGuest対応）
│   ├── useTodos.ts         # ToDo CRUD（isGuest対応）
│   ├── useMemos.ts         # メモCRUD（isGuest対応）
│   ├── useNotepad.ts       # テキスト保存（isGuest対応）
│   └── useDailyReports.ts  # 日報CRUD（isGuest対応）
├── components/
│   ├── ExpenseForm.tsx     # 経費入力・編集フォーム
│   ├── SalesForm.tsx       # 売上入力・編集フォーム
│   └── MigrationDialog.tsx # ゲスト→ログイン時のデータ移行確認ダイアログ（2段階確認）
├── pages/
│   ├── LoginPage.tsx       # Googleログイン画面（「ログインせずに試す」あり）
│   ├── ExpenseList.tsx     # 経費一覧
│   ├── ExpenseDetail.tsx   # 経費詳細・削除
│   ├── SalesList.tsx       # 売上一覧
│   ├── SalesDetail.tsx     # 売上詳細・削除
│   ├── SettingsPage.tsx    # 設定画面・CSVエクスポート
│   ├── DashboardPage.tsx   # 月次ダッシュボード
│   ├── TaxDetailPage.tsx   # 税金試算詳細
│   ├── TodoPage.tsx        # ToDoリスト
│   ├── MemoPage.tsx        # 簡易メモ
│   ├── NotepadPage.tsx     # テキストエディタ
│   └── DailyReportPage.tsx # 日報
└── App.tsx                 # ルーティング・タブ管理・認証モード/ゲストモード統合
```

---

## 認証モードとゲストモード

`useAuth.ts` が `authMode: 'loading' | 'guest' | 'loggedIn'` を管理する。

- **loading**: Firebase認証確認中、または未ログイン・未ゲスト（LoginPage表示）
- **guest**: LoginPageで「ログインせずに試す」を選んだ状態。データはlocalStorageに保存
- **loggedIn**: Googleログイン済み。データはFirestoreに保存

`App.tsx` で `isGuest = authMode === 'guest'` を算出し、各データフック（useExpenses等7種）と
TodoPage/MemoPage/NotepadPage/DailyReportPageに `isGuest` を渡している。各フックは
`isGuest` の値によって内部でFirestore/localStorageの読み書きを切り替える。

### データ移行フロー

ゲストモードでデータ入力 → ログイン操作を行うと、`App.tsx` が `guest → loggedIn` の遷移を検知し、
localStorageにデータが残っていれば `MigrationDialog` を表示する。

- **「クラウドに移行する」**: `migrateGuestDataToFirestore()` で `writeBatch` により一括書き込み → localStorage全削除
- **「破棄してログイン」**: 「本当に削除してよろしいですか？」の最終確認をもう一段挟んだ上で `discardGuestData()` を実行（localStorage全削除のみ、Firestoreには何も書かない）

### ゲストモードのデータ構造上の注意

- 経費・売上はFirestoreでは年別サブコレクション（`expenses/{year}/items/`）だが、
  localStorage上は年を分けずフラットな配列1キーで保存し、UI側で月や年でフィルタする
- 経費・売上・ToDo・メモ・日報は配列をJSON化して保存、テキスト・設定は単一の値として保存
- 新規データのidは `crypto.randomUUID()` で発行（Firestore移行時はidを振り直す）

---

## Firestoreデータ構造

```
users/{userId}/
  ├── expenses/{year}/items/{docId}
  │     date, category, amountWithTax, taxRate, amountWithoutTax,
  │     taxAmount, payee, expenseType, purpose, memo, receiptUrl, createdAt, updatedAt
  ├── sales/{year}/items/{docId}
  │     date, paymentDueDate, paymentDate, status, client, amount, memo, createdAt, updatedAt
  ├── settings/main
  │     targetExpenseRate, residentialTaxRate, consumptionTaxCategory,
  │     consumptionTaxSpecialRate, healthInsurance, pension, dependentDeduction,
  │     lifeInsuranceDeduction, idecoDeduction, smallBusinessDeduction, updatedAt
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

リポジトリには含まれていない（Firebase Console側で直接管理）。参考として現在運用中のルール：

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

### 認証・モード
- [x] Googleログイン（Firebase Authentication）
- [x] ゲストモード（ログイン不要・localStorageにのみ保存）
- [x] ゲスト→ログイン時のデータ移行ダイアログ（移行 / 破棄の2段階確認）

### 会計機能
- [x] 経費入力フォーム（新規・編集）
  - 勘定科目選択（12種）
  - 税率選択（0%・8%・10%）→ 税抜・消費税を自動計算
  - 固定費/変動費の分類
  - 利用目的・メモ・証票URL（「＋詳細」で折りたたみ表示）
- [x] 経費一覧（月別グループ・サマリーバー）・経費詳細・削除（削除確認ダイアログあり）
- [x] 売上管理（売上発生日・入金予定日・入金日・ステータス・請求先・金額、一覧・詳細・削除）
- [x] 設定画面
  - 目標経費率／住民税率（デフォルト10%）
  - 消費税事業区分（第1〜6種）／消費税特例係数（年度ごと）
  - 所得控除（健康保険・年金・扶養・生命保険・iDeCo・小規模企業共済）
  - 経費・売上データのCSVエクスポート
- [x] 月次ダッシュボード（今月売上・今月経費・当月利益・経費予算・残予算・概算税額）
- [x] 税金試算詳細（所得税・住民税・消費税の内訳、社会保険料を健保/年金に分割表示、粗利表示）
- [x] Firestore連携（リアルタイム同期、ログイン時）

### ツール機能
- [x] ToDoリスト（優先度高・中・低、完了管理、フィルター）
- [x] 簡易メモ（コマンド・スクリプト・プロンプト・その他、コピー機能）
- [x] テキストエディタ（保存ボタン方式、txt出力）
- [x] 日報（今日やったこと・明日やること・所感、日付別管理）

---

## 未実装機能（今後の開発予定）

- [ ] 年次集計・グラフ
- [ ] 証票画像アップロード（Firebase Storage使用。現状は証票URLのテキスト入力のみ対応）
- [ ] PWA最終調整
- [ ] ゲストモードのCSVエクスポート（現状はログイン時のみ。スコープ未確定）

---

## 税金試算仕様

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

この仕様は `DashboardPage.tsx` と `TaxDetailPage.tsx` 内に実装済み（同じ定数テーブルがそれぞれのファイルに重複定義されている点に注意。将来的に `constants/index.ts` へ共通化する余地あり）。

---

## 開発フロー

```bash
# ローカル開発
npm run dev

# 型チェック・ビルド確認
npx tsc --noEmit
npm run build

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

複数の関心事を含む変更は、共通基盤→個別フック→UIのようにレイヤー単位で
複数コミットに分けるのが基本（1機能=1コミットに固執しない）。

---

## 注意事項・既知の事項

- `manifest.webmanifest`のSyntax errorがコンソールに出るが動作に影響なし（PWAアイコン未設置のため）
- 経費・売上データはFirestoreでは年度別サブコレクションで管理（`expenses/{year}/items/`、`sales/{year}/items/`）。ゲストモードのlocalStorageはフラット配列
- テキストエディタのみ保存ボタン方式（他はリアルタイム保存、ゲストモードでは即時localStorage書き込み）
- 税額表示はあくまで概算。確定申告はCSVエクスポート後にe-Taxで実施する想定
- `eslint`は`package.json`の`lint`スクリプトに定義されているが、devDependenciesに未インストール（`npx eslint`実行時は別途インストールが必要）
- `requirements.md`・`sprint_plan.md`はリポジトリには存在しない（過去のドキュメントで参照されていたが現存しないか別管理）

---

## 将来のサービス展開方針

### ビジネスモデル
- 無料ユーザー向けにアプリ内広告枠を提供するスポンサード契約で収益化
- スポンサー候補：会計ソフト会社・クラウドサービス会社など
- 目標：年間数十万円規模の収益化
- マイクロ法人（来年設立予定）のサービスの一つとして展開

### インフラコスト試算（1,000ユーザー・月100件入力の場合）
- Firestoreアクセス：無料枠内に収まる見込み
- Firebase Storage（証票画像・圧縮あり400KB/枚）：月数百円程度
- 圧縮なしの場合は月数千円規模になるため、**アップロード時の画像圧縮は必須**

### アプリ内広告の実装方針
- メール広告はNG（特定電子メール法・Googleサービス利用規約上の問題）
- **アプリ内通知・バナー・お知らせ欄への広告掲載はOK**
- プッシュ通知への広告掲載は事前のユーザー許可が必要
- 広告出し分けのためにユーザー属性情報を収集する

### ユーザー属性情報の収集方針
サービス利用開始時に以下を任意登録させる（全項目任意）：

| 項目 | 形式 |
|------|------|
| ユーザー名 | 自由入力（ニックネーム可） |
| 社名・屋号 | 任意・自由入力 |
| 都道府県 | 選択式 |
| 事業分類 | 選択式 |
| 事業規模 | 選択式 |
| フリーランス歴・キャリア年数 | 選択式 |

**取得しない情報**：氏名（フルネーム）・電話番号・詳細住所・生年月日

属性情報と入力データをもとにアプリ内広告を出し分ける。

### 法務・運用面での必要対応
- **プライバシーポリシーの公開**（必須）
  - Google認証でメールアドレスを取得する旨を明記
  - 属性情報を広告配信最適化に利用する旨を明記
  - Googleのプライバシーポリシーへの依存を明記
- **利用規約の公開**（必須）
- **退会機能の実装**（必須）：Firebase Authenticationのアカウント削除
- Pマーク取得は不要（過剰・コスト過大）
- 詳細な法的判断は弁護士・行政書士への相談推奨

### 技術展開方針
- 現在：GitHub Pages（無料）
- 本格展開時：Firebase Hosting + 独自ドメイン に移行
- マルチユーザー対応は現在の設計（`users/{userId}/`）で拡張可能

