'use strict';
const server = require('net').createServer((socket) => {
  console.log('Subscriber connected.');
  // Two message chunks that together make a whole message.
  const firstChunk = '{"type":"changed","timesta';
  const secondChunk =
    'mp":1450694370094}\r\n{"type":"changed","timestamp":1550894370094}\r\n';
  // Send the first chunk immediately.
  socket.write(firstChunk);
  // After a short delay, send the other chunk.
  const timer = setTimeout(() => {
    socket.write(secondChunk);
    socket.end();
  }, 100);
  // Clear timer when the connection ends.
  socket.on('end', () => {
    clearTimeout(timer);
    console.log('Subscriber disconnected.');
  });
});
server.listen(60300, function () {
  console.log('Test server listening for subscribers...');
});
