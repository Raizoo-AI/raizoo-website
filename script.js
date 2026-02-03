// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Button interactions
document.querySelector('.btn-primary').addEventListener('click', function() {
    document.querySelector('#about').scrollIntoView({ behavior: 'smooth' });
});

document.querySelector('.btn-secondary').addEventListener('click', function() {
    document.querySelector('#contact').scrollIntoView({ behavior: 'smooth' });
});

// Contact form
document.querySelector('.contact form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = this.querySelector('input[type="email"]').value;
    
    if (email) {
        // Simple notification
        const notification = document.createElement('div');
        notification.textContent = 'Message sent! We\'ll contact you soon.';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1e40af;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
        
        this.reset();
    }
});

// Add slide-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);