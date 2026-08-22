const express = require('express');
const { signUp, signIn, signOut, getCurrentUser, requireAuth } = require('../services/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

// POST /api/auth/signup - Register a new user
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: 'Invalid email format' 
            });
        }

        const data = await signUp(email, password);
        res.status(201).json({ 
            message: 'User created successfully',
            user: data.user,
            session: data.session
        });
    } catch (error) {
        console.error('Signup error:', error);
        
        if (error.status === 429) {
            return res.status(429).json({ 
                error: 'Too many signup attempts. Please wait a moment and try again.' 
            });
        }
        
        if (error.code === 'email_address_invalid') {
            return res.status(400).json({ 
                error: 'Invalid email address format. Please use a valid email.' 
            });
        }
        
        res.status(400).json({ error: error.message });
    }
});

// POST /api/auth/signin - Login a user
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        const data = await signIn(email, password);
        res.json({ 
            message: 'Login successful',
            user: data.user,
            session: data.session
        });
    } catch (error) {
        console.error('Signin error:', error);
        
        if (error.status === 429) {
            return res.status(429).json({ 
                error: 'Too many login attempts. Please wait a moment.' 
            });
        }
        
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// POST /api/auth/signout - Logout a user
router.post('/signout', requireAuth, async (req, res) => {
    try {
        await signOut();
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Signout error:', error);
        res.status(400).json({ error: error.message });
    }
});

// GET /api/auth/me - Get current user
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await getCurrentUser();
        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ error: 'Not authenticated' });
    }
});

module.exports = router;
