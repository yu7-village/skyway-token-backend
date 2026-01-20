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
        




const payload = {
    jti: crypto.randomUUID(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    version: 3, // V3を明示
    scope: {
        appId: SKYWAY_APP_ID, 
        rooms: [
            {
                name: roomId,
                methods: ["create", "updateMetadata", "close"], 
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
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
