'use strict';
/**
 * @author <a href="mailto:stefanmayer13@gmail.com">Stefan Mayer</a>
 */
const sinon = require('sinon');

const requestOnStub = sinon.stub();
requestOnStub.onCall(0).callsArgWithAsync(1, '{}');
requestOnStub.onCall(1).callsArgAsync(1);

const requestWriteSpy = sinon.spy();

const requestStub = sinon.stub();
requestStub.returns({
    on: sinon.spy(),
    write: requestWriteSpy,
    end: sinon.spy()
});
requestStub.callsArgWith(1, {
    statusCode: 200,
    headers: {
        'set-cookie': []
    },
    setEncoding: () => {},
    on: requestOnStub
});

export default {
    requestStub,
    requestOnStub,
    requestWriteSpy
}