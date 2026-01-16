
// server.js (最終最終版: jsonwebtokenを使用してトークンを直接生成)

const express = require('express');
const jwt = require('jsonwebtoken'); // ★JWTライブラリをインポート★

// 環境変数 (Renderで設定)
const SKYWAY_APP_ID = process.env.SKYWAY_APP_ID;
const SKYWAY_SECRET_KEY = process.env.SKYWAY_SECRET_KEY;
const PORT = process.env.PORT || 3000;

if (!SKYWAY_APP_ID || !SKYWAY_SECRET_KEY) {
  console.error("エラー: 環境変数 SKYWAY_APP_ID または SKYWAY_SECRET_KEY が設定されていません。");
  process.exit(1);
}

const app = express();

// サーバー起動確認用のルート
app.get('/', (req, res) => {
    res.send('SkyWay Token Server is running. Access /api/skyway-token to get a token.');
});

// 1. SkyWayの認証トークンを提供するエンドポイント
app.get('/api/skyway-token', (req, res) => { // ★非同期処理は不要になりました★
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    const peerId = 'p2p-peer-' + Date.now();
    const roomId = req.query.roomId || 'default-room'; 
    const now = Math.floor(Date.now() / 1000); // 現在時刻 (Unixタイムスタンプ)
    
    try {
        // 2. JWTのペイロード（トークンの中身）を定義
        const payload = {
            jti: SKYWAY_APP_ID + ':' + now,
            iat: now,                      
            exp: now + 3600,                
            scope: {
                app: {
                    id: SKYWAY_APP_ID,
                    turn: true,
                    actions: [
                        { name: 'join_room', body: { name: roomId, type: 'p2p' } }
                    ]
                },
                room: {
                    actions: [{ name: 'write' }],
                    resource: { name: roomId, type: 'p2p' }
                }
            },
            peer: {
                id: peerId
            }
        };

        // 3. 秘密鍵を使用してトークンに署名し、エンコードする
        const token = jwt.sign(payload, SKYWAY_SECRET_KEY, {
            algorithm: 'HS256',
            header: {
                typ: 'JWT',
                alg: 'HS256',
                kid: SKYWAY_APP_ID // Key ID
            }
        });

        console.log(`[LOG] JWT token generated successfully using jsonwebtoken.`);

        res.json({
            appId: SKYWAY_APP_ID,
            token: token,
            peerId: peerId
        });
        
    } catch (error) {
        console.error(`[CRITICAL ERROR] JWT generation failed: ${error.message}`);
        res.status(500).send('Internal Server Error: Failed to generate JWT token.');
    }
});

app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました。`);
});
