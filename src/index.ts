import Logger from './utilities/Logger';

import EnvVarsUtilities from './utilities/EnvVarsUtilities';
import AutoTranslateWorker from './workers/AutoTranslateWorker';
import I18nWorker from './workers/I18nWorker';
import runner, { RunnerOption } from 'node-pg-migrate';
require('dotenv').config();

Logger.log('info', 'Run Migrations Started');
const migrations = async () =>
    runner({
        databaseUrl: {
            user: EnvVarsUtilities.getEnvVar('MIGRATIONS_DB_USER'),
            host: EnvVarsUtilities.getEnvVar('DB_HOST'),
            database: EnvVarsUtilities.getEnvVar('DB_DATABASE'),
            password: EnvVarsUtilities.getSecureEnvVar('MIGRATIONS_DB_PASSWORD'),
            port: parseInt(EnvVarsUtilities.getEnvVar('DB_PORT')),
        },
        migrationsTable: 'pg_migrations',
        migrationsSchema: 'polyglot_metrics',
        createMigrationsSchema: true,
        dir: './migrations',
        direction: 'up',
    } as RunnerOption);

Logger.log('info', 'Starting server');

const run = async () => {
    await migrations();
    Logger.log('info', 'Migrations  runned');

    const t1 = new Date();
    if (EnvVarsUtilities.getEnvVar('AUTO_TRANSLATE') === 'true')
        await new AutoTranslateWorker().start();
    await new I18nWorker().start();
    const t2 = new Date();
    const seconds = (t2.getTime() - t1.getTime()) / 1000;
    console.log('Time ' + seconds);
};

EnvVarsUtilities.printEnv([
    'LOG_LEVEL',
    'MODE',
    'DB_TYPE',
    'DB_USER',
    'DB_HOST',
    'DB_DATABASE',
    'DB_PASSWORD',
    'DB_PORT',
    'AUTO_TRANSLATE',
]);
run()
    .then(() => {
        Logger.log('info', 'Server runned');
    })
    .catch((reason) => {
        Logger.log('error', 'Server failed to run');
    });
