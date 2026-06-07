import { getDb } from '../db/database.js';
import bcrypt from 'bcryptjs';

export const UserModel = {
  async create(username, email, password) {
    const db = getDb();
    const passwordHash = await bcrypt.hash(password, 10);
    
    try {
      const result = await db.run(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash]
      );
      return { id: result.lastID, username, email };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Username or email already exists');
      }
      throw error;
    }
  },

  async findByUsername(username) {
    const db = getDb();
    return await db.get('SELECT * FROM users WHERE username = ?', [username]);
  },

  async findByEmail(email) {
    const db = getDb();
    return await db.get('SELECT * FROM users WHERE email = ?', [email]);
  },

  async findById(id) {
    const db = getDb();
    return await db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [id]);
  },

  async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }
};