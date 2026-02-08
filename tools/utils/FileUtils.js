'use strict';
var fs = require('fs');
var path = require('path');

/**
 * 调用函数拷贝目录下所有子文件到目标目录
 * copyFiles('/path/to/source', '/path/to/target');
 * @param {*} sourceDir 
 * @param {*} targetDir 
 */
function copyFiles(sourceDir, targetDir, cb = null, excepts = ['.meta']) {

    console.log(`sourceDir:${sourceDir}\ntargetDir:${targetDir}`);

    if (!fs.existsSync(sourceDir)) {
        console.error(`源目录 ${sourceDir} 不存在`);
        return;
    }

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
        console.error(`目标目录 ${sourceDir} 不存在,创建目录\n${targetDir}`);
    }

    const files = fs.readdirSync(sourceDir);

    //排除meta文件
    if (excepts && excepts.length > 0) {
        for (let i = files.length - 1; i >= 0; i--) {
            const file = files[i];
            let ext = path.extname(file);//.meta 
            if (excepts.indexOf(ext) != -1) {
                files.splice(i, 1);
            }
        }
    }

    files.forEach(file => {

        const sourceFile = path.join(sourceDir, file);
        const targetFile = path.join(targetDir, file);

        if (fs.lstatSync(sourceFile).isDirectory()) {
            // 如果是目录，递归拷贝子目录
            copyFiles(sourceFile, targetFile, null, excepts);
        } else {
            // 如果是文件，直接拷贝
            fs.copyFileSync(sourceFile, targetFile);
        }
    });

    cb && cb();
}

/**
 * 拷贝文件
 * @param src       拷贝的文件 
 * @param target    目标目录
 */
function copy(src, target) {

    return new Promise((resolve, reject) => {
        fs.stat(src, (err, stats) => {//stats: fs.Stats
            if (err) {
                console.log("拷贝文件失败1 src: " + src);
                resolve(false);
                return;
            }
            if (stats.isDirectory()) {
                //拷贝目录
            } else {
                copyOneFile(src, target).then(() => {
                    resolve(true);
                })
            }
        });
    })

    //拷贝一个文件
    function copyOneFile(src, target) {
        return new Promise((resolve, reject) => {
            fs.readFile(src, function (err, data) {
                if (err) {
                    console.log("拷贝文件失败2 src: " + src);
                    resolve(false);
                    return;
                }
                let fileName = path.basename(src);
                if (!fs.existsSync(target)) {
                    fs.mkdirSync(target, { recursive: true });
                }
                let turl = target + fileName;
                fs.writeFile(turl, data, (err) => {
                    if (err) {
                        resolve(false);
                        return;
                    }
                    console.log("拷贝文件 src: " + src + " turl: " + turl);
                    resolve(true);
                });
            });
        })
    }
}

/**
* 递归遍历目录 https://www.jb51.net/article/173560.htm
* @param dir 目录地址
* @param recursion 是否递归
* @returns 
*/
function getFilesInDir(dir, isAddDir = false, excepts = ['.meta'], recursion = true) {//: Array<string>

    var results = isAddDir ? [path.resolve(dir)] : [];
    // console.log(`---->dir:${dir} exists:${fs.existsSync(dir)}`);
    if (!fs.existsSync(dir)) {
        return;
    }
    var files = fs.readdirSync(dir, 'utf8');
    files.forEach(function (file) {
        file = path.resolve(dir, file);
        var stats = fs.statSync(file);
        if (stats.isFile()) {
            let ext = path.extname(file);//.meta
            // console.log(`ext:${ext}`);
            if (excepts.indexOf(ext) == -1) {
                results.push(file);
            }
        } else if (stats.isDirectory()) {
            if (recursion) {
                results = results.concat(getFilesInDir(file, isAddDir, excepts, recursion));
            }
        }
    });
    return results;
}

/**
 * 读取目录下所有文件路径列表
 * @param {*} dir 
 * @param {*} exts 
 * @param {*} isExt 是否带后缀名
 * @returns 返回所有文件地址列表
 */
function readAllFilePathList(dir, excepts = ['.meta'], recursion = true) {

    const files = getFilesInDir(dir, false, excepts, recursion);
    // console.log(`--->readAllFilePathList dir:${dir} files.length:${files ? files.length : 0}`);
    return files;
}

/**
 * 读取目录下所有文件
 * @param {*} dir 
 * @param {*} exts 
 * @param {*} isExt 是否带后缀名
 * @param {*} isPath 是否为路径地址
 * @returns 
 */
function readAllFiles(dir, exts = ['.ts'], isExt = false, isPath = false) {

    const files = getFilesInDir(dir);
    console.log(`dir:${dir}\nfiles.length:${files.length}`);
    const outList = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let ext = path.extname(file);//.meta
        // console.log(`file:${file}`); 
        if (exts.indexOf(ext) != -1) {
            if (isPath) {
                outList.push(file);
            } else {
                let index = file.lastIndexOf('\\');//mac 不支持\\
                if (index == -1) {
                    index = val.lastIndexOf("/");
                }
                const name = file.substr(index + 1);
                // console.log(`name:${name}`);
                if (isExt) {
                    outList.push(name);
                } else {
                    const a = name.split('.')[0];// name.replace(/\.ts/, '');
                    // console.log(`a:${a}`);
                    outList.push(a);
                }
            }
        }
    }
    return outList;
}

/**
 * 文件名字或者当前目录名字
 */
function getFileName(path) {

    const isDirectory = path.indexOf('.') == -1;
    let val = getfullName(path);
    if (isDirectory) {//目录
        let index = -1;
        let lastChar = path.length > 0 ? path.charAt(path.length - 1) : "";
        if (lastChar == "\\" || lastChar == "/") {
            val = path.substr(0, path.length - 1);
            index = val.lastIndexOf("\\");
            if (index == -1) {
                index = val.lastIndexOf("/");
            }
            val = val.substr(index);
            // console.log("[File]===>目录名字 -->index: " + index + " path: " + path);
        }
        // console.log("[File]===>目录名字 -->val: " + val + " -->this.fullName: " + this.fullName);
    } else {
        val = val.substr(0, val.lastIndexOf("."));
    }
    return val.replace(/\\|\//g, "");
}

/**
 * 带后缀名的名字
 */
function getfullName(path) {

    let index = path.lastIndexOf("\\");
    if (index == -1) {
        index = path.lastIndexOf("/");
    }
    let val = index != -1 ? path.substr(index) : "";
    return val.replace(/\\|\//g, "");
}

/**
 * 获取相对路径
 * // 定义基准目录
    const baseDirectory = '/path/to/base/directory';
    // 文件的绝对路径
    const absoluteFilePath = '/path/to/base/directory/some-folder/some-file.txt';
    // 获取相对路径
    const relativeFilePath = path.relative(baseDirectory, absoluteFilePath);
    console.log(relativeFilePath);
 * @param {*} filePath 
 * @param {*} baseDir 当前目录位置
 * @returns 
 */
function getRelativePath(filePath, baseDir) {

    const relativeFilePath = path.relative(baseDir, filePath);
    console.log(`--->获取相对路径 relativeFilePath\nbaseDir:${baseDir}\nfilePath:${filePath}`);
    return relativeFilePath;
}

module.exports = {

    copy: copy,
    copyFiles: copyFiles,
    getFilesInDir: getFilesInDir,
    readAllFiles: readAllFiles,
    readAllFilePathList: readAllFilePathList,
    getFileName: getFileName,
    getfullName: getfullName,
    getRelativePath: getRelativePath,
}