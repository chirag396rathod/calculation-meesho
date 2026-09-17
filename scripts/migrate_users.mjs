import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@libsql/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_TURSO_URL = 'libsql://fc-analytics-chirag-rathod-8866.aws-ap-south-1.turso.io';
const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkzODM5OTQsImlkIjoiMDFhMDlmOTgtMDUwMS03MTAyLTljZDYtMGEzMjgxNjY2N2FiIiwia2lkIjoiVGpBQ0syTnRGVHVPS0Nqd2YybHlHQjViWEJHb0F6amZ0RXQ1cVFLNVZCTSIsInJpZCI6IjkwOTE5YjMxLThhMzQtNDVhNi1iYTRhLThjMDhlN2UxYmU4MCJ9.MZqTuMOTlO2k1Zp9at_eXN6iLeQoUJ5ehcAXJU4qvH43xAKL0SqTa1AslX80ZSOAQIxKI5C8q_-3USLdpEjQCQ';

const url = process.env.DATABASE_URL || DEFAULT_TURSO_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN || DEFAULT_TURSO_TOKEN;

console.log('Connecting to Turso:', url);
const client = createClient({ url, authToken });

async function run() {
  console.log('--- Checking current users table schema ---');
  const infoBefore = await client.execute('PRAGMA table_info(users)');
  console.log('Current schema:', infoBefore.rows);

  const existingUsers = await client.execute('SELECT * FROM users');
  console.log(`Found ${existingUsers.rows.length} existing users:`, existingUsers.rows);

  console.log('Creating users_new with nullable mobile and email (both UNIQUE)...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users_new (
      id         TEXT PRIMARY KEY,
      mobile     TEXT UNIQUE,
      name       TEXT DEFAULT '',
      email      TEXT UNIQUE,
      created_at TEXT,
      last_login TEXT
    );
  `);

  console.log('Copying users and converting empty strings to NULL...');
  await client.execute(`
    INSERT OR REPLACE INTO users_new (id, mobile, name, email, created_at, last_login)
    SELECT 
      id,
      CASE WHEN mobile IS NULL OR TRIM(mobile) = '' THEN NULL ELSE TRIM(mobile) END,
      COALESCE(name, ''),
      CASE WHEN email IS NULL OR TRIM(email) = '' THEN NULL ELSE LOWER(TRIM(email)) END,
      created_at,
      last_login
    FROM users;
  `);

  console.log('Dropping old users table and renaming users_new to users...');
  await client.execute('DROP TABLE users;');
  await client.execute('ALTER TABLE users_new RENAME TO users;');

  console.log('--- Migration verification ---');
  const infoAfter = await client.execute('PRAGMA table_info(users)');
  console.log('New schema:', infoAfter.rows);

  const usersAfter = await client.execute('SELECT * FROM users');
  console.log('Users in new table:', usersAfter.rows);

  console.log('Testing insertion of multiple users with null mobile...');
  const testId1 = `test_usr_${Date.now()}_1`;
  const testId2 = `test_usr_${Date.now()}_2`;
  await client.execute({
    sql: 'INSERT INTO users (id, mobile, name, email, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?)',
    args: [testId1, null, 'Test User 1', 'test1@example.com', new Date().toISOString(), new Date().toISOString()]
  });
  await client.execute({
    sql: 'INSERT INTO users (id, mobile, name, email, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?)',
    args: [testId2, null, 'Test User 2', 'test2@example.com', new Date().toISOString(), new Date().toISOString()]
  });
  console.log('Multiple null mobile insertions succeeded without UNIQUE constraint error!');

  // Clean up test rows
  await client.execute({ sql: 'DELETE FROM users WHERE id IN (?, ?)', args: [testId1, testId2] });
  console.log('Cleaned up test users.');

  console.log('MIGRATION COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
