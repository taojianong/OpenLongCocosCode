'use strict';

const fs = require('fs');
const path = require('path');
const electron = require('electron');

const RESOURCE_COPY_DATA_FILE_NAME = 'resource-copy.json';
const RESOURCE_COPY_CONFIG_FILE_NAME = 'resource-copy-config.json';
const RESOURCE_COPY_HISTORY_FILE_NAME = 'resource-copy-history.json';
const MAX_HISTORY_ITEMS = 50;

const META_IMPORTER_MAP: { [ext: string]: { importer: string; ver: string } } = {
    '.png': { importer: 'texture', ver: '2.3.7' },
    '.jpg': { importer: 'texture', ver: '2.3.7' },
    '.jpeg': { importer: 'texture', ver: '2.3.7' },
    '.bmp': { importer: 'texture', ver: '2.3.7' },
    '.webp': { importer: 'texture', ver: '2.3.7' },
    '.mp3': { importer: 'audio-clip', ver: '2.0.3' },
    '.wav': { importer: 'audio-clip', ver: '2.0.3' },
    '.ogg': { importer: 'audio-clip', ver: '2.0.3' },
    '.prefab': { importer: 'prefab', ver: '1.3.2' },
    '.fire': { importer: 'scene', ver: '1.3.2' },
    '.ts': { importer: 'typescript', ver: '1.1.0' },
    '.json': { importer: 'asset', ver: '1.0.3' },
    '.atlas': { importer: 'asset', ver: '1.0.3' },
    '.anim': { importer: 'animation-clip', ver: '1.0.4' },
    '.font': { importer: 'bitmap-font', ver: '1.0.0' },
    '.ttf': { importer: 'ttf-font', ver: '1.0.0' },
    '.txt': { importer: 'text', ver: '1.0.0' },
    '.xml': { importer: 'text', ver: '1.0.0' },
    '.plist': { importer: 'plist', ver: '1.0.0' },
    '.bin': { importer: 'raw-asset', ver: '1.0.0' },
    '.spine': { importer: 'spine', ver: '1.2.5' },
};

function generateUuid(): string {
    const hexChars = '0123456789abcdef';
    const sections = [8, 4, 4, 4, 12];
    let uuid = '';
    for (let i = 0; i < sections.length; i++) {
        if (i > 0) uuid += '-';
        for (let j = 0; j < sections[i]; j++) {
            uuid += hexChars[Math.floor(Math.random() * 16)];
        }
    }
    return uuid;
}

function getMetaContent(filePath: string): { content: string; importer: string } | null {
    const ext = path.extname(filePath).toLowerCase();
    const metaInfo = META_IMPORTER_MAP[ext];
    if (!metaInfo) return null;

    const uuid = generateUuid();
    const meta: any = {
        ver: metaInfo.ver,
        uuid: uuid,
        importer: metaInfo.importer,
        subMetas: {}
    };

    if (metaInfo.importer === 'texture') {
        meta.type = 'sprite';
        meta.wrapMode = 'clamp';
        meta.filterMode = 'bilinear';
        meta.premultiplyAlpha = false;
        meta.genMipmaps = false;
        meta.packable = true;
        meta.width = 0;
        meta.height = 0;
        meta.platformSettings = {};

        const baseName = path.basename(filePath, ext);
        meta.subMetas[baseName] = {
            ver: '1.0.6',
            uuid: generateUuid(),
            importer: 'sprite-frame',
            rawTextureUuid: uuid,
            trimType: 'auto',
            trimThreshold: 1,
            rotated: false,
            offsetX: 0,
            offsetY: 0,
            trimX: 0,
            trimY: 0,
            width: 0,
            height: 0,
            rawWidth: 0,
            rawHeight: 0,
            borderTop: 0,
            borderBottom: 0,
            borderLeft: 0,
            borderRight: 0,
            subMetas: {}
        };
    }

    if (metaInfo.importer === 'typescript') {
        meta.isPlugin = false;
        meta.loadPluginInWeb = true;
        meta.loadPluginInNative = true;
        meta.loadPluginInEditor = false;
    }

    if (metaInfo.importer === 'prefab') {
        meta.optimizationPolicy = 'AUTO';
        meta.asyncLoadAssets = false;
        meta.readonly = false;
    }

    if (metaInfo.importer === 'scene') {
        meta.asyncLoadAssets = false;
        meta.autoReleaseAssets = false;
    }

    if (metaInfo.importer === 'audio-clip') {
        meta.downloadMode = 0;
        meta.duration = 0;
    }

    return { content: JSON.stringify(meta, null, 2), importer: metaInfo.importer };
}

