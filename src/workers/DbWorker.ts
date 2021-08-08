import Database from '../database/Database';
import EnvVarsUtilities from '../utilities/EnvVarsUtilities';
import Logger from '../utilities/Logger';

export default abstract class DbWorker {
    protected databaseProxy = new Database({
        user: EnvVarsUtilities.getEnvVar('DB_USER'),
        host: EnvVarsUtilities.getEnvVar('DB_HOST'),
        database: EnvVarsUtilities.getEnvVar('DB_DATABASE'),
        password: EnvVarsUtilities.getSecureEnvVar('DB_PASSWORD'),
        port: parseInt(EnvVarsUtilities.getEnvVar('DB_PORT')),
    });

    public async start() {
        const t1 = new Date();
        try {
            Logger.log('info', 'Start running');
            await this.databaseProxy.connect();
            await this.run();
        } catch (error) {
            Logger.log('error', 'error running job' + error);
            await this.databaseProxy.rollback();
        } finally {
            Logger.log('info', 'Done');
            await this.databaseProxy.close();
            const t2 = new Date();
            const seconds = (t2.getTime() - t1.getTime()) / 1000;
            Logger.log('info', 'Time ' + seconds);
        }
    }
    public abstract run(): Promise<void>;
}
