# LikedIn

## Weekend Project: LinkedIn Post Liker Slack Bot

# DANGER DANGER

My account has been restricted after developing and extensively testing this, since it uses puppeteer and I believe this
whole project
violates LinkedIn's terms of service.

# USE AT YOUR OWN RISK

## Description

This Slack bot allows users to automatically like LinkedIn posts directly from Slack. It uses a combination of Slack's
Bolt framework, Puppeteer for web automation, and SQLite for data storage.

## Features

- Slack command to share LinkedIn posts
- Automatic liking of shared LinkedIn posts
- Secure storage of LinkedIn authentication cookies
- Error handling and logging

## Prerequisites

- Node.js (v14 or later)
- pnpm
- A Slack workspace with bot permissions
- LinkedIn account

## Installation

1. Clone the repository:
   `git clone https://github.com/yourusername/linkedin-post-liker-slack-bot.git cd linkedin-post-liker-slack-bot`

2. Install dependencies:
   `pnpm install`

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:

```
SLACK_BOT_TOKEN=your_slack_bot_token 
SLACK_SIGNING_SECRET=your_slack_signing_secret 
SLACK_APP_TOKEN=your_slack_app_token 
ENCRYPTION_KEY=your_encryption_key
```

## Usage with Docker Compose

1. Make sure you have Docker and Docker Compose installed on your system.

2. Build and start the containers:
   `docker-compose up --build`

3. The bot should now be running and connected to your Slack workspace.

4. To stop the bot, use:
   `docker-compose down`

5. If you need to view the logs, use:
   `docker-compose logs`

6. To run the bot in detached mode (in the background), use:
   `docker-compose up -d`

7. In Slack, use the following commands:

- `/likedin [LinkedIn post URL]` to share a LinkedIn post
- `/set-linkedin-cookie` to set your LinkedIn authentication cookie

## Project Structure

- `app.ts`: Main application file
- `slackHandlers.ts`: Slack event handlers
- `db.ts`: Database operations
- `liker.ts`: LinkedIn post liking functionality
- `logger.ts`: Logging configuration

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Slack Bolt Framework](https://slack.dev/bolt-js/concepts)
- [Puppeteer](https://pptr.dev/)
- [SQLite](https://www.sqlite.org/index.html)
- [Docker](https://www.docker.com/)