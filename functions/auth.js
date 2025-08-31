function buildRedirect(env, request) {
  const url = new URL(request.url);
  const origin = url.searchParams.get("origin") || "";

  const headers = new Headers({
    "Set-Cookie": `oauth_origin=${encodeURIComponent(origin)}; Path=/; Max-Age=600; Secure; SameSite=Lax`,
    "Cache-Control": "no-store",
  });

  const params = new URLSearchParams({
    client_id: env.CLIENT_ID,
    scope: "repo,user:email",
    redirect_uri: env.REDIRECT_URI, // 例: https://cms-login-proxy.pages.dev/callback
    state: crypto.randomUUID(),
    allow_signup: "true",
  });

  headers.set("Location", "https://github.com/login/oauth/authorize?" + params.toString());
  // HEAD でも GET でもここは同じでOK（本文なしの 302）
  return new Response(null, { status: 302, headers });
}

export async function onRequestGet({ env, request }) {
  return buildRedirect(env, request);
}

export async function onRequestHead({ env, request }) {
  return buildRedirect(env, request);
}

// （onRequest 1本で全部受けてもOK）
// export async function onRequest(ctx) { return buildRedirect(ctx.env, ctx.request); }