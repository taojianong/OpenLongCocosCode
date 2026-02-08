const fs = require('fs');
const path = require('path');
const FileUtils = require('./utils/FileUtils');
const xml2js = require('xml2js');

const a2 = process.argv[2];//图集资源源文件目录
const a3 = process.argv[3];//导出减帧后的目录

const xmlFiles = FileUtils.readAllFiles(a2, [".xml"], true, true);

if (xmlFiles?.length > 0) {
    readXMLFile(xmlFiles[0]).then(async (xml) => {
        // console.log(xml);
        if (xml.name == 'skillEffect.xml') {
            FileUtil.delete(path.join(a3));
            const bitmapdata = xml.data.bitmapdata;
            if (Array.isArray(bitmapdata)) {
                const toPath = path.join(a3, '');//目标目录
                for (let i = 0; i < bitmapdata.length; i++) {
                    const d = bitmapdata[i];
                    const fileName = d.file;
                    const frame = parseInt(d.frame) || 1;
                    if (frame > 1) {
                        await cutPic(path.join(a2, fileName), frame, toPath);
                    } else {
                        const fileName2 = fileName.replace(path.extname(fileName), '');
                        await FileUtils.copy(path.join(a2, `${fileName}`), path.join(toPath, fileName2 + '/'));
                    }
                }
            }
        }
    });
}

const sharp = require('sharp');
const FileUtil = require('./utils/file-util');

/**
 * 裁剪图片 - 裁剪单张横向图集
 * @param {*} file      源文件
 * @param {*} frame     切帧数
 * @param {*} outPath   输出目录
 * @returns 
 */
function cutPic(file, frame, outPath) {

    return new Promise(async (resolve, reject) => {
        console.log(`--->outPath:`, outPath);
        const metadata = await sharp(file).metadata();
        const frameWidth = Math.floor(metadata.width / frame);
        const frameHeight = Math.floor(metadata.height);
        const fileName = path.basename(file).replace(path.extname(file), '');
        for (let i = 0; i < frame; i++) {
            await cropImage(path.resolve(a2, `${fileName}.png`),
                path.resolve(outPath, `${fileName}/${fileName}_${i}.png`),
                i * frameWidth, 0, frameWidth, frameHeight);
        }
        resolve();
    })
}

/**
 * 裁剪图片
 * @param {string} inputPath 输入图片路径
 * @param {string} outputPath 输出图片路径
 * @param {number} x 裁剪起点X坐标
 * @param {number} y 裁剪起点Y坐标
 * @param {number} width 裁剪宽度
 * @param {number} height 裁剪高度
 */
async function cropImage(inputPath, outputPath, x, y, width, height) {
    try {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        await sharp(inputPath)
            .extract({ left: x, top: y, width: width, height: height })
            .toFile(outputPath);
        console.log(`裁剪成功，保存到：${outputPath}`);
    } catch (err) {
        console.error('裁剪失败:', err);
    }
}
/**
 * 读取XML文件
 * @param {*} xmlFilePath 
 * @returns 
 */
function readXMLFile(xmlFilePath) {

    return new Promise(async (resolve, reject) => {
        const parser = new xml2js.Parser({
            explicitArray: false, // 不把单个元素放入数组，方便访问
            mergeAttrs: true    // 合并属性到父节点
        });
        try {
            const xmlData = await fs.promises.readFile(xmlFilePath, 'utf-8');
            const result = await parser.parseStringPromise(xmlData);
            console.log(`out xml:`, result);
            resolve({ data: result?.data, file: xmlFilePath, name: path.basename(xmlFilePath) });
        } catch (err) {
            // throw new Error(`XML 转 JSON 失败: ${err.message}`);
            console.log('out xml error:', err);
            resolve(null);
        }
    })
}