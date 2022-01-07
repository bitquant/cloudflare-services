# cloudflare-services
Routing for Cloudflare Workers module based services to handle multiple routes.

## Install
```
$ npm install cloudflare-services
```

## Usage
```javascript
import { ServiceRouter } from 'cloudflare-services';

const router = new ServiceRouter();

router.get('/', (request) => new Response('Welcome\n'))
router.get('/hello', (request) => new Response('Hi there\n'))
router.get('/goodbye', (request) => new Response('See you later\n'))

export default {
  async fetch(request, environment, context) {
    return router.handleRequest(request, environment, context)
  }
}

```

## Supported Operations
`router.use(handler)`  Add a handler that executes on every path

`router.use(path, handler)`  Add a handler that executes on a specific path

`router.get(path, handler)`  Executes a handler on GETs for a specific path

`router.put(path, handler)`  Executes a handler on PUTs for a specific path

`router.post(path, handler)`  Executes a handler on POSTs for a specific path

`router.delete(path, handler)`  Executes a handler on DELETEs for a specific path

`router.head(path, handler)`  Executes a handler on HEAD for a specific path

## Wildcard Paths
Use wildcard `*` to handle multiple routes with one handler.  For example
```javascript
router.get('/public/css/*', (request) => fetch(request))
```

## Handler Order
Handlers are executed in the order in which they are registered.  If a handler returns `undefined` the next matching handler will be invoked.  Execution of handlers stops
once a handler returns a `Response` object.

## Request Context
 A request context is created for each request. It can be used to store
 any data needed during handing of an inbound request. The following handler
 saves some information which can be retrieved later
 by another handler.
 ```javascript
router.use((request, environment, context, requestContext) => {
    requestContext.responseHeaders = {
        'Cache-Control': 'private, max-age=0'
    }
})

router.get('/some/path', (request, environment, context, requestContext) => {
    return new Response(`response with headers set in requestContext data\n`, {
        headers: requestContext.responseHeaders
    });
})
```

## Path Parameters
Path parameters are supported and can be accessed in the requestContext `pathParams` value.

```javascript
router.get('/user/:name/:account', (request, environment, context, requestContext) => {
    let username = requestContext.pathParams.name;
    let accountId = requestContext.pathParams.account;
    return new Response(`Hello ${username}. Your account number is ${accountId}\n`)
})
```

## Context waitUntil
If background processing needs to be performed use `context.waitUntil` to
wait for a background task to complete.

## Special Handlers
Special handlers can be setup for additional control of the request/response
flow.  If the special handler returns a `Response` object normal route processing
will stop and the response will be sent out.

The `ingressHandler` executes prior to any route handlers.
```javascript
router.ingressHandler = (request, environment, context, requestContext) => { requestContext.startTime = new Date(); }
```

The `egressHandler` executes right before sending a response from a route handler.
```javascript
router.egressHandler = (request, environment, context, requestContext, response) => {
    let endTime = new Date();
    let duration = endTime.valueOf() - requestContext.startTime.valueOf();
    // do something with duration data
    return response;
}
```

The `notFoundHandler` executes if the incoming request does not match any routes.
```javascript
router.notFoundHandler = (request, environment, context, requestContext) => {
    return new Response('page not found!', { status: 404 });
}
```

The `errorHandler` executes if any error is thrown during processing of the request.
```javascript
router.errorHandler = (request, environment, context, requestContext, err) => {
    return new Response(`internal error: ${err}`, { status: 500 })
}
```

## License
MIT license; see [LICENSE](./LICENSE).
