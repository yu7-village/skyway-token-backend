const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // UUID生成用

// 環境変数 (Renderの Dashboard > Settings > Environment Variables で設定)
const SKYWAY_APP_ID = process.env.SKYWAY_APP_ID;
const SKYWAY_SECRET_KEY = process.env.SKYWAY_SECRET_KEY;
const PORT = process.env.PORT || 3000;

// 必須変数のチェック
if (!SKYWAY_APP_ID || !SKYWAY_SECRET_KEY) {
  console.error("エラー: 環境変数 SKYWAY_APP_ID または SKYWAY_SECRET_KEY が設定されていません。");
  process.exit(1);
}

const app = express();


// サーバー起動確認用のルート (CORS対応を追加)
app.get('/', (req, res) => {
    // すべてのオリジンからのアクセスを許可するヘッダーを追加
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.send('SkyWay Auth Token Server (V3) is running.');
});



// トークン生成エンドポイント
app.get('/api/skyway-token', (req, res) => {
    // CORS対応: フロントエンド（Static Site）からのアクセスを許可
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    const roomId = req.query.roomId || 'default-room'; 
    const now = Math.floor(Date.now() / 1000); 
    
    try {
        /**
         * SkyWay Auth Token Version 3 ペイロード構成
         * SDK v2.x 以降で必須の形式です
         */



// --- server.js のトークン生成部分のみ抜粋 ---
const payload = {
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + 3600,
    version: 3,
    scope: {
        app: { // ★重要: app オブジェクトにする
            id: SKYWAY_APP_ID,
            turn: true, // TURNサーバー（リレー）を許可
            actions: ['read'], // 基本的な読み取り権限
            rooms: [
                {
                    name: roomId,
                    methods: ['create', 'updateMetadata'],
                    member: {
                        name: '*',
                        methods: ['publish', 'subscribe', 'updateMetadata']
                    }
                }
            ]
        }
    }
};




        // トークンの署名と生成
        const token = jwt.sign(payload, SKYWAY_SECRET_KEY, {
            algorithm: 'HS256',
            header: {
                typ: 'JWT',
                alg: 'HS256',
                kid: SKYWAY_APP_ID // Key IDとしてApp IDを設定
            }
        });

        console.log(`[LOG] V3 Token generated for room: ${roomId}`);

        res.json({
            token: token
        });
        
    } catch (error) {
        console.error(`[CRITICAL ERROR] JWT generation failed: ${error.message}`);
        res.status(500).send('Internal Server Error: Failed to generate V3 token.');
    }
});

app.listen(PORT, () => {
  console.log(`バックエンドサーバーがポート ${PORT} で起動しました。`);
});
