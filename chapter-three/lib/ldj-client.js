const EventEmitter = require('events').EventEmitter;

class LDJClient extends EventEmitter {
  constructor(stream) {
    super();
    let buffer = '';
    if (!stream) {
      throw new Error('Stream is required');
    }
    stream.on('data', (data) => {
      buffer += data;
      let boundary = buffer.indexOf('\r\n');
      while (boundary !== -1) {
        const input = buffer.substring(0, boundary + 2);
        buffer = buffer.substring(boundary + 2);
        try {
          this.emit('message', JSON.parse(input));
        } catch (e) {
          this.emit('error', e);
        }
        boundary = buffer.indexOf('\r\n');
      }
    });
    stream.on('close', () => {
      try {
        this.emit('message', JSON.parse(buffer));
      } catch (e) {
        this.emit('error', e);
      }
      this.emit('close');
    });
  }

  static connect(stream) {
    return new LDJClient(stream);
  }
}
module.exports = LDJClient;
