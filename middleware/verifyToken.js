const jwt = require('jsonwebtoken');
require('dotenv').config();

function verifyToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login.html');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // можеш далі використати user.id
        next();
    } catch (err) {
        console.error('Недійсний токен:', err.message);
        return res.redirect('/login.html');
    }
}

module.exports = verifyToken;
