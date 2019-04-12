#! /usr/bin/env node

let config = {
    port: 3000,
    host: "127.0.0.1",
    dir: process.cwd()
}

let commander = require('commander');
let json = require("./package.json");
let Server = require('./server');

commander.version(json.version)
    .option('-d, --dir <s>', 'set your root dir')
    .option('-p, --port <n>', 'set yourt port')
    .option('-h, --host <s>', 'set your host')
    .parse(process.argv)
    .on('--help', function(){
        console.log('$ myserver --port xxx --host xxx')
    });
// console.log(commander.port, commander.dir, commander.host);


config = {...config, ...commander};
let server = new Server(config);
server.start();

