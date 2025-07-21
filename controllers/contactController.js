const db = require('../config/db');
const { sendEmail } = require('../utils/sendEmail');

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const [result] = await db.query(
      'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );

    // Optional: Send emails
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully!'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};