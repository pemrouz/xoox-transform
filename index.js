module.exports = (
  inp
, out = (inp[Symbol.species] || inp.constructor)()
, itr = stop((inp[Symbol.asyncIterator] || inp[Symbol.iterator]).call(inp))
) => (...fns) => step(
    require('./compose')(...fns)(next, itr)
  , out
  , itr
  )

const step = (
  pipeline
, out
, itr
, rec = itr.next()
) => {
  if (rec.then) return rec.then(rec => step(pipeline, out, itr, rec))
  while (!rec.done) {
    out = pipeline(out, rec.value)
    if (itr.done) return out
    if (out.then && !out.next) return out.then(out => step(pipeline, out, itr))
    rec = itr.next()
    if (rec.then) return rec.then(rec => step(pipeline, out, itr, rec))
  }
  return out
}

// TODO: default receivers which could be set
// standardise this as Symbol.send/receive/call/reduce?
const next = (out, v) => 
  out.next    ? (then(out.next(v), () => out)) // Generators, Channels, Observables
: out.call    ? (out(v), out)                  // Functions
: out.push    ? (out.push(v), out)             // Array
: out.concat  ? (out.concat(v))                // Strings
: out.toFixed ? (out += v)                     // Number
              : (out[v[0]] = v[1], out)        // Object

const then = (thing, proc) => 
  thing.next || !thing.then ? proc(thing) : thing.then(proc) 

// TODO: add stops method, as itr.return doesn't set done (which it probably should)?
const stop = itr => {
  itr.stop = () => !itr.done && (itr.done = true) && itr.return && itr.return()
  return itr
}

// TODO: These can be set by default instead of passing in 
// to make object-to-object transformations for example "just work"
Object.prototype[Symbol.iterator] = function*(){ 
  for (entry of Object.entries(this)) yield entry 
}

Function.prototype[Symbol.iterator] = function(){ 
  return { 
    next: () => ({ value: this(), done: false })
  }
}

Number.prototype[Symbol.iterator] = function*(value = 0){
  while (value++ < this) yield value
}