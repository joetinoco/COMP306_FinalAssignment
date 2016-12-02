'use strict'

const slackClient = require("../server/slackClient");
const service = require("../server/service");
const http = require("http");
const server = http.createServer(service);

const witToken = 'HAUD5MQNBNCLPK4A5U4ZPRKUR66OVCUC'
const witClient = require('../server/witClient')(witToken);

const slackToken = 'xoxb-107904435569-dBGAdYMHPMKTe9I7D59g5GL9';
const slackLogLevel = 'verbose';

const rtm = slackClient.init(slackToken, slackLogLevel, witClient);
rtm.start();

slackClient.addAuthenticatedHandler(rtm, () => server.listen(4000));

server.on('listening', function() {
    console.log(`BUBBLEBOT is listening on ${server.address().port} in ${service.get('env')} mode. `);
});