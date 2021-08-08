import Logger from './Logger';
import axios, { AxiosResponse } from 'axios';

export default class UrlUtilities {
    public static async fetch(url: string): Promise<any> {
        try {
            const response: AxiosResponse = await axios.get(url);
            if (response.status === 200) {
                Logger.log('debug', url + 200);
                return response.data;
            }
        } catch (e) {
            //Logger.log("warn",url + e.message);
        }
    }
}
