'use strict';

class BaseHandler {
    
    get pattern() {
        throw new Error('A request handler requires a pattern');
    }

    doGet(req, res, next) {
        this.doUnrecognized(req, res, next);
    }

    doPost(req, res, next) {
        this.doUnrecognized(req, res, next);
    }

    doPut(req, res, next) {
        this.doUnrecognized(req, res, next);
    }

    doDelete(req, res, next) {
        this.doUnrecognized(req, res, next);
    }
    
    doUnrecognized(req, res, next) {
        const err = new Error('Unrecognized method');
        err.status = 405;
        return next(err);
    }

    getRequestLogger(logger, req) {
        return logger.child({
            sessionID: req.sessionID,
            url: req.url,
            method: req.method,
            role: req.user ? req.user.role : 'guest'
        });
    }
}

module.exports = BaseHandler;