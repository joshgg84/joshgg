// Contact form handling
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            message: document.getElementById('message').value
        };
        
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        
        // Create or get message div
        let formMessage = document.getElementById('formMessage');
        if (!formMessage) {
            formMessage = document.createElement('div');
            formMessage.id = 'formMessage';
            formMessage.className = 'form-message';
            contactForm.appendChild(formMessage);
        }
        
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                formMessage.className = 'form-message success';
                formMessage.textContent = 'Message sent successfully! We will get back to you soon.';
                formMessage.style.display = 'block';
                contactForm.reset();
            } else {
                formMessage.className = 'form-message error';
                formMessage.textContent = result.error || 'Something went wrong.';
                formMessage.style.display = 'block';
            }
        } catch (error) {
            formMessage.className = 'form-message error';
            formMessage.textContent = 'Network error. Please check your connection and try again.';
            formMessage.style.display = 'block';
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 5000);
        }
    });
}