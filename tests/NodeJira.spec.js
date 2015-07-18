/**
 * @author <a href="mailto:stefanmayer13@gmail.com">Stefan Mayer</a>
 */

const rewire = require('rewire');
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const HttpsMock = require('./mocks/https');

const NodeJira = rewire('../src/NodeJira.es6');

const expect = chai.expect;

NodeJira.__set__({
    Logger: () => {
        return {
            info: () => {}
        }
    }
});

describe('NodeJira', () => {
    let nodeJira;
    const hostname = 'host';
    const port = 1234;
    let rewiredHttps;

    before(() => {
        const options = {
            hostname,
            port,
            logger: {
                console: {}
            }
        };
        nodeJira = new NodeJira(options);
        rewiredHttps = NodeJira.__set__({
            https: {
                request: HttpsMock.requestStub
            },
        });
    });

    after(() => {
        rewiredHttps();
    });

    beforeEach(() => {
        HttpsMock.requestStub.reset();
        HttpsMock.requestWriteSpy.reset();
        HttpsMock.requestOnStub.reset();
    });

    describe('loginRx', () => {
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
                a:'Test123'
            };
            const base64 = 'eyJhIjoiVGVzdDEyMyJ9';
            HttpsMock.requestStub.callsArgWith(1, {
                statusCode: 200,
                headers: {
                    'set-cookie': cookie
                },
                setEncoding: () => {},
                on: HttpsMock.requestOnStub
            });

            return expect(nodeJira.login('a', 'ab')).to.eventually.be.deep.equal({
                setCookie: base64,
                data: {}
            });
        });
    });
});