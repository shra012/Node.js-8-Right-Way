const filename = process.argv[2];
const requester = require("./zmq-filer-req");

for (let i = 1; i <= 5; i++) {
  console.log(`Sending request ${i} for ${filename}`);
  requester.send(JSON.stringify({ path: filename }));
}
