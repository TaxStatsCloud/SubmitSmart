/**
 * Admin User Creation Script
 * Run this with: node create-admin-user.js
 */

import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  const password = 'Admin123!';
  const hash = await hashPassword(password);
  
  console.log('\n=== ADMIN USER CREDENTIALS ===');
  console.log('Email: admin@promptsubmissions.com');
  console.log('Password:', password);
  console.log('Password Hash:', hash);
  console.log('\n SQL to create admin user:');
  console.log(`INSERT INTO users (email, password, full_name, role, credits) VALUES ('admin@promptsubmissions.com', '${hash}', 'Admin User', 'admin', 1000) ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;`);
  console.log('===============================\n');
}

main();
