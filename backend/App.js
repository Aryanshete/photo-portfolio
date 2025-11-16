const express = require('express');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory storage (replace with a database in production)
const users = [];
const userFavorites = new Map();
const userCollections = new Map();

// Middleware to verify user token
const verifyUserToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, 'your-secret-key'); // Use environment variable in production
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, 'your-admin-secret-key');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Admin credentials (move to environment variables in production)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    // Pre-hashed password for 'admin123'
    password: 'admin123'
};

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Check username
        if (username !== ADMIN_CREDENTIALS.username) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, ADMIN_CREDENTIALS.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { username, role: 'admin' },
            'your-admin-secret-key', // Use environment variable in production
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Registration
app.post('/api/user/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        if (users.some(user => user.email === email)) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            id: users.length + 1,
            name,
            email,
            password: hashedPassword
        };

        users.push(user);
        userFavorites.set(user.id, []);
        userCollections.set(user.id, []);

        // Generate token
        const token = jwt.sign({ id: user.id, email: user.email }, 'your-secret-key', { expiresIn: '24h' });

        res.status(201).json({ token });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User Login
app.post('/api/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, 'your-secret-key', { expiresIn: '24h' });
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get user favorites
app.get('/api/user/favorites', verifyUserToken, (req, res) => {
    const userFavs = userFavorites.get(req.user.id) || [];
    res.json(userFavs);
});

// Add to favorites
app.post('/api/user/favorites', verifyUserToken, (req, res) => {
    const { photoId } = req.body;
    const userFavs = userFavorites.get(req.user.id) || [];
    
    if (!userFavs.some(fav => fav.id === photoId)) {
        userFavs.push({ id: photoId, addedAt: new Date() });
        userFavorites.set(req.user.id, userFavs);
    }
    
    res.json(userFavs);
});

// Remove from favorites
app.delete('/api/user/favorites/:photoId', verifyUserToken, (req, res) => {
    const { photoId } = req.params;
    const userFavs = userFavorites.get(req.user.id) || [];
    
    const updatedFavs = userFavs.filter(fav => fav.id !== photoId);
    userFavorites.set(req.user.id, updatedFavs);
    
    res.json(updatedFavs);
});

// Get user collections
app.get('/api/user/collections', verifyUserToken, (req, res) => {
    const collections = userCollections.get(req.user.id) || [];
    res.json(collections);
});

// Create collection
app.post('/api/user/collections', verifyUserToken, (req, res) => {
    const { name } = req.body;
    const collections = userCollections.get(req.user.id) || [];
    
    const newCollection = {
        id: Date.now().toString(),
        name,
        photos: [],
        createdAt: new Date()
    };
    
    collections.push(newCollection);
    userCollections.set(req.user.id, collections);
    
    res.status(201).json(newCollection);
});

// Add photo to collection
app.post('/api/user/collections/:collectionId/photos', verifyUserToken, (req, res) => {
    const { collectionId } = req.params;
    const { photoId } = req.body;
    const collections = userCollections.get(req.user.id) || [];
    
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
    }
    
    if (!collection.photos.includes(photoId)) {
        collection.photos.push(photoId);
    }
    
    res.json(collection);
});

// Storage configuration for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Serve static files from the public directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
