# Firestoreセキュリティルールの更新（許可リスト対応）

このファイルはリポジトリのコードではなく、Firebase Consoleで手動適用するための
ルール変更案です。設定 → Firestore Database → ルール タブに貼り付けて
「公開」してください。

## 変更内容

`request.auth.token.email` を許可リストに含まれる場合のみ読み書きを許可するように
条件を追加します。これにより、コード側の許可リストチェック（useAuth.ts）をすり抜けて
直接Firestoreにアクセスしようとした場合でも、サーバー側でブロックされます。

ALLOWED_EMAILS のセットは、`.env.local` の VITE_ALLOWED_EMAILS と同じ内容にしてください
（コード側と二重管理になる点は注意。メールアドレスを追加・削除する際は
両方を更新する必要があります）。

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAllowedUser() {
      return request.auth != null &&
        request.auth.token.email in [
          'shishido.akira@gmail.com'
          // 許可するアカウントを追加する場合はここに追記
        ];
    }

    match /users/{userId}/{document=**} {
      allow read, write: if isAllowedUser() && request.auth.uid == userId;
    }
  }
}
```

## 注意点

- メールアドレスの追加・削除を行う際は、必ず以下の2箇所を両方更新してください
  1. `.env.local` の `VITE_ALLOWED_EMAILS`（GitHub ActionsのSecretsも同様に更新）
  2. このFirestoreルール内のセット
- 反映を忘れると、コード側はログインを許可しているのにFirestoreの読み書きだけ失敗する
  といった不整合が起きるので注意してください。
- ルールの公開はFirebase Console上の操作のみで完了します。コードのデプロイは不要です。
