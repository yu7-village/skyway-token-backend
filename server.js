const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const SKYWAY_APP_ID = process.env.SKYWAY_APP_ID;
const SKYWAY_SECRET_KEY = process.env.SKYWAY_SECRET_KEY;
const PORT = process.env.PORT || 3000;

if (!SKYWAY_APP_ID || !SKYWAY_SECRET_KEY) {
  process.exit(1);
}

const app = express();

app.get('/', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.send('SkyWay Auth Token Server (V3) is running.');
});

app.get('/api/skyway-token', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    const roomId = req.query.roomId || 'default-room'; 
    const now = Math.floor(Date.now() / 1000); 
    
    try {
        // ★修正: SkyWay Auth Token V3 の正しい構造
        const payload = {
            jti: crypto.randomUUID(),
            iat: now,
            exp: now + 3600,
            version: 3,
            scope: {
                app: { // appId ではなく app オブジェクトにする
                    id: SKYWAY_APP_ID,
                    turn: true, // TURN サーバーを有効化
                    actions: ['read'],
                    rooms: [
                        {
                            name: roomId,
                            actions: ['write'],
                            members: [
                                {
                                    name: '*',
                                    actions: ['write'],
                                    publication: { actions: ['write'] },
                                    subscription: { actions: ['write'] }
                                }
                            ]
                        }
                    ]
                }
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
        res.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
