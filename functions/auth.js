export async function onRequestGet() {
  return new Response("auth ok", { status: 200 });
}

// export async function onRequestGet({ env, request }) {
//   const url = new URL(request.url);
//   const origin = url.searchParams.get("origin") || "";

//   const headers = new Headers({
//     "Set-Cookie": `oauth_origin=${encodeURIComponent(origin)}; Path=/; Max-Age=600; Secure; SameSite=Lax`,
//   });

//   const params = new URLSearchParams({
//     client_id: env.CLIENT_ID,
//     scope: "repo,user:email",
//     redirect_uri: env.REDIRECT_URI, // 例: https://cms-login-proxy.pages.dev/callback
//     state: crypto.randomUUID(),
//     allow_signup: "true",
//   });

//   headers.set("Location", "https://github.com/login/oauth/authorize?" + params.toString());
//   return new Response(null, { status: 302, headers });
// }