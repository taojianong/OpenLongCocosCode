// ============================================================
// Design Ruler 插件 - 主进程模块
// ============================================================
// 职责：
// 1. 管理场景/预制体级别的标尺数据持久化（对齐线、设计图、可见性）
// 2. 通过 IPC 与渲染进程（inject.js）通信
// 3. 处理设计图的加载、缓存和回退逻辑
// 4. 监听场景切换事件，自动加载/保存对应数据
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const nodeCrypto = require('crypto');
const electron = require('electron');
const { ResourceCopyHandler } = require('./resource-copy-handler');
const PACKAGE_NAME = 'cocos-design-ruler';
// ============================================================
// 缓存目录配置（系统临时目录，避免多用户/项目冲突）
// ============================================================
// 路径结构：{系统temp}/cocos-design-ruler-{用户名}/{项目hash}/
// 这样每个用户的每个项目都有独立的缓存目录
const TMP_BASE = os.tmpdir();
//@ts-ignore
const userName = (os.userInfo && os.userInfo().username) ? os.userInfo().username : process.env.USER || process.env.USERNAME || 'unknown';
//@ts-ignore
const projectHash = nodeCrypto.createHash('md5').update(process.cwd() || '').digest('hex').substr(0, 8);
const DATA_DIR = path.join(TMP_BASE, PACKAGE_NAME + '-' + userName, projectHash);
const DATA_FILE = path.join(DATA_DIR, 'data.json');
// ============================================================
// 运行时状态（当前场景的数据）
// ============================================================
var _currentSceneUuid = ''; // 当前场景/预制体的 UUID
var _currentGuides = []; // 当前对齐线数组
var _currentDesignImagePath = ''; // 当前设计图文件路径（不存 base64，节省内存）
var _currentVisible = false; // 标尺当前是否显示
// ============================================================
// 资源拷贝处理器
// ============================================================
var _resourceCopyHandler = new ResourceCopyHandler(DATA_DIR);
/**
 * 确保缓存目录存在
 */
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}
/**
 * 读取所有场景的缓存数据
 * @returns {Object} 键为场景UUID，值为该场景的数据对象
 */
function getAllData() {
    if (!fs.existsSync(DATA_FILE))
        return {};
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
    catch (e) {
        return {};
    }
}
/**
 * 保存当前场景的数据到缓存文件
 * 使用场景 UUID 作为键，存储对齐线、设计图路径和可见性状态
 */
function saveCurrentData() {
    if (!_currentSceneUuid)
        return;
    ensureDataDir();
    var allData = getAllData();
    allData[_currentSceneUuid] = {
        guides: _currentGuides,
        designImagePath: _currentDesignImagePath,
        visible: _currentVisible,
    };
    try {
        // Editor.log('[design-ruler] 保存场景数据:', _currentSceneUuid);
        fs.writeFileSync(DATA_FILE, JSON.stringify(allData, null, 2), 'utf-8');
    }
    catch (e) {
        Editor.error('[design-ruler] 保存数据失败:', e);
    }
}
/**
 * 从缓存中加载指定场景的数据
 * @param {string} uuid - 场景/预制体 UUID
 * @returns {Object|null} 场景数据对象或 null
 */
function loadSceneData(uuid) {
    var allData = getAllData();
    return allData[uuid] || null;
}
/**
 * 应用场景数据到渲染层
 * 当切换场景/预制体时调用，负责加载缓存数据并同步到渲染进程
 *
 * 特殊逻辑：进入预制体编辑时，如果预制体没有缓存的设计图，
 * 会回退使用上一个场景的设计图（方便预制体编辑时参考）
 *
 * @param {string} uuid - 场景/预制体 UUID
 */
