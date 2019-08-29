const { mix, rgb } = require('nano-rgb')

function spacer(message, length) {
  let _r = message
  while (_r.length < length) _r += ' '
  return _r
}

const theme = {
  blue: rgb(52, 177, 235),
  red: rgb(235, 97, 52),
  yellow: rgb(235, 189, 52),
  green: rgb(52, 235, 155)
}

function log(prefix, message, type) {
  console.log(`${mix(type === 'error' ? theme.red : theme.blue,`  |  ${spacer(prefix.toUpperCase(), 5)} >`)}`, mix(theme[type === 'error' ? 'red' : type === 'success' ? 'green':'blue'], message))
}

module.exports = {
  spacer,
  theme,
  log
}