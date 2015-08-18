/**
 * @author <a href="mailto:stefanmayer13@gmail.com">Stefan Mayer</a>
 */
const https = require('https');
const Rx = require('rx');
const Boom = require('boom');

export function getUserDataRx(cookieBase64) {
    return Rx.Observable.create((observer) => {
        if (!cookieBase64) {
            return observer.onError(Boom.unauthorized('Not logged in'));
        }
        const url = `/rest/auth/1/session`;
        const cookie = JSON.parse(new Buffer(cookieBase64, 'base64').toString('ascii'));

        const options = {
            hostname: this.hostname,
            port: this.port,
            path: url,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie.join(', '),
            },
        };
        const req = https.request(options, (res) => {
            if (res.statusCode === 401) {
                return observer.onError(Boom.unauthorized('Not logged in'));
            } else if (res.statusCode !== 200) {
                return observer.onError(Boom.create(res.statusCode, res.statusMessage));
            }

            res.setEncoding('utf8');
            res.on('data', (data) => {
                observer.onNext(data);
            });
            res.on('end', () => {
                observer.onCompleted();
            });
        });

        req.on('error', (e) => {
            this.logger.error('problem with request: ' + e.message);
            observer.onError(Boom.badGateway(e));
            observer.onCompleted();
        });

        req.end();
    }).reduce((prev, current) => {
        return prev + current;
    }).map((data) => {
        return JSON.parse(data);
    });
}

export function getUserData(cookieBase64) {
    return this.getUserDataRx(cookieBase64).toPromise();
}
