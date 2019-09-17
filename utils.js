const { mix, rgb } = require('nano-rgb');
const path = require('path');
const winston = require('winston');

const { combine, timestamp, json } = winston.format;

function spacer(message, length) {
  let _r = message;
  while (_r.length < length) _r += ' ';
  return _r;
}

const theme = {
  error: rgb(235, 97, 52),
  warn: rgb(235, 189, 52),
  info: rgb(52, 177, 235),
  verbose: rgb(240, 140, 174),
  debug: rgb(64, 78, 77),
  silly: rgb(245, 138, 7),
  success: rgb(52, 235, 155),
};

const logstamp = Date.now();

let loggerOptions = {};

const sylphLevels = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5,
  success: 6,
};

let logger;

function log(prefix, message, type) {
  const logType = type || 'info';
  if (loggerOptions.devLogs === true || process.env.NODE_ENV === 'production') {
    logger[logType](`${prefix.toUpperCase()} > ${message}`);
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${mix(theme[logType === 'error' ? 'error' : 'info'], `  |  ${spacer(prefix.toUpperCase(), 8)} >`)}`, mix(theme[logType], message));
  }
}

function initLogger(options) {
  loggerOptions = options;
  let transports = [];
  if (loggerOptions.devLogs === true || process.env.NODE_ENV === 'production') {
    transports = [
      new winston.transports.File({ filename: path.join(process.cwd(), `logs/${logstamp}-all.log`), level: 'success' }),
      new winston.transports.File({ filename: path.join(process.cwd(), `logs/${logstamp}-info.log`), level: 'info' }),
      new winston.transports.File({ filename: path.join(process.cwd(), `logs/${logstamp}-error.log`), level: 'error' }),
    ];
  }
  logger = winston.createLogger({
    levels: sylphLevels,
    format: combine(timestamp(), json()),
    transports,
  });
}

module.exports = {
  spacer,
  theme,
  log,
  initLogger,
};
