'use strict';
const fs = require('fs');
const net = require('net');
const filename = process.argv[2];
if (!filename) {
  throw Error('Error: No filename specified.');
}

net
  .createServer((socket) => {
    // Reporting.
    console.log('Subscriber connected.');
    socket.write(JSON.stringify({ type: 'watching', file: filename }) + '\r\n');
    // Watcher setup.
    const watcher = fs.watch(filename, () =>
      socket.write(
        JSON.stringify({ type: 'changed', timestamp: Date.now() }) + '\r\n'
      )
    );
    // Cleanup.
    socket.on('close', () => {
      console.log('Subscriber disconnected.');
      watcher.close();
    });
  })
  .listen(60300, () => console.log('Listening for subscribers...'));
