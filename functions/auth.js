export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const origin = url.searchParams.get("origin") || "";
    
    // 必須環境変数のチェック
    if (!env.CLIENT_ID || !env.REDIRECT_URI) {
      return new Response("Missing required environment variables", { status: 500 });
    }

    // stateパラメータを生成（セキュリティ向上）
    const state = crypto.randomUUID();
    
    // 認証情報をセッションに保存（必要に応じて）
    const headers = new Headers({
      "Set-Cookie": `oauth_origin=${encodeURIComponent(origin)}; Path=/; Max-Age=600; Secure; SameSite=Lax`,
      "Set-Cookie": `oauth_state=${state}; Path=/; Max-Age=600; Secure; SameSite=Lax`,
    });

    const params = new URLSearchParams({
      client_id: env.CLIENT_ID,
      scope: "repo,user:email",
      redirect_uri: env.REDIRECT_URI,
      state: state,
      allow_signup: "true",
    });

    const githubAuthUrl = "https://github.com/login/oauth/authorize?" + params.toString();
    
    headers.set("Location", githubAuthUrl);
    return new Response(null, { status: 302, headers });
    
  } catch (error) {
    console.error('Auth error:', error);
    return new Response("Authentication error", { status: 500 });
  }
}