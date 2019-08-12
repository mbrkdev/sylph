# Sylph

## What is Sylph?

It's an Express wrapper that takes many of the setup steps out, builds best practices into the core when possible and is built to be both modular and easily extendable by default.

## Getting Started

It's incredibly hard to create a new Sylph app. First make sure there is a ```server``` folder in the same directory as your ```main.js``` entry point. Inside that folder create ```get```, ```post``` and ```public```.

Add an ```index.js``` route inside the ```get``` folder and copy the basic [GET Example](#get-example) below.

Back in ```main.js```, import/require Sylph and then call the ```sylph.start(/*port*/)``` method:

```js
const sylph = require('sylph');

sylph.start(8081);
```

And you're done! Optionally after the specified port you can add a callback. 

Run the code with:

```bash
node ./main.js
```

This should scan your server directory, parse all of the routes and create their endpoints. If you access the Sylph-Express server by going to localhost:8081 (or whatever port you chose) then you should see ```'OK'```

## Things you should know

- ~/server/public is served by default
- All routes are handled asynchronously

## File Structure

```
server/
├── get/
│   ├── index.js
│   ├── _id.js
│   └── auth/
│       ├── logout.js
│       └── is-authed.js
├── post/
│   └── login.js
├── utils/
│   └── display.js
├── middleware/
│   └── index.js
└── public/
    └── login.html
```

In the example above, the ```server``` directory acts as the root node in the file system, endpoints are created as individual .js files under the ```post``` and ```get``` directories.

Subfolders also generate endpoints successfully. ```~/server/get/auth/logout.js``` is the registered GET handler for ```auth/logout``` for example.

The ```utils```, ```middleware``` and ```public``` folders are ignored by the route builder that only looks for ```get || post```. Additionally only the ```public``` folder is required (even if it's empty), the others are just here for organisation of code.

## About Transformations

The routes go through multiple transformation steps to get from the filesystem path into a route that express can consume. Each step is detailed below:
```js
path
  // Strip all but path after get/post
  .replace(/server\\(?:get|post)\\(.+).js/, '$1') 
  // Change index to nothing (so route becomes /)
  .replace('index', '') 
  // Backslash to forward slash
  .replace('\\', '/') 
  // Remove ending slash (for xx/index)
  .replace(/\/$/, '') 
  // Spaces to dashes
  .replace(' ', '-') 
  // Underscore to colon (for dynamic routes)
  .replace('_', ':') 
```

## About Middleware

Globally there is a handy Sylph method that allows the addition of any necessary middleware called ```expand```. Here is an example of using ```expand``` to handle CORS:

```js
const cors = require('cors')

sylph.app.options('*', cors())

sylph.expand([
  cors({
    origin: ['http://localhost:3000'],
    credentials: true
  })
])
```

In addition to the global middleware, per-route middleware can be included by simply exporting an array of express compatible middleware along with the handler:
```js
module.exports.middleware = [/*My Middleware*/]

module.exports.handler = async (req, res, next) => {}
```

All middleware is a function with the signature:

```js
(req, res, next) => {
  //action
  next();
}
```

It is also simple enough to define single-use actions in the middleware export, for example if I want to run logging middleware before and after the authentication action, it could look like this:

```js
const {isAuthenticated} = require('../middleware')

module.exports.middleware = [
  (req,res,next) => {
    console.log('Custom Log: Trying authentication...')
    next();
  },
  isAuthenticated, 
  (req,res,next) => {
    console.log(`Custom Log: User ${req.user.email} Authenticated!`)
    next();
  }
]
```

## GET Example

```js
// ~/server/get/index.js
// GET /
module.exports.handler = async (req, res, next) => {
  res.status(200).send('OK')
}
```

## Authenticated Example

```js
// ~/server/get/is-authed.js
// GET /is-authed
const {isAuthenticated} = require('../middleware')

module.exports.middleware = [isAuthenticated]

module.exports.handler = async (req, res, next) => {
  res.status(200).send('OK')
}

```

## Dynamic Route Example

```js
// ~/server/get/_id.js
// GET /:id
module.exports.handler = async (req, res, next) => {
  res.status(200).send(req.params.id)
}

```