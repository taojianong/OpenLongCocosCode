// var xlsx = require('node-xlsx').default;

const xml2js = require('xml2js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const FileUtils = require('./utils/FileUtils');
const FileUtil = require('./utils/file-util');

const p2 = process.argv[2];//XML源文件或目录
const p3 = process.argv[3];//导出目录 

/**
 * 将 XML 文件转换成 JSON 对象
 * @param {string} xmlFilePath - XML 文件路径
 * @returns {Promise<Object>} - 解析后的 JSON 对象
 */
async function xmlFileToJson(xmlFilePath) {

    console.log(`------>xmlFilePath:`, xmlFilePath);
    const fileName = path.basename(xmlFilePath);

    const parser = new xml2js.Parser({
        explicitArray: false, // 不把单个元素放入数组，方便访问
        mergeAttrs: true    // 合并属性到父节点
    });

    try {
        if (xmlFilePath.indexOf('config.xml') != -1) {
            return null;
        }
        const xmlData = await fs.promises.readFile(xmlFilePath, 'utf-8');
        const result = await parser.parseStringPromise(xmlData);
        let out = result.data?.item || result.attrubit?.item;
        let oldJson = out;//原JSON文件,用于保存json文件
        //map1001item map2001mob
        const fname = fileName.replace('.xml', '');
        const m = fname.match(/map(\d+)(item|mob)/);
        if (m?.length > 0) {
            console.log(fileName);
            if (fname.match(/map(\d+)item/)?.length > 0) {
                readMapItem(result.data, parseInt(m[1]));
            } else if (fname.match(/map(\d+)mob/)?.length > 0) {
                // readMapMob(result.data, parseInt(m[1]));
            }
            return null;
        }
        //只有一级的xml文件
        if (['checkAdd.xml', 'fortEquip.xml', 'openItem.xml', 'skillConfig.xml',
            'itemDef.xml', 'mobDef.xml', 'skillEffect.xml', 'soundData.xml',
            'spesection.xml', 'textDef.xml'
        ].includes(fileName)) {
            // out = result.data.item;
            oldJson = out;
        } else if (fileName == 'achieve.xml') {
            out = oldJson = result.data.achieve;
        } else if (fileName == 'mapList.xml') {
            out = oldJson = result.data.source;
        }
        else if (fileName == 'itemEffect.xml') {
            oldJson = result.data.itemeffect;
            out = JSON.parse(JSON.stringify(result.data.itemeffect));
            out.map(v => {
                if (v.effect) {
                    v.effect = JSON.stringify(v.effect);
                } else {
                    v.effect = '{}';
                }
            })
        } else if (fileName == 'config.xml') {
            out = oldJson = result.data.effect;//暂时不处理
        } else if (fileName == 'mobModel.xml') {
            oldJson = JSON.parse(JSON.stringify(result.data.model));
            out = decodeMobModel(result.data.model);
        }
        else if (fileName == 'dropItems.xml') {
            oldJson = JSON.parse(JSON.stringify(result.attrubit.monster));
            out = decodeDropItem(result.attrubit.monster);
        }
        else {
            return null;
        }
        if (out == null) {
            out = oldJson = {};
            console.error(`---->xmlFilePath:`, xmlFilePath);
        }
        return [out, oldJson];
    } catch (err) {
        throw new Error(`XML 转 JSON 失败: ${err?.message} xmlFilePath:${xmlFilePath}`);
    }
}

//解析map1001item.xml
function readMapItem(out, id) {
    // console.log(out);
    const data = JSON.parse(JSON.stringify(out));
    // data.mapData = data.mapData ||{row:1,list:1,data:[]}
    if (data.mapData) {
        data.mapData.row = parseInt(data.mapData.row);
        data.mapData.list = parseInt(data.mapData.list);
        data.mapData.data = data.mapData.data.split(',').map(v => parseInt(v));
    } else {
        data.mapData = { row: 1, list: 1, data: [] };
    }

    data.group.teams.team.item?.map(v => {
        v.id = parseInt(v.id);
        v.x = parseInt(v.x);
        v.y = parseInt(v.y);
        v.probability = parseInt(v.probability);
        v.point?.map(o => {
            o.x = parseInt(o.x);
            o.y = parseInt(o.y);
        })
    })

    const o = {
        id, mapData: data.mapData,
        teams: data.group.teams.team.item || []
    };

    MAP_ITEMs.push(o);
}

//解析map1001mob.xml  TODO 暂时复制的readMapItem
function readMapMob(out, id) {
    // console.log(out);
    const data = JSON.parse(JSON.stringify(out));
    data.mapData.row = parseInt(data.mapData.row);
    data.mapData.list = parseInt(data.mapData.list);
    data.mapData.data = data.mapData.data.split(',').map(v => parseInt(v));

    data.group.teams.team.item.map(v => {
        v.id = parseInt(v.id);
        v.x = parseInt(v.x);
        v.y = parseInt(v.y);
        v.probability = parseInt(v.probability);
        v.point?.map(o => {
            o.x = parseInt(o.x);
            o.y = parseInt(o.y);
        })
    })

    const o = {
        id, mapData: data.mapData,
        teams: data.group.teams.team.item
    };

    MAP_ITEMs.push(o);
}

//解析dropItems.xml
function decodeDropItem(out) {

    let newOut = [];
    for (let i = 0; i < out.length; i++) {
        const o = out[i];
        o.item = JSON.stringify(o.item);
        newOut.push(o);
    }
    // newOut.splice(0, 0, { id: 'int', name: 'string', type: 'int', animation: 'string' });
    return newOut;
}

//解析mobModel.xml
function decodeMobModel(out) {

    let newOut = [];
    for (let i = 0; i < out.length; i++) {
        const o = out[i];
        o.name = o.name.replace('.swf', '');
        o.animation = JSON.stringify(o.animation);
        newOut.push(o);
    }
    // newOut.splice(0, 0, { id: 'int', name: 'string', type: 'int', animation: 'string' });
    return newOut;
}

//所有map${0}item.xml导入到一张表
var MAP_ITEMs = [];
//所有map${0}mob.xml导入到一张表
var MAP_MOBs = [];

/**
 * 导出XML文件为EXCEL
 * @param {*} fileOrDir xml文件目录
 * @param {*} outDir    导出excel文件目录
 */
async function exportXML2Excel(fileOrDir, outDir) {

    MAP_ITEMs = [];
    MAP_MOBs = [];

    if (fs.existsSync(fileOrDir)) {
        if (fs.lstatSync(fileOrDir).isFile()) {
            await xml2Excel(fileOrDir, outDir, true);
        } else if (fs.lstatSync(fileOrDir).isDirectory()) {
            const xmlFiles = FileUtils.readAllFilePathList(p2, ['.meta'], false);
            for (let i = 0; i < xmlFiles.length; i++) {
                await xml2Excel(xmlFiles[i], outDir, true);
            }
        }

        //单独导出mapItem.xlsx mapMob.xlsx
        console.log(MAP_ITEMs);
    } else {
        console.error(`文件或目录不存在`, fileOrDir);
    }
}

/**
 * 将xml文件转换成excel文件
 * @param {*} file      xml文件
 * @param {*} outDir    导出目录
 * @param {*} saveJson    是否导出json文件
 */
async function xml2Excel(file, outDir, saveJson = false) {
    const fileName = path.basename(file).replace('.xml', '');
    await new Promise((resolve, reject) => {
        xmlFileToJson(file).then((data) => {
            const json = data?.[0];
            const oldJson = data?.[1];
            if (json == null) {
                resolve();
                return;
            }
            try {

                if (Array.isArray(json) && json.length > 0) {
                    const o = JSON.parse(JSON.stringify(json[0]));
                    const keys = Object.keys(o);
                    keys.map(v => {
                        o[v] = v == 'id' ? 'int' : 'string';
                    })
                    json.splice(0, 0, o);//加入键值类型
                }

                jsonToExcel(json, oldJson, fileName, outDir, saveJson);
                console.log(`xml → excel成功.`);
            } catch (error) {
                console.error(`xml转换excel失败.`, error);
            }
            resolve();
        });
    })
}

/**
 * 将 JSON 文件转换成 Excel 文件
 * @param {string} json - 输入 JSON 
 * @param {string} fileName - 输出文件名 - 作为默认sheet
 *  // 读取 JSON 文件
    // const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
 */
function jsonToExcel(jsonData, oldJson, fileName, toPath, saveJson = false) {

    const excelFilePath = `${path.join(p3, fileName)}.xlsx`;
    if (!fs.existsSync(toPath)) {
        fs.mkdirSync(toPath);
    }

    if (saveJson) {
        const jsonPath = path.join(toPath, 'json');
        if (!fs.existsSync(jsonPath)) {
            fs.mkdirSync(jsonPath);
        }
        try {
            const jsonFile = path.join(jsonPath, `${fileName}.json`);
            FileUtil.delete(jsonFile);
            fs.writeFileSync(jsonFile, JSON.stringify(oldJson, null, 4), 'utf-8');
        } catch (error) {
            console.error(error);
        }

    }

    // 将 JSON 转换成工作表（worksheet）
    const worksheet = XLSX.utils.json_to_sheet(jsonData);

    // 创建一个新的工作簿（workbook）
    const workbook = XLSX.utils.book_new();

    // 将工作表添加到工作簿，sheet名默认为 'Sheet1'
    XLSX.utils.book_append_sheet(workbook, worksheet, fileName);

    // 写入 Excel 文件
    XLSX.writeFile(workbook, excelFilePath);

    console.log(`成功生成 Excel 文件：${excelFilePath}`);
}

// 使用示例
// [
//   { "name": "张三", "age": 28, "city": "北京" },
//   { "name": "李四", "age": 32, "city": "上海" },
//   { "name": "王五", "age": 24, "city": "广州" }
// ]

// jsonToExcel('data.json', 'output.xlsx');

exportXML2Excel(p2, p3);
