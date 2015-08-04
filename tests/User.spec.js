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

const User = rewire('../src/User');
const NodeJira = rewire('../src/NodeJira');

NodeJira.__set__({
    Logger: () => {
        return {
            info: () => {},
            error: () => {},
        };
    },
});

describe('User', () => {
    let nodeJira;
    let httpsMock;
    const hostname = 'host';
    const port = 1234;
    const cookie = 'WyJ0ZXN0Y29va2llIiwiYWJjIl0=';
    const parsedCookie = ['testcookie', 'abc'].join(', ');
    let rewiredHttps;
    let rewiredNodeJira;

    beforeEach(() => {
        httpsMock = new HttpsMock();
        const options = {
            hostname,
            port,
            logger: {
                console: {},
            },
        };
        rewiredHttps = User.__set__({
            https: {
                request: httpsMock.requestStub,
            },
        });
        rewiredNodeJira = NodeJira.__set__({
            User: User,
        });
        nodeJira = new NodeJira(options);
    });

    afterEach(() => {
        rewiredHttps();
        rewiredNodeJira();
    });

    describe('getUserData', () => {
        it('makes a get request', () => {
            return nodeJira.getUserData(cookie).then(() => {
                expect(httpsMock.requestStub.calledOnce).to.be.true;
                expect(httpsMock.requestStub.getCall(0).args[0].method).to.be.equal('GET');
            });
        });

        it('uses the provided host and port', () => {
            return nodeJira.getUserData(cookie).then(() => {
                expect(httpsMock.requestStub.getCall(0).args[0].hostname).to.be.equal(hostname);
                expect(httpsMock.requestStub.getCall(0).args[0].port).to.be.equal(port);
            });
        });

        it('uses the provided cookie', () => {
            return nodeJira.getUserData(cookie).then(() => {
                expect(httpsMock.requestStub.getCall(0).args[0].headers.Cookie).to.be.equal(parsedCookie);
            });
        });

        it('returns an error if cookie not provided', () => {
            return expect(nodeJira.getUserData()).to.eventually.be.rejected;
        });

        it('returns the userdata', () => {
            const data = {
                user: 123,
            };
            httpsMock.networkOnStub.onCall(0).callsArgWithAsync(1, JSON.stringify(data));

            return expect(nodeJira.getUserData(cookie)).to.eventually.be.deep.equal(data);
        });

        it('returns an error if statuscode != 200', () => {
            httpsMock.requestStub.onCall(0).callsArgWith(1, {
                statusCode: 401,
                setEncoding: () => {},
                on: httpsMock.networkOnStub,
            });
            httpsMock.requestStub.onCall(1).callsArgWith(1, {
                statusCode: 500,
                setEncoding: () => {},
                on: httpsMock.networkOnStub,
            });

            return expect(nodeJira.getUserData(cookie)).to.eventually.be.rejected
                .then(() => {
                    return expect(nodeJira.getUserData(cookie)).to.eventually.be.rejected;
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
            rewiredHttps = User.__set__({
                https: {
                    request: requestStub,
                },
            });

            return expect(nodeJira.getUserData(cookie)).to.eventually.be.rejectedWith('error');
        });
    });
});
