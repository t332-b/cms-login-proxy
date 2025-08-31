// functions/auth.js
export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const origin = url.searchParams.get("origin") || ""; // Decapが付けてくる

  // （任意）戻り先のヒントとしてCookie保存
  const headers = new Headers({
    "Set-Cookie": `oauth_origin=${encodeURIComponent(origin)}; Path=/; Max-Age=600; Secure; SameSite=Lax`,
  });

  const params = new URLSearchParams({
    client_id: env.CLIENT_ID,
    scope: "repo,user:email",            // private repo なら repo 必須
    redirect_uri: env.REDIRECT_URI,      // 例: https://pr0p0se-cms.pages.dev/callback
    state: crypto.randomUUID(),
    allow_signup: "true",
  });

  return new Response(null, {
    status: 302,
    headers: new Headers([...headers, ["Location", "https://github.com/login/oauth/authorize?" + params.toString()]])
  });
}
  


/*
export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const state = crypto.randomUUID();

  const origin = url.searchParams.get("origin") || "";

  const redirect = new URL("https://github.com/login/oauth/authorize");
  redirect.searchParams.set("client_id", env.CLIENT_ID);
  redirect.searchParams.set("redirect_uri", env.REDIRECT_URI); // 例: https://xxx.pages.dev/callback
  redirect.searchParams.set("scope", "repo,user:email");
  redirect.searchParams.set("state", state);

  // state & origin を短命Cookieに保存（10分）
  const headers = new Headers({ Location: redirect.toString() });
  const exp = new Date(Date.now() + 10 * 60 * 1000).toUTCString();
  headers.append("Set-Cookie", `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${exp}`);
  headers.append("Set-Cookie", `oauth_origin=${encodeURIComponent(origin)}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${exp}`);

  return new Response(null, { status: 302, headers });
}
*/