export interface ResourceCopyRule {
    id: string;
    enabled: boolean;
    name: string;
    sourceDirs: string[];
    sourceDir?: string;
    targetDir: string;
    copyRule: 'all' | 'prefix' | 'regex' | 'ext';
    filePrefix?: string;
    fileRegex?: string;
    fileExts?: string;
    recursive?: boolean;
}

export interface CopyHistoryItem {
    id: string;
    time: string;
    ruleName: string;
    fileCount: number;
    metaCount: number;
    sourceDirs: string[];
    targetDir: string;
}

export interface RootDirConfig {
    sourceRoot: string;
    exportRoots: string[];
}

export class ResourceCopyHandler {
    private _dataDir: string;
    private _dataFile: string;

    constructor(dataDir: string) {
        this._dataDir = dataDir;
        this._dataFile = path.join(dataDir, RESOURCE_COPY_DATA_FILE_NAME);
    }

    ensureDataDir() {
        if (!fs.existsSync(this._dataDir)) {
            fs.mkdirSync(this._dataDir, { recursive: true });
        }
    }

    getCopyRules(): ResourceCopyRule[] {
        if (!fs.existsSync(this._dataFile)) return [];
        try {
            return JSON.parse(fs.readFileSync(this._dataFile, 'utf-8'));
        } catch (e: any) {
            Editor.error('[resource-copy] 读取资源拷贝规则失败:', e);
            return [];
        }
    }

    saveCopyRules(rules: ResourceCopyRule[]) {
        this.ensureDataDir();
        try {
            fs.writeFileSync(this._dataFile, JSON.stringify(rules, null, 2), 'utf-8');
        } catch (e: any) {
            Editor.error('[resource-copy] 保存资源拷贝规则失败:', e);
        }
    }

    copySingleResource(rule: ResourceCopyRule) {
        const sourceDirs = rule.sourceDirs || (rule.sourceDir ? [rule.sourceDir] : []);
        if (sourceDirs.length === 0 || !rule.targetDir) {
            Editor.error('[resource-copy] 源目录和目标目录不能为空');
            return { fileCount: 0, metaCount: 0 };
        }

        const rootConfig = this.getRootDirs();
        let totalFileCount = 0;
        let totalMetaCount = 0;

        for (const sourceDir of sourceDirs) {
            const actualSourceDir = this.resolvePath(sourceDir, rootConfig.sourceRoot);
            if (!fs.existsSync(actualSourceDir)) {
                Editor.error('[resource-copy] 源目录不存在:', actualSourceDir);
                continue;
            }

            if (this.isAbsolutePath(rule.targetDir)) {
                const result = this.doCopyDir(rule, actualSourceDir, rule.targetDir);
                totalFileCount += result.fileCount;
                totalMetaCount += result.metaCount;
            } else {
                if (!rootConfig.exportRoots || rootConfig.exportRoots.length === 0) {
                    Editor.warn('[resource-copy] 目标为相对路径但未配置导出根目录');
                    continue;
                }
                let copiedAny = false;
                rootConfig.exportRoots.forEach((exportRoot: string) => {
                    if (!exportRoot) return;
                    const actualTargetDir = this.resolvePath(rule.targetDir, exportRoot);
                    const result = this.doCopyDir(rule, actualSourceDir, actualTargetDir);
                    totalFileCount += result.fileCount;
                    totalMetaCount += result.metaCount;
                    copiedAny = true;
                });
                if (!copiedAny) {
                    Editor.warn('[resource-copy] 没有有效的导出根目录');
                }
            }
        }

        Editor.log('[resource-copy] 规则拷贝完成: 文件', totalFileCount, '个, meta', totalMetaCount, '个');
        this.addHistory({
            ruleName: rule.name || '',
            fileCount: totalFileCount,
            metaCount: totalMetaCount,
            sourceDirs: sourceDirs,
            targetDir: rule.targetDir,
        });
        return { fileCount: totalFileCount, metaCount: totalMetaCount };
    }

