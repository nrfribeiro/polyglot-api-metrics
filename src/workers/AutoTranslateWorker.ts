import Logger from '../utilities/Logger';

import AwsTranslate from '../aws/AwsTranslate';
import Key from '../models/Key';
import DbWorker from './DbWorker';
export default class AutoTranslateWorker extends DbWorker {
    public async run(): Promise<void> {
        await this.translatePendingKeys();
    }
    private async translatePendingKeys() {
        const itensToFetch = 1000;
        let page = 1;
        let keys: Key[];
        await this.databaseProxy.startAutoTranslateKeys();

        do {
            keys = await this.databaseProxy.getPendingAutoTranslateKeys(itensToFetch, page);
            for (const key of keys) {
                Logger.log('debug', key.language.language.substring(0, 2));
                Logger.log('debug', key.referenceValue);
                const translated = await AwsTranslate.translateValue(
                    'auto',
                    key.language.language.substring(0, 2),
                    key.referenceValue
                );
                Logger.log('debug', translated);
                Logger.log('debug', '-----');
                await this.databaseProxy.saveAutoTranslateKey(key, translated);
            }
            //page++;
        } while (keys.length === itensToFetch);
    }
}
