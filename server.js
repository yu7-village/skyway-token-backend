// server.js (最終推奨版: CommonJS + 動的インポート)

const express = require('express');

// SkyWayToken のインポートを動的に行うため、ここでは定義しません。
let SkyWayToken; 
let SkyWayTokenPromise = null;

// 環境変数 (Renderで設定)
const SKYWAY_APP_ID = process.env.SKYWAY_APP_ID;
const SKYWAY_SECRET_KEY = process.env.SKYWAY_SECRET_KEY;
const PORT = process.env.PORT || 3000;

if (!SKYWAY_APP_ID || !SKYWAY_SECRET_KEY) {
  console.error("エラー: 環境変数 SKYWAY_APP_ID または SKYWAY_SECRET_KEY が設定されていません。");
  process.exit(1);
}

const app = express();

// 3. SkyWayToken クラスの準備 (サーバー起動時に一度だけ実行)
SkyWayTokenPromise = import('@skyway-sdk/token') // 動的インポート
    .then(module => {
        // SkyWayToken または default のいずれかとしてクラスを取得
        return module.SkyWayToken || module.default; 
    })
    .catch(error => {
        console.error("Critical Error: Failed to import SkyWayToken module.", error);
        process.exit(1);
    });

// 4. SkyWayの認証トークンを提供するエンドポイント
app.get('/api/skyway-token', async (req, res) => {
    // フロントエンドからのアクセスを許可するためにCORSヘッダーを追加
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    const peerId = 'p2p-peer-' + Date.now(); 
    
    try {
        SkyWayToken = await SkyWayTokenPromise; 
        
        if (!SkyWayToken || typeof SkyWayToken !== 'function') {
             throw new Error("SkyWayToken is not a valid constructor even after dynamic import.");
        }

        const token = new SkyWayToken({
            app: {
                id: SKYWAY_APP_ID,
                secret: SKYWAY_SECRET_KEY,
            },
            peer: {
                id: peerId,
                scope: [{
                    service: 'room',
                    actions: ['write'],
                    resource: { room: 'room-name:*', name: peerId, type: 'p2p' } 
                }],
            },
            ttl: 3600 
        }).encode();

        res.json({
            appId: SKYWAY_APP_ID,
            token: token,
            peerId: peerId
        });
        
    } catch (error) {
        console.error(`[DEBUG LOG 3] Token generation failed: ${error.message}`);
        res.status(500).send('Internal Server Error during token generation.');
    }
});

app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました。`);
});
