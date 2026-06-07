import { ExpenseModel } from '../models/Expense.js';

export const getExpenses = async (req, res) => {
  try {
    const expenses = await ExpenseModel.findAll(req.userId);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getExpense = async (req, res) => {
  try {
    const expense = await ExpenseModel.findById(req.params.id, req.userId);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { amount, category, date, note } = req.body;
    
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
    
    const expenseDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expenseDate > today) {
      return res.status(400).json({ error: 'Date cannot be in the future' });
    }
    
    const newExpense = await ExpenseModel.create(req.userId, {
      amount: parseFloat(amount),
      category,
      date,
      note: note || ''
    });
    
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { amount, category, date, note } = req.body;
    
    if (amount && amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    
    if (date) {
      const expenseDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expenseDate > today) {
        return res.status(400).json({ error: 'Date cannot be in the future' });
      }
    }
    
    const updatedExpense = await ExpenseModel.update(
      req.params.id, 
      req.userId,
      {
        ...(amount && { amount: parseFloat(amount) }),
        ...(category && { category }),
        ...(date && { date }),
        ...(note !== undefined && { note })
      }
    );
    
    if (!updatedExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const deleted = await ExpenseModel.delete(req.params.id, req.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};