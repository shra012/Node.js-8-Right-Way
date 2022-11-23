'use strict';
const fs = require('fs');
const spawn = require('child_process').spawn;

const filename = process.argv[2];
if (!filename) {
  throw Error('A file to watch must be specified!');
}
fs.watch(filename, () => {
  const ls = spawn('dir', [filename], { shell: true });
  let output = '';
  ls.stdout.on('data', (chunk) => (output += chunk));
  ls.on('close', () => {
    const parts = output.match(/[^\r\n]+/g);
    const fileChunk = parts[3].split(/\s+/);
    const metaChunk = parts[4].split(/\s+/);
    console.log([
      fileChunk[4],
      'size',
      metaChunk[3],
      metaChunk[4],
      'changed at',
      fileChunk[0],
      fileChunk[1],
      fileChunk[2],
    ]);
  });
});
console.log(`Now watching ${filename} for changes...`);
