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

// Mixpanel tracking. Shared across all rzw pages (main landing + waitlist).
// Every event carries `site` so both pages stay separable within one project.
(function () {
    if (typeof mixpanel === 'undefined') return;

    const SITE = location.pathname.includes('/waitlist') ? 'waitlist' : 'landing';
    mixpanel.register({ site: SITE });

    const RETURN_KEY = '_yoo_returning';
    let isReturning = false;
    try {
        isReturning = localStorage.getItem(RETURN_KEY) === '1';
        localStorage.setItem(RETURN_KEY, '1');
    } catch { /* private-mode storage unavailable -- treat as first visit */ }

    mixpanel.track('Page Viewed', { path: location.pathname, is_returning_visitor: isReturning });

    // Scroll depth: fire each milestone once per page load.
    const SCROLL_MILESTONES = [25, 50, 75, 100];
    const firedMilestones = new Set();
    let scrollTicking = false;
    function checkScrollDepth() {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) return;
        const pct = Math.min(100, Math.round((window.scrollY / docHeight) * 100));
        for (const milestone of SCROLL_MILESTONES) {
            if (pct >= milestone && !firedMilestones.has(milestone)) {
                firedMilestones.add(milestone);
                mixpanel.track('Scroll Depth', { depth_pct: milestone });
            }
        }
    }
    window.addEventListener('scroll', () => {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(() => { checkScrollDepth(); scrollTicking = false; });
    });

    // Dwell time: fired once, on the first signal that the visitor is leaving/hiding
    // the tab. visibilitychange fires reliably on mobile (where pagehide/unload are
    // unreliable); pagehide covers desktop back/forward-cache navigation.
    const pageLoadTime = Date.now();
    let dwellReported = false;
    function reportDwellTime() {
        if (dwellReported) return;
        dwellReported = true;
        mixpanel.track('Time On Page', { duration_seconds: Math.round((Date.now() - pageLoadTime) / 1000) });
    }
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') reportDwellTime();
    });
    window.addEventListener('pagehide', reportDwellTime);

    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        setTimeout(() => {
            mixpanel.track('Theme Toggled', { new_theme: document.documentElement.getAttribute('data-theme') || 'dark' });
        }, 0); // after the existing handler has applied the new theme
    });

    // Scroll hint
    document.querySelector('.scroll-hint')?.addEventListener('click', () => {
        mixpanel.track('Scroll Hint Clicked');
    });

    // Generic CTA clicks, tagged via data-cta on the element
    document.querySelectorAll('[data-cta]').forEach((el) => {
        el.addEventListener('click', () => mixpanel.track('CTA Clicked', { cta_name: el.dataset.cta }));
    });

    // Outbound link clicks (any link leaving ibu-ai.com/raizoo.ai entirely)
    document.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        let url;
        try { url = new URL(href, location.href); } catch { return; }
        if (url.hostname === location.hostname) return;
        a.addEventListener('click', () => mixpanel.track('Outbound Link Clicked', { destination: url.href }));
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
        mixpanel?.track('Waitlist Signup Failed', { reason: 'invalid_email' });
        return;
    }

    const originalLabel = submitBtn?.textContent ?? 'Join the waitlist';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Joining…';
    }
    setMessage('', '');
    mixpanel?.track('Waitlist Signup Submitted');

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
            mixpanel?.track('Waitlist Signup Succeeded', { already_registered: !!data.already });
            if (counterEl && !data.already) {
                const current = parseInt(counterEl.textContent, 10);
                if (!Number.isNaN(current)) {
                    counterEl.textContent = `${current + 1} people have already joined`;
                }
            }
        } else if (data.error === 'invalid_email') {
            setMessage('Please enter a valid email address.', 'error');
            mixpanel?.track('Waitlist Signup Failed', { reason: 'invalid_email' });
        } else {
            setMessage('Something went wrong. Please try again.', 'error');
            mixpanel?.track('Waitlist Signup Failed', { reason: data.error || 'unknown' });
        }
    } catch {
        setMessage('Network error. Please check your connection and try again.', 'error');
        mixpanel?.track('Waitlist Signup Failed', { reason: 'network_error' });
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
        }
    }
});

