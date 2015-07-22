/**
 * @author <a href="mailto:stefanmayer13@gmail.com">Stefan Mayer</a>
 */
'use strict';

const sinon = require('sinon');

const networkOnStub = sinon.stub();
const requestWriteSpy = sinon.spy();
const requestStub = sinon.stub();
const requestOnStub = sinon.stub();

export default {
    requestStub,
    networkOnStub,
    requestWriteSpy,
    requestOnStub,
    init() {
        networkOnStub.onCall(0).callsArgWithAsync(1, '{}');
        networkOnStub.onCall(1).callsArgAsync(1);
        requestStub.returns({
            on: requestOnStub,
            write: requestWriteSpy,
            end: sinon.spy(),
        });
        requestStub.callsArgWith(1, {
            statusCode: 200,
            headers: {
                'set-cookie': [],
            },
            setEncoding: () => {},
            on: networkOnStub,
        });
    },
};
