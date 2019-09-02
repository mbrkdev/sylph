// Imports
const { mix } = require('nano-rgb');
const nanoexpress = require('nanoexpress');

const path = require('path');
const fs = require('fs');
const readdirp = require('readdirp');

const { version } = require('./package.json');
const { theme, log } = require('./utils');

// Application Variables
const middlewares = {};
let options = {
  showMiddleware: false,
  basePath: 'server',
  clear: true,
};

const app = nanoexpress();


// Serve Public Folder
// const publicFolder = path.join(__dirname, `${options.basePath}/public`);
// if (fs.existsSync(publicFolder)) {
//   app.use(require('nanoexpress/build/static.js')(publicFolder));
// }

// Default Favicon Handling
const faviconPath = path.join(__dirname, `${options.basePath}/public/favicon.ico`);
const fallback = './favicon.ico';
const fav = fs.existsSync(faviconPath) ? faviconPath : fs.existsSync(fallback) ? fallback : null;
if (fav) {
  const favicon = fs.readFileSync(fav);
  app.get('/favicon.ico', async (req, res) => {
    res.end(favicon);
  });
}

function setRoute(filePath) {
  // Determine type
  const type = filePath.replace(/(\w+)[\\|/](.+).js/, '$1');
  // Route Normalization
  const cleanRoute = filePath
    .replace(/\w+[\\|/](.+).js/gi, '$1') // Strip all but path
    .replace('index.js', '.js') // Change index to just .js
    .replace('\\', '/') // Backslash to forward slash
    .replace(/\/$/gi, '') // Remove ending slash (for xx/index)
    .replace(' ', '-') // Spaces to dashes
    .replace('_', ':'); // Underscore to colon (for dynamic routes)
  let route = `/${cleanRoute}`;

  const routePath = `${process.cwd()}/${options.basePath}/${filePath}`;

  // Resolve Middleware
  if (type === 'middleware') {
    const mw = require(routePath).middleware;
    const fileName = filePath.replace(/\w+[\\|/](.+).js/gi, '$1')
      .replace(/[\\|/]/, '/');
    middlewares[fileName] = mw;
    if (options.showMiddleware) { log('Midd', fileName, 'success'); }
    return;
  }

  // Removes 'index' only if it's at the end of a route
  route = route.replace(/[\\|/]index$/, '');

  // Resolve handler
  const { handler, middleware } = require(routePath);
  if (!handler) {
    log(type, route, 'error');
    return;
  }
  log(type, route, 'success');
  app[type](route, async (req, res) => {
    try {
      if (middleware) {
        middleware.map(async (m) => {
          if (typeof m === 'function') await m(req, res, () => {});
          else await middlewares[m](req, res, () => {});
        });
      }
      await handler(req, res);
    } catch (error) {
      log(type, `${route}| ERROR`, 'error');
      console.log(error);
    }
  });
}

function expand(functionality) {
  if (options.showMiddleware) { log('Midd', `Expanded x ${functionality.length}`); }
  functionality.map((f) => {
    app.use('/', f);
  });
}

function start(port, callback) {
  // App Starts
  if (options.clear) {
    console.clear();
  }
  console.log(`${mix(theme.blue, 'Sylph')} Engine Starting`);
  readdirp(options.basePath, {
    fileFilter: '*.js',
    directoryFilter: ['!public', '!*utils'],
  })
    .on('data', (entry) => {
      setRoute(entry.path);
    })
    .on('end', async () => {
      // Because of a crazy error that is nothing to do with this app.
      console.done = () => {};
      try {
        await app.listen(port, '0.0.0.0');
        console.log(`${mix(theme.blue, `Sylph ${mix(theme.yellow, version)}`)} listening on port ${mix(theme.blue, port)}`);
        if (callback) callback();
      } catch (error) {
        console.log('error');
      }
    });
}

function setOptions(opts) {
  options = { ...options, ...opts };
}

module.exports = {
  app,
  options: setOptions,
  log,
  expand,
  start,
};
