'use strict';
const fs = require('fs');
const fileName = process.argv[2];
if (fs.existsSync(fileName)) {
  fs.watch(fileName, (eventname) => {
    if (eventname == 'rename' && !fs.existsSync(fileName)) {
      throw new Error('File has been deleted');
    } else {
      console.log('File has been changed : ' + eventname);
    }
  });
} else {
  console.log(`File ${fileName} does not exist`);
}
