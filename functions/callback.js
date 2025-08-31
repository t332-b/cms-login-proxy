function successScript(payload) {
  // 親に通知してすぐ閉じる
  return `<!doctype html><meta charset="utf-8">
  <script>
    (function(){
      var msg = ${JSON.stringify(payload)};
      try { if (window.opener) window.opener.postMessage(msg, "*"); } catch(e) {}
      try { if (window.parent && window.parent !== window) window.parent.postMessage(msg, "*"); } catch(e) {}
      setTimeout(function(){ try{ window.close(); }catch(e){} }, 50);
    })();
  </script>`;
}

export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    if (!code) return new Response(successScript('authorization:github:error:{"message":"No code"}'), { headers: { "Content-Type": "text/html; charset=utf-8" } });

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
      const msg = 'authorization:github:error:' + JSON.stringify({ message: json.error_description || "No token" });
      return new Response(successScript(msg), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    const payload = 'authorization:github:success:' + JSON.stringify({ token: json.access_token });
    return new Response(successScript(payload), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (e) {
    const msg = 'authorization:github:error:' + JSON.stringify({ message: e.message || "OAuth error" });
    return new Response(successScript(msg), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}