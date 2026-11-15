// Log the real error on the server; send shoppers a plain message without internals
// (database hosts, stack details, query errors).
const sendServerError = (res, error, message = 'Something went wrong. Please try again.') => {
  console.error(`[${res.req?.method || ''} ${res.req?.originalUrl || ''}]`, error?.stack || error?.message || error);
  return res.status(500).json({ message });
};

module.exports = { sendServerError };
