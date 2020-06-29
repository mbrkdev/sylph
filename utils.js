const { mix, rgb } = require('nano-rgb');

const theme = {
  error: rgb(235, 97, 52),
  warn: rgb(235, 189, 52),
  info: rgb(52, 177, 235),
  verbose: rgb(240, 140, 174),
  debug: rgb(64, 78, 77),
  silly: rgb(245, 138, 7),
  success: rgb(52, 235, 155),
};

function log(prefix, message, type) {
  const logType = type || 'info';
  if (process.env.NODE_ENV === 'production') {
    console.log(`${new Date().toUTCString()} | ${prefix.toUpperCase()} > ${message}`);
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${mix(theme[logType === 'error' ? 'error' : 'info'], `  |  ${prefix.toUpperCase().padEnd(11)} >`)}`, mix(theme[logType], message));
  }
}

module.exports = {
  theme,
  log,
};
