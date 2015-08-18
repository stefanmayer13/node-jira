/**
 * @author <a href="mailto:stefanmayer13@gmail.com">Stefan Mayer</a>
 */
const https = require('https');
const Rx = require('rx');
const Boom = require('boom');

export function loginRx(username, password) {
    return Rx.Observable.create((observer) => {
        if (!username || !password) {
            observer.onError(Boom.badRequest('Missing username and/or password'));
            observer.onCompleted();
            return;
        }

        const postData = JSON.stringify({
            username,
            password,
        });

        const url = `/rest/auth/1/session`;

        const options = {
            hostname: this.hostname,
            port: this.port,
            path: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        this.logger.info('Handling login to Jira', username);

        const req = https.request(options, (res) => {
            if (res.statusCode === 401) {
                return observer.onError(Boom.unauthorized('Username or password wrong'));
            } else if (res.statusCode === 403) {
                return observer.onError(Boom.forbidden('CAPTCHA required'));
            } else if (res.statusCode !== 200) {
                return observer.onError(Boom.create(res.statusCode, res.statusMessag));
            }

            observer.onNext({
                'setCookie': res.headers['set-cookie'],
            });

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
        req.write(postData);

        req.end();
    }).reduce((prev, current) => {
        if (current.setCookie) {
            prev.setCookie = current.setCookie;
        } else {
            prev.data += current;
        }
        return prev;
    }, {data: ''}).map((data) => {
        return {
            cookie: new Buffer(JSON.stringify(data.setCookie)).toString('base64'),
            data: JSON.parse(data.data),
        };
    });
}

export function login(username, password) {
    return this.loginRx(username, password).toPromise();
}
