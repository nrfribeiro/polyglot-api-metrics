import { Client } from 'pg';
import IClientDB from './IClientDB';
import StringUtilities from '../utilities/StringUtilities';
export default class ClientPostgres implements IClientDB {
    private static instance: ClientPostgres;
    private client: Client;
    public constructor(config: any) {
        this.client = new Client(config);
    }
    public async connect(): Promise<void> {
        await this.client.connect();
    }

    public async beginTrans(): Promise<void> {
        await this.client.query('BEGIN');
    }
    public async commitTrans(): Promise<void> {
        await this.client.query('COMMIT');
    }
    public async rollbackTrans(): Promise<void> {
        await this.client.query('ROLLBACK');
    }
    public async executeDML(dml: string, vals?: any[]): Promise<any> {
        return await this.client.query(dml, vals);
    }
    public async close(): Promise<void> {
        await this.client.end();
    }
    public genBindVariables(length: number): string {
        return StringUtilities.genStringPattern('$', length, true);
    }
    public escape(val: any): any {
        return val;
    }
}
