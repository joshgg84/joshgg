const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images) from root directory
app.use(express.static(__dirname));

app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.emailAddress,
            pass: process.env.emailPass  // Your 16-char app password
        }
    });

    try {
        await transporter.sendMail({
            from: process.env.emailAddress,
            to: 'joshuagiwa440@gmial.com', // Where you want to receive it
            subject: `New contact from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`
        });
        
        console.log('=== New Contact Form Submission ===');
        console.log(`Name: ${name}`);
        console.log(`Email: ${email}`);
        console.log(`Phone: ${phone || 'Not provided'}`);
        console.log(`Message: ${message}`);
        console.log('===================================');
        
        res.status(200).json({ message: 'Message received successfully! We will contact you soon.' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: true, message: "500- Internal Server error" });
    }
});

// Routes for your HTML files (all in root)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`JoshGG server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}`);
});