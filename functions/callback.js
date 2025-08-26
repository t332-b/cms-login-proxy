async function closeWithMessage(type, data) {
  const payload = JSON.stringify(data);
  return new Response(
    `<!doctype html><meta charset="utf-8">
     <script>
       (function() {
         if (window.opener) {
           // ポップアップウィンドウの場合
           window.opener.postMessage(
             { type: "authorization:github:${type}", data: ${payload} }, "*"
           );
           window.close();
         } else {
           // 直接アクセスの場合、Netlify CMSの認証フローに合わせる
           if ("${type}" === "success") {
             const token = ${payload}.token;
             // Netlify CMSが期待する形式でリダイレクト
             window.location.href = "/admin/#access_token=" + token;
           } else {
             // エラーの場合
             window.location.href = "/admin/#error=" + encodeURIComponent(${payload}.message);
           }
         }
       })();
     </script>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return closeWithMessage("error", { message: "No code" });
  }

  // GitHubでアクセストークン交換
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Accept": "application/json" },
    body: JSON.stringify({
      client_id: env.CLIENT_ID,
      client_secret: env.CLIENT_SECRET,
      code,
      redirect_uri: env.REDIRECT_URI,
    }),
  });

  const json = await res.json();
  if (!json.access_token) {
    return closeWithMessage("error", { message: json.error_description || "No token" });
  }

  return closeWithMessage("success", { token: json.access_token });
}
