
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Database setup
const db = new sqlite3.Database(':memory:');

// Define tables
db.serialize(() => {
    db.run(`CREATE TABLE Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        password_hash TEXT
    )`);

    db.run(`CREATE TABLE Tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        status TEXT,
        assignee_id INTEGER,
        created_at DATETIME,
        updated_at DATETIME,
        FOREIGN KEY(assignee_id) REFERENCES Users(id)
    )`);
});

// API endpoints
// CRUD operations for tasks
app.post('/tasks', (req, res) => {
    const { title, description, status, assignee_id } = req.body;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    db.run(`INSERT INTO Tasks (title, description, status, assignee_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [title, description, status, assignee_id, createdAt, updatedAt], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.status(201).json({ id: this.lastID, title, description, status, assignee_id, created_at: createdAt, updated_at: updatedAt });
    });
});

app.get('/tasks', (req, res) => {
    db.all(`SELECT * FROM Tasks`, (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(rows);
    });
});

app.get('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    db.get(`SELECT * FROM Tasks WHERE id = ?`, [taskId], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(row);
    });
});

app.put('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, description, status, assignee_id } = req.body;
    const updatedAt = new Date().toISOString();

    db.run(`UPDATE Tasks SET title = ?, description = ?, status = ?, assignee_id = ?, updated_at = ? WHERE id = ?`,
    [title, description, status, assignee_id, updatedAt, taskId], (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({ message: 'Task updated successfully' });
    });
});

app.delete('/tasks/:id', (req, res) => {
    const taskId = req.params.id;

    db.run(`DELETE FROM Tasks WHERE id = ?`, [taskId], (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({ message: 'Task deleted successfully' });
    });
});

// Authentication endpoints
app.post('/auth/login', (req, res) => {
    // Authentication endpoints
app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;

    // Check if the username and password are valid (e.g., in the database)
    db.get(`SELECT * FROM Users WHERE username = ? AND password_hash = ?`, [username, password], (err, user) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // If the user is authenticated, generate a JWT token
        const token = jwt.sign({ username: user.username }, 'your_secret_key', { expiresIn: '1h' });

        res.json({ token });
    });
});

app.post('/auth/register', (req, res) => {
    const { username, password } = req.body;

    // Check if the username already exists in the database
    db.get(`SELECT * FROM Users WHERE username = ?`, [username], (err, existingUser) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // If the username is unique, insert the new user into the database
        db.run(`INSERT INTO Users (username, password_hash) VALUES (?, ?)`, [username, password], (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.status(201).json({ message: 'User registered successfully' });
        });
    });
});

});

app.post('/auth/register', (req, res) => {
    app.post('/auth/register', (req, res) => {
    const { username, password } = req.body;

    // Check if the username already exists in the database
    db.get(`SELECT * FROM Users WHERE username = ?`, [username], (err, existingUser) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // If the username is unique, insert the new user into the database
        db.run(`INSERT INTO Users (username, password_hash) VALUES (?, ?)`, [username, password], (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.status(201).json({ message: 'User registered successfully' });
        });
    });
});

});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
    // Middleware for authentication
const authenticateToken = (req, res, next) => {
    // Extract the token from the request headers or query parameters
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided' });
    }

    // Verify the token
    jwt.verify(token, 'your_secret_key', (err, decodedToken) => {
        if (err) {
            console.error(err.message);
            return res.status(403).json({ error: 'Failed to authenticate token' });
        }

        // If the token is valid, attach the decoded user information to the request object
        req.user = decodedToken;
        next();
    });
};

// Example usage:
app.get('/tasks', authenticateToken, (req, res) => {
    app.get('/tasks', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM Tasks`, (err, tasks) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(tasks);
    });
});

});

};

// Testing and Debugging (Optional)
// Unit testing
// Integration testing

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
