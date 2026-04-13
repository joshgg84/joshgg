const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS) from root directory
app.use(express.static(__dirname));

// Simple contact endpoint
app.post('/api/contact', (req, res) => {
    const { name, email, phone, message } = req.body;
    
    console.log('=== New Contact Form Submission ===');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone || 'Not provided'}`);
    console.log(`Message: ${message}`);
    console.log('===================================');
    
    res.status(200).json({ message: 'Message received successfully! We will contact you soon.' });
});

// Serve HTML files (since they are in root)
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