    copyRecursive(source: string, target: string, rule: ResourceCopyRule) {
        const files = fs.readdirSync(source);

        files.forEach((file: string) => {
            const sourcePath = path.join(source, file);
            const targetPath = path.join(target, file);
            const stat = fs.statSync(sourcePath);

            if (stat.isFile()) {
                if (this.matchFile(rule, file)) {
                    try {
                        fs.copyFileSync(sourcePath, targetPath);
                    } catch (e: any) {
                        Editor.error('[resource-copy] 拷贝文件失败:', file, e);
                    }
                }
            } else if (stat.isDirectory()) {
                if (!fs.existsSync(targetPath)) {
                    fs.mkdirSync(targetPath, { recursive: true });
                }
                this.copyRecursive(sourcePath, targetPath, rule);
            }
        });
    }

    doCopyDir(rule: ResourceCopyRule, sourceDir: string, targetDir: string): { fileCount: number; metaCount: number } {
        if (!fs.existsSync(targetDir)) {
            try {
                fs.mkdirSync(targetDir, { recursive: true });
            } catch (e: any) {
                Editor.error('[resource-copy] 创建目标目录失败:', targetDir, e);
                return { fileCount: 0, metaCount: 0 };
            }
        }

        let copiedCount = 0;
        const files = fs.readdirSync(sourceDir);
        files.forEach((file: string) => {
            const filePath = path.join(sourceDir, file);
            const stat = fs.statSync(filePath);

            if (stat.isFile()) {
                const shouldCopy = this.matchFile(rule, file);
                if (shouldCopy) {
                    const targetFilePath = path.join(targetDir, file);
                    try {
                        fs.copyFileSync(filePath, targetFilePath);
                        copiedCount++;
                    } catch (e: any) {
                        Editor.error('[resource-copy] 拷贝文件失败:', file, e);
                    }
                }
            } else if (stat.isDirectory() && rule.recursive !== false) {
                const targetSubDir = path.join(targetDir, file);
                if (!fs.existsSync(targetSubDir)) {
                    fs.mkdirSync(targetSubDir, { recursive: true });
                }
                this.copyRecursive(filePath, targetSubDir, rule);
            }
        });

        Editor.log('[resource-copy] 拷贝完成:', sourceDir, '->', targetDir, '共', copiedCount, '个文件', rule.recursive === false ? '(仅文件)' : '(递归)');

        const isRecursive = rule.recursive !== false;
        const metaCount = this.generateMissingMetaFiles(targetDir, isRecursive);
        if (metaCount > 0) {
            Editor.log('[resource-copy] 生成meta文件:', metaCount, '个');
            this.refreshAssetDb(targetDir);
        }

        return { fileCount: copiedCount, metaCount };
    }

    openInExplorer(dirPath: string) {
        if (!dirPath) return false;

        const rootConfig = this.getRootDirs();
        let absPath = dirPath;
        if (!this.isAbsolutePath(dirPath)) {
            absPath = this.resolvePath(dirPath, rootConfig.sourceRoot);
        }
        if (!fs.existsSync(absPath)) {
            Editor.warn('[resource-copy] 目录不存在:', absPath);
            return false;
        }
        electron.shell.openPath(absPath);
        return true;
    }

    openTargetInExplorer(dirPath: string) {
        if (!dirPath) return false;

        const rootConfig = this.getRootDirs();
        let absPath = dirPath;
        if (!this.isAbsolutePath(dirPath)) {
            if (rootConfig.exportRoots && rootConfig.exportRoots.length > 0) {
                absPath = this.resolvePath(dirPath, rootConfig.exportRoots[0]);
            }
        }
        if (!fs.existsSync(absPath)) {
            Editor.warn('[resource-copy] 目录不存在:', absPath);
            return false;
        }
        electron.shell.openPath(absPath);
        return true;
    }

