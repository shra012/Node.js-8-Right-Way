"use strict";

const fs = require("fs");
const zmq = require("zeromq/v5-compat");

const responder = zmq.socket("rep");

responder.on("message", (data) => {
  const request = JSON.parse(data);
  console.log("Received request to get: " + request.path);

  fs.readFile(request.path, (err, data) => {
    if (err) {
      responder.send(
        JSON.stringify({
          error: err.message,
          timestamp: Date.now(),
          pid: process.pid,
        })
      );
      return;
    }
    console.log("Sending response content.");
    responder.send(
      JSON.stringify({
        content: data.toString(),
        timestamp: Date.now(),
        pid: process.pid,
      })
    );
  });
});

responder.bind("tcp://127.0.0.1:60401", (error) => {
  if (error) {
    throw error;
  }
  console.log("Listening for zmq requests...");
});

process.on("SIGINT", () => {
  console.log("Received SIGINT Shutting down");
  responder.close();
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM Shutting down");
  responder.close();
});

process.on("uncaughtException", (error, origin) => {
  console.log("Shutting down");
  responder.close();
});
