// 谷歌出品压缩图片工具
// npm install @squoosh/lib


// async function init() {
//     const fetchModule = (await import('node-fetch')).default;
//     global.fetch = fetchModule.default || fetchModule;
//     console.log(global.fetch);
// }

const { ImagePool } = require('@squoosh/lib');
const fs = require('fs');

var p2 = process.argv[2];
var p3 = process.argv[3];

/**
 * 压缩图集
 * @param {*} input     要压缩的图片
 * @param {*} outPath   输出压缩图片
 */
async function compressPng(input, outPath) {
    const imagePool = new ImagePool();

    // 读取图片文件
    const image = imagePool.ingestImage(input);

    // 压缩配置
    await image.encode({
        mozjpeg: { quality: 75 },
        webp: { quality: 75 },
    });

    // 获取压缩后的图片数据
    const encodedImage = image.encodedWith.mozjpeg || image.encodedWith.webp;

    // 写入文件
    await fs.promises.writeFile(outPath, encodedImage.binary);
    await imagePool.close();
    console.log('===>图片压缩完成:', input, outPath);
}

if (p2) {
    p3 = p3 || p2;
    compressPng(p2, p3);
}

exports.module = {
    compressPng
}