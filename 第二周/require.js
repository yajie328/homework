
// require
// module.require
// Module._load(requireUrl,parent, isMan)加载模块
// Module._resolveFilename(require) 解析文件名 获取文件的据对路径
// Module.catch
// new module(id,) //没用模块就创建一个模块 id exports  
// Module._catch[fileName] = module

let path = require('path');
let fs = require('fs');
let vm = require('vm');

function Module(id){
    this.id = id;
    this.exports = {};
}
Module._catche = Object.create(null);
Module._extensions = {
    '.js': function(module){
        let jsStr = Module.wrapper[0];
        let str = ''
        let statObj = fs.statSync(module.id);
        if(statObj.isDirectory()){
            module.id = path.join(module.id , 'index.js'); // 如果是目录则读取下面的index.js
        }

        str = fs.readFileSync(module.id,'utf8'); 
        
        jsStr += str;
        jsStr += Module.wrapper[1];
        let fn = vm.runInThisContext(jsStr);
       fn.call(module.exports, module.exports, module, req);
    },
    ".json": function(module){
        let str = fs.readFileSync(module.id, 'utf8');
        try{
          str = JSON.parse(str);
        }catch(e){
            throw e;
        }
        
        module.exports = str;
    }
}
Module.wrapper = [
    '(function(exports,module,require,__dirname,__filename){',
    '})'
]
Module.prototype.load =  function(){
    let extname =  path.extname(this.id);
    if(!Module._extensions[extname]){ // 如果没有匹配的扩展名就按照js来解析
        extname = '.js';
    }
    try{
        Module._extensions[extname](this);
    }catch(e){
        // throw e;
    }
    // console.log(Module._extensions);
}

Module.resolveFileName = function(fileName){
    let err = {flag:true, e:''}
    let extnames = Object.keys(Module._extensions);
    extnames.push(''); // 添加一个空的后缀，有的文件就是没用后缀 或者 文件有后缀是.html 在extnames中没有匹配的
    
    for(const key of extnames){
        try{
            fs.accessSync(fileName+key);
            fileName = fileName+key;
            err.flag = false;
            return fileName;
            break;
        }catch(e){
            err.e = e;
            continue;
        }
    }

    if(err.flag){
        throw err.e;
    }

    return fileName;
}

function req(id){
    let absPath =  path.resolve(__dirname, id);
    let fileName = Module.resolveFileName(absPath);
    if(Module._catche[fileName]){ // 有就读缓存
        return Module._catche[fileName].exports
    }
    let module =  new Module(fileName);
    Module._catche[fileName] = module;  // 创建模块后放入缓存
    module.load();
    return module.exports;
}
module.exports = req;

let a = req('a.js');
console.log(a(1));
// console.log(__dirname);





