const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const verifyToken = require('./middleware/verifyToken'); // ⬅️ Підключаємо middleware
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

// Дозволяє приймати JSON у запитах
app.use(bodyParser.json());

// Дозволяє обробляти куки
app.use(cookieParser());

// Підключаємо статичні файли (login.html, dashboard.html тощо)
app.use(express.static(path.join(__dirname, 'public')));

// Початкова сторінка
app.get('/', (req, res) => {
  res.send('Sydorov Dmytro I31');
});

// 🔐 Захищений маршрут
app.get('/dashboard', verifyToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API маршрути
app.use('/api', authRoutes);

// Запуск сервера
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
