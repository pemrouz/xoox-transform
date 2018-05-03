// this is just a helper function: standard compose from any library
module.exports = (...fns) => (next, ...args) => 
  fns.reverse().reduce((res, fn) => fn(res, ...args), next)