    clearTargetDir(dirPath: string): { success: boolean; fileCount: number } {
        if (!dirPath) return { success: false, fileCount: 0 };

        const rootConfig = this.getRootDirs();
        let absPaths: string[] = [];

        if (this.isAbsolutePath(dirPath)) {
            absPaths = [dirPath];
        } else {
            if (rootConfig.exportRoots && rootConfig.exportRoots.length > 0) {
                absPaths = rootConfig.exportRoots
                    .filter((e: string) => e)
                    .map((e: string) => this.resolvePath(dirPath, e));
            }
        }

        let totalCleared = 0;
        for (const absPath of absPaths) {
            if (!fs.existsSync(absPath)) continue;
            try {
                const entries = fs.readdirSync(absPath);
                for (const entry of entries) {
                    const fullPath = path.join(absPath, entry);
                    const stat = fs.statSync(fullPath);
                    if (stat.isFile()) {
                        fs.unlinkSync(fullPath);
                        totalCleared++;
                    } else if (stat.isDirectory()) {
                        fs.rmSync(fullPath, { recursive: true, force: true });
                        totalCleared++;
                    }
                }
            } catch (e: any) {
                Editor.error('[resource-copy] 清空目录失败:', absPath, e);
            }
        }
        Editor.log('[resource-copy] 清空目标目录:', dirPath, '共清除', totalCleared, '个条目');
        return { success: true, fileCount: totalCleared };
    }

