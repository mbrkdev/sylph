// Imports
const { mix } = require('nano-rgb');
const express = require('express');

const path = require('path');
const fs = require('fs');
const cors = require('cors');
const readdirp = require('readdirp');

const { version } = require('./package.json');
const { theme, log } = require('./utils');

// Application Variables
const app = express();
const dir = process.cwd();

const middlewares = {};
let options = {
  showMiddleware: false,
  basePath: 'server',
  clear: true,
  origins: ['http://localhost:3000'],
  verbose: false,
};

function setupApplication() {
  // Serve Public Folder
  const publicDir = path.join(dir, options.basePath, 'public');
  const publicExists = fs.existsSync(publicDir);
  if (options.verbose) {
    log('LOG', `Public ${publicExists ? 'Exists' : 'Doesn\'t Exist @'}`, publicExists ? 'success' : 'error');
    if (!publicExists) {
      log('LOG', publicDir, 'error');
    }
  }
  if (publicExists) app.use(express.static(publicDir));

  // Default Favicon Handling
  const faviconPath = path.join(dir, `${options.basePath}/public/favicon.ico`);
  const fallback = path.join(__dirname, 'favicon.ico');
  const favExists = fs.existsSync(faviconPath);
  const fallbackExists = fs.existsSync(fallback);

  const fav = favExists ? faviconPath : fallbackExists ? fallback : null;

  if (options.verbose) {
    log('LOG', `Public Favicon ${favExists ? 'Exists' : 'Doesn\'t Exist'}`, favExists ? 'success' : 'error');
    log('LOG', `Fallback Favicon ${fallbackExists ? 'Exists' : 'Doesn\'t Exist'}`, fallbackExists ? 'success' : 'error');
    if (!fav) {
      log('LOG', 'No Favicon Available', 'error');
      log('LOG', `FV: ${faviconPath}`, 'error');
      log('LOG', `FB: ${fallback}`, 'error');
    } else {
      log('LOG', 'Favicon Resolved', 'success');
    }
  }
  if (fav) {
    app.get('/favicon.ico', (req, res) => {
      res.sendFile(fav);
    });
  }
}

function resolveHandler(routePath, type, route) {
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

  resolveHandler(routePath, type, route);
}

function expand(functionality) {
  if (options.showMiddleware) { log('Midd', `Expanded x ${functionality.length}`); }
  functionality.map((f) => {
    app.use('/', f);
  });
}

async function start(port, callback) {
  // App Starts
  if (options.clear) {
    console.clear();
  }
  console.log(`${mix(theme.info, 'Sylph')} Engine Starting`);
  app.disable('x-powered-by');
  setupApplication();
  readdirp(options.basePath, {
    fileFilter: '*.js',
    directoryFilter: ['!public', '!*utils'],
  })
    .on('data', (entry) => {
      setRoute(entry.path);
    })
    .on('end', async () => {
      try {
        app.listen(port, () => {
          console.log(`${mix(theme.info, `Sylph ${mix(theme.silly, version)}`)} listening on port ${mix(theme.info, port)}`);
          if (callback) callback();
        });
      } catch (error) {
        console.log(error);
      }
    });
}

function setOptions(opts) {
  options = { ...options, ...opts };
  const corsOptions = {
    preflightContinue: false,
    optionsSuccessStatus: 200,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (options.origins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
}

module.exports = {
  app,
  options: setOptions,
  log,
  expand,
  start,
};
