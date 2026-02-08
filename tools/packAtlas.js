// 图集打包工具 https://free-tex-packer.com/ 
const src = process.argv[2]; //导出动画散图源目录
const toSrc = process.argv[3];//导出目录 

const fs = require('fs');
const path = require('path');

//npm install free-tex-packer-cli
const { packAsync } = require('free-tex-packer-core');
const FileUtils = require('./utils/FileUtils');

// 配置参数
const options = {
    textureName: 'myTexture',
    width: 2048,
    height: 2048,
    fixedSize: false,
    padding: 0,
    extrude: 0,
    allowRotation: true,
    detectIdentical: true,
    allowTrim: true,
    trimMode: "trim",
    tinify: false,
    tinifyKey: "",
    scale: 1,
    filter: "none",
    exporter: 'cocos2d', // 输出格式，可选 JsonHash、JsonArray、Xml、Plist 等
    removeFileExtension: true,
    prependFolderName: true,
    alphaThreshold: 0,
    packer: 'MaxRectsBin',// 'MaxRectsBinPack', // 排布算法
    packerMethod: "BottomLeftRule",
    allowDuplicates: false,
    // 其他参数根据需要配置
};

// 读取图片Buffer
// { path: 'sprite1.png', contents: fs.readFileSync(path.join(__dirname, 'sprite1.png')) }
const images = [];

var files = fs.readdirSync(src, 'utf8');

pkgAll();

async function pkgAll() {
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        if (fs.statSync(path.join(src, file))?.isDirectory()) {
            await packFiles(src, file);
        }
    }
    console.log(`=====>打包图集所有资源完成...`);
}

async function packFiles(dir, name = 'aiqiang', cb = null) {

    console.log(`--------->开始打包图集 name:`, name);

    options.textureName = name;

    dir = path.join(dir, name);

    const files = FileUtils.readAllFilePathList(dir, ['.json', '.meta']);

    images.length = 0;
    files.map(v => {
        const a = path.basename(v);
        images.push({ path: a, contents: fs.readFileSync(v) })
    })

    let toPath = path.join(toSrc, `${name}/`);

    const ret = await packAsync(images, options);
    if (Array.isArray(ret)) {
        ret.map(v => {
            if (!fs.existsSync(toPath)) {
                fs.mkdirSync(toPath, { recursive: true });
            }
            fs.writeFileSync(path.join(toPath, v.name), v.buffer);
        })
    }
    console.log(`=====>打包图集[${name}]完成. toPath:`, toPath);
    return ret;
}
