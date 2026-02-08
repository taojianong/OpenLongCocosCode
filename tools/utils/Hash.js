
const fs = require('fs');
const path = require('path');
const { config } = require('process');

function readFileAsBuffer(filePath) {
    return new Promise((resolve, reject) => {

        if (!fs.existsSync(filePath)) {
            resolve(null);
            return;
        }
        fs.readFile(filePath, (err, data) => {
            resolve(data); // data 是一个 Buffer 对象
        });
    });
}

function fnv1aHash(buffer) {
    const FNV_PRIME = 16777619;        // FNV-1a 素数
    let hash = 0x811c9dc5;              // FNV 偏移基数
    for (let i = 0; i < buffer.length; i++) {
        hash ^= buffer[i];
        hash = (hash * FNV_PRIME) >>> 0;
    }
    return hash;
}

/**
 * 检出两个目录不同的文件
 * @param {*} srcPath 当前目录
 * @param {*} tmpPath 临时目录,作为比对目录
 */
async function checkOutFiles(srcPath, tmpPath, out = []) {

    if (!fs.existsSync(srcPath) || !fs.existsSync(tmpPath)) {
        return out;
    }
    const srcFiles = fs.readdirSync(srcPath);
    // console.log(`---->srcPath:${srcPath}`);
    // console.log(`---->srcFiles:${srcFiles}`);
    // console.log(`---->tmpFiles:${tmpFiles}`);

    for (let i = 0; i < srcFiles.length; i++) {
        const file = srcFiles[i];
        const f1 = path.join(srcPath, file);
        if (fs.lstatSync(f1).isDirectory()) {
            continue;//暂不比较多极目录
        }
        const checkFile = path.join(tmpPath, file);
        if (!fs.existsSync(checkFile)) {
            out.push(file);
        } else {
            const bol = await compareFilesWith(f1, checkFile);
            if (!bol) {
                out.push(file);
            }
        }
    }
    // console.log(`------>比对文件输出:${out}`);
    return out;
}

/**读取两个文件进行hash比较 */
async function compareFilesWith(filePath1, filePath2) {
    const fileBuffer1 = await readFileAsBuffer(filePath1);
    const fileBuffer2 = await readFileAsBuffer(filePath2);
    if (!fileBuffer1 || !fileBuffer2) {
        // !fileBuffer1 && console.error(`比对 f1文件不存在 `);
        // !fileBuffer2 && console.error(`比对 f2文件不存在 `);
        return false;
    }
    return compareFiles(fileBuffer1, fileBuffer2);
}

/**比较文件hash值 */
function compareFiles(fileBuffer1, fileBuffer2) {
    // 如果文件大小不同，直接返回 false
    if (fileBuffer1.length !== fileBuffer2.length) {
        return false;
    }
    // 先计算两个文件的 FNV-1a 哈希值
    const hash1 = fnv1aHash(fileBuffer1);
    const hash2 = fnv1aHash(fileBuffer2);
    if (hash1 !== hash2) {
        return false;
    }
    // 如果哈希值相同，再逐字节比较一次(以防万一避免哈希碰撞)
    for (let i = 0; i < fileBuffer1.length; i++) {
        if (fileBuffer1[i] !== fileBuffer2[i]) {
            return false;
        }
    }
    return true;
}

module.exports = {
    compareFilesWith,
    compareFiles,
    checkOutFiles,
}