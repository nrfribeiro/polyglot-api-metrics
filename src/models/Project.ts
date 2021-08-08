export default class Project {
    //No getters :(
    public id: bigint;
    public slug: string;

    constructor(id: bigint, slug: string) {
        this.id = id;
        this.slug = slug;
    }
}
