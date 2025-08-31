function buildAuthorizeUrl(env, request) {
  const url = new URL(request.url);
  const origin = url.searchParams.get("origin") || "";

  const params = new URLSearchParams({
    client_id: env.CLIENT_ID,
    scope: "repo,user:email",
    redirect_uri: env.REDIRECT_URI, // 例: https://cms-login-proxy.pages.dev/callback
    state: crypto.randomUUID(),
    allow_signup: "true",
  });

  const authorizeUrl = "https://github.com/login/oauth/authorize?" + params.toString();

  // origin は戻り先ヒント。あれば cookie で 10 分だけ記録（任意）
  const headers = new Headers({
    "Set-Cookie": `oauth_origin=${encodeURIComponent(origin)}; Path=/; Max-Age=600; Secure; SameSite=Lax`,
    "Cache-Control": "no-store",
  });

  return { authorizeUrl, headers };
}

// GET: 事前に authorizing を通知 → その後 GitHub に遷移
export async function onRequestGet({ env, request }) {
  const { authorizeUrl, headers } = buildAuthorizeUrl(env, request);

  const html = `<!doctype html><meta charset="utf-8">
  <script>
    try { if (window.opener) window.opener.postMessage('authorizing:github', '*'); } catch(e) {}
    // 少し待ってから GitHub に遷移（メッセージ取りこぼし防止）
    setTimeout(function(){ location.replace(${JSON.stringify(authorizeUrl)}); }, 30);
  </script>`;

  return new Response(html, {
    status: 200,
    headers: new Headers([...headers, ["Content-Type", "text/html; charset=utf-8"]]),
  });
}

// HEAD: テスト用途の curl -I では 302 を返す
export async function onRequestHead({ env, request }) {
  const { authorizeUrl, headers } = buildAuthorizeUrl(env, request);
  headers.set("Location", authorizeUrl);
  return new Response(null, { status: 302, headers });
}