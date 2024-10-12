import {App} from '@slack/bolt';
import dotenv from 'dotenv';
import {initializeDatabase} from "./db";
import {setupSlackHandlers} from "./slackHandlers";

dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

setupSlackHandlers(app);

(async () => {
  await initializeDatabase();
  await app.start();
  console.log('⚡️ Bolt app is running in socket mode!');
})();
