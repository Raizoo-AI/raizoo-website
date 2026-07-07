// Theme detection and toggle
(function() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle?.querySelector('.theme-icon');
    
    // Get stored preference or detect system preference
    const getThemePreference = () => {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    };
    
    // Apply theme
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '☀️' : '🌙';
        }
    };
    
    // Initialize theme
    applyTheme(getThemePreference());
    
    // Toggle on click
    themeToggle?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === 'light' ? 'dark' : 'light');
    });
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'light' : 'dark');
        }
    });
})();

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

// Waitlist signup: posts to an AWS Lambda (via API Gateway) that appends each
// signup to waitlist.csv / waitlist.json in a private S3 bucket. No manual setup.
const WAITLIST_ENDPOINT = 'https://wgmcc22seg.execute-api.us-east-1.amazonaws.com/';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Waitlist counter: shows a baseline of 100 plus real signups, fetched from
// the same Lambda (GET instead of POST). Fails silently if unreachable.
const counterEl = document.querySelector('#waitlist-counter');
if (counterEl) {
    fetch(WAITLIST_ENDPOINT)
        .then((res) => res.json())
        .then((data) => {
            if (data?.ok && typeof data.count === 'number') {
                counterEl.textContent = `${data.count} people have already joined`;
            }
        })
        .catch(() => {});
}

const waitlistForm = document.querySelector('#waitlist-form');
waitlistForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = document.querySelector('#waitlist-email');
    const submitBtn = document.querySelector('#waitlist-submit');
    const messageEl = document.querySelector('#waitlist-message');
    const email = emailInput?.value.trim() ?? '';

    const setMessage = (text, kind) => {
        if (!messageEl) return;
        messageEl.textContent = text;
        messageEl.className = `waitlist-message ${kind}`;
    };

    if (!EMAIL_RE.test(email)) {
        setMessage('Please enter a valid email address.', 'error');
        emailInput?.focus();
        return;
    }

    const originalLabel = submitBtn?.textContent ?? 'Join the waitlist';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Joining…';
    }
    setMessage('', '');

    try {
        const res = await fetch(WAITLIST_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, source: 'waitlist-ibu-ai' }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.ok) {
            setMessage(data.message || "You're on the list!", 'success');
            waitlistForm.reset();
            if (counterEl && !data.already) {
                const current = parseInt(counterEl.textContent, 10);
                if (!Number.isNaN(current)) {
                    counterEl.textContent = `${current + 1} people have already joined`;
                }
            }
        } else if (data.error === 'invalid_email') {
            setMessage('Please enter a valid email address.', 'error');
        } else {
            setMessage('Something went wrong. Please try again.', 'error');
        }
    } catch {
        setMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
        }
    }
});