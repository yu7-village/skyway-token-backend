// server.js (SkyWay公式SDK使用 + エラー回避の動的インポート)

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

// 1. SkyWayToken クラスの準備 (サーバー起動時に一度だけ実行)
SkyWayTokenPromise = import('@skyway-sdk/token') // 非同期でクラスを強制取得
    .then(module => {
        // 公式SDKの認証サンプルに従い、SkyWayTokenクラスを取得
        return module.SkyWayToken || module.default; 
    })
    .catch(error => {
        console.error("Critical Error: Failed to import SkyWayToken module.", error);
        process.exit(1);
    });

// 2. SkyWayの認証トークンを提供するエンドポイント
app.get('/api/skyway-token', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    const peerId = 'p2p-peer-' + Date.now(); 
    const roomId = req.query.roomId || 'default-room'; // ルームIDをクエリから受け取る想定

    try {
        // トークンクラスが準備できるのを待つ
        SkyWayToken = await SkyWayTokenPromise; 
        
        if (!SkyWayToken || typeof SkyWayToken !== 'function') {
             // 過去のエラーが再発した場合
             throw new Error("SkyWayToken is not a valid constructor even after dynamic import.");
        }

        // 3. SkyWay公式認証サンプルのロジックを適用
        const token = new SkyWayToken({
            app: {
                id: SKYWAY_APP_ID,
                // Secret Key はコンストラクタに渡す
                secret: SKYWAY_SECRET_KEY, 
            },
            peer: {
                id: peerId,
                scope: [{
                    service: 'room',
                    actions: ['write'], // ルームでの書き込み権限
                    resource: { room: `room-name:${roomId}`, name: peerId, type: 'p2p' } 
                }],
            },
            ttl: 3600 // 有効期限 1時間
        }).encode(); // トークンをエンコード

        console.log(`[LOG] SkyWay SDK token generated successfully.`);

        res.json({
            appId: SKYWAY_APP_ID,
            token: token,
            peerId: peerId
        });
        
    } catch (error) {
        console.error(`[CRITICAL ERROR] Token generation failed: ${error.message}`);
        res.status(500).send('Internal Server Error: Failed to generate token using SkyWay SDK.');
    }
});

app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました。`);
});
