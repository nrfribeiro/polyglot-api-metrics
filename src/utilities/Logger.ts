import * as winston from 'winston';
import EnvVarsUtilities from './EnvVarsUtilities';

export default class Logger {
    private static transports = {
        console: new winston.transports.Console({
            level: EnvVarsUtilities.getEnvVar('LOG_LEVEL'),
        }),
    };
    private static logger = winston.createLogger({
        transports: [Logger.transports.console],
        format: winston.format.combine(winston.format.splat(), winston.format.simple()),
    });
    public static getLogLevel = (): string | undefined => {
        return Logger.transports.console.level;
    };
    public static log(level: string, msg: string) {
        Logger.logger.log(level, msg);
    }
}
