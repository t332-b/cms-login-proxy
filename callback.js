function successScript(payload, redirectUrl) {
  return `<!doctype html><meta charset="utf-8">
  <script>
    (function(){
      var msg=${JSON.stringify(payload)};
      var redirectUrl=${JSON.stringify(redirectUrl)};
      
      // Decap CMSの認証フローに適した処理
      try {
        // 親ウィンドウにメッセージを送信
        if(window.opener) {
          window.opener.postMessage(msg, "*");
        }
        if(window.parent && window.parent !== window) {
          window.parent.postMessage(msg, "*");
        }
        
        // 認証成功時はCMS画面にリダイレクト
        if(redirectUrl) {
          setTimeout(function() {
            window.location.href = redirectUrl;
          }, 100);
        } else {
          // リダイレクト先が指定されていない場合はウィンドウを閉じる
          setTimeout(function() {
            try { window.close(); } catch(e) {}
          }, 100);
        }
      } catch(e) {
        console.error('Error in callback:', e);
        // エラー時もリダイレクトを試行
        if(redirectUrl) {
          window.location.href = redirectUrl;
        }
      }
    })();
  </script>`;
}

export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    
    if (!code) {
      const msg = 'authorization:github:error:' + JSON.stringify({ message: "No authorization code" });
      return new Response(successScript(msg), { 
        headers: { "content-type": "text/html; charset=utf-8" } 
      });
    }

    // GitHubからアクセストークンを取得
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { 
        "Accept": "application/json", 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        client_id: env.CLIENT_ID,
        client_secret: env.CLIENT_SECRET,
        code,
        redirect_uri: env.REDIRECT_URI
      })
    });
    
    const json = await res.json();
    
    if (!json.access_token) {
      const msg = 'authorization:github:error:' + JSON.stringify({ 
        message: json.error_description || "Failed to obtain access token" 
      });
      return new Response(successScript(msg), { 
        headers: { "content-type": "text/html; charset=utf-8" } 
      });
    }

    // 認証成功時のペイロード
    const payload = 'authorization:github:success:' + JSON.stringify({ 
      token: json.access_token,
      scope: json.scope,
      token_type: json.token_type
    });

    // CMSの管理画面URLを構築（環境変数から取得するか、デフォルト値を設定）
    const cmsUrl = env.CMS_URL || url.origin + '/admin/';
    
    return new Response(successScript(payload, cmsUrl), { 
      headers: { "content-type": "text/html; charset=utf-8" } 
    });
    
  } catch (e) {
    console.error('OAuth callback error:', e);
    const msg = 'authorization:github:error:' + JSON.stringify({ 
      message: e.message || "OAuth authentication failed" 
    });
    return new Response(successScript(msg), { 
      headers: { "content-type": "text/html; charset=utf-8" } 
    });
  }
}
