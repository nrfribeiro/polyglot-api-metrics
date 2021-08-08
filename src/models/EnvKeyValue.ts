import Language from './Language';
import Namespace from './Namespace';
export default class EnvKeyValue {
    //No getters :(
    public namespace: Namespace;
    public key: string;
    public language: Language;
    public value: string;
    public environment: string;
    constructor(
        namespace: Namespace,
        key: string,
        language: Language,
        value: string,
        environment: string
    ) {
        this.namespace = namespace;
        this.key = key;
        this.language = language;
        this.value = value;
        this.environment = environment;
    }
}
