'use strict';
const assert = require('assert');
const EventEmitter = require('events').EventEmitter;
const LDJClient = require('./ldj-client');

describe('LDJClient', () => {
  let stream = null;
  let client = null;

  beforeEach(() => {
    stream = new EventEmitter();
    client = LDJClient.connect(stream);
  });

  it('should emit a message event from a single data event', (done) => {
    client.on('message', (message) => {
      assert.deepEqual(message, { foo: 'bar' });
      done();
    });
    stream.emit('data', '{"foo": "bar"}\r\n');
  });

  it('should emit a message event from split data events', (done) => {
    client.on('message', (message) => {
      assert.deepEqual(message, { foo: 'bar' });
      done();
    });
    stream.emit('data', '{"foo" : ');
    process.nextTick(() => stream.emit('data', '"bar" }\r\n'));
  });

  it('should emit two events from split data events', (done) => {
    let count = 0;
    client.on('message', (message) => {
      if (count === 1) {
        assert.deepEqual(message, { foo: 'baz' });
        done();
      }

      if (count === 0) {
        assert.deepEqual(message, { foo: 'bar' });
        count = 1;
      }
    });
    stream.emit('data', '{"foo" : ');
    setImmediate(() => {
      stream.emit('data', '"bar" }');
    });
    setTimeout(() => {
      stream.emit('data', '\r\n{"foo" : ');
    }, 2);
    setTimeout(() => {
      stream.emit('data', '"baz" }\r\n');
    }, 6);
  });

  it('should throw error when event stream is null', (done) => {
    assert.throws(() => LDJClient.connect(null), {
      name: 'Error',
      message: 'Stream is required',
    });
    done();
  });

  it('should emit error when event stream emits malformed json', (done) => {
    client.on('error', (error) => {
      assert.equal(error.message, 'Unexpected token \r in JSON at position 12');
      done();
    });
    stream.emit('data', '{"foo": "ba=\r\n');
  });

  it('should emit close events when the stream is closed', (done) => {
    client.on('close', () => {
      done();
    });
    client.on('message', (data) => {
      assert.deepEqual(data, { foo: 'baz' });
    });
    stream.emit('data', '{"foo": "baz"}');
    stream.emit('close', () => {});
  });
});
