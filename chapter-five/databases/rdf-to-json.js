#!/usr/bin/env node
const fs = require('fs');
const parseRdF = require('./lib/parse-rdf');
const rdf = fs.readFileSync(process.argv[2], 'utf8');
const book = parseRdF(rdf);
console.log(JSON.stringify(book, null, '  '));