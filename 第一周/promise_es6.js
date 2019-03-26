console.log('daya-promise-se6');
class Promise{
    constructor(executor){
        this.status = 'pending';
        this.value= undefined;
        this.reason = undefined;
        this.onRejectedCallbacks = [];
        this.onResolveCallbacks = [];
        let resolve = (value)=>{
            if(this.status === 'pending'){
                // console.log(1);
                this.status = 'fulfilled';
                this.value = value;
                
                this.onResolveCallbacks.forEach(fn=>fn());
            }
        }
        let reject = (reason)=>{
            if(this.status === 'pending'){
                this.status = 'rejected';
                this.reason = reason;
                this.onRejectedCallbacks.forEach(fn=>fn());
            }

        }
        // 执行器 立即执行, 用trycatch 防止直接抛出错误，错误直接执行reject
        try{
            executor(resolve, reject);
        }catch(e){
            // console.log(e, 'catch');
            reject(e)
        }
    }
    // promise就是当前then返回的promise
    // x就是当前then中成功或者失败的返回结果
    static resolvePromise(promise, x, resolve, reject){
        let self = this;
        // 对x进行判断，如果x是一个普通值，直接执行resolve(x)
        // 如果x是一个promise 采用x的状态
        if(promise === x){
            return reject(new TypeError('循环引用'));
        }
        // 这种情况肯能就是一个promise
        if(x != null && (typeof x === 'object' || typeof x === 'function')){
            let called;
            try{
                let then = x.then; // 看当前的promise有没有then方法 有可能取then的时候会报错
                if(typeof then ==='function'){ //是一个promise
                    then.call(x,y=>{
                        if(called) return;
                        called = true;
                        // resolve(y);
                        // 如果返回的是一个promise, 这个promise，resolve的结果可能还是一个promise，递归解析直到这个y是一个常量为止
                        Promise.resolvePromise(promise, y, resolve, reject);

                    }, r=>{
                        if(called) return;
                        called = true;
                        reject(r);
                    });
                }else{
                    resolve(x);
                }
            }catch(e){
                if(called) return
                called = true;
                reject(e);
            }
        }else{
            resolve(x);
        }
        
    }
    // then 
    then(onfulfilled, onrejected){
        onfulfilled = typeof onfulfilled ==='function'? onfulfilled: value=>value;
        onrejected =  typeof onrejected ==='function'? onrejected: err=> {throw err};
        let self = this;
        // 返回新的promise 让当前的方法执行后继续then
        let promise2 = new Promise((resolve, reject)=>{
            if(self.status === 'fulfilled'){
            // resolve(x); 如果x是一个普通值或一个返回成功的promise 用调用promise2的resolve(x),
            // reject(x); // 如果x是一个返回失败的promise 或 抛出异常 则调用promise2的reject(x)
            // 所以用下面那个resolvePromise函数判断处理以下，也便于后面重复使用
            setTimeout(()=>{
                try{
                    let x =  onfulfilled(self.value); //x就是then第一个函数的返回值
                    Promise.resolvePromise(promise2, x, resolve, reject); 
                }catch(e){
                    reject(e);
                }
            })
            }
            if(self.status === 'rejected'){
                setTimeout(()=>{
                    try{
                        let x =  onrejected(self.reason);
                        Promise.resolvePromise(promise2, x, resolve, reject); 
                    }catch(e){
                        reject(e);
                    }
                })
            }
            if(self.status === 'pending'){
             // 异步的存起来 ， 发布订阅 如果稍后调用了resolve 会让函数一次执行，执行的时候会将成功和失败的值进行传递
             self.onResolveCallbacks.push(()=>{
                    setTimeout(()=>{
                        try{
                            let x = onfulfilled(self.value);
                            Promise.resolvePromise(promise2, x, resolve, reject); 
                        }catch(e){
                            reject(e)
                        }
                    })
                });
                self.onRejectedCallbacks.push(()=>{
                    setTimeout(()=>{
                        try{
                            let x = onrejected(self.reason);
                            Promise.resolvePromise(promise2, x, resolve, reject);
                        }catch(e){
                            reject(e)
                        }
                    })
                });
            }
        });
        return promise2;
    }

    catch(errCallback){
        return this.then(null, errCallback);
    }

    finally(callback){
        if(this.status === 'fulfilled' || this.status == "rejected"){
            callback();
        }else{
            this.onResolveCallbacks.push(callback);
            this.onRejectedCallbacks.push(callback);
        }
        return this;
    }
}
Promise.deferred = function(){
    let dfd = {};
    dfd.promise = new Promise((resolve,reject)=>{
        dfd.resolve = resolve;
        dfd.reject = reject;
    });
    return dfd;
};
module.exports =  Promise;

