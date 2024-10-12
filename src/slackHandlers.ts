/**
 * Slack Handlers Module
 *
 * This module contains all the Slack event handlers for the LinkedIn Post Liker bot.
 * It includes handlers for Slack commands, interactive actions, and view submissions.
 * The module sets up the necessary event listeners and defines the logic for each handler.
 *
 * @module slackHandlers
 */

import {
  App,
  BlockAction,
  Middleware,
  SlackActionMiddlewareArgs,
  SlackCommandMiddlewareArgs,
  SlackViewMiddlewareArgs,
  ViewSubmitAction
} from '@slack/bolt';
import {clickLikeButton} from "./liker";
import {DatabaseManager} from "./db";

import logger from './logger';

/**
 * Sets up Slack event handlers for the application.
 * @param {App} app - The Slack Bolt app instance.
 * @param {DatabaseManager} dbManager - The database manager instance.
 */
export function setupSlackHandlers(app: App, dbManager: DatabaseManager) {
  app.command('/likedin', handleLinkedinCommand);
  app.action<BlockAction>('like_linkedin', handleLikeLinkedinAction(dbManager));
  app.command('/set-linkedin-cookie', handleSetLinkedinCookieCommand);
  app.view('cookie_modal', handleCookieModalSubmission(dbManager));
}

/**
 * Handles the /likedin Slack command.
 * Validates the provided LinkedIn URL and responds with an interactive message.
 * @type {Middleware<SlackCommandMiddlewareArgs>}
 */
const handleLinkedinCommand: Middleware<SlackCommandMiddlewareArgs> = async ({command, ack, respond}) => {
  await ack();
  const linkedInUrl = command.text.trim();

  const linkedInPostRegex = new RegExp(
    'https?://(?:www.)?linkedin.com/(?:posts/[^/]+/|feed/update/urn:li:activity:)[^\s]+',
    'i'
  );
  if (!linkedInPostRegex.test(linkedInUrl)) {
    await respond({
      text: "Please provide a valid LinkedIn URL.",
      response_type: 'ephemeral'
    });
    return;
  }
  try {
    await respond({
      text: `LinkedIn link shared by <@${command.user_id}>!}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `LinkedIn link shared by <@${command.user_id}>:  <${linkedInUrl}|www.linkedin.com>`
          }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Like Link",
                emoji: true
              },
              value: linkedInUrl,
              action_id: "like_linkedin"
            }
          ]
        },
      ],
      unfurl_links: true,
      response_type: 'in_channel'
    });


  } catch (error) {
    console.error('Error posting message:', error);
    await respond({
      text: "Sorry, there was an error processing your request.",
      response_type: 'ephemeral'
    });
  }
}

/**
 * Handles the action of liking a LinkedIn post.
 * Retrieves the user's stored cookie, likes the post, and sends a confirmation message.
 * @param {DatabaseManager} dbManager - The database manager instance.
 * @returns {Middleware<SlackActionMiddlewareArgs<BlockAction>>}
 */
const handleLikeLinkedinAction = (dbManager: DatabaseManager): Middleware<SlackActionMiddlewareArgs<BlockAction>> =>
  async ({action, ack, client, body}) => {
    await ack();
    logger.info('Like LinkedIn action received:', action);

    if ('value' in action) {
      const linkedInUrl = action.value;
      if (linkedInUrl != undefined) {
        try {
          const cookie = await dbManager.getStoredCookie(body.user.id);
          if (cookie == null) {
            throw new Error('No cookie found');
          }
          await clickLikeButton(linkedInUrl, cookie);
          await client.chat.postEphemeral({
            channel: body.channel!.id,
            user: body.user.id,
            text: "You successfully liked this post!"
          });
        } catch (e) {
          logger.error('Error liking post:', e);
          await client.chat.postEphemeral({
            channel: body.channel!.id,
            user: body.user.id,
            text: "There was an error liking the post. Please try again or check your cookie."
          });
        }
      }
    } else {
      logger.error('Action does not contain a value');
    }
  }

/**
 * Handles the /set-linkedin-cookie Slack command.
 * Opens a modal for the user to input their LinkedIn cookie.
 * @type {Middleware<SlackCommandMiddlewareArgs>}
 */
const handleSetLinkedinCookieCommand: Middleware<SlackCommandMiddlewareArgs> = async ({command, ack, client}) => {
  await ack();
  try {
    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: "modal",
        callback_id: "cookie_modal",
        title: {
          type: "plain_text",
          text: "Set Cookie"
        },
        submit: {
          type: "plain_text",
          text: "Submit"
        },
        blocks: [
          {
            type: "input",
            block_id: "cookie_input",
            element: {
              type: "plain_text_input",
              action_id: "cookie_value"
            },
            label: {
              type: "plain_text",
              text: "Enter cookie value"
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error opening modal:', error);
  }
}

/**
 * Handles the submission of the cookie modal.
 * Stores the provided cookie in the database and sends a confirmation message.
 * @param {DatabaseManager} dbManager - The database manager instance.
 * @returns {Middleware<SlackViewMiddlewareArgs<ViewSubmitAction>>}
 */
const handleCookieModalSubmission = (dbManager: DatabaseManager): Middleware<SlackViewMiddlewareArgs<ViewSubmitAction>> =>
  async ({ack, body, view, client}) => {
    await ack();
    const user_id = body.user.id;
    const cookie_value = view.state.values.cookie_input.cookie_value.value;

    if (cookie_value == null) {
      logger.error('No cookie input');
      return;
    }

    try {
      await dbManager.storeCookie(user_id, cookie_value);

      await client.chat.postMessage({
        channel: user_id,
        text: "Your LinkedIn cookie has been successfully stored!"
      });
    } catch (error) {
      logger.error('Error storing cookie:', error);
      await client.chat.postMessage({
        channel: user_id,
        text: "There was an error storing your LinkedIn cookie. Please try again."
      });
    }
  }
