
var fs = require('fs');
var path = require('path');
var join = require('path').join;

class NodeFile {
    constructor() {
    }
    // static readBin(pathUrl, handler = null) {
    //     if (!fs.existsSync(pathUrl)) {
    //         console.error("暂无该文件 path: " + path);
    //         return;
    //     }
    //     fs.readFile(pathUrl, {}, (err, data) => {
    //         let bytes = new Laya.Byte(data);
    //         handler && handler.runWith(bytes);
    //     });
    // }
    static saveBin(bytes, url) {
        if (fs.existsSync(url)) {
            fs.unlink(url, (err) => {
                console.log("删除文件成功 url: " + url);
                this.writeBin(bytes, url);
            });
        }
        else {
            this.writeBin(bytes, url);
        }
    }
    static writeBin(buffer, url) {
        let dir = path.dirname(url);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
            console.log('创建目录:' + dir);
        }
        fs.writeFile(url, buffer, { encoding: 'binary' }, function (err) {
            if (err) {
                console.log('写入文件失败 url: ' + url);
                return;
            }
            console.log('===>写入bin文件成功 url: ' + url);
        });
    }

    /**
     * 文件是否已存在
     * @param {*} url 
     * @returns 
     */
    static hasFile(url) {
        return fs.existsSync(url);
    }

    static saveTxtFile(text, url, isCover = true) {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(url)) {
                if (isCover) {
                    fs.unlink(url, (err) => {
                        console.log("删除文件成功 url: " + url);
                        this.writeTxt(text, url).then((text) => {
                            resolve(text);
                        });
                    });
                } else {
                    console.log(`该文件已存在`);
                    resolve(null);
                }
            }
            else {
                this.writeTxt(text, url).then((text) => {
                    resolve(text);
                });
            }
        })
    }

    static writeTxt(text, url) {
        const lf = this;
        return new Promise((resolve, reject) => {
            let dir = path.dirname(url);
            if (!fs.existsSync(dir)) {
                console.log('创建目录:' + dir);
                fs.mkdirSync(dir, { recursive: true });//递归创建
            }
            fs.writeFile(url, text, { 'flag': 'a' }, function (err) {
                if (err) {
                    console.log('写入文件失败 url: ' + url + '\n' + err);
                    if (lf.isFileInUse(url)) {//文件占用被删除后重新执行
                        lf.writeTxt(text, url).then((ret) => {
                            return resolve(ret);
                        })
                    } else {
                        resolve(null);
                    }
                    return;
                }
                console.log('写入文件成功 url: ' + url);
                resolve(text);
            });
        })
    }

    /**检测文件是否被占用 */
    static isFileInUse(filePath) {
        try {
            fs.openSync(filePath, 'r+');
            fs.closeSync(fs.openSync(filePath, 'r+')); // 关闭文件
            return false; // 文件未被占用
        } catch (err) {
            console.log(`文件被占用 file:${filePath}`);
            return true; // 文件被占用
        }
    }

    /**
     * 同步读取文本
     * @param {*} pathUrl 
     * @returns 
     */
    static readTextSync(pathUrl) {

        return fs.readFileSync(pathUrl).toString();
    }

    static readText(pathUrl) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(pathUrl)) {
                console.error("暂无该文件 pathUrl: " + pathUrl);
                return;
            }
            fs.readFile(pathUrl, {}, (err, data) => {
                // console.log(`%c----->pathUrl:${pathUrl} data:${data}`, 'color:green');
                data = data.toString();
                resolve(data);
            });
        })
    }
    static doProcess(argv) {
        var type = process.argv[2];
        var pathUrl = process.argv[3];
        var ext = path.extname(pathUrl).replace(".", "");
        console.log("------>ext: " + ext);
        if (type == "load" || type == "read") {
            if (ext == "bin") {
                this.readBin(pathUrl);
            }
            else if (ext == "txt" || ext == "json") {
                this.readText(pathUrl);
            }
        }
    }
}

// exports.NodeFile = NodeFile;

module.exports = {
    NodeFile: NodeFile,
}