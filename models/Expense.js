import { getDb } from '../db/database.js';

export const ExpenseModel = {
  async findAll(userId) {
    const db = getDb();
    const expenses = await db.all(
      'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC',
      [userId]
    );
    return expenses;
  },

  async findById(id, userId) {
    const db = getDb();
    return await db.get(
      'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  },

  async create(userId, expenseData) {
    const db = getDb();
    const { amount, category, date, note } = expenseData;
    
    const result = await db.run(
      'INSERT INTO expenses (user_id, amount, category, date, note) VALUES (?, ?, ?, ?, ?)',
      [userId, amount, category, date, note || '']
    );
    
    return await this.findById(result.lastID, userId);
  },

  async update(id, userId, updateData) {
    const db = getDb();
    const { amount, category, date, note } = updateData;
    
    await db.run(
      'UPDATE expenses SET amount = ?, category = ?, date = ?, note = ? WHERE id = ? AND user_id = ?',
      [amount, category, date, note, id, userId]
    );
    
    return await this.findById(id, userId);
  },

  async delete(id, userId) {
    const db = getDb();
    const result = await db.run(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.changes > 0;
  }
};