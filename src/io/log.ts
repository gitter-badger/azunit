import * as Globalization from "../i18n/locales";
import * as Results from "./results";
import { MessageType, AssertionMessage } from "../i18n/messages";

export interface IAzuLog {
    write(message: Globalization.IAzuCultureMessage): void;
    error(err: Error): void;

    startRun(name: string, subscription: string): void;
    startGroup(name: string, source: string): void;
    startTest(name: string): void;
    assert(message: AssertionMessage, resource: string, expected: any, actual: any): void;
    endTest(): void;
    endGroup(): void;
    endRun(): void;
    abortRun(message: string): void;
}

abstract class BaseLog implements IAzuLog {

    constructor(locale: Globalization.IAzuLocale) {
        this._locale = locale;
    }

    protected _locale: Globalization.IAzuLocale;

    private _stack = new Array();

    public abstract write(message: Globalization.IAzuCultureMessage): void;
    public abstract error(err: Error): void;

    protected getStackSize() {
        if (this._stack) {
            return this._stack.length;
        }

        return 0;
    }

    public startRun(name: string, subscription: string): void {
        if (this._stack.length != 0) { throw new Error("Logging failure: a run had already been started."); }
        this.openRun(name, subscription);
        this._stack.push(name);
    }

    public startGroup(name: string, source: string): void {
        if (this._stack.length != 1) { throw new Error("Logging failure: a test group has already been started."); }
        this.openGroup(name, source);
        this._stack.push(name);
    }

    public startTest(name: string): void {
        if (this._stack.length != 2) { throw new Error("Logging failure: a test has already been started."); }
        this.openTest(name);
        this._stack.push(name);
    }
    
    public assert(message: AssertionMessage, expected: any, actual: any): void {
        if (this._stack.length != 3) { throw new Error("Logging failure: a test is not on the result stack."); }
        this.writeAssert(message, expected, actual);        
    }
    
    public endTest() {
        if (this._stack.length != 3) { throw new Error("Logging failure: a test is not on the result stack."); }
        this.closeTest();
        this._stack.pop();
    }
    public endGroup() {
        if (this._stack.length != 2) { throw new Error("Logging failure: a test group is not on the result stack."); }
        this.closeGroup();
        this._stack.pop();
    }

    public endRun() {
        if (this._stack.length != 1) { throw new Error("Logging failure: a test group is not on the result stack."); }
        this.closeRun();
        this._stack.pop();
    }

    public abortRun(message: string): void {
        if (this._stack.length == 3) {
            this.closeTest();
        }
        
        if (this._stack.length == 2) {
            this.closeGroup();
        }

        if (this._stack.length == 1) {
            this.closeRun();
        }
    }

    protected abstract openRun(name: string, subscription: string): void;
    protected abstract openGroup(name: string, source: string): void;
    protected abstract openTest(name: string): void;
    protected abstract writeAssert(message: AssertionMessage, expected: any, actual: any): void;
    protected abstract closeTest(): void;
    protected abstract closeGroup(): void;
    protected abstract closeRun(): void;
}

export class ConsoleLog extends BaseLog {


    write(message: Globalization.IAzuCultureMessage) {
        
        let iconFormatter = (i: string, t: MessageType) => {
            if (t == MessageType.Success) {
                return "\x1b[32m" + i + "\x1b[0m";
            }
            else if (t == MessageType.Failure) {
                return "\x1b[31m" + i + "\x1b[0m";
            }
            else if (t == MessageType.Heading) {
                return "\x1b[34m" + i + "\x1b[0m";
            }
            return i;
        };

        // Tokens print out a bit brighter.
        let tokenFormatter = (t: string) => {
            return "\x1b[1m" + t + "\x1b[0m";
        };

        let text = message.toString(this._locale, iconFormatter, tokenFormatter, this.getStackSize())

        // Errors need to print out red.
        if (message.type == MessageType.Error) {
            console.log("\x1b[31m" + text + "\x1b[0m");
        }
        else if (message.type == MessageType.Title) {
            console.log("\x1b[37m\x1b[4m\x1b[1m" + text + "\x1b[0m");
        }
        else if (message.type == MessageType.Heading) {
            console.log("\x1b[34m" + text + "\x1b[0m");
        }
        else {
            console.log(text);
        }
    }

    error(err: Error) {
        let message = Globalization.Resources.fatalError(err);
        console.log(message.toString(this._locale, ));
    }

