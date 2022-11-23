'use strict'
/**
 * @type {module:cluster.Cluster}
 */
const cluster = require('cluster');
const zmq = require('zeromq/v5-compat');

const numWorkers = require('os').cpus().length;
if (cluster.isMaster) {
    const masterPusher = zmq.socket('push').bind('ipc://filer-job.ipc');
    const masterPuller = zmq.socket('pull').bind('ipc://filer-result.ipc');
    cluster.on('online', (worker) => {
        console.log(`Worker ${worker.process.pid} is online.`);
    });

    let counter = 0;
    // master puller pulls data from workers, this can be a ready message or result message
    masterPuller.on('message', data => {
        const response = JSON.parse(data.toString());
        if (response.ready) {
            counter += 1;
            if (counter == 3) {
                for (let i = 0; i < 30; i++) {
                    masterPusher.send(JSON.stringify({
                        job: `job ${i}`
                    }));
                }
            }
        } else {
            console.log(`Result from worker ${JSON.stringify(response)}`);
        }
    });

    // Fork a worker process for each CPU.
    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }
} else {
    const workerPuller = zmq.socket('pull').connect('ipc://filer-job.ipc');
    const workerPusher = zmq.socket('push').connect('ipc://filer-result.ipc');

    workerPuller.on('message', data => {
        const job = JSON.parse(data.toString()).job
        workerPusher.send(JSON.stringify({
            result: true,
            pid: process.pid,
            message: `${job} is completed`
        }));
    })

    workerPusher.send(JSON.stringify({
        ready: true,
        pid: process.pid
    }));
}