    matchFile(rule: ResourceCopyRule, fileName: string): boolean {
        switch (rule.copyRule) {
            case 'all':
                return true;
            case 'prefix':
                return !!(rule.filePrefix && fileName.startsWith(rule.filePrefix));
            case 'regex':
                if (!rule.fileRegex) return true;
                try {
                    return new RegExp(rule.fileRegex).test(fileName);
                } catch {
                    return false;
                }
            case 'ext': {
                if (!rule.fileExts) return true;
                const ext = path.extname(fileName).toLowerCase();
                const allowedExts = rule.fileExts.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean);
                return allowedExts.includes(ext) || allowedExts.includes(ext.replace('.', ''));
            }
            default:
                return true;
        }
    }

    openDirectoryDialog(data: any) {
        const win = electron.BrowserWindow.getFocusedWindow();
        if (!win) {
            Editor.error('[resource-copy] 未找到活动窗口');
            return;
        }

        const rootConfig = this.getRootDirs();
        let defaultPath = '';

        if (data.action === 'browse-source' && rootConfig.sourceRoot && fs.existsSync(rootConfig.sourceRoot)) {
            defaultPath = rootConfig.sourceRoot;
        } else if (data.action === 'browse-target' && rootConfig.exportRoots && rootConfig.exportRoots.length > 0) {
            const validExport = rootConfig.exportRoots.find((e: string) => e && fs.existsSync(e));
            if (validExport) defaultPath = validExport;
        }

        const dialogOptions: any = {
            properties: ['openDirectory']
        };
        if (defaultPath) {
            dialogOptions.defaultPath = defaultPath;
        }

        electron.dialog.showOpenDialog(win, dialogOptions).then((result: any) => {
            const filePaths = result.filePaths || result;
            if (filePaths && filePaths.length > 0) {
                let selectedPath: string = filePaths[0];

                if (data.action === 'browse-source' && rootConfig.sourceRoot) {
                    selectedPath = this.makeRelative(selectedPath, rootConfig.sourceRoot);
                } else if (data.action === 'browse-target' && rootConfig.exportRoots && rootConfig.exportRoots.length > 0) {
                    for (const exportRoot of rootConfig.exportRoots) {
                        if (exportRoot) {
                            const relative = this.makeRelative(selectedPath, exportRoot);
                            if (relative !== selectedPath) {
                                selectedPath = relative;
                                break;
                            }
                        }
                    }
                }

                Editor.Ipc.sendToPanel('cocos-design-ruler.export', 'directory-selected', JSON.stringify({
                    id: data.id,
                    path: selectedPath,
                    action: data.action,
                    sourceIndex: data.sourceIndex || 0
                }));
            }
        });
    }

    copyAllResources(rules: ResourceCopyRule[]) {
        let totalFiles = 0;
        let totalMetas = 0;
        rules.forEach((rule: ResourceCopyRule) => {
            const result = this.copySingleResource(rule);
            totalFiles += result.fileCount;
            totalMetas += result.metaCount;
        });
        Editor.log('[resource-copy] 全部拷贝完成，共', rules.length, '条规则，', totalFiles, '个文件，', totalMetas, '个meta');
        return { fileCount: totalFiles, metaCount: totalMetas };
    }

    getRootDirs(): RootDirConfig {
        const configFile = path.join(this._dataDir, RESOURCE_COPY_CONFIG_FILE_NAME);
        if (!fs.existsSync(configFile)) {
            return { sourceRoot: '', exportRoots: [] };
        }
        try {
            return JSON.parse(fs.readFileSync(configFile, 'utf-8'));
        } catch (e: any) {
            Editor.error('[resource-copy] 读取根目录配置失败:', e);
            return { sourceRoot: '', exportRoots: [] };
        }
    }

    saveRootDirs(config: RootDirConfig) {
        this.ensureDataDir();
        const configFile = path.join(this._dataDir, RESOURCE_COPY_CONFIG_FILE_NAME);
        try {
            fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
        } catch (e: any) {
            Editor.error('[resource-copy] 保存根目录配置失败:', e);
        }
    }

    openRootDirDialog(data: any) {
        const win = electron.BrowserWindow.getFocusedWindow();
        if (!win) {
            Editor.error('[resource-copy] 未找到活动窗口');
            return;
        }

        const dialogOptions = {
            properties: ['openDirectory']
        };

        electron.dialog.showOpenDialog(win, dialogOptions).then((result: any) => {
            const filePaths = result.filePaths || result;
            if (filePaths && filePaths.length > 0) {
                const selectedPath = filePaths[0];
                Editor.Ipc.sendToPanel('cocos-design-ruler.export', 'root-dir-selected', JSON.stringify({
                    type: data.type,
                    path: selectedPath,
                    index: data.index
                }));
            }
        });
    }

    makeRelative(filePath: string, rootPath: string): string {
        if (!filePath || !rootPath) return filePath;
        if (!path.isAbsolute(filePath)) return filePath;

        const normalizedFile = path.normalize(filePath);
        const normalizedRoot = path.normalize(rootPath);

        if (normalizedFile.startsWith(normalizedRoot + path.sep) || normalizedFile === normalizedRoot) {
            return path.relative(normalizedRoot, normalizedFile);
        }

        return filePath;
    }

    resolvePath(rulePath: string, rootPath: string): string {
        if (!rulePath) return '';

        if (this.isAbsolutePath(rulePath)) {
            return rulePath;
        }

        return path.resolve(rootPath, rulePath);
    }

    isAbsolutePath(p: string): boolean {
        return path.isAbsolute(p);
    }

    generateMissingMetaFiles(dir: string, recursive: boolean = true) {
        let generatedCount = 0;
        if (!fs.existsSync(dir)) {
            Editor.warn('[resource-copy] meta生成目录不存在:', dir);
            return generatedCount;
        }

        const folderMetaPath = dir + '.meta';
        if (!fs.existsSync(folderMetaPath)) {
            const folderMeta = {
                ver: '1.1.3',
                uuid: generateUuid(),
                importer: 'folder',
                isBundle: false,
                bundleName: '',
                priority: 1,
                compressionType: {},
                optimizeHotUpdate: {},
                inlineSpriteFrames: {},
                isRemoteBundle: {},
                subMetas: {}
            };
            fs.writeFileSync(folderMetaPath, JSON.stringify(folderMeta, null, 2), 'utf-8');
            generatedCount++;
            Editor.log('[resource-copy] 生成目录meta:', folderMetaPath);
        }

        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (recursive) {
                    generatedCount += this.generateMissingMetaFiles(fullPath, recursive);
                }
            } else if (stat.isFile()) {
                if (entry.endsWith('.meta')) continue;

                const metaPath = fullPath + '.meta';
                if (fs.existsSync(metaPath)) continue;

                const result = getMetaContent(fullPath);
                if (result) {
                    fs.writeFileSync(metaPath, result.content, 'utf-8');
                    generatedCount++;
                    Editor.log('[resource-copy] 生成meta:', metaPath, 'type:', result.importer);
                }
            }
        }

        return generatedCount;
    }

    refreshAssetDb(dir: string) {
        const projectPath = Editor.projectPath || '';
        if (!dir.startsWith(projectPath)) return;

        const relativePath = path.relative(projectPath, dir).replace(/\\/g, '/');
        const dbUrl = 'db://assets/' + relativePath;

        try {
            Editor.assetdb.refresh(dbUrl, function (err: any) {
                if (err) {
                    Editor.warn('[resource-copy] 刷新assetdb失败:', dbUrl, err);
                } else {
                    Editor.log('[resource-copy] 刷新assetdb成功:', dbUrl);
                }
            });
        } catch (e: any) {
            Editor.warn('[resource-copy] 刷新assetdb异常:', e);
        }
    }

    addHistory(item: Omit<CopyHistoryItem, 'id' | 'time'>) {
        this.ensureDataDir();
        const historyFile = path.join(this._dataDir, RESOURCE_COPY_HISTORY_FILE_NAME);
        let history: CopyHistoryItem[] = [];
        if (fs.existsSync(historyFile)) {
            try {
                history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
            } catch { history = []; }
        }
        history.unshift({
            id: Date.now().toString(),
            time: new Date().toLocaleString('zh-CN'),
            ...item,
        });
        if (history.length > MAX_HISTORY_ITEMS) {
            history = history.slice(0, MAX_HISTORY_ITEMS);
        }
        try {
            fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf-8');
        } catch (e: any) {
            Editor.error('[resource-copy] 保存历史记录失败:', e);
        }
    }

    getHistory(): CopyHistoryItem[] {
        const historyFile = path.join(this._dataDir, RESOURCE_COPY_HISTORY_FILE_NAME);
        if (!fs.existsSync(historyFile)) return [];
        try {
            return JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
        } catch { return []; }
    }

    clearHistory() {
        const historyFile = path.join(this._dataDir, RESOURCE_COPY_HISTORY_FILE_NAME);
        try {
            if (fs.existsSync(historyFile)) {
                fs.writeFileSync(historyFile, '[]', 'utf-8');
            }
        } catch (e: any) {
            Editor.error('[resource-copy] 清空历史记录失败:', e);
        }
    }

    exportConfig(): string {
        const rules = this.getCopyRules();
        const rootDirs = this.getRootDirs();
        return JSON.stringify({ rules, rootDirs, exportTime: new Date().toISOString() }, null, 2);
    }

    importConfig(configJson: string): boolean {
        try {
            const data = JSON.parse(configJson);
            if (data.rules && Array.isArray(data.rules)) {
                data.rules.forEach((rule: ResourceCopyRule) => {
                    if (!rule.id) rule.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
                    if (rule.copyRule === undefined) rule.copyRule = 'all';
                    if (!rule.sourceDirs) {
                        rule.sourceDirs = rule.sourceDir ? [rule.sourceDir] : [''];
                    }
                    if (rule.name === undefined) rule.name = '';
                });
                this.saveCopyRules(data.rules);
            }
            if (data.rootDirs) {
                this.saveRootDirs(data.rootDirs);
            }
            return true;
        } catch (e: any) {
            Editor.error('[resource-copy] 导入配置失败:', e);
            return false;
        }
    }

    importConfigFromFile(): boolean {
        const win = electron.BrowserWindow.getFocusedWindow();
        if (!win) return false;

        const result = electron.dialog.showOpenDialogSync(win, {
            properties: ['openFile'],
            filters: [{ name: 'JSON', extensions: ['json'] }],
            title: '导入配置',
        });
        if (!result || result.length === 0) return false;

        try {
            const content = fs.readFileSync(result[0], 'utf-8');
            return this.importConfig(content);
        } catch (e: any) {
            Editor.error('[resource-copy] 读取配置文件失败:', e);
            return false;
        }
    }

    exportConfigToFile(): boolean {
        const win = electron.BrowserWindow.getFocusedWindow();
        if (!win) return false;

        const result = electron.dialog.showSaveDialogSync(win, {
            filters: [{ name: 'JSON', extensions: ['json'] }],
            title: '导出配置',
            defaultPath: 'resource-copy-config-export.json',
        });
        if (!result) return false;

        try {
            fs.writeFileSync(result, this.exportConfig(), 'utf-8');
            return true;
        } catch (e: any) {
            Editor.error('[resource-copy] 导出配置文件失败:', e);
            return false;
        }
    }
}
