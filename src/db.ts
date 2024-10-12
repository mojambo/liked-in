/**
 * Database management module for cookie storage.
 * This module provides a DatabaseManager class for handling SQLite database operations,
 * including initialization, cookie storage, and retrieval with encryption.
 */


import sqlite3 from "sqlite3";
import {Database, open} from "sqlite";
import path from "node:path";
import fs from "fs/promises";
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
import {Logger} from 'winston';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY is not set in environment variables');
}

/**
 * Interface representing a cookie entry in the database.
 */
interface Cookie {
  user_id: string;
  cookie_value: string;
}

/**
 * Custom error class for database-related errors.
 */
class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Manages database operations for cookie storage.
 */
class DatabaseManager {
  private db: Database | null = null;
  private logger: Logger;
  private encryptionKey: string;

  /**
   * Creates a new DatabaseManager instance.
   * @param logger - The logger instance to use for logging.
   */
  constructor(logger: Logger) {
    this.logger = logger;
    if (!ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY is not set');
    }
    this.encryptionKey = ENCRYPTION_KEY;
  }

  /**
   * Initializes the database connection and creates necessary tables.
   * @throws {DatabaseError} If initialization fails.
   */
  async initialize(): Promise<void> {
    try {
      const dbDir = '/usr/src/app/data/';
      const dbPath = path.join(dbDir, 'database.sqlite');

      await fs.mkdir(dbDir, {recursive: true});
      await fs.access(dbDir, fs.constants.W_OK);

      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      await this.db.exec('CREATE TABLE IF NOT EXISTS cookies (user_id TEXT PRIMARY KEY, cookie_value TEXT)');
      this.logger.info('Database initialized successfully');

      await this.runWriteReadTest();
    } catch (error) {
      this.logger.error('Error initializing database:', error);
      throw new DatabaseError('Failed to initialize database');
    }
  }

  /**
   * Runs a write-read test to ensure database functionality.
   * @throws {DatabaseError} If the test fails.
   */
  private async runWriteReadTest(): Promise<void> {
    const testUserId = 'test_user';
    const testCookieValue = 'test_cookie';

    try {
      await this.storeCookie(testUserId, testCookieValue);
      const result = await this.getStoredCookie(testUserId);

      if (result === testCookieValue) {
        this.logger.info('Database write-read test passed successfully');
      } else {
        throw new Error('Database write-read test failed');
      }

      await this.db!.run('DELETE FROM cookies WHERE user_id = ?', [testUserId]);
    } catch (error) {
      this.logger.error('Error during write-read test:', error);
      throw new DatabaseError('Write-read test failed');
    }
  }

  /**
   * Stores an encrypted cookie in the database.
   * @param user_id - The user ID associated with the cookie.
   * @param cookie_value - The cookie value to store.
   * @throws {DatabaseError} If the database is not initialized or storage fails.
   */
  async storeCookie(user_id: string, cookie_value: string): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }
    const encryptedCookie = CryptoJS.AES.encrypt(cookie_value, this.encryptionKey).toString();
    await this.db.run('INSERT OR REPLACE INTO cookies (user_id, cookie_value) VALUES (?, ?)', [user_id, encryptedCookie]);
  }

  /**
   * Retrieves and decrypts a stored cookie for a given user ID.
   * @param user_id - The user ID to look up.
   * @returns The decrypted cookie value, or null if not found.
   * @throws {DatabaseError} If the database is not initialized or retrieval fails.
   */
  async getStoredCookie(user_id: string): Promise<string | null> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    try {
      this.logger.debug(`Looking up userId ${user_id}`);
      const result = await this.db.get<Cookie>('SELECT cookie_value FROM cookies WHERE user_id = ?', [user_id]);

      if (result) {
        const decryptedCookie = CryptoJS.AES.decrypt(result.cookie_value, this.encryptionKey).toString(CryptoJS.enc.Utf8);
        this.logger.debug('Cookie retrieved successfully');
        return decryptedCookie;
      }

      this.logger.debug(`No cookie found for user ${user_id}`);
      return null;
    } catch (error) {
      this.logger.error('Error retrieving cookie:', error);
      throw new DatabaseError('Failed to retrieve cookie');
    }
  }

  /**
   * Closes the database connection.
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export {DatabaseManager, DatabaseError};
