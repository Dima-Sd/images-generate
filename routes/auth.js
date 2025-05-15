const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const nodemailer = require('nodemailer');
require('dotenv').config();

const router = express.Router();

// 📩 Реєстрація користувача
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email і пароль обовʼязкові' });

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0)
      return res.status(409).json({ message: 'Користувач вже існує' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO users (email, password_hash, is_verified)
       VALUES ($1, $2, false) RETURNING *`,
      [email, hashedPassword]
    );

    const token = jwt.sign(
      { id: newUser.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const confirmUrl = `http://localhost:3000/api/verify-email?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      subject: 'Підтвердження електронної пошти',
      html: `Натисніть <a href="${confirmUrl}">тут</a>, щоб підтвердити email`,
    });

    res.status(201).json({ message: 'Реєстрація успішна. Перевірте пошту.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// ✅ Підтвердження email
router.get('/verify-email', async (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).send('Посилання недійсне або застаріле.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    await pool.query(
      'UPDATE users SET is_verified = true WHERE id = $1',
      [userId]
    );

    res.redirect('/email-confirmed.html');
  } catch (err) {
    console.error(err);
    res.status(400).send('❌ Недійсний або прострочений токен.');
  }
});

// 🔐 Авторизація користувача
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email і пароль обовʼязкові' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Користувача не знайдено' });

    const user = result.rows[0];

    if (!user.is_verified)
      return res.status(403).json({ message: 'Email не підтверджено' });

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch)
      return res.status(401).json({ message: 'Неправильний пароль' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.PRODUCTION === 'true',
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 день
    });

    res.json({ message: 'Авторизація успішна' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// ✅ Перевірка токена для захисту сторінки
router.get('/check-auth', (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Немає токена' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ message: 'Авторизований', userId: decoded.id });
  } catch (err) {
    return res.status(401).json({ message: 'Невалідний токен' });
  }
});

// 🧠 Перевірка сесії при завантаженні сторінки
router.get('/me', (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Ви не авторизовані' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ userId: decoded.id });
  } catch (err) {
    return res.status(401).json({ message: 'Недійсний токен' });
  }
});

// 🔓 Вихід користувача
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.PRODUCTION === 'true',
    sameSite: 'Strict',
  });
  res.json({ message: 'Ви вийшли з акаунта' });
});

module.exports = router;
