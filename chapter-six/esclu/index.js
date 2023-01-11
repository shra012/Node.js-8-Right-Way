"use strict";

const fs = require("fs");
const request = require("request");
const {Command} = require('commander');
const program = new Command();
const pkg = require("./package.json");

const fullUrl = (path = '') => {
    let url = `http://${program.opts().host}:${program.opts().port}/`
    if (program.opts().index) {
        url += program.opts().index + '/';
        if (program.opts().type) {
            url += program.opts().type + '/';
        }
    }
    return url + path.replace(/^\/*/, '');
}

const handleResponse = (err, res, body) => {
    if (err) {
        console.error(JSON.stringify(err));
        throw err;
    } else {
        console.log(body);
    }
};

program
    .version(pkg.version)
    .description(pkg.description)
    .usage('[options] <command> [...]')
    .showHelpAfterError('(add --help for additional information)')
    .option('-o, --host <hostname>', 'hostname [localhost]', 'localhost')
    .option('-p, --port <number>', 'port number [9200]', '9200')
    .option('-j, --json', 'format output as JSON')
    .option('-i, --index <name>', 'which index to use')
    .option('-t, --type <type>', 'default type for bulk operations')
    .option('-f, --filter <filter>', 'source filter for query results');

program.command('url [path]')
    .description('generate the URL for the options and path (default is /)')
    .action((path = '/') => console.log(fullUrl(path)));

program.command('get [path]')
    .description('perform an HTTP GET request for path (default is /)')
    .action((path = '/') => {
        const options = {
            url: fullUrl(path),
            json: program.opts().json,
        };
        request(options, (err, resp, body) => {
            if (program.opts().json) {
                console.log(JSON.stringify(err || body));
            } else {
                if (err) throw err;
                console.log(body);
            }
        });
    });

program.command('create-index')
    .description('create a new index')
    .action(() => {
        if (!program.opts().index) {
            const msg = 'No index specified! Use --index <name>';
            if (!program.opts().json) throw Error(msg);
            console.log(JSON.stringify({error: msg}));
            return;
        }
        request.put(fullUrl(), handleResponse);
    });

program.command('list-indices [suffix]')
    .alias('li')
    .description('get a list of indices in the cluster')
    .action((suffix) => {
        let path = suffix ? `_cat/indices/${suffix}*?v=true&s=index` : '_cat/indices?v=true&s=index';
        path = program.opts().json ? `${path}&format=json` : path;
        request({url: fullUrl(path), method: 'GET'}, handleResponse);
    })

program.command('bulk <file>')
    .description('read and perform bulk operations from a specified file')
    .action((file) => {
        fs.stat(file, (err, stats) => {
            if (err) {
                if (program.opts().json){
                    console.log(JSON.stringify(err));
                    return;
                }
                throw err;
            }
            const options = {
                url: fullUrl("_bulk"),
                json: true,
                headers: {
                    'content-length': stats.size,
                    'content-type': 'application/json',
                }
            };
            const req = request.post(options, (err, res, body) => {
                if(err) throw err;
            });
            const stream = fs.createReadStream(file);
             stream.pipe(req);
             req.pipe(process.stdout);
        });
    });

program.command('put <file>')
    .requiredOption('-id, --id <id>','The id of the document to add')
    .description('read and perform a single put operation from a specified file')
    .action((file, opts) => {
        fs.readFile(file, (err, data) => {
            if (err) {
                if (program.opts().json){
                    console.log(JSON.stringify(err));
                    return;
                }
                throw err;
            }
            const options = {
                url: fullUrl(opts.id),
                headers: {
                    'content-type': 'application/json'
                },
                body: data.toString()
            };
            request.put(options, handleResponse);
        });
    });

program.command('delete-index')
    .description('deletes an existing new index')
    .action(() => {
        if (!program.opts().index) {
            const msg = 'No index specified! Use --index <name>';
            if (!program.opts().json) throw Error(msg);
            console.log(JSON.stringify({error: msg}));
            return;
        }
        request.delete(fullUrl(), handleResponse);
    });

program.command('query [queries...]')
    .alias('q')
    .description('perform an Elasticsearch query')
    .action((queries = []) => {
       const options = {
           url: fullUrl('_search'),
           json: program.opts().json,
           qs: {},
       };
       if (queries && queries.length){
           options.qs.q = queries.join(' ');
       }
       if(program.opts().filter){
           options.qs._source = program.opts().filter
       }
       request(options, handleResponse)
    });


program.parse(process.argv);

if (program.args.filter(arg => typeof arg === 'object').length > 0) {
    program.help()
}