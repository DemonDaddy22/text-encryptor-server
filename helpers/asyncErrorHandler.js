/**
 * @param {Function} cb - a route callback function
 * @returns a function which abstracts away error catching
 */
const asyncErrorHandler = (cb) => (req, res, next) =>
    cb(req, res, next).catch(next);

export default asyncErrorHandler;
