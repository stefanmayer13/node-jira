/**
 * @author <a href="mailto:stefanmayer13@gmail.com">Stefan Mayer</a>
 */
'use strict';

const sinon = require('sinon');

export default class httpsMock {
    constructor() {
        this.networkOnStubProp = sinon.stub();
        this.requestWriteSpyProp = sinon.spy();
        this.requestStubProp = sinon.stub();
        this.requestOnStubProp = sinon.stub();
        this.networkOnStub.onCall(0).callsArgWithAsync(1, '{}');
        this.networkOnStub.onCall(1).callsArgAsync(1);
        this.requestStub.returns({
            on: this.requestOnStub,
            write: this.requestWriteSpy,
            end: sinon.spy(),
        });
        this.requestStub.callsArgWith(1, {
            statusCode: 200,
            headers: {
                'set-cookie': [],
            },
            setEncoding: () => {},
            on: this.networkOnStub,
        });
    }

    get networkOnStub() {
        return this.networkOnStubProp;
    }

    get requestWriteSpy() {
        return this.requestWriteSpyProp;
    }

    get requestStub() {
        return this.requestStubProp;
    }

    get requestOnStub() {
        return this.requestOnStubProp;
    }
}
