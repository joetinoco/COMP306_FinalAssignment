'use strict'

const RtmClient = require('@slack/client').RtmClient;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const wikipedia = require('./wikipediaClient');
let rtm = null;
let nlp = null;
let rtmData = null;

function handleOnAuthenticated(rtmStartData) {
    console.log(`Logged in as ${rtmStartData.self.name} (${rtmStartData.self.id}) of team ${rtmStartData.team.name}`);
    rtmData = rtmStartData;
}

function handleOnMessage(message) {
    let msgText = message.text;
    console.log(`Message received: "${msgText}"`);

    // Extract all users mentioned in the message
    let mentionedUsers = [], match;
    while (match = /<@([A-Z0-9]+)>/.exec(msgText)) {
        mentionedUsers.push(match[1]);
        msgText = msgText.replace(match[0], ''); // Remove the mention to make natural language processing easier later
    }

    // Do nothing if people are not talking to the bot,
    // i.e., if his ID is among the mentions
    if (!mentionedUsers.some((usr) => usr === rtmData.self.id)) return;

    // Otherwise, send the message to processing
    nlp.ask(message.text, (err, res) => {
        if(err) {
            console.log(err);
            return;
        }

        // Reject messages without intent
        if(!res.intent) return rtm.sendMessage("Sorry, I don't know what you are talking about", message.channel);

        // Reject messages without a wikipedia search query entry
        if(!res.wikipedia_search_query) return rtm.sendMessage("I did not quite get what you want me to look up.", message.channel);

        // If all is well, query Wikipedia and send results to channel.
        res.wikipedia_search_query.forEach((searchItem) => {
            wikipedia.search(searchItem.value, (err, res) => {
                if(err) {
                    console.log(err);
                    return;
                }
                rtm.sendMessage(res, message.channel);
            });
        });
        
        // rtm.sendMessage('Sorry, I did not understand.', message.channel, function messageSent() {
        // // Optional callback that executes when a message has been sent
        // });
    });


}

function addAuthenticatedHandler(rtm, handler) {
    rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, handler);
}

module.exports.init = function slackClient(token, logLevel, nlpClient) {
    rtm = new RtmClient(token, {logLevel: logLevel});
    nlp = nlpClient;
    addAuthenticatedHandler(rtm, handleOnAuthenticated);
    rtm.on(RTM_EVENTS.MESSAGE, handleOnMessage);
    return rtm;
}

module.exports.addAuthenticatedHandler = addAuthenticatedHandler;