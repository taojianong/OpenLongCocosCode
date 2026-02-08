const fs = require('fs');
const path = require('path');
const FileUtils = require('./utils/FileUtils');
const NodeLog = require('./utils/log-util');

const p2 = process.argv[2];

var files = FileUtils.readAllFilePathList(p2, ['.meta'], true);
files = files.filter(v => {
    let name = path.extname(v);
    return name == 'xml' || name == '.xml';
})
console.log(files);


async function delOneXml(file) {
    await new Promise((resolve, reject) => {
        if (file) {
            let txt = fs.readFileSync(file, 'utf-8');
            let o = txt.match(/text='(([\s\S])*?)'\//);
            let dir = path.dirname(file);
            let bname = path.basename(dir);
            try {
                var json = JSON.parse(o[1]);
                const newFile = path.join(dir, `${bname}.json`);
                fs.writeFileSync(newFile, JSON.stringify(json, null, 4), 'utf-8');
                console.log('转换xml文件为json文件', newFile, o[1]);
                fs.unlinkSync(file);
                resolve();
            } catch (error) {
                console.error(error);
                resolve();
            }
        }
    })
}

async function delAll() {

    for (let i = 0; i < files.length; i++) {
        await delOneXml(files[i]);
    }

    NodeLog.green('处理完所有xml', files.length);
}

delAll();

