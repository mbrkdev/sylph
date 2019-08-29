// Imports
const { mix } = require('nano-rgb')
const chokidar = require('chokidar');
const cero = require('0http')
const low = require('0http/lib/server/low')

const path = require('path');
const fs = require('fs')

const { version } = require('./package.json');
const { spacer, theme, log } = require('./utils')

// Initialization
const watcher = chokidar.watch(['server/get', 'server/post']);
const { router, server } = cero({
  router: require('0http/lib/router/sequential')(),
  server: low()
})

// Application Variables
let routes = { GET: {}, POST: {} }
  // Functions

// App Starts
console.clear()
console.log(`${mix(theme.blue,'Sylph')} Engine Starting`)

// Default Favicon Handling
let favicon;
const faviconPath = path.join(__dirname, 'server/public/favicon.ico')
const fallback = path.join(__dirname, 'server/public/favicon.ico')
const fav = fs.existsSync(faviconPath) ? faviconPath : fallback;
fs.readFile(fav, (err, contents) => {
  favicon = contents;
});
router.get('/favicon.ico', (req, res, next) => {
  res.end(favicon)
})

function setRoute(path) {
  // Determine type
  let type = '';
  if ((path.match(/[\\|/]get[\\|/]/))) type = 'GET';
  if ((path.match(/[\\|/]post[\\|/]/))) type = 'POST';
  // Resolve handler
  const routePath = `${process.cwd()}/${path}`;
  const { handler, middleware } = require(routePath)
    // Route Normalization
  const cleanRoute = path
    .replace(/server[\\|/](?:get|post)[\\|/](.+).js/gi, '$1') // Strip all but path
    .replace('\\', '/') // Backslash to forward slash
    .replace('index', '') // Change index to nothing
    .replace(/\/$/gi, '') // Remove ending slash (for xx/index)
    .replace(' ', '-') // Spaces to dashes
    .replace('_', ':') // Underscore to colon (for dynamic routes)

  let route = `/${cleanRoute}`;

  if (!handler) {
    log(type, route, 'error')
    return;
  }
  log(type, route, 'success')
  routes[type][route] = handler;
  router.on(type, route, async(req, res) => {
    try {
      await handler(req, res)
    } catch (error) {
      log(type, route + '| ERROR', 'error')
      console.log(error)
    }
  })
}

function expand(functionality) {
  functionality.map((f, i) => {
    log('MW', 'Registered x ' + (i + 1))
    router.use('/', f)
  })
}

function start(port, callback) {
  watcher
    .on('add', setRoute)
    .on('ready', () => {
      server.listen(port, (socket) => {
        if (socket) {
          console.log(`${mix(theme.blue,'Sylph ' + mix(theme.yellow,version))} listening on port ${mix(theme.blue,port)}`)
        }
      })
    })
}

module.exports = {
  server,
  router,
  log,
  expand,
  start
};