// Cocos Creator Editor 全局 API 类型声明
declare namespace Editor {
    function log(...args: any[]): void;
    function warn(...args: any[]): void;
    function error(...args: any[]): void;

    namespace Panel {
        function open(name: string, ...args: any[]): void;
        function close(name: string): void;
        function extend(proto: any): any;
    }

    namespace Ipc {
        function sendToMain(message: string, ...args: any[]): void;
        function sendToPanel(name: string, message: string, ...args: any[]): void;
        function sendToAll(message: string, ...args: any[]): void;
    }

    namespace Scene {
        function callSceneScript(packageName: string, method: string, cb: (err: Error, msg: any) => void): void;
        function callSceneScript(packageName: string, method: string, arg: any, cb: (err: Error, msg: any) => void): void;
        function callSceneScript(packageName: string, method: string, arg1: any, arg2: any, cb: (err: Error, msg: any) => void): void;
    }

    const projectPath: string;

    namespace assetdb {
        function refresh(dbUrl: string, callback: (err: any) => void): void;
    }
}

declare function require(module: string): any;
