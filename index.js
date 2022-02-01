import Trouter from 'trouter';

class ServiceRouter extends Trouter {

    constructor() {
        super();
    }

    use(path, ...handlers) {
        if (typeof path === 'function') {
            handlers.unshift(path);
            super.use('/', ...handlers);
        }
        else {
            super.use(path, ...handlers);
        }
    }
}

ServiceRouter.prototype.handleRequest = async function(request, environment, context, requestContext = { }) {

    try {

        if (this.ingressHandler !== undefined) {
            let igResult = await this.ingressHandler(request, environment, context, requestContext);
            if (igResult instanceof Response) {
                return igResult;
            }
        }

        const url = new URL(request.url);
        const result = this.find(request.method, url.pathname);
        requestContext.pathParams = result.params;

        for (let handler of result.handlers) {
            const response = await handler(request, environment, context, requestContext);
            if (response instanceof Response) {
                if (this.egressHandler !== undefined) {
                    let egResult = await this.egressHandler(request, environment, context, requestContext, response);
                    if (egResult instanceof Response) {
                        return egResult;
                    }
                }
                return response;
            }
        }

        if (this.notFoundHandler !== undefined) {
            let nfResult = this.notFoundHandler(request, environment, context, requestContext);
            if (nfResult instanceof Response) {
                return nfResult;
            }
        }

        return new Response('404 - Resource not found', {
            status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8'}
        });
    }
    catch (err) {
        if (this.errorHandler !== undefined) {
            let result = this.errorHandler(request, environment, context, requestContext, err);
            if (result instanceof Response) {
                return result;
            }
        }
        return new Response(`500 - ${err}`, {
            status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8'}
        });
    }
};

export { ServiceRouter };
