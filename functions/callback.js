// functions/callback.js
function getCookie(name, cookieStr) {
  const m = (`; ${cookieStr || ""};`).match(new RegExp(`;\\s*${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : "";
}

function successHtml(msg, origin) {
  // opener/parent がおらん時の目視用UIとフォールバック
  return `<!doctype html><meta charset="utf-8">
  <style>body{font:14px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji","Segoe UI Emoji";padding:24px}</style>
  <body>
    <h1>認証完了</h1>
    <p>${msg}</p>
    ${origin ? `<p><a href="${origin}">→ 戻る</a></p>` : ""}
    <script>
      // 3秒後に自動で戻す（originがあれば）
      ${origin ? `setTimeout(function(){ location.href = ${JSON.stringify(origin)} }, 3000);` : ""}
    </script>
  </body>`;
}

async function htmlMessage(type, payloadObj, cookieStr) {
  const origin = getCookie("oauth_origin", cookieStr) || "";
  const payload = `authorization:github:${type}:${JSON.stringify(payloadObj)}`;

  // ポップアップ or iframe 経由のときは postMessage して閉じる
  const script = `
    (function(){
      var msg = ${JSON.stringify(payload)};
      try { if (window.opener) window.opener.postMessage(msg, "*"); } catch(e) {}
      try { if (window.parent && window.parent !== window) window.parent.postMessage(msg, "*"); } catch(e) {}
      // 50ms 後に閉じる（取りこぼし防止）
      setTimeout(function(){ try{ window.close(); }catch(e){} }, 50);
    })();`;

  // opener/parent が無ければ「完了ページ」を出す（直叩きテスト用）
  const hasOpener = typeof window !== "undefined" ? (window.opener || (window.parent && window.parent !== window)) : true;

  return new Response(
    hasOpener
      ? `<!doctype html><meta charset="utf-8"><script>${script}</script>`
      : successHtml("このタブは閉じてもOKです。", origin),
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    if (!code) return htmlMessage("error", { message: "No code" }, request.headers.get("Cookie") || "");

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
      return htmlMessage("error", { message: json.error_description || "No token" }, request.headers.get("Cookie") || "");
    }
    return htmlMessage("success", { token: json.access_token }, request.headers.get("Cookie") || "");
  } catch (e) {
    return htmlMessage("error", { message: e.message || "OAuth error" }, request.headers.get("Cookie") || "");
  }
}
