# Raizoo

RaizoO website - Using technology to bridge the very distance it created

## Live Site
https://www.raizoo.ai

## Tech Stack
- HTML5
- CSS3 with custom properties
- Vanilla JavaScript
- Hosted on AWS S3 + CloudFront

## Features
- Responsive design
- Dark theme with gradient accents
- Smooth animations
- Modern typography

## Deployment
```bash
# Deploy to S3
aws s3 sync . s3://www.raizoo.ai --exclude "*.git*" --exclude "*.md"
```