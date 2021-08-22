import EnvKeyValue from '../models/EnvKeyValue';
import Logger from '../utilities/Logger';
import IClientDB from './IClientDB';
import getDbClient from './ClientFactory';
import Result from '../models/Result';
import Namespace from '../models/Namespace';
import Project from '../models/Project';
import Language from '../models/Language';
import Key from '../models/Key';
export default class Database {
    private client: IClientDB;
    private config: {};
    public constructor(config: any) {
        this.config = config;
    }
    public async connect() {
        try {
            this.client = getDbClient(this.config);
            Logger.log('debug', 'Connecting');
            await this.client.connect();
            Logger.log('debug', 'Connected');
        } catch (error) {
            Logger.log('error', 'Error connect ' + error);
            throw error;
        }
    }
    public async startDump() {
        try {
            await this.client.beginTrans();
            Logger.log('debug', 'Transaction Started');
            await this.client.executeDML('SET search_path TO polyglot_extension,public');
            await this.client.executeDML('delete from translation_values_environments');
        } catch (error) {
            Logger.log('error', 'Error Loading ' + error);
            throw error;
        }
    }
    public startAutoTranslateKeys = async (): Promise<void> => {
        Logger.log('silly', 'deleteStaleAutoTranslateKeys');
        try {
            //await this.client.beginTrans();
            Logger.log('debug', 'Transaction Started');

            const result = await this.client.executeDML(
                `delete
                from translation_values_auto_translate a
                where (translation_key_id,reference_value) not in  (select b.id,b.reference_value from translation_keys b)`
            );
        } catch (error) {
            Logger.log('error', 'deleteStaleAutoTranslateKeys ' + error);
            throw error;
        }
    };
    public saveAutoTranslateKey = async (key: Key, translated: string): Promise<Result> => {
        Logger.log('silly', ' saveAutoTranslateKey');

        try {
            await this.client.executeDML(
                'INSERT INTO translation_values_auto_translate(' +
                    'translation_key_id, language_id, value, reference_value)' +
                    ' VALUES (' +
                    this.client.genBindVariables(4) +
                    ') ' +
                    'ON CONFLICT ON CONSTRAINT un_translation_values_auto_trans ' +
                    'DO update set value=$5,reference_value=$6', //where translation_key_id=$7 and language_id=$8'
                [
                    key.id,
                    key.language.id,
                    translated,
                    key.referenceValue,
                    translated,
                    key.referenceValue /*,key.id, key.language.id*/,
                ]
            );
            return new Result(true);
        } catch (error) {
            Logger.log('error', 'saveAutoTranslateKey ' + error);
            throw error;
        }
    };
    public getPendingAutoTranslateKeys = async (
        itensPerPage: number,
        page: number
    ): Promise<Key[]> => {
        Logger.log('silly', 'getKeys');
        try {
            const result = await this.client.executeDML(
                `select a.id, a.reference_value,b.id language_id,b.language_tag
                from translation_keys a,languages b
                where a.reference_value!='' and (a.id,reference_value,b.id) not in (select c.translation_key_id,c.reference_value,c.language_id from translation_values_auto_translate c)
                order by a.id
                LIMIT $1 OFFSET $2`,
                [itensPerPage, (page - 1) * itensPerPage]
            );
            return result.rows.map((res: any) => {
                return new Key(
                    res.id,
                    res.reference_value,
                    new Language(res.language_id, res.language_tag)
                );
            });
        } catch (error) {
            Logger.log('error', 'getKeys ' + error);
            throw error;
        }
    };

    public getAllNamespaces = async (): Promise<Namespace[]> => {
        Logger.log('silly', 'getAllNamespaces');
        try {
            const result = await this.client.executeDML(
                `select a.id project_id,a.slug project_slug, b.id,b.name,b.reference_url
                from projects a,namespaces b
                where  
                  a.id=b.project_id and 
                   deleted!=true`
            );
            return result.rows.map((res: any) => {
                return new Namespace(
                    new Project(res.project_id, res.project_slug),
                    res.id,
                    res.name,
                    res.reference_url
                );
            });
        } catch (error) {
            Logger.log('error', 'getAllNamespaces ' + error);
            throw error;
        }
    };
    public getAllLanguages = async (): Promise<Language[]> => {
        Logger.log('silly', 'getAllLanguages');
        try {
            const result = await this.client.executeDML(
                `select id, language_tag
                from languages`
            );
            return result.rows.map((res: any) => {
                return new Language(res.id, res.language_tag);
            });
        } catch (error) {
            Logger.log('error', 'getAllLanguages ' + error);
            throw error;
        }
    };

    public saveKeyValOnEnv = async (envKeyValue: EnvKeyValue): Promise<Result> => {
        Logger.log('silly', 'Save saveKeyValOnEnv');
        Logger.log('silly', JSON.stringify(envKeyValue, null, '\t'));

        try {
            const result = await this.client.executeDML(
                `select a.id
                from translation_keys a
                where a.namespace_id=$1 and 
                a.key=$2`,
                [envKeyValue.namespace.id, envKeyValue.key]
            );

            if (result.rows.length === 0)
                return new Result(
                    false,
                    'Project, namespace,Key or landuage not found ' + JSON.stringify(envKeyValue)
                );

            await this.client.executeDML(
                'INSERT INTO translation_values_environments(' +
                    'translation_key_id, language_id, value, environment)' +
                    ' VALUES (' +
                    this.client.genBindVariables(4) +
                    ')',
                [
                    result.rows[0].id,
                    envKeyValue.language.id,
                    envKeyValue.value,
                    envKeyValue.environment,
                ]
            );
            return new Result(true);
        } catch (error) {
            Logger.log('error', 'saveKeyValOnEnv ' + error);
            throw error;
        }
    };
    public async finish() {
        try {
            Logger.log('debug', 'Finish Start');
            await this.client.commitTrans();
            Logger.log('debug', 'Finish End');
        } catch (error) {
            Logger.log('error', 'Finish ' + error);
            throw error;
        }
    }
    public async close() {
        try {
            Logger.log('debug', 'close Start');
            await this.client.close();
            Logger.log('debug', 'close End');
        } catch (error) {
            Logger.log('error', 'close ' + error);
            throw error;
        }
    }
    public async rollback() {
        try {
            await this.client.rollbackTrans();
            await this.client.close();
        } catch (error) {
            Logger.log('error', 'rollback ' + error);
            throw error;
        }
    }
}
