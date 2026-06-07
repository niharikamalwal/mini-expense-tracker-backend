import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Add your frontend URL in production
  credentials: true
}));
app.use(express.json());

// Database setup - Use /tmp for Railway/Render (ephemeral storage)
let db;
const dbPath = process.env.NODE_ENV === 'production' 
  ? path.join('/tmp', 'expense_tracker.db')
  : path.join(__dirname, 'expense_tracker.db');

async function initializeDatabase() {
  // Ensure directory exists for production
  if (process.env.NODE_ENV === 'production') {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create expenses table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Database initialized successfully');
  console.log(`📁 Database path: ${dbPath}`);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

// GET all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await db.all('SELECT * FROM expenses ORDER BY date DESC, created_at DESC');
    console.log(`📊 Returning ${expenses.length} expenses`);
    res.json(expenses);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST new expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { amount, category, date, note } = req.body;
    
    console.log('📝 Creating expense:', { amount, category, date, note });
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const result = await db.run(
      'INSERT INTO expenses (amount, category, date, note) VALUES (?, ?, ?, ?)',
      [parseFloat(amount), category, date, note || '']
    );
    
    const newExpense = await db.get('SELECT * FROM expenses WHERE id = ?', [result.lastID]);
    console.log('✅ Expense created:', newExpense);
    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { amount, category, date, note } = req.body;
    const id = req.params.id;
    
    await db.run(
      'UPDATE expenses SET amount = ?, category = ?, date = ?, note = ? WHERE id = ?',
      [parseFloat(amount), category, date, note || '', id]
    );
    
    const updated = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await db.run('DELETE FROM expenses WHERE id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Expense Tracker Backend is running!' });
});

// Start server
async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`\n🚀 Expense Tracker Server Running`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 API: http://localhost:${PORT}/api/expenses`);
    console.log(`✅ No authentication required - Single user mode\n`);
  });
}

startServer();