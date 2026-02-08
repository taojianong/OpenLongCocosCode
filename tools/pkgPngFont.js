//打包位图字体

const fs = require('fs');
const path = require('path');
const Spritesmith = require('spritesmith');

// const inputDir = path.resolve(__dirname, 'chars'); // 单字图片目录
// const outputDir = path.resolve(__dirname, 'output'); // 输出目录

const conf = {
    fontName: 'font',
    atlasWidth: 512,
    atlasHeight: 512,
    size: 46,
    lineHeight: 54
};

function pkgFont(inputDir, outputDir, fontName, cb = null) {

    conf.fontName = fontName;

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 读取所有图片文件
    const files = fs.readdirSync(inputDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));

    // 构造完整路径数组
    const filePaths = files.map(f => path.join(inputDir, f));

    // 生成纹理图集
    Spritesmith.run({ src: filePaths }, (err, result) => {
        if (err) {
            console.error('打包失败:', err);
            cb?.(false);
            return;
        }

        // 写入合成图集 PNG
        const atlasPath = path.join(outputDir, `${fontName}_atlas.png`);
        fs.writeFileSync(atlasPath, result.image);
        console.log('生成纹理图集:', atlasPath);

        // 生成 .fnt 文件内容（简易版，XML格式）
        const chars = [];
        let id = 32; // 从空格开始，或者根据实际字符调整

        // 这里假设文件名就是字符，比如 A.png 对应字符 'A'
        for (const file of files) {
            const char = path.basename(file, path.extname(file)); // 文件名作为字符
            const frame = result.coordinates[path.join(inputDir, file)];

            let id = char == 'dian' ? '.'.charCodeAt(0) : char.charCodeAt(0);

            chars.push({
                id,
                x: frame.x,
                y: frame.y,
                width: frame.width,
                height: frame.height,
                xoffset: 0,
                yoffset: 0,
                xadvance: frame.width,
            });
        }

        // 生成简单的 .fnt XML格式字符串
        const fntContent = generateFntXML(chars, result.properties.width, result.properties.height, fontName);

        const fntPath = path.join(outputDir, `${fontName}.fnt`);
        fs.writeFileSync(fntPath, fntContent);
        console.log('生成字体描述文件:', fntPath);
        cb?.(true);
    });
}

// 生成 .fnt 文件的 XML 内容
function generateFntXML(chars, atlasWidth, atlasHeight, fontName) {
    const header = `<?xml version="1.0"?>
<font>
  <info face="CustomFont" size="${conf.size}" />
  <common lineHeight="${conf.lineHeight}" scaleW="${atlasWidth}" scaleH="${atlasHeight}" pages="1" />
  <pages>
    <page id="0" file="${fontName}_atlas.png" />
  </pages>
  <chars count="${chars.length}">`;

    const charLines = chars.map(c => `
    <char id="${c.id}" x="${c.x}" y="${c.y}" width="${c.width}" height="${c.height}" xoffset="${c.xoffset}" yoffset="${c.yoffset}" xadvance="${c.xadvance}" page="0" chnl="15" />`).join('');

    const footer = `
  </chars>
</font>`;

    return header + charLines + footer;
}

if (process.argv.length > 2) {

    const inputDir = process.argv[2];
    const outputDir = process.argv[3];
    const fontName = process.argv[4] || 'font';

    pkgFont(inputDir, outputDir, fontName);
}