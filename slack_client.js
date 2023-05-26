const axios = require("axios");
const moment = require("moment");

const channel = "C059JL9RX1A";

const requestLastWeekMessages = (token) => {
    let lastWeek = moment().subtract(7, 'days').unix();

    return new Promise((resolve, reject) => {
        axios.post('https://slack.com/api/conversations.history',
            {
                channel: channel,
                oldest: lastWeek,
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-type': 'application/json',
                },
            }
        )
            .then((res) => {
                if (res.data.ok) {
                    resolve(res.data.messages);
                } else {
                    reject(`Error: ${res.data.error}`);
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};

module.exports = {
    requestLastWeekMessages
};