#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const TMP_BASE = os.tmpdir();
const userName = (os.userInfo && os.userInfo().username) ? os.userInfo().username : process.env.USER || process.env.USERNAME || 'unknown';
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
if (showHelp) {
    console.log(`
资源拷贝命令行工具

用法:
  resource-copy              根据缓存配置拷贝所有启用的规则
  resource-copy --all        拷贝所有规则（包括未启用的）
  resource-copy --config     显示当前配置信息
  resource-copy --source <dir> --target <dir>   指定源和目标目录拷贝
  resource-copy --help       显示帮助信息

选项:
  --all       拷贝所有规则，不限于 enabled 状态
  --config    显示当前缓存中的规则和根目录配置
  --source    指定源目录（绝对路径）
  --target    指定目标目录（绝对路径）
  --filter    文件后缀筛选，逗号分隔，如 .png,.jpg
  --incremental 增量拷贝（只拷贝变化的文件）
`);
    process.exit(0);
}
function findDataDir() {
    const tmpDir = path.join(TMP_BASE, 'cocos-design-ruler-' + userName);
    if (!fs.existsSync(tmpDir))
        return null;
    const dirs = fs.readdirSync(tmpDir);
    if (dirs.length === 0)
        return null;
    const dataDir = path.join(tmpDir, dirs[0]);
    const dataFile = path.join(dataDir, 'resource-copy.json');
    if (fs.existsSync(dataFile))
        return dataDir;
    for (const d of dirs) {
        const candidate = path.join(tmpDir, d);
        if (fs.existsSync(path.join(candidate, 'resource-copy.json'))) {
            return candidate;
        }
    }
    return null;
}
function loadJson(filePath) {
    if (!fs.existsSync(filePath))
        return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    catch (_a) {
        return null;
    }
}
function matchFile(fileName, copyRule, filePrefix, fileRegex, fileExts) {
    switch (copyRule) {
        case 'prefix': return !!(filePrefix && fileName.startsWith(filePrefix));
        case 'regex':
            if (!fileRegex)
                return true;
            try {
                return new RegExp(fileRegex).test(fileName);
            }
            catch (_a) {
                return false;
            }
        case 'ext': {
            if (!fileExts)
                return true;
            const ext = path.extname(fileName).toLowerCase();
            const allowed = fileExts.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
            return allowed.includes(ext) || allowed.includes(ext.replace('.', ''));
        }
        default: return true;
    }
}
function copyDir(sourceDir, targetDir, rule, incremental) {
    if (!fs.existsSync(sourceDir)) {
        console.error('源目录不存在:', sourceDir);
        return 0;
    }
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    let count = 0;
    const entries = fs.readdirSync(sourceDir);
    for (const entry of entries) {
        const srcPath = path.join(sourceDir, entry);
        const tgtPath = path.join(targetDir, entry);
        const stat = fs.statSync(srcPath);
        if (stat.isFile()) {
            if (!matchFile(entry, rule.copyRule || 'all', rule.filePrefix, rule.fileRegex, rule.fileExts))
                continue;
            if (incremental && fs.existsSync(tgtPath)) {
                const tgtStat = fs.statSync(tgtPath);
                if (stat.mtimeMs <= tgtStat.mtimeMs && stat.size === tgtStat.size)
                    continue;
            }
            fs.copyFileSync(srcPath, tgtPath);
            count++;
            console.log('  拷贝:', entry);
        }
        else if (stat.isDirectory() && rule.recursive !== false) {
            count += copyDir(srcPath, tgtPath, rule, incremental);
        }
    }
    return count;
}
function main() {
    var _a;
    const dataDir = findDataDir();
    const showConfig = args.includes('--config');
    if (!dataDir) {
        console.error('未找到缓存数据目录，请先在 Cocos Creator 中配置拷贝规则');
        process.exit(1);
    }
    const rules = loadJson(path.join(dataDir, 'resource-copy.json')) || [];
    const config = loadJson(path.join(dataDir, 'resource-copy-config.json')) || { sourceRoot: '', exportRoots: [] };
    if (showConfig) {
        console.log('=== 根目录配置 ===');
        console.log('资源根目录:', config.sourceRoot || '(未设置)');
        console.log('导出根目录:', ((_a = config.exportRoots) === null || _a === void 0 ? void 0 : _a.join(', ')) || '(未设置)');
        console.log('\n=== 拷贝规则 ===');
        rules.forEach((rule, i) => {
            console.log(`[${i + 1}] ${rule.name || '(未命名)'} | ${rule.enabled ? '启用' : '禁用'} | 模式:${rule.copyRule || 'all'} | 源:${JSON.stringify(rule.sourceDirs || [])} -> 目标:${rule.targetDir}`);
        });
        return;
    }
    const sourceIdx = args.indexOf('--source');
    const targetIdx = args.indexOf('--target');
    const filterIdx = args.indexOf('--filter');
    const incremental = args.includes('--incremental');
    if (sourceIdx >= 0 && targetIdx >= 0) {
        const source = args[sourceIdx + 1];
        const target = args[targetIdx + 1];
        const filter = filterIdx >= 0 ? args[filterIdx + 1] : undefined;
        console.log(`指定模式拷贝: ${source} -> ${target}`);
        if (filter)
            console.log('后缀筛选:', filter);
        const rule = { copyRule: filter ? 'ext' : 'all', fileExts: filter, recursive: true };
        const count = copyDir(source, target, rule, incremental);
        console.log(`完成，共拷贝 ${count} 个文件`);
        return;
    }
    const copyAll = args.includes('--all');
    const activeRules = copyAll ? rules : rules.filter((r) => r.enabled);
    if (activeRules.length === 0) {
        console.log('没有可执行的拷贝规则');
        return;
    }
    console.log(`共 ${activeRules.length} 条规则待执行${copyAll ? '（包含禁用）' : ''}\n`);
    let totalCount = 0;
    for (const rule of activeRules) {
        const sourceDirs = rule.sourceDirs || [];
        const name = rule.name || '(未命名)';
        console.log(`[${name}]`);
        for (const srcDir of sourceDirs) {
            if (!srcDir)
                continue;
            const actualSource = path.isAbsolute(srcDir) ? srcDir : path.resolve(config.sourceRoot || '', srcDir);
            if (path.isAbsolute(rule.targetDir)) {
                const count = copyDir(actualSource, rule.targetDir, rule, incremental);
                totalCount += count;
            }
            else {
                for (const exportRoot of (config.exportRoots || [])) {
                    if (!exportRoot)
                        continue;
                    const actualTarget = path.resolve(exportRoot, rule.targetDir);
                    const count = copyDir(actualSource, actualTarget, rule, incremental);
                    totalCount += count;
                }
            }
        }
    }
    console.log(`\n全部完成，共拷贝 ${totalCount} 个文件`);
}
main();