function applySceneData(uuid) {
    _currentSceneUuid = uuid;
    _currentGuides = [];
    // 保留上一个场景的设计图路径（用于回退）
    var _prevDesignImagePath = _currentDesignImagePath;
    _currentDesignImagePath = '';
    _currentVisible = false;
    // 尝试加载新场景的缓存数据
    var data = loadSceneData(uuid);
    if (!data) {
        // === 无缓存数据：尝试回退到上一个场景的设计图 ===
        if (_prevDesignImagePath && fs.existsSync(_prevDesignImagePath)) {
            _currentDesignImagePath = _prevDesignImagePath;
            try {
                // 将设计图转换为 base64 DataURL 传递给渲染层
                var ext = path.extname(_prevDesignImagePath).toLowerCase();
                var mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
                var base64 = fs.readFileSync(_prevDesignImagePath).toString('base64');
                var dataUrl = 'data:' + mime + ';base64,' + base64;
                Editor.Scene.callSceneScript(PACKAGE_NAME, 'set-design-image', dataUrl, () => { });
            }
            catch (e) {
                Editor.error('[design-ruler] 回退加载设计图失败:', e);
            }
            // 保持标尺可见性状态，清空对齐线
            sendToRenderer('design-ruler:update-state', { visible: _currentVisible, guides: [] });
            return;
        }
        // === 无缓存且无回退图：使用默认状态（隐藏） ===
        sendToRenderer('design-ruler:update-state', { visible: false, guides: [] });
        return;
    }
    // 恢复标尺显示状态
    if (data.visible !== undefined) {
        _currentVisible = data.visible;
        sendToRenderer('design-ruler:update-state', { visible: data.visible });
    }
    if (data.guides && data.guides.length > 0) {
        _currentGuides = data.guides;
        sendToRenderer('design-ruler:update-state', { guides: data.guides });
    }
    if (data.designImagePath && fs.existsSync(data.designImagePath)) {
        _currentDesignImagePath = data.designImagePath;
        try {
            var ext = path.extname(data.designImagePath).toLowerCase();
            var mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
            var base64 = fs.readFileSync(data.designImagePath).toString('base64');
            var dataUrl = 'data:' + mime + ';base64,' + base64;
            Editor.Scene.callSceneScript(PACKAGE_NAME, 'set-design-image', dataUrl, () => { });
        }
        catch (e) {
            Editor.error('[design-ruler] 加载设计图失败:', e);
        }
    }
}
function getMainWebContents() {
    var allwins = electron.BrowserWindow.getAllWindows();
    for (var i = 0; i < allwins.length; i++) {
        var win = allwins[i];
        var url = win.getURL();
        if (url.includes('windows/main.html') || url.includes('app.asar/editor/index.html') || (win.title && win.title.includes('Cocos Creator'))) {
            return win.webContents;
        }
    }
    return null;
}
function sendToRenderer(channel, ...args) {
    var wc = getMainWebContents();
    if (wc) {
        wc.send(channel, ...args);
    }
}
var _injected = false;
function injectOverlay() {
    var wc = getMainWebContents();
    if (!wc || _injected)
        return;
    // @ts-ignore
    var code = fs.readFileSync(path.join(__dirname, '..', 'inject.js'), 'utf-8');
    wc.executeJavaScript(code, () => {
        Editor.log('[design-ruler] inject 完成');
    });
    _injected = true;
}
function cleanupOverlay() {
    sendToRenderer('design-ruler:cleanup');
    _injected = false;
}
// @ts-ignore
module.exports = {
    load() {
        Editor.log('[design-ruler] 插件已加载');
        injectOverlay();
        electron.app.on('web-contents-created', (_sender, webContents) => {
            webContents.on('dom-ready', () => {
                _injected = false;
                injectOverlay();
            });
        });
    },
    unload() {
        cleanupOverlay();
        Editor.Scene.callSceneScript(PACKAGE_NAME, 'cleanup', () => { });
        Editor.log('[design-ruler] 插件已卸载');
    },
    messages: {
        //重新注入代码,主要用于开发过程中快速刷新注入层
        'reinject'() {
            Editor.log('[design-ruler] received reinject');
            _injected = false;
            injectOverlay();
            // 重新初始化场景脚本并恢复当前数据
            Editor.Scene.callSceneScript(PACKAGE_NAME, 'init', () => {
                if (_currentSceneUuid) {
                    // small delay to let scene script finish setup
                    setTimeout(() => {
                        applySceneData(_currentSceneUuid);
                    }, 100);
                }
            });
        },
        'open-panel'() {
            Editor.Panel.open(PACKAGE_NAME);
        },
        'open-resource-copy'() {
            Editor.Panel.open(`${PACKAGE_NAME}.export`);
        },
        'toggle-visible'() {
            sendToRenderer(`${PACKAGE_NAME}:toggle-visible`);
        },
        // 标尺显示状态改变
        'visible-changed'(event, visible) {
            _currentVisible = visible;
            saveCurrentData();
        },
        //打开预制体
        'scene:enter-prefab-edit-mode'(event, uuid) {
            if (!_injected)
                injectOverlay();
            // 保存当前场景数据
            saveCurrentData();
            // Editor.log('[design-ruler] scene:enter-prefab-edit-mode uuid:', uuid);
            // 先清除当前数据
            sendToRenderer('design-ruler:clear-guides');
            Editor.Scene.callSceneScript(PACKAGE_NAME, 'clear-design-image', () => { });
            setTimeout(() => {
                Editor.Scene.callSceneScript(PACKAGE_NAME, 'init', () => {
                    if (uuid)
                        applySceneData(uuid);
                });
            }, 500);
        },
        //打开场景
        'scene:ready'(event) {
            Editor.Scene.callSceneScript(PACKAGE_NAME, 'open-scene', (err, uuid) => {
                Editor.log('[design-ruler] scene:ready callback uuid:', uuid, ' err:', err);
                Editor.Ipc.sendToMain('cocos-design-ruler:scene-ready', uuid); //
            });
        },
        'scene-ready'(event, uuid) {
            if (!_injected)
                injectOverlay();
            // 保存当前场景数据
            saveCurrentData();
            Editor.log('[design-ruler] *** scene-ready uuid:', uuid, event);
            // 先清除当前数据
            sendToRenderer('design-ruler:clear-guides');
            //清除设计图
            Editor.Scene.callSceneScript(PACKAGE_NAME, 'clear-design-image', () => { });
            setTimeout(() => {
                Editor.Scene.callSceneScript(PACKAGE_NAME, 'init', () => {
                    if (uuid)
                        applySceneData(uuid);
                });
            }, 500);
        },
        'add-guide'(event, guide) {
            sendToRenderer('design-ruler:add-guide', guide);
        },
        'remove-guide'(event, index) {
            sendToRenderer('design-ruler:remove-guide', index);
        },
        'clear-guides'() {
            _currentGuides = [];
            sendToRenderer('design-ruler:clear-guides');
            saveCurrentData();
        },
        'set-design-image'(event, base64, filePath) {
            // 保存文件路径用于持久化
            if (filePath) {
                _currentDesignImagePath = filePath;
                saveCurrentData();
            }
            Editor.Scene.callSceneScript(PACKAGE_NAME, 'set-design-image', base64, (err) => {
                if (err)
                    Editor.error('[design-ruler] set-design-image error:', err);
            });
        },
        'clear-design-image'() {
            _currentDesignImagePath = '';
            saveCurrentData();
            Editor.Scene.callSceneScript(PACKAGE_NAME, 'clear-design-image', () => { });
        },
        'set-guide-color'(event, color) {
            sendToRenderer('design-ruler:set-guide-color', color);
        },
        'set-guide-opacity'(event, opacity) {
            sendToRenderer('design-ruler:set-guide-opacity', opacity);
        },
        'set-design-opacity'(event, opacity) {
            Editor.Scene.callSceneScript(PACKAGE_NAME, 'set-design-opacity', opacity, () => { });
        },
        'set-guides-enabled'(event, enabled) {
            sendToRenderer('design-ruler:set-guides-enabled', enabled);
        },
        'set-default-dashed'(event, dashed) {
            sendToRenderer('design-ruler:set-default-dashed', dashed);
        },
        // 从注入层回传：对齐线被拖动后的新位置
        'guide-moved'(event, guidesJson) {
            Editor.log('[design-ruler] guide-moved _currentSceneUuid:', _currentSceneUuid);
            Editor.log('[design-ruler] guide-moved guidesJson:', guidesJson);
            try {
                var guides = JSON.parse(guidesJson);
                if (Array.isArray(guides)) {
                    _currentGuides = guides;
                    Editor.log('[design-ruler] guide-moved 保存前 _currentGuides:', JSON.stringify(_currentGuides));
                    saveCurrentData();
                    Editor.Ipc.sendToPanel(PACKAGE_NAME, 'update-guides-list', guidesJson);
                }
            }
            catch (e) {
                Editor.error('[design-ruler] guide-moved 错误:', e);
            }
        },
        // 获取资源拷贝规则
        'get-copy-rules'() {
            var rules = _resourceCopyHandler.getCopyRules();
            Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'update-copy-rules', JSON.stringify(rules));
        },
        // 保存资源拷贝规则
        'save-copy-rules'(event, rulesJson) {
            try {
                var rules = JSON.parse(rulesJson);
                _resourceCopyHandler.saveCopyRules(rules);
            }
            catch (e) {
                Editor.error('[resource-copy] 保存拷贝规则失败:', e);
            }
        },
        // 浏览目录
        'browse-directory'(event, data) {
            try {
                var dataObj = JSON.parse(data);
                _resourceCopyHandler.openDirectoryDialog(dataObj);
            }
            catch (e) {
                Editor.error('[resource-copy] 处理目录浏览失败:', e);
            }
        },
        // 浏览根目录
        'browse-root-dir'(event, data) {
            try {
                var dataObj = JSON.parse(data);
                _resourceCopyHandler.openRootDirDialog(dataObj);
            }
            catch (e) {
                Editor.error('[resource-copy] 处理根目录浏览失败:', e);
            }
        },
        // 获取根目录配置
        'get-root-dirs'() {
            var config = _resourceCopyHandler.getRootDirs();
            Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'update-root-dirs', JSON.stringify(config));
        },
        // 保存根目录配置
        'save-root-dirs'(event, configJson) {
            try {
                var config = JSON.parse(configJson);
                _resourceCopyHandler.saveRootDirs(config);
            }
            catch (e) {
                Editor.error('[resource-copy] 保存根目录配置失败:', e);
            }
        },
        // 拷贝单个资源
        'copy-single-resource'(event, ruleJson) {
            try {
                var rule = JSON.parse(ruleJson);
                var result = _resourceCopyHandler.copySingleResource(rule);
                Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'copy-result', JSON.stringify({
                    success: result.fileCount > 0 || result.metaCount >= 0,
                    fileCount: result.fileCount,
                    metaCount: result.metaCount,
                    ruleName: rule.name || ''
                }));
            }
            catch (e) {
                Editor.error('[resource-copy] 拷贝单个资源失败:', e);
                Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'copy-result', JSON.stringify({
                    success: false,
                    fileCount: 0,
                    metaCount: 0,
                    ruleName: ''
                }));
            }
        },
        // 拷贝所有资源
        'copy-all-resources'(event, rulesJson) {
            try {
                var rules = JSON.parse(rulesJson);
                if (Array.isArray(rules)) {
                    var result = _resourceCopyHandler.copyAllResources(rules);
                    Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'copy-result', JSON.stringify({
                        success: result.fileCount > 0 || result.metaCount >= 0,
                        fileCount: result.fileCount,
                        metaCount: result.metaCount,
                        ruleName: ''
                    }));
                }
            }
            catch (e) {
                Editor.error('[resource-copy] 拷贝所有资源失败:', e);
                Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'copy-result', JSON.stringify({
                    success: false,
                    fileCount: 0,
                    metaCount: 0,
                    ruleName: ''
                }));
            }
        },
        // 刷新meta文件
        'refresh-meta-files'(event, dirPath) {
            try {
                var metaCount = _resourceCopyHandler.generateMissingMetaFiles(dirPath, true);
                if (metaCount > 0) {
                    _resourceCopyHandler.refreshAssetDb(dirPath);
                    Editor.log('[resource-copy] 手动刷新meta:', metaCount, '个');
                }
                Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'meta-refresh-result', JSON.stringify({ count: metaCount }));
            }
            catch (e) {
                Editor.error('[resource-copy] 刷新meta失败:', e);
            }
        },
        // 获取历史记录
        'get-copy-history'() {
            var history = _resourceCopyHandler.getHistory();
            Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'update-copy-history', JSON.stringify(history));
        },
        // 清空历史记录
        'clear-copy-history'() {
            _resourceCopyHandler.clearHistory();
            Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'update-copy-history', JSON.stringify([]));
        },
        // 导入配置
        'import-config'() {
            var success = _resourceCopyHandler.importConfigFromFile();
            if (success) {
                var rules = _resourceCopyHandler.getCopyRules();
                var config = _resourceCopyHandler.getRootDirs();
                Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'update-copy-rules', JSON.stringify(rules));
                Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'update-root-dirs', JSON.stringify(config));
                Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'import-result', JSON.stringify({ success: true }));
            }
            else {
                Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'import-result', JSON.stringify({ success: false }));
            }
        },
        // 导出配置
        'export-config'() {
            var success = _resourceCopyHandler.exportConfigToFile();
            Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'export-result', JSON.stringify({ success }));
        },
        // 打开源目录
        'open-source-dir'(event, data) {
            try {
                var obj = JSON.parse(data);
                _resourceCopyHandler.openInExplorer(obj.path);
            }
            catch (e) {
                Editor.error('[resource-copy] 打开目录失败:', e);
            }
        },
        // 打开目标目录
        'open-target-dir'(event, dirPath) {
            try {
                _resourceCopyHandler.openTargetInExplorer(dirPath);
            }
            catch (e) {
                Editor.error('[resource-copy] 打开目录失败:', e);
            }
        },
        // 清空目标目录
        'clear-target-dir'(event, dirPath) {
            try {
                var result = _resourceCopyHandler.clearTargetDir(dirPath);
                Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'clear-result', JSON.stringify(result));
            }
            catch (e) {
                Editor.error('[resource-copy] 清空目录失败:', e);
                Editor.Ipc.sendToPanel(`${PACKAGE_NAME}.export`, 'clear-result', JSON.stringify({ success: false, fileCount: 0 }));
            }
        },
        //打开导出面板
        'open'() {
            // open entry panel registered in package.json
            Editor.Panel.open(`${PACKAGE_NAME}.export`);
            Editor.log(`[main.js]--->打开面板`);
        }
    },
};
