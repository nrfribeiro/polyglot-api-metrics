export default class EnvVarsUtilities {
    public static getEnvVar = (varName: string) => {
        return EnvVarsUtilities.getEnvVarInner(varName);
    };
    private static getEnvVarInner = (varName: string) => {
        if (varName.indexOf('PASSWORD') > 0 && process.env['MODE'] !== 'TESTS')
            return process.env[varName] !== null ? '******' : 'null';
        else return process.env[varName];
    };

    public static getSecureEnvVar = (varName: string) => {
        return process.env[varName];
    };
    public static printEnv(keys: string[]) {
        keys.forEach((key) => console.log(EnvVarsUtilities.getEnvVar(key)));
    }
}
