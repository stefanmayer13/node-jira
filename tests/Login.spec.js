/**
 * @author <a href="mailto:stefanmayer13@gmail.com">Stefan Mayer</a>
 */
'use strict';

const rewire = require('rewire');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const HttpsMock = require('./mocks/https');

chai.use(chaiAsPromised);
const expect = chai.expect;

const Login = rewire('../src/Login');
const NodeJira = rewire('../src/NodeJira');

NodeJira.__set__({
    Logger: () => {
        return {
            info: () => {},
            error: () => {},
        };
    },
});

describe('Login', () => {
    let nodeJira;
    const hostname = 'host';
    const port = 1234;
    let rewiredHttps;
    let rewiredNodeJira;
    let httpsMock;

    beforeEach(() => {
        httpsMock = new HttpsMock();
        const options = {
            hostname,
            port,
            logger: {
                console: {},
            },
        };
        rewiredHttps = Login.__set__({
            https: {
                request: httpsMock.requestStub,
            },
        });
        rewiredNodeJira = NodeJira.__set__({
            Login: Login,
        });
        nodeJira = new NodeJira(options);
    });

    afterEach(() => {
        rewiredHttps();
        rewiredNodeJira();
    });

    describe('login', () => {
        it('makes a post request with username and password', () => {
            const username = 'test';
            const password = '123';

            return nodeJira.login(username, password).then(() => {
                expect(httpsMock.requestStub.calledOnce).to.be.true;
                expect(httpsMock.requestStub.getCall(0).args[0].method).to.be.equal('POST');
                expect(httpsMock.requestWriteSpy.calledOnce).to.be.true;
                expect(JSON.parse(httpsMock.requestWriteSpy.getCall(0).args[0])).to.be.deep.equal({
                    username,
                    password,
                });
            });
        });

        it('uses the provided host and port', () => {
            return nodeJira.login('a', 'ab').then(() => {
                expect(httpsMock.requestStub.getCall(0).args[0].hostname).to.be.equal(hostname);
                expect(httpsMock.requestStub.getCall(0).args[0].port).to.be.equal(port);
            });
        });

        it('returns the cookie retrieved by set cookie base64 encoded', () => {
            const cookie = {
                a: 'Test123',
            };
            const base64 = 'eyJhIjoiVGVzdDEyMyJ9';
            httpsMock.requestStub.callsArgWith(1, {
                statusCode: 200,
                headers: {
                    'set-cookie': cookie,
                },
                setEncoding: () => {},
                on: httpsMock.networkOnStub,
            });

            return expect(nodeJira.login('a', 'ab')).to.eventually.be.deep.equal({
                cookie: base64,
                data: {},
            });
        });

        it('returns the userdata', () => {
            const data = {
                user: 123,
            };
            httpsMock.networkOnStub.onCall(0).callsArgWithAsync(1, JSON.stringify(data));

            return expect(nodeJira.login('a', 'ab')).to.eventually.be.deep.equal({
                cookie: 'W10=',
                data: data,
            });
        });

        it('returns an error if username or password is absent', () => {
            return expect(nodeJira.login('a')).to.eventually.be.rejected.then(() => {
                return expect(nodeJira.login('', 'b')).to.eventually.be.rejected;
            });
        });

        it('returns an error if statuscode != 200', () => {
            httpsMock.requestStub.onCall(0).callsArgWith(1, {
                statusCode: 401,
                setEncoding: () => {},
                on: httpsMock.networkOnStub,
            });
            httpsMock.requestStub.onCall(1).callsArgWith(1, {
                statusCode: 403,
                setEncoding: () => {},
                on: httpsMock.networkOnStub,
            });
            httpsMock.requestStub.onCall(2).callsArgWith(1, {
                statusCode: 500,
                setEncoding: () => {},
                on: httpsMock.networkOnStub,
            });

            return expect(nodeJira.login('a', 'b')).to.eventually.be.rejected
            .then(() => {
                return expect(nodeJira.login('a', 'b')).to.eventually.be.rejected;
            }).then(() => {
                return expect(nodeJira.login('a', 'b')).to.eventually.be.rejected;
            });
        });

        it('returns an error on network errors', () => {
            rewiredHttps();
            httpsMock.requestOnStub.onCall(0).callsArgWith(1, 'error');
            const requestStub = sinon.stub();
            requestStub.returns({
                on: httpsMock.requestOnStub,
                write: httpsMock.requestWriteSpy,
                end: sinon.spy(),
            });
            rewiredHttps = Login.__set__({
                https: {
                    request: requestStub,
                },
            });

            return expect(nodeJira.login('a', 'b')).to.eventually.be.rejectedWith('error');
        });
    });
});
