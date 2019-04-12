let http = require('http');
let url = require('url');
let path = require('path');
let zlib = require('zlib');

let fs = require('mz/fs');
let mime = require('mime');
let ejs = require('ejs');
let chalk = require('chalk');

let template = fs.readFileSync(path.resolve(__dirname,'dir.html'),'utf8');
class HttpServer{
    constructor(config){
        this.port = config.port;
        this.dir = config.dir;
        this.host = config.host;
    }
   async handler(req,res){
        let {pathname} = url.parse(req.url);
        let absPath =  path.join(this.dir, pathname);
        
        try{
            let statObj = await fs.stat(absPath);
            if(statObj.isDirectory()){
                let dirs = await fs.readdir(absPath);
                dirs = dirs.map((dir)=>{
                    return {'href': path.join(pathname, dir), 'key':dir};
                });
                let str = ejs.render(template, {arr:dirs});
                res.setHeader('Content-type', 'text/html;charset=utf-8');
                res.end(str);
            }else{
                this.readFile(req, res, absPath, statObj);
            }
        }catch(e){
            this.error(e,req,res);
        }
    }
    cache(req, res, statObj){
        let lastModified = statObj.ctime.toUTCString();
        let modifiedSince = req.headers['if-modified-since'];
        
        let etag = statObj.size+'';
        let noneMatch = req.headers['if-none-match'];

        res.setHeader('Cache-Control','max-age=5');
        res.setHeader('Last-Modified', lastModified);
        res.setHeader('Etag', etag);

        if(lastModified !== modifiedSince){
            return false;
        }
        if(noneMatch !== etag){
            return false;
        }
        return  true;

    }
    readFile(req,res,absPath,statObj){
        res.setHeader("Content-type",mime.getType(absPath)+";charset=utf-8");

        // 缓存
        if(this.cache(req,res,statObj)){ 
            res.statusCode = 304;
            res.end();
            return;
        }

        // 范围请求
        let range = req.headers['range'];
        if(range){
            this.sendRangeFile(range, absPath, req, res);
            return;
        }

        // gzip 压缩
        let encoding = req.headers['accept-encoding'];
        if(encoding){
           this.sendGzipFile(encoding,absPath, req, res);
           return;
        }

        fs.createReadStream(absPath).pipe(res);
    }
    sendGzipFile(encoding, absPath, req, res){  // Accept-Encoding: gzip, deflate
         if(/\bgzip\b/.test(encoding)){
            res.setHeader('Content-Encoding','gzip');
            fs.createReadStream(absPath).pipe(zlib.createGzip()).pipe(res);
            return;
        }
        if(/\bdeflate\b/.test(encoding)){
            res.setHeader('Content-Encoding','deflate');
            fs.createReadStream(absPath).pipe(zlib.createDeflate()).pipe(res);
            return;
        }
    }
    sendRangeFile(range, absPath, req, res){  // Range:bytes=1-5  Content-Range
        let [,start, end] = range.match(/(\d*)-(\d*)/); 
        start =  start? Number(start):0;
        let total = fs.statSync(absPath).size;
        end = end? Number(end) : total;

        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
        fs.createReadStream(absPath, {start, end:end-1}).pipe(res);
    }
    error(err, req, res){
        res.statusCode = 404;
        res.end('Not Found');
    }
    start(){
        http.createServer(this.handler.bind(this)).listen(this.port, this.host, ()=>{
            console.log(chalk.yellow(`Starting up http-server, serving ${this.dir} available on `));
            console.log(chalk.green(`http://${this.host}:${this.port}`));
        });
    }

}



module.exports = HttpServer;
