// slackHandlers.ts

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
import {getStoredCookie, storeCookie} from "./db";

export function setupSlackHandlers(app: App) {
  app.command('/likedin', handleLinkedinCommand);
  app.action<BlockAction>('like_linkedin', handleLikeLinkedinAction);
  app.command('/set-linkedin-cookie', handleSetLinkedinCookieCommand);
  app.view('cookie_modal', handleCookieModalSubmission);
}

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

const handleLikeLinkedinAction: Middleware<SlackActionMiddlewareArgs<BlockAction>> = async ({
                                                                                              action,
                                                                                              ack,
                                                                                              client,
                                                                                              body
                                                                                            }) => {
  await ack();
  console.log('Like LinkedIn action received:', action);

  if ('value' in action) {
    const linkedInUrl = action.value;
    if (linkedInUrl != undefined) {
      try {
        const cookie = await getStoredCookie(body.user.id);
        if (cookie == null) {
          throw Error('No cookie found');
        }
        await clickLikeButton(linkedInUrl, cookie);
        await client.chat.postEphemeral({
          channel: body.channel!.id,
          user: body.user.id,
          text: "You successfully liked this post!"
        });
      } catch (e) {
        console.error(e);
      }
    }
  } else {
    console.error('Action does not contain a value');
  }
}

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


const handleCookieModalSubmission: Middleware<SlackViewMiddlewareArgs<ViewSubmitAction>> = async ({
                                                                                                    ack,
                                                                                                    body,
                                                                                                    view,
                                                                                                    client
                                                                                                  }) => {
  await ack();
  const user_id = body.user.id;
  const cookie_value = view.state.values.cookie_input.cookie_value.value;

  if (cookie_value == null) {
    console.error('No cookie input');
    return;
  }

  try {
    await storeCookie(user_id, cookie_value);

    await client.chat.postMessage({
      channel: user_id,
      text: "Your LinkedIn cookie has been successfully stored!"
    });
  } catch (error) {
    console.error('Error storing cookie:', error);
    await client.chat.postMessage({
      channel: user_id,
      text: "There was an error storing your LinkedIn cookie. Please try again."
    });
  }
}
