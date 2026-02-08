'use strict';
//动画减帧工具脚本
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
``
const a2 = process.argv[2];//图集资源源文件目录
const a3 = process.argv[3];//导出减帧后的目录

const delDir = path.join(a3, '');
fs.rmdirSync(delDir, { recursive: true, force: true });

//读取animation.xlsx中对应动画帧数据
const ws = XLSX.readFile('./res/xlsx/animation.xlsx');
const out = XLSX.utils.sheet_to_json(ws.Sheets['animation']);

const heros = [];
const heroMap = {};
out.map((v, i) => {
    if (v.name != 'string' && heros.indexOf(v.name) == -1) {
        heros.push(v.name);
        heroMap[v.name] = out.filter(a => a.name == v.name);
    }
});

if (heros) {
    for (let i = 0; i < heros.length; i++) {
        const hero = heros[i];
        delOneAnimation(hero);
    }
    console.log(`----->资源减帧处理完成.`);
}

async function delOneAnimation(hero, cutFrame = 2) {

    if (hero == 'yanshikuilei') {
        cutFrame = 3;
    }

    const p1 = path.join(a2, hero);
    if (fs.existsSync(p1)) {
        const actionList = heroMap[hero];
        for (let i = 0; i < actionList.length; i++) {
            const data = actionList[i]
            const col = cutFrame == 2 ? data.column >> 1 : Math.floor(data.column / cutFrame);
            const p3 = path.join(`${a3}`, `${hero}/${data.action}/`);
            for (let j = 0; j < col; j++) {
                await new Promise((resolve, reject) => {
                    const p2 = path.join(a2, `${hero}/${data.action}/${data.action}_${j * cutFrame}.png`);
                    if (!fs.existsSync(p3)) {
                        fs.mkdirSync(p3, { recursive: true });
                        // console.error(`目标目录 ${p3} 不存在,创建目录\n${p3}`);
                    }
                    const p4 = path.join(p3, `${data.action}_${j}.png`);
                    if (!fs.existsSync(p2)) {
                        console.log(`---->文件${p2}不存在.`);
                        resolve();
                        return;
                    }
                    fs.copyFileSync(p2, p4);
                    console.log(`拷贝文件 ${p2} -> ${p4}`);
                    resolve();
                })
            }
        }
    }
}