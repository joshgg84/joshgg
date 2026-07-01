const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config(); // 👈 ADD THIS

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Create uploads folder if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('📁 Uploads folder created');
}

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and MP4 allowed.'), false);
    }
};

// ✅ Fixed storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir); // ✅ Pass the folder path correctly
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, uniqueName);
    }
});

// Multer configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // ✅ 25MB (Gmail limit)
        files: 5
    },
    fileFilter: fileFilter
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ✅ Fixed contact endpoint - spelling: 'attachments'
app.post('/api/contact', upload.array('attachments', 5), async (req, res) => {
    const { name, email, phone, message } = req.body;
    const files = req.files || [];

    // Log submission
    console.log('=== New Contact Form Submission ===');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone || 'Not provided'}`);
    console.log(`Message: ${message}`);
    console.log(`Files: ${files.length} attachment(s)`);
    if (files.length > 0) {
        files.forEach((f, i) => {
            console.log(`  File ${i+1}: ${f.originalname} (${(f.size/1024/1024).toFixed(2)}MB)`);
        });
    }
    console.log('===================================');

    // ✅ Send success response immediately (ONLY ONCE)
    res.json({ 
        success: true, 
        message: "Message sent successfully. We will contact you soon" 
    });

    // ✅ Send email in background with attachments
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // ✅ Consistent naming
                pass: process.env.EMAIL_PASS
            }
        });

        // Prepare file info
        const fileNames = files.length > 0 
            ? files.map(f => f.originalname).join(', ')
            : 'No attachments';

        // ✅ Prepare attachments for email
        const attachments = files.map(file => ({
            filename: file.originalname,
            path: file.path // Path to the saved file
        }));

        await transporter.sendMail({
            from: `"Contact Form" <${process.env.EMAIL_USER}>`,
            to: 'joshuagiwa440@gmail.com',
            subject: `New contact from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nMessage: ${message}\n\nAttachments: ${fileNames}`,
            attachments: attachments // ✅ Actual files attached
        });

        console.log('✅ Email sent successfully with attachments!');
        
    } catch (error) {
        console.error('❌ Email error:', error);
        // User already got success response
        // Consider logging to a file or database for retry
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

// ✅ Error handling middleware
app.use((err, req, res, next) => {
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
                message: 'Unexpected field. Use "attachments" as the field name.' 
            });
        }
    }
    if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next(err);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 JoshGG server running on port ${PORT}`);
    console.log(`📍 Visit http://localhost:${PORT}`);
    console.log(`📁 Uploads saved to: ${uploadsDir}`);
});