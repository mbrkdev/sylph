const express = require('express')
const chokidar = require('chokidar');
const chalk = require('chalk');
const asyncHandler = require('express-async-handler')

const watcher = chokidar.watch(['server/get', 'server/post']);

const version = '1.0.0'

let routes = { get: {},  post: {} }
let state = {};

let app = express();
app.disable('x-powered-by');
app.use(express.static(process.cwd() + '/server/public'))
console.clear()
console.log(`${chalk.blue('Sylph')} Engine Starting`)

function spacer (message, length) {
  let _r = message
  while (_r.length < length) _r += ' '
  return _r
}

function setRoute(path) {
  // Determine type
  let type = '';
  if((path.includes('/get/'))) type = 'get';
  if((path.includes('\\get\\'))) type = 'get';
  if((path.includes('/post/'))) type = 'post';
  if((path.includes('\\post\\'))) type = 'post';
  // Resolve handler
  const routePath = `${process.cwd()}/${path}`;
  const {handler, middleware} = require(routePath)
  // Route Normalisation
  const cleanRoute = path
  .replace(/server\/(?:get|post)\/(.+).js/gi, '$1') // Strip all but path
  .replace(/server\\(?:get|post)\\(.+).js/gi, '$1') // Strip all but path
  .replace('\\', '/') // Backslash to forward slash
  .replace('index', '') // Change index to nothing
  .replace(/\/$/gi, '') // Remove ending slash (for xx/index)
  .replace(' ', '-') // Spaces to dashes
  .replace('_', ':') // Underscore to colon (for dynamic routes)
  
  let route = `/${cleanRoute}`;
  console.log(path)
  console.log(type)
  console.log(routePath)
  console.log(route)
  console.log(cleanRoute)
  console.log(`${chalk.blue(`  |  ${spacer(type.toUpperCase(), 5)} >`)}`, chalk.green(route))
  if(!handler) {
    console.log(`${chalk.red(`|   ${spacer(type.toUpperCase(), 5)} >`)}`, chalk.red(route))
    return;
  }
  routes[type][route] = handler;
  app[type](route,middleware || [], asyncHandler(handler))
}

module.exports = {
  app,
  state,
  expand: (functionality) => {
    functionality.map(f => {
      app.use(f)
    })
  },
  start: (port, callback) => {
    watcher
    .on('add', setRoute)
    .on('ready', () => {
      const server = app.listen(port, () => {
        console.log(`${chalk.blue('Sylph ' + chalk.bold(version))} listening on port ${chalk.blue(port)}`)
        if(callback) callback()
      })
      server.on('close', function() {
        console.log(`${chalk.blue('Sylph ')}${chalk.red('Stopping')}`)
        return;
      });
      
      process.on('SIGINT', function() {
        server.close();
      });
    })
  }
};