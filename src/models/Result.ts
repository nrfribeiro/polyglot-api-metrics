export default class Result {
    //No getters :(
    public sucess: boolean;
    public message: string;
    constructor(success: boolean, message: string = null) {
        this.sucess = success;
        this.message = message;
    }
}
