const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static());

// Email transporter configuration (using Ethereal for testing, replace with real SMTP for production)
let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'test@ethereal.email', // Replace with your credentials
        pass: 'testpassword'          // Replace with your credentials
    }
});

// For production, use this instead with environment variables:
/*
let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
*/

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Please fill in all required fields.' });
    }
    
    const mailOptions = {
        from: email,
        to: 'joshuagiwa440@gmail.com',
        subject: `New Contact Form Submission from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\nMessage:\n${message}`,
        html: `<h3>New Contact Form Submission</h3>
               <p><strong>Name:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
               <p><strong>Message:</strong></p>
               <p>${message.replace(/\n/g, '<br>')}</p>`
    };
    
    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send message. Please try again later.' });
    }
});

// Serve all routes (SPA-style)
app.get('*', (req, res) => {
   
app.listen(PORT, () => {
    console.log(`JoshGG server running on port ${PORT}`);
});