const spawn = require('child_process').spawn;
let child = spawn(
  process.argv[0],
  ['.src\fileswatcher-simple.js'].concat(process.argv.slice(1)),
  { shell: true }
);
let output = '';
child.stdout.pipe(process.stdout);
child.stdout.on('data', (chunk) => (output += chunk));
child.on('close', () => {
  console.log(`output : ${output}`);
});
