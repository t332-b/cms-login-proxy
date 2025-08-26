// functions/callback.js
async function htmlMessage(type, payloadObj) {
  // Decap が期待する「文字列」payload を作る
  const payload = `authorization:github:${type}:${JSON.stringify(payloadObj)}`;
  return new Response(
    `<!doctype html><meta charset="utf-8">
     <script>
      (function(){
        var msg = ${JSON.stringify(payload)};
        try { if (window.opener) window.opener.postMessage(msg, "*"); } catch(e) {}
        try { if (window.parent && window.parent !== window) window.parent.postMessage(msg, "*"); } catch(e) {}
        // 念のため自分自身にも投げとく（ブラウザ差異対策）
        try { window.postMessage(msg, "*"); } catch(e) {}
        setTimeout(function(){ window.close(); }, 50);
      })();
     </script>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    if (!code) return htmlMessage("error", { message: "No code" });

    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.CLIENT_ID,
        client_secret: env.CLIENT_SECRET,
        code,
        redirect_uri: env.REDIRECT_URI
      })
    });
    const json = await res.json();
    if (!json.access_token) {
      return htmlMessage("error", { message: json.error_description || "No token" });
    }
    // ★ 成功時は token を文字列フォーマットで返す
    return htmlMessage("success", { token: json.access_token });
  } catch (e) {
    return htmlMessage("error", { message: e.message || "OAuth error" });
  }
}
