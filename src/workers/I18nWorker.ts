import Logger from '../utilities/Logger';

import Language from '../models/Language';
import TalkdeskUtilties from '../utilities/TalkdeskUtilities';
import UrlUtilities from '../utilities/UrlUtilities';
import { flatten } from 'flat';
import Namespace from '../models/Namespace';
import EnvKeyValue from '../models/EnvKeyValue';
import DbWorker from './DbWorker';
import EnvVarsUtilities from '../utilities/EnvVarsUtilities';
export default class I18NWorker extends DbWorker {
    public async run(): Promise<void> {
        await this.cloneDatabase();
        await this.dumpI18NFiles();
    }

    private async cloneDatabase() {
        await this.databaseProxy.startClone();

        await this.databaseProxy.cleanTable('translation_values_environments');
        await this.databaseProxy.cleanTable('translation_values');
        await this.databaseProxy.cleanTable('translation_keys');
        await this.databaseProxy.cleanTable('namespaces');
        await this.databaseProxy.cleanTable('projects');
        await this.databaseProxy.cleanTable('languages');

        const source = this.databaseProxy.buildDbLink(
            EnvVarsUtilities.getEnvVar('POLYGLOT_DB_HOST'),
            parseInt(EnvVarsUtilities.getEnvVar('POLYGLOT_DB_PORT')),
            EnvVarsUtilities.getEnvVar('POLYGLOT_DB_DATABASE'),
            EnvVarsUtilities.getEnvVar('POLYGLOT_DB_USER'),
            EnvVarsUtilities.getSecureEnvVar('POLYGLOT_DB_PASSWORD')
        );
        console.log('Source ' + source);

        await this.databaseProxy.cloneLanguages(source);
        await this.databaseProxy.cloneProjects(source);
        await this.databaseProxy.cloneNamespaces(source);
        await this.databaseProxy.cloneTranslationKeys(source);
        await this.databaseProxy.cloneTranslationValues(source);
        await this.databaseProxy.deleteDeprecatedAutoTranslate();
        await this.databaseProxy.finish();
    }

    private index = 0;
    //TODO decrease round trip to server, doing builk inserts
    private async saveI18n(namespace: Namespace, language: Language, env: string) {
        const url = TalkdeskUtilties.buildI18NEnvUrl(
            namespace.project.slug,
            env,
            language.language,
            namespace.name
        );
        Logger.log('debug', 'Fetch ' + url);
        const data = await UrlUtilities.fetch(url);
        if (data !== undefined && data !== {}) {
            const flat: [][] = await flatten(data);
            for (const key in flat) {
                const envKeyValue = new EnvKeyValue(
                    namespace,
                    key,
                    language,
                    (flat[key] as unknown) as string,
                    env
                );
                this.index++;
                if (this.index % 100 === 0) Logger.log('warn', 'Running ' + this.index);
                const res = await this.databaseProxy.saveKeyValOnEnv(envKeyValue);
                if (!res.sucess)
                    Logger.log('info', res.message + ' ' + JSON.stringify(envKeyValue));
            }
        } else {
            Logger.log('warn', 'Fetch or save failed ' + url);
        }
    }
    private async dumpI18NFiles() {
        const namespaces = await this.databaseProxy.getAllNamespaces();
        const languages = await this.databaseProxy.getAllLanguages();

        await this.databaseProxy.startDump();

        for (const env of TalkdeskUtilties.ENVS) {
            for (const language of languages) {
                await Promise.all(
                    namespaces.map(async (namespace) => {
                        await this.saveI18n(namespace, language, env);
                    })
                );
            }
        }
        await this.databaseProxy.finish();
    }
}
