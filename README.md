# CMS Login Proxy for Decap CMS

このプロジェクトは、Decap CMSでGitHub OAuth認証を使用する際のログインプロキシとして機能します。Cloudflare Pagesでホストされ、GitHub OAuth認証後のコールバック処理を適切に行います。

## 機能

- GitHub OAuth認証の処理
- アクセストークンの取得
- Decap CMSへの認証情報の受け渡し
- 認証成功後のCMS画面への自動リダイレクト

## 環境変数の設定

Cloudflare Pagesの環境変数として以下を設定してください：

```bash
CLIENT_ID=your_github_oauth_app_client_id
CLIENT_SECRET=your_github_oauth_app_client_secret
REDIRECT_URI=https://your-domain.pages.dev/callback
CMS_URL=https://your-domain.com/admin/  # オプション
```

### GitHub OAuth Appの設定

1. GitHubのSettings > Developer settings > OAuth Appsで新しいアプリを作成
2. Authorization callback URLを`https://your-domain.pages.dev/callback`に設定
3. 必要なスコープ: `repo`, `user:email`

## デプロイ

1. このリポジトリをGitHubにプッシュ
2. Cloudflare Pagesで新しいプロジェクトを作成
3. リポジトリを接続
4. 環境変数を設定
5. デプロイ

## 使用方法

1. Decap CMSの設定で、認証プロバイダーとして以下を設定：

```yaml
backend:
  name: github
  repo: your-username/your-repo
  auth_endpoint: https://your-domain.pages.dev/auth
```

2. ユーザーがCMSにアクセスすると、自動的にGitHub認証が開始されます
3. 認証成功後、自動的にCMSの管理画面にリダイレクトされます

## トラブルシューティング

### 認証後にCMS画面に切り替わらない場合

1. 環境変数`CMS_URL`が正しく設定されているか確認
2. ブラウザのコンソールでエラーメッセージを確認
3. Cloudflare Pagesの関数ログを確認

### よくある問題

- **CORSエラー**: 適切なドメインでアクセスしているか確認
- **環境変数未設定**: 必須の環境変数が設定されているか確認
- **リダイレクトURI不一致**: GitHub OAuth Appの設定と一致しているか確認

## セキュリティ

- `state`パラメータを使用してCSRF攻撃を防止
- セキュアなCookie設定
- 適切なエラーハンドリング

## ライセンス

MIT License
