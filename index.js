import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
let db;

async function initializeDatabase() {
  db = await open({
    filename: path.join(__dirname, 'expense_tracker.db'),
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
}

// Get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await db.all(
      'SELECT * FROM expenses ORDER BY date DESC, created_at DESC'
    );
    res.json(expenses);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new expense - FIXED DATE VALIDATION
app.post('/api/expenses', async (req, res) => {
  try {
    const { amount, category, date, note } = req.body;
    
    console.log('Creating expense:', { amount, category, date, note });
    
    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    // FIX: Allow today's date and past dates only
    const expenseDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expenseDate.setHours(0, 0, 0, 0);
    
    // Only block if date is strictly in the future
    if (expenseDate > today) {
      return res.status(400).json({ error: 'Date cannot be in the future' });
    }
    
    const result = await db.run(
      'INSERT INTO expenses (amount, category, date, note) VALUES (?, ?, ?, ?)',
      [parseFloat(amount), category, date, note || '']
    );
    
    const newExpense = await db.get(
      'SELECT * FROM expenses WHERE id = ?',
      [result.lastID]
    );
    
    console.log('✅ Expense created:', newExpense);
    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { amount, category, date, note } = req.body;
    const id = req.params.id;
    
    const existing = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    await db.run(
      `UPDATE expenses 
       SET amount = ?, category = ?, date = ?, note = ? 
       WHERE id = ?`,
      [parseFloat(amount), category, date, note || '', id]
    );
    
    const updated = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete expense
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
  res.json({ message: 'Expense Tracker is running!' });
});

// Start server
async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`\n🚀 Expense Tracker Server Running`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api/expenses\n`);
  });
}

startServer();