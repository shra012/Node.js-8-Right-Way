"use strict";

const zmq = require("zeromq/v5-compat");
const filename = process.argv[2];

const requester = zmq.socket("req");

requester.on("message", (data) => {
  const response = JSON.parse(data);
  console.log(`Received response: ${JSON.stringify(response)}`);
});

requester.connect("tcp://localhost:60401");

console.log("Sending a request for " + filename);
requester.send(JSON.stringify({ path: filename }));

module.exports = requester;
