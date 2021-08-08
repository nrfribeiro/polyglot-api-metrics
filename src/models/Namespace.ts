import Project from './Project';
export default class Namespace {
    //No getters :(
    public project: Project;
    public id: bigint;
    public name: string;
    public referenceUri: string;
    constructor(project: Project, id: bigint, name: string, referenceUri: string) {
        this.project = project;
        this.id = id;
        this.name = name;
        this.referenceUri = referenceUri;
    }
}
