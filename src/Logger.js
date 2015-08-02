/* eslint new-cap: [0] */
/**
 * @author <a href="mailto:stefanmayer13@gmail.com">Stefan Mayer</a>
 */

const winston = require('winston');

export default function Logger(config) {
    const transports = [];

    if (config) {
        if (config.console) {
            transports.push(
                new (winston.transports.Console)({
                    level: (config.console.level || 'error'),
                    colorize: !!config.console.colorize,
                })
            );
        }
        if (config.file) {
            transports.push(
                new (winston.transports.File)({
                    level: (config.file.level || 'error'),
                    filename: config.file.file || 'log/error.log',
                })
            );
        }
    }

    return (winston.Logger)({
        transports: transports,
    });
}
