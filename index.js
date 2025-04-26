const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Sydorov Dmytro I31');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});