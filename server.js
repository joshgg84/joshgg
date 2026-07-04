require('dotenv').config();

const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CREATE UPLOADS FOLDER
// ============================================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('📁 Uploads folder created');
}

// ============================================
// MULTER CONFIGURATION
// ============================================
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
};

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

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB
        files: 5
    },
    fileFilter: fileFilter
});

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Serve uploaded files publicly
app.use('/uploads', express.static(uploadsDir));

// ============================================
// 📁 24-HOUR FILE CLEANUP
// ============================================
const CLEANUP_AGE_HOURS = 24; // Delete files older than 24 hours
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Run every hour

function cleanupOldFiles() {
    console.log('🧹 Running file cleanup...');
    
    if (!fs.existsSync(uploadsDir)) {
        console.log('⚠️ Uploads folder not found, skipping cleanup');
        return;
    }

    try {
        const files = fs.readdirSync(uploadsDir);
        const now = Date.now();
        const maxAgeMs = CLEANUP_AGE_HOURS * 60 * 60 * 1000;
        let deletedCount = 0;
        let totalSize = 0;

        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            
            try {
                const stats = fs.statSync(filePath);
                const fileAge = now - stats.mtimeMs;
                
                if (fileAge > maxAgeMs) {
                    const fileSize = stats.size;
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    totalSize += fileSize;
                    console.log(`🗑️ Deleted: ${file} (${(fileSize / 1024 / 1024).toFixed(2)}MB, ${(fileAge / 1000 / 60 / 60).toFixed(1)} hours old)`);
                }
            } catch (err) {
                console.error(`❌ Error processing file ${file}:`, err.message);
            }
        });

        if (deletedCount > 0) {
            console.log(`✅ Cleanup complete: ${deletedCount} file(s) deleted (${(totalSize / 1024 / 1024).toFixed(2)}MB freed)`);
        } else {
            console.log('✅ No files to clean up');
        }
    } catch (error) {
        console.error('❌ Cleanup error:', error);
    }
}

// Run cleanup on server startup
setTimeout(() => {
    console.log('🧹 Running initial file cleanup...');
    cleanupOldFiles();
}, 5000); // Wait 5 seconds after server starts

// Schedule cleanup every hour
setInterval(cleanupOldFiles, CLEANUP_INTERVAL_MS);
console.log(`🕐 File cleanup scheduled every ${CLEANUP_INTERVAL_MS / 1000 / 60} minutes`);
console.log(`🗑️ Files older than ${CLEANUP_AGE_HOURS} hours will be deleted`);

// ============================================
// DEBUG ENDPOINT - Check environment
// ============================================
app.get('/debug', (req, res) => {
    const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    const fileDetails = files.map(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        return {
            name: file,
            size: stats.size,
            sizeMB: (stats.size / 1024 / 1024).toFixed(2),
            created: stats.birthtime,
            modified: stats.mtime,
            ageHours: ((Date.now() - stats.mtimeMs) / 1000 / 60 / 60).toFixed(1)
        };
    });

    res.json({
        nodeEnv: process.env.NODE_ENV || 'development',
        uploadsPath: uploadsDir,
        totalFiles: files.length,
        files: fileDetails,
        cleanupAgeHours: CLEANUP_AGE_HOURS,
        cleanupIntervalMinutes: CLEANUP_INTERVAL_MS / 1000 / 60,
        emailUser: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
        emailPass: process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing',
        renderUrl: process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT
    });
});

// ============================================
// CONTACT ENDPOINT WITH FILE UPLOAD
// ============================================
app.post('/api/contact', upload.array('attachments', 5), async (req, res) => {
    const { name, email, phone, message } = req.body;
    const files = req.files || [];

    // Get base URL for file links
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

    console.log('=== New Contact Form Submission ===');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone || 'Not provided'}`);
    console.log(`Message: ${message}`);
    console.log(`Files: ${files.length} attachment(s)`);
    
    if (files.length > 0) {
        files.forEach((f, i) => {
            console.log(`  File ${i+1}: ${f.originalname} (${(f.size/1024/1024).toFixed(2)}MB)`);
            console.log(`  Saved to: ${f.path}`);
            console.log(`  Public URL: ${baseUrl}/uploads/${path.basename(f.path)}`);
        });
    }
    console.log('===================================');

    // Build file URLs for WhatsApp
    const fileUrls = files.map(file => {
        return `${baseUrl}/uploads/${path.basename(file.path)}`;
    });

    const fileNames = files.map(file => file.originalname).join(', ') || 'None';

    // Send response immediately
    res.json({ 
        success: true, 
        message: "Message sent successfully! We will contact you soon.",
        files: fileUrls
    });

    // ============================================
    // SEND EMAIL WITH ATTACHMENTS
    // ============================================
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                connectionTimeout: 30000,
                greetingTimeout: 30000,
                socketTimeout: 30000
            });

            await transporter.verify();
            console.log('✅ Email transporter verified');

            const attachments = files.map(file => ({
                filename: file.originalname,
                path: file.path
            }));

            let emailText = `Name: ${name}\n`;
            emailText += `Email: ${email}\n`;
            emailText += `Phone: ${phone || 'Not provided'}\n`;
            emailText += `Message: ${message}\n\n`;
            emailText += `Attachments: ${files.length} file(s)\n\n`;
            
            if (fileUrls.length > 0) {
                emailText += `File URLs:\n${fileUrls.join('\n')}\n\n`;
                emailText += `⚠️ These URLs are public and accessible to anyone with the link.\n`;
                emailText += `📁 Files will be automatically deleted after ${CLEANUP_AGE_HOURS} hours.`;
            }

            await transporter.sendMail({
                from: `"Contact Form" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_USER,
                replyTo: email,
                subject: `New contact from ${name}`,
                text: emailText,
                attachments: attachments
            });

            console.log('✅ Email sent successfully!');
            
        } catch (error) {
            console.error('❌ Email error:', error);
            if (error.code === 'EAUTH') {
                console.error('❌ Authentication failed! Check your email/password.');
            } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
                console.error('❌ Connection error! Check Render network settings.');
            }
        }
    } else {
        console.log('⚠️ Email not configured. Set EMAIL_USER and EMAIL_PASS in .env');
    }
});

// ============================================
// MANUAL CLEANUP ENDPOINT (Admin)
// ============================================
app.post('/api/cleanup', (req, res) => {
    console.log('🧹 Manual cleanup triggered');
    cleanupOldFiles();
    res.json({ 
        success: true, 
        message: 'Cleanup completed successfully' 
    });
});

// ============================================
// ROUTES
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================
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

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 JoshGG server running on port ${PORT}`);
    console.log(`📍 Visit http://localhost:${PORT}`);
    console.log(`📁 Uploads saved to: ${uploadsDir}`);
    console.log(`🔗 Uploads served at: /uploads/`);
    console.log(`📧 Email will be sent to: joshuagiwa440@gmail.com`);
    console.log(`🌐 Render URL: ${process.env.RENDER_EXTERNAL_URL || 'Not set'}`);
    console.log(`🗑️ Files older than ${CLEANUP_AGE_HOURS} hours will be auto-deleted`);
    console.log(`🔄 Cleanup runs every ${CLEANUP_INTERVAL_MS / 1000 / 60} minutes`);
});