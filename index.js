require("dotenv").config();

const axios = require("axios");
const moment = require("moment");
const { postToDiscord, postToSlack } = require("./channels");
const { requestChat, models } = require("./chat");
const { requestLastWeekMessages } = require("./slack_client");

const repository = "mobile-dev-inc/maestro";
const token = process.env.SLACK_API_TOKEN;

const providerType = {
  0: "GitHub issues",
  1: "Slack #maestro channel messages",
};

const getIssues = async (repoName) => {
  const oneWeekAgo = moment().subtract(7, "days").toISOString();
  const url = `https://api.github.com/repos/${repoName}/issues`;

  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const params = {
    labels: "bug",
    since: oneWeekAgo,
    sort: "created",
  };

  const response = await axios.get(url, { headers: headers, params: params });
  return response.data;
};

const getSummaries = async (issues) => {
  const summaries = [];

  for (const issue of issues) {
    const prompt = `This is a github issue. Create a short summary for: ${issue.body}\nSummary:`;
    const summary = await requestChat(prompt);
    summaries.push({
      title: issue.title,
      summary: summary || "",
      url: issue.html_url,
      labels: issue.labels.map((label) => label.name),
      created_at: issue.created_at,
    });
  }

  return summaries;
};

const getTopIssues = async (issues) => {
  const issuesPrompt = JSON.stringify(issues);
  const prompt = `I will provide you with github issues (bugs only) for a mobile ui automation repository called Maestro.
Provide me with the top 3 bugs ranked by severity and explain your reasoning.
Make sure to add an emoji at the beginning of each trend, format the text for Discord usage and use hyperlinks.
---
Issues: ${issuesPrompt}`;
  const response = await requestChat(prompt, models["4"], 2500);

  return response;
};

const getSlackMessagesInsights = async (messages) => {
  const messagesPrompt = JSON.stringify(messages);
  const prompt = `I will provide you with a list of Slack messages from a customer support channel for a mobile ui automation framework called Maestro.
Provide me with the top 3 most interesting trends.
Make sure to add an emoji at the beginning of each trend.
---
Messages: ${messagesPrompt}`;
  const response = await requestChat(prompt, models["3"], 2500);

  return response;
};

const getGithubIssuesInsights = async (issues) => {
  const issuesPrompt = JSON.stringify(issues);
  const prompt = `I will provide you with github issues (bugs only) for a mobile ui automation repository called Maestro.
Provide me with the top 3 most interesting trends.
Make sure to add an emoji at the beginning of each trend, format the text for Discord usage and use hyperlinks.
---
Issues: ${issuesPrompt}`;
  const response = await requestChat(prompt, models["4"], 2500);

  return response;
};

// Generates Discord/Slack message from issue summaries
const generateMessages = async (summaries, type) => {
  console.log(`Generating insights from ${summaries.length} ${type} `);

  // get insights
  let insights;

  switch (type) {
    case providerType[0]:
      insights = await getGithubIssuesInsights(summaries);
      break;
    case providerType[1]:
      insights = await getSlackMessagesInsights(summaries);
      break;
    default:
      insights = null;
  }

  console.log("Insights: \n", insights || "No response from GPT-4");
  //await postToDiscord("Maestro Trends (Last 7 days)", insights);

  // get top issues
  // const topIssues = await getTopIssues(summaries);
  // console.log("Top issues: ", topIssues || "No response from GPT-4");
  // await postToDiscord("Maestro Top Issues (Last 7 days)", topIssues);
};

const githubIssuesFlow = async () => {
  // get issues for the repo
  getIssues(repository)
    .then((issues) => {
      // remove pull requests
      return issues.filter((issue) => !issue.pull_request);
    })

    // get summaries for the github issues
    .then((issues) => {
      return getSummaries(issues.slice(0, 20));
    })
    // get insights from summaries and post to Discord
    .then((summaries) => {
      console.log("Summaries: ", summaries);
      return generateMessages(summaries, providerType[0]);
    })
    .catch((error) => {
      console.log(error);
    });
}

const slackMessagesFlow = async () => {
  requestLastWeekMessages(token)
    .then((messages) => {
      // remove non-user messages
      return messages.filter(message => message.client_msg_id).map(message => message.text);
    })
    .then((messages) => {
      console.log("Messages: ", messages);
      return generateMessages(messages, providerType[1]);
    });
}

const args = process.argv.slice(2);

args.forEach((arg) => {
  if (arg.startsWith('--source=')) {
    const param = arg.split('=')[1];

    if (param === 'slack') {
      slackMessagesFlow();
    } else if (param === 'github') {
      githubIssuesFlow();
    } else {
      console.log(`Invalid source: ${param}`);
    }
  }
});