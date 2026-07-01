const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Create uploads folder
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('📁 Uploads folder created');
}

// ✅ File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, GIF, MP4 allowed.`), false);
    }
};

// ✅ Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, uniqueName);
    }
});

// ✅ Multer configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB
        files: 5
    },
    fileFilter: fileFilter
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ✅ FIXED: Contact endpoint with debugging
app.post('/api/contact', (req, res, next) => {
    // ✅ Log content type for debugging
    console.log('📨 Content-Type:', req.headers['content-type']);
    next();
}, upload.array('attachments', 5), async (req, res) => {
    const { name, email, phone, message } = req.body;
    const files = req.files || [];

    // ✅ DEBUG: Log everything
    console.log('=== REQUEST DEBUG ===');
    console.log('Body:', req.body);
    console.log('Files array:', req.files);
    console.log('File count:', files.length);
    if (files.length > 0) {
        files.forEach((f, i) => {
            console.log(`  File ${i+1}: ${f.originalname} (${f.mimetype}, ${(f.size/1024).toFixed(2)}KB)`);
            console.log(`  Saved to: ${f.path}`);
        });
    }
    console.log('=====================');

    // Log submission
    console.log('=== New Contact Form Submission ===');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone || 'Not provided'}`);
    console.log(`Message: ${message}`);
    console.log(`Files: ${files.length} attachment(s)`);
    console.log('===================================');

    // ✅ Send response
    res.json({ 
        success: true, 
        message: "Message sent successfully. We will contact you soon" 
    });

    // ✅ Send email with attachments
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const fileNames = files.length > 0 
            ? files.map(f => f.originalname).join(', ')
            : 'No attachments';

        const attachments = files.map(file => ({
            filename: file.originalname,
            path: file.path
        }));

        await transporter.sendMail({
            from: `"Contact Form" <${process.env.EMAIL_USER}>`,
            to: 'joshuagiwa440@gmail.com',
            subject: `New contact from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nMessage: ${message}\n\nAttachments: ${fileNames}`,
            attachments: attachments
        });

        console.log('✅ Email sent successfully!');
        
    } catch (error) {
        console.error('❌ Email error:', error);
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

// ✅ Error handling
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false, 
                message: 'File too large! Max 25MB per file.' 
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                success: false, 
                message: 'Too many files! Max 5 files allowed.' 
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                success: false, 
                message: `Unexpected field: "${err.field}". Use "attachments" as the field name.` 
            });
        }
    }
    
    if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    res.status(500).json({ 
        success: false, 
        message: 'Server error. Please try again.' 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 JoshGG server running on port ${PORT}`);
    console.log(`📍 Visit http://localhost:${PORT}`);
    console.log(`📁 Uploads saved to: ${uploadsDir}`);
});