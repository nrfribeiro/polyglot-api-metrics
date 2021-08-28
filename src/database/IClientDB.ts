export default interface IClientDB {
    connect(): Promise<void>;
    beginTrans(): Promise<void>;
    commitTrans(): Promise<void>;
    rollbackTrans(): Promise<void>;
    executeDML(dml: string, vals?: any[]): Promise<any>;
    close(): Promise<void>;
    genBindVariables(length: number): string;
    escape(val: any): any;
    buildDbLink(
        server: string,
        port: number,
        database: string,
        user: string,
        password: string
    ): string;
}
