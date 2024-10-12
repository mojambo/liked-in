/**
 * logger.ts
 *
 * This module sets up a Winston logger for the application.
 * It configures logging to files and optionally to the console in non-production environments.
 */

import winston from 'winston';

/**
 * The main logger instance for the application.
 *
 * @constant
 * @type {winston.Logger}
 */
const logger: winston.Logger = winston.createLogger({
  // Set the default logging level
  level: 'info',
  // Configure the log format
  format: winston.format.combine(
    winston.format.timestamp(), // Add timestamps to log entries
    winston.format.json() // Format logs as JSON
  ),
  // Configure log transports (destinations)
  transports: [
    // Log errors to a separate file
    new winston.transports.File({filename: '/usr/src/app/data/error.log', level: 'error'}),
    // Log all levels to a combined file
    new winston.transports.File({filename: '/usr/src/app/data/combined.log'}),
  ],
});

// Add console logging in non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(), // Use a simpler format for console output
  }));
}

export default logger;
