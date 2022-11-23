'use strict';

const zmq = require('zeromq/v5-compat');

const subscriber = zmq.socket('sub');

subscriber.subscribe('');

subscriber.on('message', data => {
   const message = JSON.parse(data);
   const date = new Date(message.timestamp);
   console.log(`File ${message.file} changed at ${date.toUTCString()}`);
});

subscriber.connect("tcp://localhost:60400");

console.log("Subscriber connected, waiting for publisher to publish");