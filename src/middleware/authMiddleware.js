const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    
    const bearerToken = req.headers['authorization'];
    const token = bearerToken.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    jwt.verify(token, 'secret123', (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Failed to authenticate token' });
        }
        // console.log("User authenticated",decoded);
        req.userId = decoded.userId; // Add userId to request object for further use
        next();
    });
};
