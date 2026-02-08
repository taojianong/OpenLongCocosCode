/**
 * 事件
 * @author clong 2022.04.09
 */
export default class Handler {

    static create(caller: any, method: Function, args: any = null, once = true) {
        if (Handler._pool.length)
            return Handler._pool.pop().setTo(caller, method, args, once);
        return new Handler(caller, method, args, once);
    }

    private static _pool: Array<any> = [];
    private static _gid = 1;

    private once: boolean = false;
    private _id: number = 0;

    private caller: any;
    private method: Function | any;
    private args: any;

    constructor(caller: any = null, method: Function, args: any = null, once: boolean = false) {
        this.once = false;
        this._id = 0;
        this.setTo(caller, method, args, once);
    }

    setTo(caller: any, method: Function, args: any, once = false) {
        this._id = Handler._gid++;
        this.caller = caller;
        this.method = method;
        this.args = args;
        this.once = once;
        return this;
    }
    run() {
        if (this.method == null)
            return null;
        var id = this._id;
        var result = this.method.apply(this.caller, this.args);
        this._id === id && this.once && this.recover();
        return result;
    }
    runWith(data: any) {
        if (this.method == null)
            return null;
        var id = this._id;
        if (data == null)
            var result = this.method.apply(this.caller, this.args);
        else if (!this.args && !data.unshift)
            result = this.method.call(this.caller, data);
        else if (this.args)
            result = this.method.apply(this.caller, this.args.concat(data));
        else
            result = this.method.apply(this.caller, data);
        this._id === id && this.once && this.recover();
        return result;
    }

    clear() {
        this.caller = null;
        this.method = null;
        this.args = null;
        return this;
    }

    recover() {
        if (this._id > 0) {
            this._id = 0;
            Handler._pool.push(this.clear());
        }
    }

}