const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    ? fs.mkdirSync(uploadsDir);
}
const app = express();
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};
const storage = multer.diskStorage({
    destination: `${uploadsDir}`,
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
    }
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 29 * 1024 * 1024,
        files: 5,
        headerPairs: 2000
    },
    fileFilter: fileFilter
});
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images) from root directory
app.use(express.static(__dirname));

app.post('/api/contact', upload.array('attachments'), async (req, res) => {
    const { name, email, phone, message } = req.body;
    const files = req.files;
    const file = files ? files.map(f => f.originalname) : null;

    console.log('=== New Contact Form Submission ===');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone || 'Not provided'}`);
    console.log(`Message: ${message}`);
    console.log('===================================');
    res.json({ error: false, message: "Message sent successfully. We will contact you soon" });
    
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
            to: 'joshuagiwa440@gmail.com', // Where you want to receive it
            subject: `New contact from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}\nAttachments: ${file}`
        });
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