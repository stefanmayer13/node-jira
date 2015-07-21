/**
 * @author <a href="mailto:stefanmayer13@gmail.com">Stefan Mayer</a>
 */
'use strict';

const sinon = require('sinon');

const requestOnStub = sinon.stub();
const requestWriteSpy = sinon.spy();
const requestStub = sinon.stub();

export default {
    requestStub,
    requestOnStub,
    requestWriteSpy,
    init() {
        requestOnStub.onCall(0).callsArgWithAsync(1, '{}');
        requestOnStub.onCall(1).callsArgAsync(1);
        requestStub.returns({
            on: sinon.spy(),
            write: requestWriteSpy,
            end: sinon.spy(),
        });
        requestStub.callsArgWith(1, {
            statusCode: 200,
            headers: {
                'set-cookie': [],
            },
            setEncoding: () => {},
            on: requestOnStub,
        });
    },
};
