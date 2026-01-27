const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const SKYWAY_APP_ID = process.env.SKYWAY_APP_ID;
const SKYWAY_SECRET_KEY = process.env.SKYWAY_SECRET_KEY;
const PORT = process.env.PORT || 3000;

if (!SKYWAY_APP_ID || !SKYWAY_SECRET_KEY) {
    console.error('Error: SKYWAY_APP_ID and SKYWAY_SECRET_KEY are required.');
    process.exit(1);
}

const app = express();

// CORSの設定
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.get('/', (req, res) => {
    res.send('SkyWay Auth Token Server (V3) is running.');
});

app.get('/api/skyway-token', (req, res) => {
    const roomId = req.query.roomId || '*'; // デフォルトを全ルーム許可にする
    
    // 時刻の計算 (秒単位)
    const now = Math.floor(Date.now() / 1000);
    const iat = now - 30; // サーバー時刻のズレを考慮して30秒前に設定
    
    // 【修正箇所】 有効期限を 500秒から 3600秒(1時間) に延長
    const exp = now + 3600; 

    try {
        const payload = {
            jti: crypto.randomUUID(),
            iat: iat,
            exp: exp,
            version: 3,
            scope: {
                appId: SKYWAY_APP_ID,
                // 【修正箇所】 通信維持時間を明示的に設定（1時間）
                sessionDuration: 3600, 
                rooms: [
                    {
                        name: roomId, 
                        methods: ["create", "updateMetadata", "close"],
                        sfu: { enabled: true },
                        member: {
                            name: "*",
                            methods: ["publish", "subscribe", "updateMetadata"]
                        }
                    }
                ],
                turn: { enabled: true }
            }
        };

        const token = jwt.sign(payload, SKYWAY_SECRET_KEY, {
            algorithm: 'HS256',
            header: {
                typ: 'JWT',
                alg: 'HS256',
                kid: SKYWAY_APP_ID
            }
        });

        res.json({ token: token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
