# Photography Portfolio Website

A professional photography portfolio website with user and admin panels. Built with Node.js, Express, and modern frontend technologies.

## Features

### User Panel
- Browse photographer's portfolio with high-quality images
- Category-based image organization
- Review system for client feedback
- Contact form for inquiries
- Responsive, modern design with smooth animations

### Admin Panel
- Secure authentication system
- Upload and manage high-quality photos
- Organize photos by categories
- Manage user reviews
- Handle contact inquiries

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create necessary directories:
```bash
mkdir -p public/uploads/optimized
```

3. Start the server:
```bash
node App.js
```

4. Access the website:
- User Panel: http://localhost:3000
- Admin Panel: http://localhost:3000/admin.html

## Admin Login
- Email: admin
- Password: admin123

## Technologies Used
- Node.js & Express
- JWT for authentication
- Multer for file uploads
- Sharp for image optimization
- Modern CSS with Flexbox and Grid
- Responsive design

## Directory Structure
```
/
├── public/
│   ├── uploads/         # Uploaded images
│   ├── index.html      # User panel
│   ├── admin.html      # Admin panel
│   ├── style.css       # User panel styles
│   ├── admin-style.css # Admin panel styles
│   └── admin.js        # Admin panel functionality
├── App.js              # Server configuration
└── package.json        # Project dependencies
```

## Security Notes
- Change the admin credentials in production
- Use environment variables for sensitive data
- Implement rate limiting for the API
- Add CSRF protection
- Use HTTPS in production
