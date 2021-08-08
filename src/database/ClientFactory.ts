import EnvVarsUtilities from '../utilities/EnvVarsUtilities';
import IClientDB from './IClientDB';
import ClientPostgres from './ClientPostgres';

const getDbClient = (config: any): IClientDB => {
    const dbType = EnvVarsUtilities.getEnvVar('DB_TYPE');
    switch (dbType) {
        case 'POSTGRES':
            return new ClientPostgres(config);
        default:
            throw new Error('Wrong Database Type');
    }
};
export default getDbClient;
