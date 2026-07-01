// Contact form handling with file upload support
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) return;

    // ✅ File input preview
    const fileInput = document.getElementById('attachments');
    const fileList = document.getElementById('fileList');

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

    // ✅ Form submission - FIXED!
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // ✅ Create FormData (includes files automatically!)
        const formData = new FormData(contactForm);
        
        // ✅ DEBUG: Check what's being sent
        console.log('📤 Sending form data:');
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`  ${key}: ${value.name} (${value.size} bytes, ${value.type})`);
            } else {
                console.log(`  ${key}: ${value}`);
            }
        }
        
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const btnText = document.getElementById('btnText');
        const btnSpinner = document.getElementById('btnSpinner');
        const originalText = submitButton.textContent;
        
        // Show loading state
        if (btnText && btnSpinner) {
            btnText.style.display = 'none';
            btnSpinner.style.display = 'inline';
        }
        submitButton.disabled = true;
        
        // Get or create message div
        let formMessage = document.getElementById('formMessage');
        if (!formMessage) {
            formMessage = document.createElement('div');
            formMessage.id = 'formMessage';
            formMessage.className = 'form-message';
            contactForm.appendChild(formMessage);
        }
        
        try {
            // ✅ Send as FormData - NO Content-Type header!
            const response = await fetch('/api/contact', {
                method: 'POST',
                body: formData  // ✅ Browser sets Content-Type automatically
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                formMessage.className = 'form-message success';
                formMessage.textContent = result.message || 'Message sent successfully! We will get back to you soon.';
                formMessage.style.display = 'block';
                contactForm.reset();
                
                // Clear file list
                if (fileList) {
                    fileList.innerHTML = '';
                    fileList.style.display = 'none';
                }
            } else {
                formMessage.className = 'form-message error';
                formMessage.textContent = result.message || result.error || 'Something went wrong.';
                formMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('❌ Form error:', error);
            formMessage.className = 'form-message error';
            formMessage.textContent = 'Network error. Please check your connection and try again.';
            formMessage.style.display = 'block';
        } finally {
            // Reset button
            if (btnText && btnSpinner) {
                btnText.style.display = 'inline';
                btnSpinner.style.display = 'none';
            }
            submitButton.disabled = false;
            
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 5000);
        }
    });
});