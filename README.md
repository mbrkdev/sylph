# Sylph

## What is Sylph?

A route based web server framework, think Next/Nuxt but for server routes instead of application pages!

It's a [Sifrr Server](https://github.com/sifrr/sifrr/tree/master/packages/server/sifrr-server) wrapper that takes many of the setup steps out, builds best practices into the core when possible and was created to be both modular and easily extendable by default while providing a familiar developer experience.

## Getting Started

```bash
yarn add sylph-server
# npm i sylph-server
```

First make sure there is a ```server``` folder in the same directory as your entry point (typically ```main.js```). Inside that folder create ```get```.

Add an ```index.js``` route inside the ```get``` folder and copy the basic [GET Example](#get-example) below.

Back in ```main.js```, import/require Sylph and then call the ```sylph.start(/*port*/)``` method:

```js
const sylph = require('sylph-server');

sylph.start(8081);
```

Optionally after the specified port you can add a callback if you need to run something after the server is initialised. 

Run the code with:

```bash
node ./main.js
```

And you're done! This should scan your server directory, parse all of the routes and create their endpoints. If you access the Sylph server by going to localhost:8081 (or whatever port you chose) then you should see ```'OK'```

## Things you should know

- All routes are handled asynchronously
- Favicon.ico is served manually if not specified (to avoid double requests on dynamic routes)

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
    ├── index.html
    └── favicon.ico
```

In the example above, the ```server``` directory acts as the root node in the file system, endpoints are created as individual .js files under the ```post``` and ```get``` directories.

Subfolders also generate endpoints successfully. ```~/server/get/auth/logout.js``` is the registered GET handler for ```auth/logout``` for example.

The ```middleware``` folder is special, all of the files you add inside here are available as strings inside the middleware export array. See [Middleware](#middleware) for more details.

The ```utils``` folder is ignored by the route builder so you can add shared code here.

## About Transformations

The routes go through multiple transformation steps to get from the filesystem path into a route that express can consume. Each step is detailed below:
```js
path
  // Strip all but path
  .replace(/\w+[\\|/](.+).js/gi, '$1')
  // Change index.js to just .js
  .replace('index.js', '.js') 
  // Backslash to forward slash
  .replace('\\', '/') 
  // Remove ending slash (for xx/index)
  .replace(/\/$/gi, '') 
  // Spaces to dashes
  .replace(' ', '-') 
  // Underscore to colon (for dynamic routes)
  .replace('_', ':') 
```

Index is required for middleware, in the case of 'index' middleware it would otherwise be removed. Another replace is run after middleware is processed:

```js
path
  // Removes '/index' only if it's at the end of a route
  .replace(/\/index$/, '') 
```

## CORS

CORS is dealt with by default, this is because it's often the biggest headache when trying to get something going quickly offline, and important for security when you're ready for production. The Origins and Methods allowed can be changed inside the Sylph Options configuration, default settings are below:

```js
// Default
let options = {
  // ... other options
  origins: ['http://localhost:3000'],
  methods: '*',
}
```

It is relatively important to change your Origins before you deploy, localhost:3000 is the default for rapid prototyping but you may not want localhost to be able to access your server at all!

## Custom Headers

You can add custom headers in the same way as configuring CORS, simply use the ```headers``` property in the ```options``` function!

```js
sylph.options({
  headers: {
    'X-My-Custom-Header': 32
  }
})
```

## Middleware

Globally there is a handy Sylph method that allows the addition of any necessary middleware called ```expand```. This can easily be used to add global level middleware to the application.

```js
sylph.expand([
  (req, res, next) => {
    req.params && console.log(req.params)
    next();
  }
])
```

In addition to the global middleware, per-route middleware can be included by simply exporting an array of express compatible middleware along with the handler:
```js
module.exports.middleware = [/*My Middleware*/]

module.exports.handler = async (req, res, next) => {}
```

All middleware is a function with the signature, next() has no function in route defined middleware but for compatibility it's still best to follow this pattern:

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

There are 'keyed' middleware, these are globally defined under your ```middleware``` folder and launched simply by using their name in the export array:

```js
module.exports.middleware = [
  'route-log-start', 'isAuthenticated', 'route-log-end'
]
```

Here's an example of all three types of middleware working happily together:
```js
const {isAuthenticated} = require('../middleware')
module.exports.middleware = [
  // Keyed
  'route-log-start',
  // Import
  isAuthenticated,
  // Functional
  (req, res, next) => { 
    console.log(`Custom Log: User ${req.user.email} Authenticated!`)
    next();
  }
]
```

## Application Options

```js
let options = {
  // Verbosity flag for middleware on console output
  showMiddleware: false, 
  // Base path to crawl for server routes
  basePath: 'server',
  // Should the app clear the terminal when it starts?
  clear: true',
  // CORS Origins & Allowed Methods
  origins: ['http://localhost:3000'],
  methods: '*',
  // Global Headers
  headers: {}
}
```

To change options you simply pass an object of new option values that is merged with the defaults (above). For example:

```js
sylph.options({
  showMiddleware: true,
});
```

# Examples

## GET Example

```js
// ~/server/get/index.js
// GET /
module.exports.handler = async (req, res) => {
  res.end('OK')
}
```

## Authenticated Example

```js
// ~/server/get/is-authed.js
// GET /is-authed
const {isAuthenticated} = require('../middleware')

module.exports.middleware = [isAuthenticated]

module.exports.handler = async (req, res) => {
  res.end('OK')
}

```

## Dynamic Route Example

```js
// ~/server/get/_id.js
// GET /:id
module.exports.handler = async (req, res) => {
  res.send(req.params.id)
}

```