const axios = require("axios");

const apiKey = process.env.OPENAI_API_KEY;
const models = {
  3: "gpt-3.5-turbo",
  4: "gpt-4",
};

const url = "https://api.openai.com/v1/chat/completions";

const requestChat = async (prompt, model = models["3"], maxTokens = 1500) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const messages = [
    {
      role: "user",
      content: prompt,
      name: "Jarvis",
    },
  ];

  const body = {
    model: model,
    messages: messages,
    max_tokens: maxTokens, // Set this to the maximum allowed tokens, adjust if needed
    n: 1,
    stop: null,
    temperature: 0.2,
    stream: false,
  };

  console.log("Making OpenAI request (chat): ", prompt.slice(0, 50) + "...");

  try {
    const response = await axios.post(url, body, { headers: headers });

    const data = await response.data;
    console.log("OpenAI response (chat)", response.status, data);

    if (response.status === 200) {
      // get gpt output
      return data.choices[0].message.content;
    } else {
      console.error(
        `OpenAI Request failed with status ${response.status}`,
        response
      );
    }
  } catch (error) {
    console.error("OpenAI Request Error:", error);
    return null;
  }
};

module.exports = {
  requestChat,
  models,
};
