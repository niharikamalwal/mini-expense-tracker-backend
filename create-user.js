import { initializeDatabase, getDb } from './db/database.js';
import bcrypt from 'bcryptjs';

async function createUser() {
  try {
    await initializeDatabase();
    const db = getDb();
    
    const username = 'malwal';
    const email = 'malwal@example.com';
    const password = 'password123';
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (existingUser) {
      console.log('User already exists:', existingUser);
      
      // Update password if needed
      await db.run('UPDATE users SET password_hash = ? WHERE username = ?', [passwordHash, username]);
      console.log('Password updated for existing user');
    } else {
      // Create new user
      const result = await db.run(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash]
      );
      console.log('User created successfully!');
      console.log('Username:', username);
      console.log('Password:', password);
    }
    
    // Verify the user
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    console.log('User in database:', { id: user.id, username: user.username, email: user.email });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createUser();
