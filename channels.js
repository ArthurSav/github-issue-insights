const axios = require("axios");

const webhookDiscord = process.env.WEBHOOK_DISCORD;
const webhookSlack = process.env.WEBHOOK_SLACK;

const postToDiscord = async (title, body) => {
  const message = {
    embeds: [
      {
        title: title,
        description: body,
        color: 5814783,
      },
    ],
  };

  return axios
    .post(webhookDiscord, message)
    .then((response) => {
      console.log("Posted to Discord: ", title);
      return response;
    })
    .catch((error) => {
      console.error("Error sending message to Discord", error);
    });
};

const postToSlack = async (title, body) => {
  const message = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: title,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: body,
        },
      },
    ],
  };

  return axios
    .post(webhookSlack, message)
    .then((response) => {
      console.log("Posted: ", title);
      return response;
    })
    .catch((error) => {
      console.error("Error sending message", error);
    });
};

module.exports = {
  postToDiscord,
  postToSlack,
};
