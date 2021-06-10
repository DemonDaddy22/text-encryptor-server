export default class SwooshError extends Error {
    constructor(status, message, name = 'SwooshError') {
        super();
        this.name = name;
        this.message = message;
        this.status = status;
    }
}
