class Promise {
  constructor(executor) {
      this.resolveCallbacks = [];
      this.rejectCallbacks = [];
      this.status = 'pending';
      this.value = undefined;
      this.reason = undefined;
      let resolve =  (value) => {
          if (value instanceof Promise) {
              return value.then(resolve, reject);
          }
          if (this.status === 'pending') {
              this.value = value;
              this.resolveCallbacks.forEach(fn => fn());
              this.status = 'fulfilled';
          }
      };
      let reject =  (reason) => {
          if (this.status === 'pending') {
              this.reason = reason;
              this.rejectCallbacks.forEach(fn => fn());
              this.status = 'rejected';
          }
      };
      try {
          executor(resolve, reject);
      } catch (e) {
          reject(e);
      }
  }

  then(onfulfilled, onrejected) {
      onfulfilled = typeof onfulfilled === 'function' ? onfulfilled : value => value;
      onrejected = typeof onrejected === 'function' ? onrejected : reason => {
          throw reason;
      };
      let that = this;
      let promise = new Promise((resolve, reject) => {
          if (that.status === 'fulfilled') {
              setTimeout(() => {
                  try {
                      let x = onfulfilled(that.value);
                      resolvePromise(promise, x, resolve, reject)
                  } catch (r) {
                      reject(r);
                  }
              });
          }
          if (that.status === 'rejected') {
              setTimeout(() => {
                  try {
                      let x = onrejected(that.reason);
                      resolvePromise(promise, x, resolve, reject);
                  } catch (r) {
                      reject(r);
                  }
              });
          }
          if (that.status === 'pending') {
              that.resolveCallbacks.push(() => {
                  setTimeout(() => {
                      try {
                          let x = onfulfilled(that.value);
                          resolvePromise(promise, x, resolve, reject);
                      } catch (r) {
                          reject(r)
                      }
                  });
              });
              that.rejectCallbacks.push(() => {
                  setTimeout(() => {
                      try {
                          let x = onrejected(that.reason);
                          resolvePromise(promise, x, resolve, reject);
                      } catch (r) {
                          reject(r)
                      }
                  })
              })
          }

      });
      return promise;
  }

  finally(callback) {
    return this.then(val => Promise.resolve(callback()).then(() => val),
        reason => Promise.resolve(callback()).then(() => { throw reason }))
  }
}

function resolvePromise(promise, x, resolve, reject) {
  if (x === promise) return reject(new TypeError('Ñ­»·µ÷ÓÃ'));
  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
      let called;
      try {
          const then = x.then;
          if (typeof then === 'function') {
              then.call(x, y => {
                  if (called) return;
                  called = true;
                  resolvePromise(promise, y, resolve, reject);
              }, r => {
                  if (called) return;
                  called = true;
                  reject(r);
              })
          } else {
              resolve(x);
          }
      } catch (r) {
          if (called) return;
          called = true;
          reject(r)
      }
  } else {
      resolve(x)
  }
}

Promise.deferred = function () {
  let dfd = {};
  dfd.promise = new Promise((resolve, reject) => {
      dfd.resolve = resolve;
      dfd.reject = reject;
  });
  return dfd;
};

module.exports = Promise;