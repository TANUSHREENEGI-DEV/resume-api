// middleware/logger.js
// Our own middleware. Prints every request that comes in.
function logger(req, res, next) {
  console.log(req.method, req.url);
  next(); // done, carry on to the next thing
}

module.exports = logger;
