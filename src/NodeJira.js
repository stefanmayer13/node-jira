/**
 * @author <a href="mailto:stefanmayer13@gmail.com">Stefan Mayer</a>
 */

const Logger = require('./Logger');
const Login = require('./Login');

export default class NodeJira {
    constructor(options) {
        this.hostname = options.hostname;
        this.port = options.port;
        this.logger = new Logger(options.logger);
    }

    login = Login.login;
    loginRx = Login.loginRx;
}
