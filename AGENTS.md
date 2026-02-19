# AGENTS.md - Agentic Coding Guidelines for RaizoO

## Project Overview

- **Project Name**: RaizoO (raizoo.ai)
- **Tech Stack**: Vanilla HTML5, CSS3, JavaScript
- **Deployment**: AWS S3 + CloudFront

---

## Build & Development Commands

### Running the Project

No build required. Open `index.html` directly or serve locally:

```bash
npx serve .
# or
python -m http.server 8000
```

### No Linter/Formatter

No ESLint, Prettier, or other linting tools.

### No Tests

No test suite exists. Do not create test files.

### Deployment

```bash
aws s3 sync . s3://www.raizoo.ai --exclude "*.git*" --exclude "*.md"
```

---

## Code Style Guidelines

### General Principles

- Keep it simple - vanilla JS, no frameworks
- Maintain dark theme with CSS custom properties
- Use modern ES6+ JavaScript
- Follow existing code patterns exactly

### HTML (index.html)

- Use HTML5 semantic elements (`<main>`, `<section>`, `<footer>`)
- Include `lang="en"` on `<html>` tag
- Viewport meta tag for responsiveness
- `<script>` at end of `<body>`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RaizoO</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <main>...</main>
    <script src="script.js"></script>
</body>
</html>
```

### CSS (styles.css)

Define colors in `:root`:

```css
:root {
    --bg-primary: #0a0a0a;
    --bg-secondary: #111111;
    --text-primary: #ffffff;
    --text-secondary: #a0a0a0;
    --accent: #6366f1;
    --accent-hover: #4f46e5;
    --border: #2a2a2a;
    --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif`
- Use `clamp()` for responsive font sizes
- Max container: 1200px
- Mobile-first: `@media (max-width: 768px)`
- 2-space indentation
- `border-radius: 12px` for cards/buttons
- `transition: all 0.3s ease` for hovers

### JavaScript (script.js)

- Use `const` by default, `let` when needed, never `var`
- Arrow functions for callbacks
- Template literals for strings

```javascript
const handleClick = () => {
    const target = document.querySelector('#section');
    if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
    }
};
```

- Check element existence before manipulating
- Use `style.cssText` for complex inline styles
- Use `classList.add()/remove()` for toggles

### Naming Conventions

- **CSS Classes**: kebab-case (`.btn-primary`, `.hero-title`)
- **JS Variables**: camelCase (`const emailValue`, `let notification`)
- **Constants**: UPPER_SNAKE_CASE

### Git Conventions

- Imperative commit messages
- Branch naming: `feature/description` or `fix/description`

---

## What NOT To Do

- Do NOT add frameworks (React, Vue, etc.)
- Do NOT add build tools (Webpack, Vite)
- Do NOT add testing libraries
- Do NOT change dark theme color scheme
- Do NOT remove gradient accents
- Do NOT add TypeScript
- Do NOT create component files

---

## File Organization

```
rzw/
├── index.html   # Main HTML
├── styles.css   # All styles
├── script.js    # All JavaScript
└── README.md    # Documentation
```

---

## Questions?

Check existing patterns first. Simple project - don't overcomplicate.
