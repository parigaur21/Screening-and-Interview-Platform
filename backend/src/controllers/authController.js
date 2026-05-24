import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, execute } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export async function register(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password required.' });
  try {
    const existing = await query('SELECT * FROM users WHERE username = $1', [username]);
    if (existing.length > 0) return res.status(409).json({ message: 'User already exists.' });
    const hash = await bcrypt.hash(password, 10);
    await execute('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hash]);
    res.status(201).json({ message: 'User registered.' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
}

export async function login(req, res) {
  const { username, password } = req.body;
  try {
    const users = await query('SELECT * FROM users WHERE username = $1', [username]);
    if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials.' });
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });
    const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
}
