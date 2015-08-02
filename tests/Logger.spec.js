/**
 * @author <a href="mailto:stefanmayer13@gmail.com">Stefan Mayer</a>
 */
'use strict';

const rewire = require('rewire');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

chai.use(chaiAsPromised);
const expect = chai.expect;

const Logger = rewire('../src/Logger');

describe('Logger', () => {
    let rewiredLogger;
    const winstonMock = sinon.mock();
    const consoleMock = sinon.mock();
    const fileMock = sinon.mock();

    before(() => {
        rewiredLogger = Logger.__set__({
            winston: {
                Logger: winstonMock,
                transports: {
                    Console: consoleMock,
                    File: fileMock,
                },
            },
        });
    });

    after(() => {
        rewiredLogger();
    });

    beforeEach(() => {
        winstonMock.reset();
        consoleMock.reset();
        fileMock.reset();
    });

    it('returns winston logger', () => {
        const loggerObject = {
            logger: true,
        };
        winstonMock.returns(loggerObject);

        const logger = new Logger();

        expect(logger).to.be.equal(loggerObject);
    });

    it('adds winston console transport', () => {
        const loggerObject = {
            logger: true,
        };
        winstonMock.returns(loggerObject);

        const logger = new Logger({
            console: true,
        });

        expect(logger).to.be.equal(loggerObject);
        expect(winstonMock.getCall(0).args[0].transports.length).to.equal(1);
        expect(consoleMock.calledOnce).to.be.true;
        expect(fileMock.callCount).to.be.equal(0);
    });

    it('adds winston file transport', () => {
        const loggerObject = {
            logger: true,
        };
        winstonMock.returns(loggerObject);

        const logger = new Logger({
            file: true,
        });

        expect(logger).to.be.equal(loggerObject);
        expect(winstonMock.getCall(0).args[0].transports.length).to.equal(1);
        expect(fileMock.calledOnce).to.be.true;
        expect(consoleMock.callCount).to.be.equal(0);
    });

    it('adds multiple transports', () => {
        const loggerObject = {
            logger: true,
        };
        winstonMock.returns(loggerObject);

        const logger = new Logger({
            console: true,
            file: true,
        });

        expect(logger).to.be.equal(loggerObject);
        expect(winstonMock.getCall(0).args[0].transports.length).to.equal(2);
        expect(consoleMock.calledOnce).to.be.true;
        expect(fileMock.calledOnce).to.be.true;
    });
});
