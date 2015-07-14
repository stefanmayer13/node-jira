/**
 * @author <a href="mailto:stefanmayer13@gmail.com">Stefan Mayer</a>
 */

const rewire = require('rewire');
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");

const NodeJira = rewire('../src/NodeJira.es6');

chai.use(chaiAsPromised);
const expect = chai.expect;
const requestSpy = sinon.stub();
const reqOnStub = sinon.stub();
reqOnStub.onCall(0).callsArgWithAsync(1, '{}');
reqOnStub.onCall(1).callsArgAsync(1);

requestSpy.returns({
    on: sinon.spy(),
    write: sinon.spy(),
    end: sinon.spy()
});
requestSpy.callsArgWith(1, {
    statusCode: 200,
    headers: {
        'set-cookie': []
    },
    setEncoding: () => {},
    on: reqOnStub
});

NodeJira.__set__({
    https: {
        request: requestSpy
    },
    Logger: () => {
        return {
            info: () => {}
        }
    }
});

describe('NodeJira', () => {
    let nodeJira;

    before(() => {
        const options = {
            host: 'host',
            port: 1234,
            logger: {
                console: {}
            }
        };
        nodeJira = new NodeJira(options);
    });

    describe('loginRx', () => {
        it('makes a post request with username and password', () => {
            const username = 'test';
            const password = '123';

            return nodeJira.login(username, password).then(() => {
                expect(requestSpy.calledOnce).to.be.true;
            });
        });
    });
});