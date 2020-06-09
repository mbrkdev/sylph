// Imports
const { mix } = require('nano-rgb');
const express = require('express');
const { scan } = require('sylph-router');

const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const history = require('connect-history-api-fallback');

const { version } = require('./package.json');
const { theme, log } = require('./utils');

// Application Variables
const app = express();
const dir = process.cwd();

const middlewares = {};
const state = {};
let options = {
  showMiddleware: false,
  basePath: 'server',
  historyMode: false,
  apiBase: '',
  clear: true,
  silent: false,
  origins: '*',
  verbose: false,
};

let handleError = (err, req, res) => {
  console.error(err);
  if (res && !res.headersSent) {
    res.status(500).send({ error: err.message });
  }
};

function setupApplication() {
  // Serve Public Folder
  const publicDir = path.join(dir, options.basePath, 'public');
  const publicExists = fs.existsSync(publicDir);
  if (options.verbose && !options.silent) {
    log(
      'LOG',
      `Public ${publicExists ? 'Exists' : "Doesn't Exist @"}`,
      publicExists ? 'success' : 'error',
    );
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

  if (options.verbose && !options.silent) {
    log(
      'LOG',
      `Public Favicon ${favExists ? 'Exists' : "Doesn't Exist"}`,
      favExists ? 'success' : 'error',
    );
    log(
      'LOG',
      `Fallback Favicon ${fallbackExists ? 'Exists' : "Doesn't Exist"}`,
      fallbackExists ? 'success' : 'error',
    );
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

function resolveHandler(type, route, handler, middleware) {
  // Resolve handler
  if (!options.silent) {
    if (handler) {
      log(type, route, 'success');
    } else {
      log(type, route, 'error');
    }
  }
  if (!handler) return;
  app[type](`${options.apiBase ? `/${options.apiBase}` : ''}/${route}`, async (req, res) => {
    try {
      if (middleware) {
        for (let i = 0; i < middleware.length; i += 1) {
          let fn;
          let done = false;
          if (typeof middleware[i] === 'function') {
            fn = middleware[i];
          } else fn = middlewares[middleware[i]];
          // Disabling no await in middleware
          // eslint-disable-next-line
          await fn(req, res, () => {
            done = true;
          });
          if (!done) return;
        }
      }
      await handler(req, res, state);
    } catch (error) {
      if (!options.silent) {
        log(type, `${route}| ERROR`, 'error');
      }
      handleError(error, req, res);
    }
  });
}


function setOptions(opts) {
  options = { ...options, ...opts };
  const corsOptions = {
    preflightContinue: false,
    optionsSuccessStatus: 200,
    origin:
      options.origins === '*'
        ? '*'
        : (origin, callback) => {
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

function setRoute(type, route, handler, middleware) {
  if (type === 'middleware') {
    middlewares[route] = middleware;
    if (!options.silent) {
      if (middleware) {
        log('Middleware', route, 'success');
      } else {
        log('Middleware', route, 'error');
      }
    }
    return;
  }
  resolveHandler(type, route, handler, middleware);
}

function expand(functionality) {
  functionality.map((f) => {
    app.use('/', f);
  });
}

async function setup() {
  // App Starts
  // TODO: dirty fix before restructuring on v3
  const optionsSet = false;
  if (!optionsSet) {
    setOptions({});
  }
  if (options.historyMode) {
    app.use(history());
  }
  if (options.clear) {
    console.clear();
  }
  if (!options.silent) {
    console.log(`${mix(theme.info, 'Sylph')} Engine Starting`);
  }
  app.disable('x-powered-by');
  app.use(bodyParser.json());
  setupApplication();
  const routes = await scan('server', ['handler', 'middleware']);
  const special = {};
  Object.keys(routes).forEach((route) => {
    if (route.includes(':')) {
      special[route] = routes[route];
      return;
    }
    const { handler, middleware, type } = routes[route];
    setRoute(type, route, handler, middleware);
  });
  Object.keys(special).forEach((route) => {
    if (!route.includes(':')) return;
    const { handler, middleware, type } = special[route];
    setRoute(type, route, handler, middleware);
  });
}

async function start(port, callback) {
  await setup()
  return app.listen(port || process.env.SYLPH_PORT, () => {
    if (!options.silent) {
      console.log(
        `${mix(
          theme.info,
          `Sylph ${mix(theme.silly, version)}`,
        )} listening on port ${mix(theme.info, port)}`,
      );
    }
    if (callback) callback();
  });
}

module.exports = {
  app,
  options: setOptions,
  log,
  expand,
  start,
  setup,
  setErrorHandler: (handler) => {
    handleError = handler;
  },
};