// "Try Yoodolon" chat widget: one stateless message -> one reply, backed by a
// standalone Lambda (device + IP + global rate-limited). No conversation
// history is kept server-side, so the UI shows only the current exchange
// rather than an accumulating thread that would misleadingly imply memory.
const CHAT_ENDPOINT = 'https://wgmcc22seg.execute-api.us-east-1.amazonaws.com/chat';
const DEVICE_ID_KEY = '_yoo_chat_did';

function getOrCreateDeviceId() {
    try {
        let id = localStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
            id = 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
            localStorage.setItem(DEVICE_ID_KEY, id);
        }
        return id;
    } catch {
        // localStorage unavailable, or exists but throws on write (e.g. Safari
        // private mode) -- fall back to an in-memory-only id for this session.
        return 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
}

const chatForm = document.querySelector('#chat-form');
if (chatForm) {
    const deviceId = getOrCreateDeviceId(); // computed once, cached for the page's lifetime
    const chatThread = document.querySelector('#chat-thread');
    const chatLoading = document.querySelector('#chat-loading');
    const chatInput = document.querySelector('#chat-input');
    const chatSubmit = document.querySelector('#chat-submit');
    const chatError = document.querySelector('#chat-error');
    const chatRemaining = document.querySelector('#chat-remaining');
    const chatCapCta = document.querySelector('#chat-cap-cta');

    const CHAT_ERROR_COPY = {
        device_limit_reached: "You've used your 10 free messages with Yoodolon. Join the waitlist below to keep talking once we launch.",
        ip_limit_reached: "This demo is getting a lot of visitors right now. Join the waitlist below and we'll let you know the moment Yoodolon's ready for you.",
        invalid_input: 'Please enter a shorter message.',
        no_reply: "Yoodolon didn't have a reply for that one — try rephrasing?",
        service_unavailable: "Yoodolon's taking a moment. Try again in a bit.",
        network_error: "Couldn't reach the server — check your connection and try again.",
    };

    const STATE_IDLE = 'idle';
    const STATE_LOADING = 'loading';
    const STATE_CAPPED = 'capped';
    let widgetState = STATE_IDLE;

    let lastSubmittedMessage = '';
    let revertTimer = null;
    let latestRequestSeq = 0;
    let slowLoadingTimer = null;

    const setError = (text) => {
        if (!chatError) return;
        chatError.textContent = text || '';
        chatError.hidden = !text;
    };

    const setLoading = (isLoading) => {
        if (!chatLoading) return;
        chatLoading.hidden = !isLoading;
        chatLoading.classList.remove('slow');
        chatLoading.textContent = 'Yoodolon is typing…';
        if (slowLoadingTimer) { clearTimeout(slowLoadingTimer); slowLoadingTimer = null; }
        if (isLoading) {
            slowLoadingTimer = setTimeout(() => {
                chatLoading.classList.add('slow');
                chatLoading.textContent = 'Still thinking… almost there.';
            }, 8000);
        }
    };

    const setRemaining = (n) => {
        if (!chatRemaining) return;
        if (typeof n !== 'number') {
            chatRemaining.textContent = 'Up to 10 free messages';
            return;
        }
        chatRemaining.textContent = n > 0
            ? `${n} free message${n === 1 ? '' : 's'} left`
            : "That's your last free message for now.";
    };

    const enterCappedState = (ctaVisible) => {
        widgetState = STATE_CAPPED;
        chatInput.disabled = true;
        chatSubmit.disabled = true;
        if (ctaVisible && chatCapCta) {
            chatCapCta.hidden = false;
            const ctaLink = chatCapCta.querySelector('a');
            ctaLink?.focus();
        }
    };

    function clearCopyRevert() {
        if (revertTimer) { clearTimeout(revertTimer); revertTimer = null; }
    }

    function renderTurn(userMessage, botReply) {
        clearCopyRevert();
        chatThread.innerHTML = '';

        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble chat-bubble-user';
        userBubble.textContent = userMessage; // textContent only -- never innerHTML of visitor/model text
        chatThread.appendChild(userBubble);

        if (!botReply) return;

        const botBubble = document.createElement('div');
        botBubble.className = 'chat-bubble chat-bubble-bot';
        const label = document.createElement('span');
        label.className = 'chat-bubble-bot-label';
        label.textContent = 'Yoodolon';
        botBubble.appendChild(label);
        const botText = document.createElement('span');
        botText.textContent = botReply;
        botBubble.appendChild(botText);
        chatThread.appendChild(botBubble);

        const copyRow = document.createElement('div');
        copyRow.className = 'chat-copy-row';
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'chat-copy-btn';
        copyBtn.textContent = 'Copy this message to try in ChatGPT';
        copyRow.appendChild(copyBtn);
        chatThread.appendChild(copyRow);

        copyBtn.addEventListener('click', () => {
            // Reads lastSubmittedMessage live, not a value captured at button-creation
            // time -- this widget accepts up to 10 turns, and a stale closure would
            // silently copy an earlier turn's message from turn 2 onward.
            mixpanel?.track('Chat Copy Clicked');
            navigator.clipboard.writeText(lastSubmittedMessage)
                .then(() => {
                    clearCopyRevert();
                    copyBtn.textContent = 'Copied!';
                    revertTimer = setTimeout(() => {
                        copyBtn.textContent = 'Copy this message to try in ChatGPT';
                        revertTimer = null;
                    }, 2000);
                })
                .catch(() => {
                    copyRow.innerHTML = '';
                    const fallback = document.createElement('textarea');
                    fallback.className = 'chat-copy-fallback';
                    fallback.readOnly = true;
                    fallback.value = lastSubmittedMessage;
                    fallback.rows = 2;
                    copyRow.appendChild(fallback);
                    fallback.focus();
                    fallback.select();
                });
        });
    }

    function trySend() {
        if (widgetState !== STATE_IDLE) return; // gates BOTH Enter and click paths
        const message = chatInput.value.trim();
        if (!message) return;
        if (message.length > 500) {
            setError(CHAT_ERROR_COPY.invalid_input);
            return;
        }
        handleSend(message);
    }

    async function handleSend(message) {
        widgetState = STATE_LOADING;
        chatSubmit.disabled = true;
        setError('');
        setLoading(true);
        lastSubmittedMessage = message;
        mixpanel?.track('Chat Message Sent', { message_length: message.length });

        const seq = ++latestRequestSeq;
        const controller = new AbortController();
        const clientTimeout = setTimeout(() => controller.abort(), 28000);

        try {
            const res = await fetch(CHAT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, deviceId }),
                signal: controller.signal,
            });
            clearTimeout(clientTimeout);
            const data = await res.json().catch(() => ({}));

            if (seq !== latestRequestSeq) return; // superseded by a newer request

            if (data.ok) {
                chatInput.value = '';
                renderTurn(message, data.reply);
                setRemaining(typeof data.remaining === 'number' ? data.remaining : undefined);
                setLoading(false);
                mixpanel?.track('Chat Reply Received', { remaining_count: data.remaining });
                if (typeof data.remaining === 'number' && data.remaining <= 0) {
                    mixpanel?.track('Chat Cap Reached');
                    enterCappedState(true);
                } else {
                    widgetState = STATE_IDLE;
                    chatSubmit.disabled = false;
                }
                return;
            }

            setLoading(false);
            renderTurn(message, null);
            const copy = CHAT_ERROR_COPY[data.error] || CHAT_ERROR_COPY.service_unavailable;
            setError(copy);
            mixpanel?.track('Chat Error Shown', { error_code: data.error || 'unknown' });

            if (data.error === 'device_limit_reached' || data.error === 'ip_limit_reached') {
                enterCappedState(true);
            } else {
                widgetState = STATE_IDLE;
                chatSubmit.disabled = false;
            }
        } catch (err) {
            clearTimeout(clientTimeout);
            if (seq !== latestRequestSeq) return;
            setLoading(false);
            renderTurn(message, null);
            setError(CHAT_ERROR_COPY.network_error);
            mixpanel?.track('Chat Error Shown', { error_code: 'network_error' });
            widgetState = STATE_IDLE;
            chatSubmit.disabled = false;
        }
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        trySend();
    });

    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            trySend();
        }
    });
}