const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());
app.use('/assets', express.static('public'));

// MySQL DB connection
const db = mysql.createConnection({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
    return;
  }
  console.log('Connected to MySQL database!');
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error);
  } else {
    console.log('✅ Email transporter is ready');
  }
});

// Welcome Email HTML Template
function getWelcomeEmailHtml(name) {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #0e0e0e; color: #ffffff; padding: 20px;">
      <div style="max-width: 650px; margin: auto; background: #1a1a1a; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(255,255,255,0.1);">
        <div style="text-align: center;">
          <h2 style="color: #4fd1c5;">Hi ${name}, Welcome! 👋</h2>
          <p style="font-size: 16px;">Thank you for contacting me! I'm thrilled to connect with you.</p>
          <p style="font-size: 16px;">मुझसे संपर्क करने के लिए धन्यवाद!</p>
        </div>
        <hr style="margin: 30px 0; border-color: #444;" />
        <div>
          <p style="font-size: 16px;">I'm a passionate <strong>Full Stack Web Developer</strong> with expertise in:</p>
          <ul style="columns: 2; list-style: none; padding: 0; margin: 20px 0; color: #ccc;">
            <li>✔ Java</li><li>✔ Spring Boot</li><li>✔ React.js</li><li>✔ Next.js</li>
            <li>✔ Node.js</li><li>✔ MongoDB</li><li>✔ MySQL</li><li>✔ PostgreSQL</li>
            <li>✔ Tailwind CSS</li><li>✔ Bootstrap</li><li>✔ Git & GitHub</li><li>✔ APIs & JWT</li>
          </ul>
        </div>
        <div style="margin-top: 30px;">
          <p style="font-size: 16px;">🚀 Let's build something extraordinary together!</p>
          <p style="font-size: 16px;">Feel free to reply to this email or message me anytime.</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="http://localhost:3000/resume.pdf" style="display: inline-block; margin: 10px; padding: 10px 20px; background: #4fd1c5; color: #000; text-decoration: none; border-radius: 5px;">📄 Download Resume</a>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://github.com/yourusername" style="margin: 0 10px;"><img src="https://cdn-icons-png.flaticon.com/24/25/25231.png" alt="GitHub" /></a>
          <a href="https://linkedin.com/in/yourusername" style="margin: 0 10px;"><img src="https://cdn-icons-png.flaticon.com/24/174/174857.png" alt="LinkedIn" /></a>
          <a href="https://twitter.com/yourusername" style="margin: 0 10px;"><img src="https://cdn-icons-png.flaticon.com/24/733/733579.png" alt="Twitter" /></a>
        </div>
        <hr style="margin: 30px 0; border-color: #444;" />
        <p style="font-size: 12px; color: #888; text-align: center;">If you did not contact me, please ignore this email.</p>
      </div>
    </div>`;
}

// Email Queue Logic
const emailQueue = [];
let isProcessing = false;

function processEmailQueue() {
  if (isProcessing || emailQueue.length === 0) return;

  isProcessing = true;
  const mailOptions = emailQueue.shift();

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error(`❌ Failed to send email to ${mailOptions.to}:`, err.message);
    } else {
      console.log(`✅ Email sent to ${mailOptions.to}:`, info.response);
    }

    isProcessing = false;

    // Process next email after delay
    setTimeout(processEmailQueue, 500);
  });
}

// Contact API Route
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send('Name, email, and message are required');
  }

  const sql = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
  db.query(sql, [name, email, message], (err) => {
    if (err) {
      console.error('❌ DB Error:', err.message);
      return res.status(500).send('Database error');
    }

    const mailOptionsToAdmin = {
      from: process.env.EMAIL,
      to: process.env.EMAIL,
      subject: 'New Contact Message',
      text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`
    };

    const mailOptionsToUser = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Thank you for contacting us!',
      html: getWelcomeEmailHtml(name)
    };

    console.log('📨 Queuing email to admin:', mailOptionsToAdmin.to);
    console.log('📨 Queuing welcome email to user:', mailOptionsToUser.to);

    emailQueue.push(mailOptionsToAdmin);
    emailQueue.push(mailOptionsToUser);

    processEmailQueue();

    res.status(200).send('Message saved and emails queued');
  });
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
