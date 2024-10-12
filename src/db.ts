import sqlite3 from "sqlite3";
import {Database, open} from "sqlite";
import path from "node:path";
import fs from "fs/promises";
import CryptoJS from 'crypto-js';
// Add this at the top of your file
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-this';

let db: Database | null = null;

export async function initializeDatabase() {
  try {
    const dbDir = '/usr/src/app/data/';
    const dbPath = path.join(dbDir, 'database.sqlite');

    // Ensure the data directory exists
    await fs.mkdir(dbDir, {recursive: true});

    // Check if we can write to the directory
    await fs.access(dbDir, fs.constants.W_OK);
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await db.exec('CREATE TABLE IF NOT EXISTS cookies (user_id TEXT PRIMARY KEY, cookie_value TEXT)');
    console.log('Database initialized successfully');

    // Simple write-read test
    const testUserId = 'test_user';
    const testCookieValue = 'test_cookie';

    // Write test
    await db.run('INSERT OR REPLACE INTO cookies (user_id, cookie_value) VALUES (?, ?)', [testUserId, testCookieValue]);

    // Read test
    const result = await db.get('SELECT cookie_value FROM cookies WHERE user_id = ?', [testUserId]);

    if (result && result.cookie_value === testCookieValue) {
      console.log('Database write-read test passed successfully');
    } else {
      throw new Error('Database write-read test failed');
    }
    // Clean up test data
    await db.run('DELETE FROM cookies WHERE user_id = ?', [testUserId]);
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error; // Re-throw the error to ensure the calling code knows initialization failed
  }
}


export function getDatabase(): Database | null {
  return db;
}

export async function storeCookie(user_id: string, cookie_value: string) {
  const database = getDatabase();
  if (!database) {
    throw new Error('Database not initialized');
  }
  const encryptedCookie = CryptoJS.AES.encrypt(cookie_value, ENCRYPTION_KEY).toString();
  await database.run('INSERT OR REPLACE INTO cookies (user_id, cookie_value) VALUES (?, ?)', [user_id, cookie_value]);

// Fetch all records from the 'cookies' table
  const allCookies = await database.all('SELECT * FROM cookies');

// Print the fetched records
  console.log('All cookies in the database:');
  console.log(allCookies);

}

export async function getStoredCookie(user_id: string): Promise<string | null> {

  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }
  try {
    console.log(`Looking up userId ${user_id}`);
    const result = await db.get('SELECT cookie_value FROM cookies WHERE user_id = ?', [user_id]);

    if (result) {
      // Check if the cookie value is a valid UTF-8 string
      if (isValidUTF8(result.cookie_value)) {
        console.log(`Success!`);
        return result.cookie_value;
      } else {
        console.error('Cookie value is not valid UTF-8');
        return null;
      }
    }
    console.log(`No cookie found for user ${user_id}`);
    return null;
  } catch (error) {
    console.error('Error retrieving cookie:', error);
    return null;
  }
}

// Helper function to check if a string is valid UTF-8
function isValidUTF8(str: string): boolean {
  try {
    new TextDecoder('utf-8').decode(new TextEncoder().encode(str));
    return true;
  } catch (e) {
    return false;
  }
}




