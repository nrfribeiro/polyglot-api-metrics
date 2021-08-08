import Language from './Language';

export default class Key {
    //No getters :(
    public id: bigint;
    public referenceValue: string;
    public language: Language;
    constructor(id: bigint, referenceValue: string, language: Language) {
        this.id = id;
        this.referenceValue = referenceValue;
        this.language = language;
    }
}
