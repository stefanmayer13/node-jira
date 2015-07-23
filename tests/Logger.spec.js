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
    let rewiredLogger,
        winstonMock = sinon.mock();

    before(() => {
        rewiredLogger = Logger.__set__({
            winston: {
                Logger: winstonMock
            },
        });
    });

    after(() => {
        rewiredLogger();
    });

    beforeEach(() => {
        winstonMock.reset();
    });

    it('returns winston logger', () => {
        const loggerObject = {
            logger: true
        };
        winstonMock.returns(loggerObject);

        const logger = Logger();

        expect(logger).to.be.equal(loggerObject);
    });
});
