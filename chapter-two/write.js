'use strict';
const fs = require('fs');
const fileName = process.argv[2];
const content = process.argv.slice(1).join(' ');
fs.writeFile(fileName, content, (err) => {
  if (err) {
    throw err;
  }
  console.log(`File ${fileName} is saved!`);
});
