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

describe('NodeJira', () => {
    let nodeJira;
    const hostname = 'host';
    const port = 1234;
    let rewiredHttps;
    let rewiredNodeJira;

    before(() => {
        const options = {
            hostname,
            port,
            logger: {
                console: {},
            },
        };
        rewiredHttps = Login.__set__({
            https: {
                request: HttpsMock.requestStub,
            },
        });
        rewiredNodeJira = NodeJira.__set__({
            Login: Login,
        });
        nodeJira = new NodeJira(options);
    });

    after(() => {
        rewiredHttps();
        rewiredNodeJira();
    });

    beforeEach(() => {
        HttpsMock.init();
        HttpsMock.requestStub.reset();
        HttpsMock.requestWriteSpy.reset();
        HttpsMock.requestOnStub.reset();
        HttpsMock.networkOnStub.reset();
    });

    describe('login', () => {
        it('makes a post request with username and password', () => {
            const username = 'test';
            const password = '123';

            return nodeJira.login(username, password).then(() => {
                expect(HttpsMock.requestStub.calledOnce).to.be.true;
                expect(HttpsMock.requestStub.getCall(0).args[0].method).to.be.equal('POST');
                expect(HttpsMock.requestWriteSpy.calledOnce).to.be.true;
                expect(JSON.parse(HttpsMock.requestWriteSpy.getCall(0).args[0])).to.be.deep.equal({
                    username,
                    password,
                });
            });
        });

        it('uses the provided host and port', () => {
            return nodeJira.login('a', 'ab').then(() => {
                expect(HttpsMock.requestStub.getCall(0).args[0].hostname).to.be.equal(hostname);
                expect(HttpsMock.requestStub.getCall(0).args[0].port).to.be.equal(port);
            });
        });

        it('returns the cookie retrieved by set cookie base64 encoded', () => {
            const cookie = {
                a: 'Test123',
            };
            const base64 = 'eyJhIjoiVGVzdDEyMyJ9';
            HttpsMock.requestStub.callsArgWith(1, {
                statusCode: 200,
                headers: {
                    'set-cookie': cookie,
                },
                setEncoding: () => {},
                on: HttpsMock.networkOnStub,
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
            HttpsMock.networkOnStub.onCall(0).callsArgWithAsync(1, JSON.stringify(data));

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
            HttpsMock.requestStub.onCall(0).callsArgWith(1, {
                statusCode: 401,
                setEncoding: () => {},
                on: HttpsMock.networkOnStub,
            });
            HttpsMock.requestStub.onCall(1).callsArgWith(1, {
                statusCode: 403,
                setEncoding: () => {},
                on: HttpsMock.networkOnStub,
            });
            HttpsMock.requestStub.onCall(2).callsArgWith(1, {
                statusCode: 500,
                setEncoding: () => {},
                on: HttpsMock.networkOnStub,
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
            HttpsMock.requestOnStub.onCall(0).callsArgWith(1, 'error');
            HttpsMock.requestStub = sinon.stub();
            HttpsMock.requestStub.returns({
                on: HttpsMock.requestOnStub,
                write: HttpsMock.requestWriteSpy,
                end: sinon.spy(),
            });
            rewiredHttps = Login.__set__({
                https: {
                    request: HttpsMock.requestStub,
                },
            });

            return expect(nodeJira.login('a', 'b')).to.eventually.be.rejectedWith('error');
        });
    });
});
