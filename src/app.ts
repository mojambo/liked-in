/**
 * Main application file for the LinkedIn Slack bot.
 * This file initializes the database, sets up the Slack app, and starts the application.
 */

import {App, LogLevel} from '@slack/bolt';
import dotenv from 'dotenv';
import {DatabaseManager} from './db';
import {setupSlackHandlers} from "./slackHandlers";
import logger from './logger';

dotenv.config();

/**
 * DatabaseManager instance for handling database operations.
 * @type {DatabaseManager}
 */
const dbManager: DatabaseManager = new DatabaseManager(logger);

/**
 * Slack app instance configured with environment variables.
 * @type {App}
 */
const app: App = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logger: {
    debug: (...msgs) => logger.debug(msgs.join(' ')),
    info: (...msgs) => logger.info(msgs.join(' ')),
    warn: (...msgs) => logger.warn(msgs.join(' ')),
    error: (...msgs) => logger.error(msgs.join(' ')),
    setLevel: (level: LogLevel) => {
      logger.level = level;
    },
    getLevel: () => logger.level as LogLevel,
    setName: (name: string) => {
      // Winston doesn't have a built-in way to set logger name,
      // so we'll just log this information
      logger.info(`Logger name set to: ${name}`);
    },
  }
});

/**
 * Set up Slack event handlers and middleware.
 * @param {App} app - The Slack app instance.
 * @param {DatabaseManager} dbManager - The database manager instance.
 */
setupSlackHandlers(app, dbManager);

/**
 * Asynchronous Immediately Invoked Function Expression (IIFE) to initialize and start the application.
 * This function initializes the database and starts the Slack app.
 * If an error occurs during startup, it logs the error and exits the process.
 */
(async () => {
  try {
    // Initialize the database
    await dbManager.initialize();

    // Start the Slack app
    await app.start();
    logger.info('⚡️ Bolt app is running in socket mode!');
  } catch (error) {
    logger.error('Error starting app:', error);
    process.exit(1);
  }
})();
