export default class Language {
    //No getters :(
    public id: bigint;
    public language: string;

    constructor(id: bigint, language?: string) {
        this.id = id;
        this.language = language;
    }
}
