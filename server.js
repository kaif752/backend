require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./config/db'); 
const contactRoutes = require('./routes/contactRoutes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

db.query('SELECT 1 + 1 AS solution')
  .then(() => console.log('Connected to MySQL'))
  .catch(err => console.error('MySQL connection error:', err));


app.use('/api/contact', contactRoutes);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
