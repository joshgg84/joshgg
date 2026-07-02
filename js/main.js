// Contact form handling with file upload support and WhatsApp integration
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const fileInput = document.getElementById('attachments');
    const fileList = document.getElementById('fileList');
    const formMessage = document.getElementById('formMessage');

    // ============================================
    // FILE PREVIEW - Show selected files
    // ============================================
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const files = this.files;
            if (!fileList) return;
            
            fileList.innerHTML = '';
            
            if (files.length === 0) {
                fileList.style.display = 'none';
                return;
            }
            
            fileList.style.display = 'block';
            let html = `<strong>Selected files (${files.length}):</strong><br>`;
            Array.from(files).forEach(file => {
                const size = (file.size / 1024 / 1024).toFixed(2);
                html += `<span class="file-item">📎 ${file.name} (${size}MB)</span> `;
            });
            fileList.innerHTML = html;
        });
    }

    // ============================================
    // WHATSAPP FUNCTION - Send message to WhatsApp
    // ============================================
    window.sendWhatsAppMessage = function() {
        // Get form values
        const name = document.getElementById('name').value.trim();
        const message = document.getElementById('message').value.trim();
        const files = fileInput ? fileInput.files : [];
        
        // Validate
        if (!name) {
            showMessage('Please enter your name.', 'error');
            return;
        }
        
        if (!message) {
            showMessage('Please describe your project.', 'error');
            return;
        }
        
        // Get attachment names
        let attachmentNames = 'None';
        if (files.length > 0) {
            attachmentNames = Array.from(files).map(f => f.name).join(', ');
        }
        
        // Build the message
        const fullMessage = `Hello! My name is ${name}. I am from your website Josh GG. Here's my project: ${message}. Some attachments: ${attachmentNames}`;
        
        // Encode for URL
        const encodedMessage = encodeURIComponent(fullMessage);
        
        // Open WhatsApp
        window.open(`https://wa.me/2349025839789?text=${encodedMessage}`, '_blank');
    };

    // ============================================
    // SHOW MESSAGE - Display form feedback
    // ============================================
    function showMessage(text, type) {
        if (!formMessage) return;
        formMessage.textContent = text;
        formMessage.className = 'form-message ' + type;
        formMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }

    // ============================================
    // EMAIL FORM SUBMISSION - Send to server
    // ============================================
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            const btnText = document.getElementById('btnText');
            const btnSpinner = document.getElementById('btnSpinner');
            
            // Show loading state
            if (btnText && btnSpinner) {
                btnText.style.display = 'none';
                btnSpinner.style.display = 'inline';
            }
            submitButton.disabled = true;
            
            // Clear previous messages
            if (formMessage) {
                formMessage.style.display = 'none';
            }
            
            try {
                // Create FormData for file upload
                const formData = new FormData(this);
                
                // Send to server
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    body: formData // No Content-Type header needed
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    showMessage(result.message || 'Message sent successfully! We will contact you soon.', 'success');
                    this.reset();
                    
                    // Clear file list
                    if (fileList) {
                        fileList.innerHTML = '';
                        fileList.style.display = 'none';
                    }
                } else {
                    showMessage(result.message || result.error || 'Something went wrong. Please try again.', 'error');
                }
            } catch (error) {
                console.error('❌ Form error:', error);
                showMessage('Network error. Please check your connection and try again.', 'error');
            } finally {
                // Reset button
                if (btnText && btnSpinner) {
                    btnText.style.display = 'inline';
                    btnSpinner.style.display = 'none';
                }
                submitButton.disabled = false;
            }
        });
    }

    // ============================================
    // OPTIONAL: WhatsApp Floating Button (if exists)
    // ============================================
    const whatsappFloat = document.querySelector('.whatsapp-float');
    if (whatsappFloat) {
        whatsappFloat.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get name and message if form exists
            const nameInput = document.getElementById('name');
            const messageInput = document.getElementById('message');
            const fileInputEl = document.getElementById('attachments');
            
            const name = nameInput ? nameInput.value.trim() : '';
            const message = messageInput ? messageInput.value.trim() : '';
            const files = fileInputEl ? fileInputEl.files : [];
            
            let attachmentNames = 'None';
            if (files.length > 0) {
                attachmentNames = Array.from(files).map(f => f.name).join(', ');
            }
            
            // Build message with available data
            let fullMessage = 'Hello! My name is ';
            fullMessage += name || '[Your Name]';
            fullMessage += '. I am from your website Josh GG. Here\'s my project: ';
            fullMessage += message || '[Your Project Description]';
            fullMessage += '. Some attachments: ' + attachmentNames;
            
            const encodedMessage = encodeURIComponent(fullMessage);
            window.open(`https://wa.me/2349025839789?text=${encodedMessage}`, '_blank');
        });
    }

    console.log('✅ JoshGG Contact Form loaded successfully!');
    console.log('📧 Email submission enabled');
    console.log('📱 WhatsApp integration enabled');
});