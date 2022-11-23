"use strict";

/**
 * @type {module:cluster.Cluster}
 */
const cluster = require("cluster");
const fs = require("fs");
const zmq = require("zeromq/v5-compat");

const numWorkers = require("os").cpus().length;

if (cluster.isMaster) {
  const router = zmq.socket("router").bind("tpc://127.0.0.1:60401");
  const dealer = zmq.socket("dealer").bind("ipc://filter-dealer.ipc");

  router.on("message", (...frames) => dealer.send(frames));
  dealer.on("message", (...frames) => router.send(frames));

  cluster.on("online", (worker) =>
    console.log(`Worker: ${worker.process.pid} is online`)
  );

  for (let i = 0; i <= numWorkers; i++) {
    cluster.fork();
  }
} else {
  const responder = zmq.socket("rep").connect("ipc://filer-dealer.ipc");
  responder.on("message", (data) => {
    const request = JSON.parse(data);
    console.log(`${process.pid} received request for path ${request.path}`);

    fs.readFile(request.path, (err, data) => {
      console.log(`${process.pid} sending response`);
      responder.send(
        JSON.stringify({
          content: data.toString(),
          timestamp: Date.now(),
          pid: process.pid,
        })
      );
    });
  });
}