    protected openRun(name: string, subscription: string): void {
        this.write(Globalization.Resources.startRun(name, subscription));
    }

    protected openGroup(name: string, source: string): void {
        this.write(Globalization.Resources.startGroup(name, source));
    }
    
    protected openTest(name: string): void {
        this.write(Globalization.Resources.startTest(name));
    }
    
    protected writeAssert(message: AssertionMessage, expected: any, actual: any): void {
        this.write(message);
    }

    protected closeTest(): void {
    }

    protected closeGroup(): void {
    }
    
    protected closeRun(): void {
    }
}

export class MemoryLog {

    constructor() {
        this._log = Array<Globalization.IAzuCultureMessage>();
    }

    private _log: Array<Globalization.IAzuCultureMessage>;

    public write(message: Globalization.IAzuCultureMessage) {
        this._log.push(message);
    }

    public error(err: Error) {
        this._log.push(Globalization.Resources.fatalError(err));
    }

    public dump(log: IAzuLog) {
        this._log.forEach(e => {
            log.write(e);
        });
    }
}

export class MultiLog implements IAzuLog {

    constructor(logs : Array<IAzuLog>) {
        this._logs = logs;
    }

    private _logs : Array<IAzuLog>;

    write(message: Globalization.IAzuCultureMessage): void {
        this._logs.forEach(l => l.write(message));
    }
    error(err: Error): void {
        this._logs.forEach(l => l.error(err));
    }
    startRun(name: string, subscription: string): void {
        this._logs.forEach(l => l.startRun(name, subscription));
    }
    startGroup(name: string, source: string): void {
        this._logs.forEach(l => l.startGroup(name, source));
    }
    startTest(name: string): void {
        this._logs.forEach(l => l.startTest(name));
    }
    assert(message: AssertionMessage, resource: string, expected: any, actual: any): void {
        this._logs.forEach(l => l.assert(message, resource, expected, actual));
    }
    endTest(): void {
        this._logs.forEach(l => l.endTest());
    }
    endGroup(): void {
        this._logs.forEach(l => l.endGroup());
    }
    endRun(): void {
        this._logs.forEach(l => l.endRun());
    }
    abortRun(message: string): void {
        this._logs.forEach(l => l.abortRun(message));
    }
}

export class ResultsLog extends BaseLog {

    private _run: (Results.AzuRunResult | null) = null;
    private _group: (Results.AzuFileResult | null) = null;
    private _test: (Results.AzuTestResult | null) = null;

    write(message: Globalization.IAzuCultureMessage) {
        
    }

    error(err: Error) {
        let message = Globalization.Resources.fatalError(err);
        console.log(message.toString(this._locale, ));
    }

    protected openRun(name: string, subscription: string): void {
        this._run = new Results.AzuRunResult();
        this._run.title = name;
        this._run.subscription = subscription;
    }

    protected openGroup(name: string, source: string): void {
        this._group = new Results.AzuFileResult();
        this._group.title = name;
        this._group.filename = source;
    }
    
    protected openTest(name: string): void {
        this._test = new Results.AzuTestResult();
        this._test.title = name;
    }
    
    protected writeAssert(message: AssertionMessage, expected: any, actual: any): void {

        // Strip icons and don't augment tokens
        let iconFormatter = (i: string, t: MessageType) => { return ""; };
        let tokenFormatter = (t: string) => { return t; };

        let assertion = new Results.AzuAssertionResult(message.state, message.toString(this._locale, iconFormatter, tokenFormatter));

        if (this._test) {
            this._test.assertions.push(assertion);
        }
    }

    protected closeTest(): void {
        if (this._group && this._test) {
            let end = new Date();
            this._test.duration = (end.getTime() - this._test.start.getTime()) / 1000;
            this._group.tests.push(this._test);
            this._test = null;
        }
    }

    protected closeGroup(): void {
        if (this._run && this._group) {
            let end = new Date();
            this._group.duration = (end.getTime() - this._group.start.getTime()) / 1000;
            this._run.files.push(this._group);
            this._group = null;
        }
    }
    
    protected closeRun(): void {
        if (this._run) {
            let end = new Date();
            this._run.duration = (end.getTime() - this._run.start.getTime()) / 1000;
        }
    }

    public getResults() : (Results.IAzuRunResult | null) {
        return this._run;
    }
}