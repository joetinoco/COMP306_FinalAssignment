'use strict'

const slackClient = require("../server/slackClient");
const service = require("../server/service");
const http = require("http");
const server = http.createServer(service);

const witToken = 'DIULG2EX2WND7WZDWZTMJNMTVN52DZJO'
const witClient = require('../server/witClient')(witToken);

const slackToken = 'xoxb-106871034272-9QJiM25Ugu2hFQPsZA8y4lUC';
const slackLogLevel = 'verbose';

const rtm = slackClient.init(slackToken, slackLogLevel, witClient);
rtm.start();

slackClient.addAuthenticatedHandler(rtm, () => server.listen(4000));

server.on('listening', function() {
    console.log(`FRANK is listening on ${server.address().port} in ${service.get('env')} mode. `);
});