var x = (function () {
  'use strict';

  // this is just a helper function: standard compose from any library
  var compose = (...fns) => (next, ...args) => fns
    .reverse()
    .reduce((res, fn) => fn(res, ...args), next);

  var pipe = (inp, ...fns) => {
    const itr = stop((inp[Symbol.asyncIterator] || inp[Symbol.iterator] || from(inp)).call(inp));
    return step(
      itr
    , compose(...fns)((value => itr.out = value), itr)
    )
  };

  const step = (
    itr
  , pipeline
  , rec = itr.next()
  ) => {
    if (rec.then) return rec.then(rec => step(itr, pipeline, rec))
    while (!rec.done && !itr.done) {
      const out = pipeline(rec.value);
      if (out && out.then && !out.next) return out.then(out => step(itr, pipeline))
      rec = itr.next();
      if (rec.then) return rec.then(rec => step(itr, pipeline, rec))
    }
    return itr.out
  };

  // TODO: add stops method, as itr.return doesn't set done (which it probably should)?
  const stop = itr => {
    itr.stopped = new Promise(resolve => {
      itr.stop = () => !itr.done && (itr.done = true) && itr.return && resolve(itr.return());
    });
    return itr
  };

  const from = thing => 
    thing.constructor == Object   ? function*(){ for (entry of Object.entries(this)) yield entry; }
  : thing.constructor == Function ? function*(){ while (true) yield this(); }
  : thing.constructor == Number   ? function*(value = 0){ while (value++ < this) yield value; }
                                  : 0;

  return pipe;

}());
