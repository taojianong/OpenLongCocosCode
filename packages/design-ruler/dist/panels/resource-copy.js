'use strict';
const RESOURCE_PKG_NAME = 'cocos-design-ruler';
function sendResourceToMain(msg, ...args) {
    const fullMsg = `${RESOURCE_PKG_NAME}:${msg}`;
    Editor.Ipc.sendToMain(fullMsg, ...args);
}
module.exports = Editor.Panel.extend({
    style: `.panel {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #3a3a3a;
    color: #ffffff;
    font-family: Arial, sans-serif;
    font-size: 12px;
}
.header {
    padding: 10px 15px;
    border-bottom: 1px solid #505050;
    background: #2a2a2a;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.header h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #ff6b6b;
}
.toolbar {
    display: flex;
    gap: 6px;
}
.toolbar-btn {
    padding: 4px 10px;
    background: #555;
    color: #ccc;
    border: 1px solid #666;
    border-radius: 3px;
    font-size: 11px;
    cursor: pointer;
}
.toolbar-btn:hover {
    background: #666;
    color: #fff;
}
.tabs {
    display: flex;
    border-bottom: 1px solid #505050;
    background: #333;
}
.tab-btn {
    flex: 1;
    padding: 8px;
    background: transparent;
    color: #999;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
}
.tab-btn:hover {
    color: #ccc;
}
.tab-btn.active {
    color: #ff6b6b;
    border-bottom-color: #ff6b6b;
    background: #3a3a3a;
}
.tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: none;
}
.tab-content.active {
    display: block;
}
.root-dir-section {
    margin-bottom: 15px;
    padding: 10px;
    background: #404040;
    border-radius: 4px;
    border-left: 3px solid #4a90e2;
}
.root-dir-section h4 {
    margin: 0 0 10px 0;
    font-size: 12px;
    font-weight: 600;
    color: #ffb347;
}
.root-dir-item {
    margin-bottom: 8px;
}
.root-dir-item:last-child {
    margin-bottom: 0;
}
.root-dir-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}
.root-dir-label {
    font-size: 11px;
    color: #ccc;
    min-width: 70px;
}
.export-dir-list {
    margin-top: 8px;
}
.export-dir-item {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
}
.export-dir-item input {
    flex: 1;
}
.remove-dir-btn {
    padding: 3px 7px;
    background: #e63946;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 10px;
    cursor: pointer;
}
.remove-dir-btn:hover {
    background: #d62828;
}
.add-dir-btn {
    width: auto;
    padding: 5px 10px;
    margin-top: 6px;
    background: #4a90e2;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 11px;
    cursor: pointer;
}
.add-dir-btn:hover {
    background: #357abd;
}
.rules-list {
    margin-bottom: 10px;
}
.rule-item {
    background: #404040;
    border: 1px solid #505050;
    border-radius: 4px;
    margin-bottom: 8px;
    padding: 10px;
    transition: border-color 0.2s;
}
.rule-item:hover {
    border-color: #666;
}
.rule-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}
.rule-header input[type="checkbox"] {
    width: 15px;
    height: 15px;
    cursor: pointer;
}
.rule-number {
    font-size: 11px;
    color: #ffb347;
    min-width: 18px;
}
.name-input {
    flex: 1;
    max-width: 200px;
}
.rule-actions {
    margin-left: auto;
    display: flex;
    gap: 4px;
}
.rule-fields {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.field-row {
    display: flex;
    align-items: center;
    gap: 6px;
}
.field-label {
    font-size: 11px;
    color: #ccc;
    min-width: 55px;
}
.field-input {
    flex: 1;
    padding: 5px 7px;
    background: #353535;
    border: 1px solid #555;
    border-radius: 3px;
    color: #fff;
    font-size: 11px;
}
.field-input:focus {
    outline: none;
    border-color: #ff6b6b;
}
.field-input:disabled {
    background: #2a2a2a;
    color: #888;
}
.browse-btn {
    padding: 4px 8px;
    background: #555;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 10px;
    cursor: pointer;
    white-space: nowrap;
}
.browse-btn:hover {
    background: #666;
}
.rule-select {
    padding: 4px;
    background: #353535;
    border: 1px solid #555;
    border-radius: 3px;
    color: #fff;
    font-size: 11px;
}
.filter-input {
    flex: 1;
    padding: 5px 7px;
    background: #353535;
    border: 1px solid #555;
    border-radius: 3px;
    color: #fff;
    font-size: 11px;
}
.filter-input:disabled {
    background: #2a2a2a;
    color: #888;
}
.copy-btn {
    padding: 4px 10px;
    background: #4a90e2;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 11px;
    cursor: pointer;
}
.copy-btn:hover {
    background: #357abd;
}
.delete-btn {
    padding: 4px 8px;
    background: #e63946;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 11px;
    cursor: pointer;
}
.delete-btn:hover {
    background: #d62828;
}
.bottom-actions {
    display: flex;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid #505050;
    margin-top: 8px;
}
.bottom-btn {
    flex: 1;
    padding: 8px;
    background: #ff6b6b;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
}
.bottom-btn:hover {
    background: #ff5252;
}
.bottom-btn.secondary {
    background: #555;
}
.bottom-btn.secondary:hover {
    background: #666;
}
.path-type-badge {
    font-size: 9px;
    padding: 1px 5px;
    border-radius: 3px;
    background: #555;
    color: #fff;
    white-space: nowrap;
}
.path-type-badge.relative {
    background: #4a90e2;
}
.path-type-badge.absolute {
    background: #ff6b6b;
}
.resolved-path {
    font-size: 9px;
    color: #777;
    margin-top: 1px;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-left: 61px;
}
.source-dir-item {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 3px;
}
.remove-source-btn {
    padding: 2px 5px;
    background: #e63946;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 10px;
    cursor: pointer;
    line-height: 1;
}
.remove-source-btn:hover {
    background: #d62828;
}
.add-source-btn {
    padding: 2px 7px;
    background: #4a90e2;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 10px;
    cursor: pointer;
    margin-top: 2px;
}
.add-source-btn:hover {
    background: #357abd;
}
.clear-target-btn {
    background: #b34700;
}
.clear-target-btn:hover:not(:disabled) {
    background: #e63946;
}
.progress-bar-container {
    height: 4px;
    background: #353535;
    border-radius: 2px;
    margin: 6px 0;
    display: none;
}
.progress-bar-container.active {
    display: block;
}
.progress-bar {
    height: 100%;
    background: #4a90e2;
    border-radius: 2px;
    transition: width 0.2s;
    width: 0%;
}
.progress-label {
    font-size: 10px;
    color: #888;
    margin-bottom: 2px;
    display: none;
}
.progress-label.active {
    display: block;
}
.log-entry {
    padding: 3px 8px;
    font-size: 11px;
    font-family: Consolas, monospace;
    border-bottom: 1px solid #3a3a3a;
    word-break: break-all;
}
.log-entry.info { color: #ccc; }
.log-entry.warn { color: #ffb347; }
.log-entry.error { color: #ff6b6b; }
.log-time {
    color: #666;
    margin-right: 6px;
}
.log-section {
    margin-top: 10px;
    border-top: 1px solid #505050;
    padding-top: 8px;
}
.log-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
}
.log-section-title {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.log-section-content {
    max-height: 150px;
    overflow-y: auto;
    background: #2a2a2a;
    border-radius: 3px;
    border: 1px solid #444;
}
.history-item {
    background: #404040;
    border: 1px solid #505050;
    border-radius: 4px;
    padding: 8px 10px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
}
.history-time {
    font-size: 10px;
    color: #888;
    min-width: 130px;
}
.history-name {
    font-size: 11px;
    color: #ffb347;
    min-width: 80px;
}
.history-info {
    font-size: 11px;
    color: #ccc;
    flex: 1;
}
.history-empty {
    text-align: center;
    color: #888;
    padding: 30px;
    font-size: 12px;
}
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 6px;
    pointer-events: none;
}
.toast-item {
    padding: 8px 14px;
    border-radius: 4px;
    font-size: 12px;
    color: #fff;
    background: #4caf50;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    opacity: 0;
    transform: translateX(30px);
    transition: opacity 0.3s ease, transform 0.3s ease;
}
.toast-item.show {
    opacity: 1;
    transform: translateX(0);
}
.toast-item.error {
    background: #e63946;
}
::-webkit-scrollbar {
    width: 7px;
}
::-webkit-scrollbar-track {
    background: #353535;
    border-radius: 4px;
}
::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
    background: #666;
}`,
    template: `
<div class="panel">
  <div class="header">
    <h3>资源拷贝</h3>
    <div class="toolbar">
      <button id="btn-import" class="toolbar-btn">导入配置</button>
      <button id="btn-export" class="toolbar-btn">导出配置</button>
    </div>
  </div>
  <div class="tabs">
    <button id="tab-btn-rules" class="tab-btn active">拷贝规则</button>
    <button id="tab-btn-history" class="tab-btn">历史记录</button>
  </div>
  <div id="progress-bar-container" class="progress-bar-container"><div id="progress-bar" class="progress-bar"></div></div>
  <div id="progress-label" class="progress-label"></div>
  <div id="tab-content-rules" class="tab-content active">
    <div class="root-dir-section">
      <h4>根目录设置</h4>
      <div class="root-dir-item">
        <div class="root-dir-header">
          <span class="root-dir-label">资源根目录:</span>
          <input type="text" id="source-root" class="field-input" placeholder="选择资源根目录">
          <button id="browse-source-root" class="browse-btn">浏览</button>
        </div>
      </div>
      <div class="root-dir-item">
        <div class="root-dir-header">
          <span class="root-dir-label">导出根目录:</span>
        </div>
        <div id="export-root-list" class="export-dir-list"></div>
        <button id="add-export-root" class="add-dir-btn">+ 添加导出目录</button>
      </div>
    </div>
    <div id="rules-list" class="rules-list"></div>
    <div class="bottom-actions">
      <button id="add-rule-btn" class="bottom-btn secondary">+ 添加条目</button>
      <button id="undo-btn" class="bottom-btn secondary" style="background:#b34700">撤销</button>
      <button id="select-all-btn" class="bottom-btn secondary">全部选中</button>
      <button id="copy-all-btn" class="bottom-btn">全部拷贝</button>
    </div>
    <div class="log-section">
      <div class="log-section-header">
        <span class="log-section-title">日志</span>
        <button id="clear-logs-btn" class="toolbar-btn">清空</button>
      </div>
      <div id="log-list" class="log-section-content"></div>
    </div>
  </div>
  <div id="tab-content-history" class="tab-content">
    <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
      <button id="clear-history-btn" class="toolbar-btn">清空历史</button>
    </div>
    <div id="history-list"></div>
  </div>
  <div id="toast-container" class="toast-container"></div>
</div>`,
    $: {
        sourceRoot: '#source-root',
        browseSourceRoot: '#browse-source-root',
        exportRootList: '#export-root-list',
        addExportRoot: '#add-export-root',
        rulesList: '#rules-list',
        selectAllBtn: '#select-all-btn',
        copyAllBtn: '#copy-all-btn',
        addRuleBtn: '#add-rule-btn',
        undoBtn: '#undo-btn',
        toastContainer: '#toast-container',
        historyList: '#history-list',
        clearHistoryBtn: '#clear-history-btn',
        logList: '#log-list',
        clearLogsBtn: '#clear-logs-btn',
        btnImport: '#btn-import',
        btnExport: '#btn-export',
        progressBarContainer: '#progress-bar-container',
        progressBar: '#progress-bar',
        progressLabel: '#progress-label',
        tabBtnRules: '#tab-btn-rules',
        tabBtnHistory: '#tab-btn-history',
        tabContentRules: '#tab-content-rules',
        tabContentHistory: '#tab-content-history',
    },
    ready() {
        this._rules = [];
        this._rootConfig = {
            sourceRoot: '',
            exportRoots: []
        };
        const self = this;
        const allTabBtns = [this.$tabBtnRules, this.$tabBtnHistory];
        const allTabContents = [this.$tabContentRules, this.$tabContentHistory];
        this.$tabBtnRules.addEventListener('click', () => {
            allTabBtns.forEach((b) => b.classList.remove('active'));
            allTabContents.forEach((c) => c.classList.remove('active'));
            this.$tabBtnRules.classList.add('active');
            this.$tabContentRules.classList.add('active');
        });
        this.$tabBtnHistory.addEventListener('click', () => {
            allTabBtns.forEach((b) => b.classList.remove('active'));
            allTabContents.forEach((c) => c.classList.remove('active'));
            this.$tabBtnHistory.classList.add('active');
            this.$tabContentHistory.classList.add('active');
            sendResourceToMain('get-copy-history');
        });
        this.$browseSourceRoot.addEventListener('click', () => {
            sendResourceToMain('browse-root-dir', JSON.stringify({ type: 'source' }));
        });
        this.$addExportRoot.addEventListener('click', () => {
            sendResourceToMain('browse-root-dir', JSON.stringify({ type: 'export' }));
        });
        this.$sourceRoot.addEventListener('change', (e) => {
            this._rootConfig.sourceRoot = e.target.value;
            sendResourceToMain('save-root-dirs', JSON.stringify(this._rootConfig));
            this.renderRules();
        });
        this.$addRuleBtn.addEventListener('click', () => this.addRule());
        this.$selectAllBtn.addEventListener('click', () => {
            const allSelected = this._rules.every((r) => r.enabled);
            this._rules.forEach((r) => r.enabled = !allSelected);
            this.saveRules();
            this.renderRules();
        });
        this.$copyAllBtn.addEventListener('click', () => {
            const enabledRules = this._rules.filter((r) => r.enabled);
            if (enabledRules.length === 0) {
                this.showToast('请先选择要拷贝的规则', true);
                return;
            }
            sendResourceToMain('copy-all-resources', JSON.stringify(enabledRules));
        });
        this.$clearHistoryBtn.addEventListener('click', () => {
            sendResourceToMain('clear-copy-history');
            this.showToast('历史记录已清空');
        });
        this.$undoBtn.addEventListener('click', () => {
            if (!confirm('确认撤销上次拷贝操作？'))
                return;
            sendResourceToMain('undo-last-copy');
        });
        this.$clearLogsBtn.addEventListener('click', () => {
            sendResourceToMain('clear-copy-logs');
            this.$logList.innerHTML = '';
        });
        this.$btnImport.addEventListener('click', () => {
            sendResourceToMain('import-config');
        });
        this.$btnExport.addEventListener('click', () => {
            sendResourceToMain('export-config');
        });
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                const allSelected = this._rules.every((r) => r.enabled);
                this._rules.forEach((r) => r.enabled = !allSelected);
                this.saveRules();
                this.renderRules();
            }
        });
        sendResourceToMain('get-copy-rules');
        sendResourceToMain('get-root-dirs');
    },
    firstLoad(rules) {
        this._rules = rules;
        if (!this._rules || this._rules.length === 0) {
            this.addRule();
        }
        else {
            this.renderRules();
        }
    },
    renderExportRoots() {
        const list = this.$exportRootList;
        list.innerHTML = '';
        if (!this._rootConfig.exportRoots || this._rootConfig.exportRoots.length === 0) {
            list.innerHTML = '<div style="padding:8px;color:#888;font-size:11px;">暂无导出根目录</div>';
            return;
        }
        Editor.log('[resource-copy] Rendering export roots:', this._rootConfig.exportRoots);
        this._rootConfig.exportRoots.forEach((root, index) => {
            const item = document.createElement('div');
            item.className = 'export-dir-item';
            item.innerHTML = `
                <input type="text" class="field-input" value="" data-index="${index}" placeholder="导出根目录">
                    <button class="browse-btn" data-action="browse-export" data-index="${index}">浏览</button>
                    <button class="remove-dir-btn" data-index="${index}">删除</button>
            `;
            list.appendChild(item);
        });
        Array.from(list.querySelectorAll('.export-dir-item .field-input')).forEach((input) => {
            const index = parseInt(input.dataset.index);
            input.value = this._rootConfig.exportRoots[index] || '';
            Editor.log('[resource-copy] Set export root input value:', index, input.value);
        });
        Array.from(list.querySelectorAll('.export-dir-item .browse-btn')).forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                sendResourceToMain('browse-root-dir', JSON.stringify({ type: 'export-edit', index }));
            });
        });
        Array.from(list.querySelectorAll('.export-dir-item .remove-dir-btn')).forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this._rootConfig.exportRoots.splice(index, 1);
                sendResourceToMain('save-root-dirs', JSON.stringify(this._rootConfig));
                this.renderExportRoots();
                this.renderRules(); // 重新渲染规则以更新路径类型
            });
        });
        Editor.log('[resource-copy] Export roots rendered');
    },
    addRule() {
        const newRule = {
            id: Date.now().toString(),
            enabled: true,
            name: '',
            sourceDirs: [''],
            targetDir: '',
            copyRule: 'all',
            recursive: true,
        };
        this._rules.push(newRule);
        this.saveRules();
        this.renderRules();
    },
    deleteRule(id) {
        this._rules = this._rules.filter((r) => r.id !== id);
        this.saveRules();
        this.renderRules();
    },
    saveRules() {
        sendResourceToMain('save-copy-rules', JSON.stringify(this._rules));
    },
    copySingleRule(id) {
        const rule = this._rules.find((r) => r.id === id);
        if (rule) {
            sendResourceToMain('copy-single-resource', JSON.stringify(rule));
        }
    },
    getSourceDirs(rule) {
        if (rule.sourceDirs && rule.sourceDirs.length > 0) {
            return rule.sourceDirs.filter((d) => d !== undefined && d !== null);
        }
        if (rule.sourceDir) {
            return [rule.sourceDir];
        }
        return [];
    },
    showToast(message, isError) {
        const container = this.$toastContainer;
        if (!container)
            return;
        const toast = document.createElement('div');
        toast.className = 'toast-item' + (isError ? ' error' : '');
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode)
                    toast.parentNode.removeChild(toast);
            }, 300);
        }, 3000);
    },
    getPathType(filePath) {
        if (!filePath)
            return '';
        if (/^[a-zA-Z]:\\/.test(filePath) || /^\//.test(filePath)) {
            return 'absolute';
        }
        return 'relative';
    },
    getResolvedPath(filePath, type) {
        if (!filePath)
            return '';
        if (this.getPathType(filePath) === 'absolute')
            return filePath;
        if (type === 'source') {
            if (!this._rootConfig.sourceRoot)
                return filePath;
            return this._rootConfig.sourceRoot.replace(/[\\\/]$/, '') + '\\' + filePath;
        }
        else {
            if (!this._rootConfig.exportRoots || this._rootConfig.exportRoots.length === 0)
                return filePath;
            return this._rootConfig.exportRoots
                .filter((r) => r)
                .map((r) => r.replace(/[\\\/]$/, '') + '\\' + filePath)
                .join(' | ');
        }
    },
    normalizeRule(rule) {
        if (!rule.sourceDirs || rule.sourceDirs.length === 0) {
            if (rule.sourceDir) {
                rule.sourceDirs = [rule.sourceDir];
                delete rule.sourceDir;
            }
            else {
                rule.sourceDirs = [''];
            }
        }
        if (rule.name === undefined) {
            rule.name = '';
        }
        if (!rule.copyRule) {
            rule.copyRule = 'all';
        }
        return rule;
    },
    getFilterPlaceholder(copyRule) {
        switch (copyRule) {
            case 'prefix': return '文件名前缀';
            case 'regex': return '正则表达式，如: .*\\.png';
            case 'ext': return '后缀列表，如: .png,.jpg';
            default: return '';
        }
    },
    getFilterValue(rule) {
        switch (rule.copyRule) {
            case 'prefix': return rule.filePrefix || '';
            case 'regex': return rule.fileRegex || '';
            case 'ext': return rule.fileExts || '';
            default: return '';
        }
    },
    renderRules() {
        const list = this.$rulesList;
        list.innerHTML = '';
        if (!this._rules || this._rules.length === 0) {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:#888;font-size:12px;">暂无拷贝规则</div>';
            return;
        }
        this._rules.forEach((rule, index) => {
            this.normalizeRule(rule);
            const sourceDirs = this.getSourceDirs(rule);
            const targetType = this.getPathType(rule.targetDir);
            const targetTypeText = targetType === 'relative' ? '相对' : '绝对';
            const resolvedTarget = this.getResolvedPath(rule.targetDir, 'target');
            const sourceDirRows = sourceDirs.map((src, srcIdx) => {
                const srcType = this.getPathType(src);
                const srcTypeText = srcType === 'relative' ? '相对' : '绝对';
                const resolvedSrc = this.getResolvedPath(src, 'source');
                return `
                    <div class="source-dir-item">
                        <input type="text" class="field-input source-dir-input" placeholder="源目录${sourceDirs.length > 1 ? (srcIdx + 1) : ''}" value="${src}" data-id="${rule.id}" data-source-index="${srcIdx}">
                        <button class="browse-btn" data-action="browse-source" data-id="${rule.id}" data-source-index="${srcIdx}">浏览</button>
                        <button class="browse-btn open-dir-btn" data-action="open-source" data-id="${rule.id}" data-source-index="${srcIdx}" ${!src ? 'disabled style="opacity:0.4"' : ''}>打开</button>
                        <span class="path-type-badge ${srcType}">${srcTypeText}</span>
                        ${sourceDirs.length > 1 ? '<button class="remove-source-btn" data-id="' + rule.id + '" data-source-index="' + srcIdx + '">-</button>' : ''}
                    </div>
                    <div class="resolved-path" style="padding-left:68px">→ ${resolvedSrc}</div>`;
            }).join('');
            const item = document.createElement('div');
            item.className = 'rule-item';
            item.innerHTML = `
                <div class="rule-header">
                    <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-id="${rule.id}">
                    <span class="rule-number">#${index + 1}</span>
                    <input type="text" class="field-input name-input" placeholder="备注名" value="${rule.name || ''}" data-field="name" data-id="${rule.id}" style="flex:1;max-width:150px;">
                    <div class="rule-actions">
                        <button class="copy-btn" data-id="${rule.id}">拷贝</button>
                        <button class="delete-btn" data-id="${rule.id}">删除</button>
                    </div>
                </div>
                <div class="rule-fields">
                    <div class="field-row">
                        <span class="field-label">源目录:</span>
                    </div>
                    ${sourceDirRows}
                    <button class="add-source-btn" data-id="${rule.id}">+ 添加源目录</button>
                    <div class="field-row" style="margin-top:8px">
                        <span class="field-label">目标目录:</span>
                        <input type="text" class="field-input target-dir-input" placeholder="选择目标目录" value="${rule.targetDir}" data-field="targetDir" data-id="${rule.id}">
                        <button class="browse-btn" data-action="browse-target" data-id="${rule.id}">浏览</button>
                        <button class="browse-btn open-dir-btn" data-action="open-target" data-id="${rule.id}" ${!rule.targetDir ? 'disabled style="opacity:0.4"' : ''}>打开</button>
                        <button class="browse-btn clear-target-btn" data-action="clear-target" data-id="${rule.id}" ${!rule.targetDir ? 'disabled style="opacity:0.4"' : ''}>清空</button>
                        <span class="path-type-badge ${targetType}">${targetTypeText}</span>
                    </div>
                    <div class="resolved-path" style="padding-left:68px">→ ${resolvedTarget}</div>
                    <div class="field-row">
                        <span class="field-label">拷贝模式:</span>
                        <label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer">
                            <input type="checkbox" ${rule.recursive !== false ? 'checked' : ''} data-field="recursive" data-id="${rule.id}">
                            递归子目录
                        </label>
                        <label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;margin-left:10px">
                            <input type="checkbox" ${rule.incremental ? 'checked' : ''} data-field="incremental" data-id="${rule.id}">
                            增量拷贝
                        </label>
                    </div>
                    <div class="field-row">
                        <span class="field-label">文件筛选:</span>
                        <select class="rule-select" data-field="copyRule" data-id="${rule.id}">
                            <option value="all" ${rule.copyRule === 'all' ? 'selected' : ''}>全部文件</option>
                            <option value="prefix" ${rule.copyRule === 'prefix' ? 'selected' : ''}>文件名开头</option>
                            <option value="regex" ${rule.copyRule === 'regex' ? 'selected' : ''}>正则匹配</option>
                            <option value="ext" ${rule.copyRule === 'ext' ? 'selected' : ''}>文件后缀</option>
                        </select>
                        <input type="text" class="filter-input filter-value-input" placeholder="${this.getFilterPlaceholder(rule.copyRule)}" value="${this.getFilterValue(rule)}" data-field="filterValue" data-id="${rule.id}" ${rule.copyRule === 'all' ? 'disabled' : ''}>
                    </div>
                </div>
            `;
            list.appendChild(item);
        });
        // 勾选
        list.querySelectorAll('.rule-item input[type="checkbox"]:not([data-field])').forEach((cb) => {
            cb.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const rule = this._rules.find((r) => r.id === id);
                if (rule) {
                    rule.enabled = e.target.checked;
                    this.saveRules();
                }
            });
        });
        // 删除
        list.querySelectorAll('.delete-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.deleteRule(e.target.dataset.id);
            });
        });
        // 拷贝
        list.querySelectorAll('.copy-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.copySingleRule(e.target.dataset.id);
            });
        });
        // 浏览按钮 - 源目录
        list.querySelectorAll('.browse-btn[data-action="browse-source"]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const sourceIndex = parseInt(e.target.dataset.sourceIndex) || 0;
                sendResourceToMain('browse-directory', JSON.stringify({ id, action: 'browse-source', sourceIndex }));
            });
        });
        // 浏览按钮 - 目标目录
        list.querySelectorAll('.browse-btn[data-action="browse-target"]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                sendResourceToMain('browse-directory', JSON.stringify({ id, action: 'browse-target' }));
            });
        });
        // 打开源目录
        list.querySelectorAll('.open-dir-btn[data-action="open-source"]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const srcIdx = parseInt(e.target.dataset.sourceIndex) || 0;
                const rule = this._rules.find((r) => r.id === id);
                if (rule) {
                    this.normalizeRule(rule);
                    const src = rule.sourceDirs[srcIdx];
                    if (src)
                        sendResourceToMain('open-source-dir', JSON.stringify({ path: src }));
                }
            });
        });
        // 打开目标目录
        list.querySelectorAll('.open-dir-btn[data-action="open-target"]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const rule = this._rules.find((r) => r.id === id);
                if (rule && rule.targetDir) {
                    sendResourceToMain('open-target-dir', rule.targetDir);
                }
            });
        });
        // 清空目标目录
        list.querySelectorAll('.clear-target-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const rule = this._rules.find((r) => r.id === id);
                if (rule && rule.targetDir) {
                    const nameSuffix = rule.name ? ` "${rule.name}"` : '';
                    if (!confirm(`确认清空${nameSuffix}的目标目录内容？此操作不可撤销！`))
                        return;
                    sendResourceToMain('clear-target-dir', rule.targetDir);
                }
            });
        });
        // 备注名输入
        list.querySelectorAll('.name-input').forEach((input) => {
            input.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const rule = this._rules.find((r) => r.id === id);
                if (rule) {
                    rule.name = e.target.value;
                    this.saveRules();
                }
            });
        });
        // 源目录输入
        list.querySelectorAll('.source-dir-input').forEach((input) => {
            input.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const srcIdx = parseInt(e.target.dataset.sourceIndex);
                const rule = this._rules.find((r) => r.id === id);
                if (rule) {
                    this.normalizeRule(rule);
                    rule.sourceDirs[srcIdx] = e.target.value;
                    this.saveRules();
                }
            });
        });
        // 目标目录输入
        list.querySelectorAll('.target-dir-input').forEach((input) => {
            input.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const rule = this._rules.find((r) => r.id === id);
                if (rule) {
                    rule.targetDir = e.target.value;
                    this.saveRules();
                }
            });
        });
        // 删除源目录
        list.querySelectorAll('.remove-source-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const srcIdx = parseInt(e.target.dataset.sourceIndex);
                const rule = this._rules.find((r) => r.id === id);
                if (rule) {
                    this.normalizeRule(rule);
                    rule.sourceDirs.splice(srcIdx, 1);
                    if (rule.sourceDirs.length === 0)
                        rule.sourceDirs = [''];
                    this.saveRules();
                    this.renderRules();
                }
            });
        });
        // 添加源目录
        list.querySelectorAll('.add-source-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const rule = this._rules.find((r) => r.id === id);
                if (rule) {
                    this.normalizeRule(rule);
                    rule.sourceDirs.push('');
                    this.saveRules();
                    this.renderRules();
                }
            });
        });
        // 拷贝模式
        list.querySelectorAll('.rule-item .rule-select').forEach((select) => {
            select.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const rule = this._rules.find((r) => r.id === id);
                if (rule) {
                    rule.copyRule = e.target.value;
                    const filterInput = e.target.parentElement.querySelector('.filter-value-input');
                    if (filterInput) {
                        filterInput.disabled = rule.copyRule === 'all';
                        filterInput.placeholder = this.getFilterPlaceholder(rule.copyRule);
                        filterInput.value = '';
                    }
                    this.saveRules();
                    this.renderRules();
                }
            });
        });
        // 筛选值输入
        list.querySelectorAll('.rule-item .filter-value-input').forEach((input) => {
            input.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const rule = this._rules.find((r) => r.id === id);
                if (rule) {
                    switch (rule.copyRule) {
                        case 'prefix':
                            rule.filePrefix = e.target.value;
                            break;
                        case 'regex':
                            rule.fileRegex = e.target.value;
                            break;
                        case 'ext':
                            rule.fileExts = e.target.value;
                            break;
                    }
                    this.saveRules();
                }
            });
        });
        // 递归
        list.querySelectorAll('.rule-item input[data-field="recursive"]').forEach((checkbox) => {
            checkbox.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const rule = this._rules.find((r) => r.id === id);
                if (rule) {
                    rule.recursive = e.target.checked;
                    this.saveRules();
                }
            });
        });
        list.querySelectorAll('.rule-item input[data-field="incremental"]').forEach((checkbox) => {
            checkbox.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const rule = this._rules.find((r) => r.id === id);
                if (rule) {
                    rule.incremental = e.target.checked;
                    this.saveRules();
                }
            });
        });
        // 设置输入框初始值
        Array.from(list.querySelectorAll('.source-dir-input')).forEach((input) => {
            const rule = this._rules.find((r) => r.id === input.dataset.id);
            if (rule) {
                this.normalizeRule(rule);
                const srcIdx = parseInt(input.dataset.sourceIndex);
                input.value = rule.sourceDirs[srcIdx] || '';
            }
        });
        Array.from(list.querySelectorAll('.target-dir-input')).forEach((input) => {
            const rule = this._rules.find((r) => r.id === input.dataset.id);
            if (rule) {
                input.value = rule.targetDir || '';
            }
        });
        Array.from(list.querySelectorAll('.name-input')).forEach((input) => {
            const rule = this._rules.find((r) => r.id === input.dataset.id);
            if (rule) {
                input.value = rule.name || '';
            }
        });
        Array.from(list.querySelectorAll('.filter-value-input')).forEach((input) => {
            const rule = this._rules.find((r) => r.id === input.dataset.id);
            if (rule) {
                input.value = this.getFilterValue(rule);
            }
        });
    },
    renderHistory(history) {
        const list = this.$historyList;
        if (!list)
            return;
        list.innerHTML = '';
        if (!history || history.length === 0) {
            list.innerHTML = '<div class="history-empty">暂无拷贝历史记录</div>';
            return;
        }
        history.forEach((item) => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <span class="history-time">${item.time}</span>
                <span class="history-name">${item.ruleName || '-'}</span>
                <span class="history-info">${item.fileCount}个文件，${item.metaCount}个meta</span>
            `;
            list.appendChild(el);
        });
    },
    appendLogEntry(entry) {
        const list = this.$logList;
        if (!list)
            return;
        const el = document.createElement('div');
        el.className = 'log-entry ' + (entry.level || 'info');
        el.innerHTML = `<span class="log-time">${entry.time || ''}</span>${entry.message || ''}`;
        list.insertBefore(el, list.firstChild);
        while (list.children.length > 200) {
            list.removeChild(list.lastChild);
        }
    },
    messages: {
        'update-copy-rules'(event, rulesJson) {
            try {
                const rules = JSON.parse(rulesJson);
                this.firstLoad(rules);
            }
            catch (e) {
                Editor.error('[resource-copy] 解析规则失败:', e);
            }
        },
        'update-root-dirs'(event, configJson) {
            try {
                this._rootConfig = JSON.parse(configJson);
                this.$sourceRoot.value = this._rootConfig.sourceRoot || '';
                this.renderExportRoots();
                this.renderRules();
            }
            catch (e) {
                Editor.error('[resource-copy] 解析根目录配置失败:', e);
            }
        },
        'directory-selected'(event, data) {
            try {
                const { id, path, action, sourceIndex } = JSON.parse(data);
                const rule = this._rules.find((r) => r.id === id);
                if (rule) {
                    if (action === 'browse-source') {
                        this.normalizeRule(rule);
                        const idx = sourceIndex || 0;
                        rule.sourceDirs[idx] = path;
                    }
                    else {
                        rule.targetDir = path;
                    }
                }
                this.saveRules();
                this.renderRules();
            }
            catch (e) {
                Editor.error('[resource-copy] 处理目录选择失败:', e);
            }
        },
        'root-dir-selected'(event, data) {
            try {
                const { type, path, index } = JSON.parse(data);
                if (type === 'source') {
                    this._rootConfig.sourceRoot = path;
                    this.$sourceRoot.value = path;
                }
                else if (type === 'export') {
                    this._rootConfig.exportRoots.push(path);
                }
                else if (type === 'export-edit') {
                    this._rootConfig.exportRoots[index] = path;
                }
                sendResourceToMain('save-root-dirs', JSON.stringify(this._rootConfig));
                this.renderExportRoots();
                this.renderRules();
            }
            catch (e) {
                Editor.error('[resource-copy] 处理根目录选择失败:', e);
            }
        },
        'copy-result'(event, resultJson) {
            try {
                const { success, fileCount, metaCount, ruleName } = JSON.parse(resultJson);
                if (success && fileCount > 0) {
                    const nameSuffix = ruleName ? ` (${ruleName})` : '';
                    const metaSuffix = metaCount > 0 ? `，生成meta ${metaCount}个` : '';
                    this.showToast(`拷贝成功${nameSuffix}: ${fileCount}个文件${metaSuffix}`);
                }
                else if (success && fileCount === 0) {
                    this.showToast('没有文件需要拷贝', true);
                }
                else {
                    this.showToast('拷贝失败', true);
                }
            }
            catch (e) {
                Editor.error('[resource-copy] 处理拷贝结果失败:', e);
            }
        },
        'meta-refresh-result'(event, resultJson) {
            try {
                const { count } = JSON.parse(resultJson);
                if (count > 0) {
                    Editor.log('[resource-copy] meta文件已生成:', count, '个');
                }
            }
            catch (e) {
                Editor.error('[resource-copy] 处理meta刷新结果失败:', e);
            }
        },
        'update-copy-history'(event, historyJson) {
            try {
                const history = JSON.parse(historyJson);
                this.renderHistory(history);
            }
            catch (e) {
                Editor.error('[resource-copy] 解析历史记录失败:', e);
            }
        },
        'import-result'(event, resultJson) {
            try {
                const { success } = JSON.parse(resultJson);
                this.showToast(success ? '导入配置成功' : '导入配置失败', !success);
            }
            catch (e) {
                Editor.error('[resource-copy] 处理导入结果失败:', e);
            }
        },
        'export-result'(event, resultJson) {
            try {
                const { success } = JSON.parse(resultJson);
                this.showToast(success ? '导出配置成功' : '导出配置失败', !success);
            }
            catch (e) {
                Editor.error('[resource-copy] 处理导出结果失败:', e);
            }
        },
        'clear-result'(event, resultJson) {
            try {
                const { success, fileCount } = JSON.parse(resultJson);
                if (success) {
                    this.showToast(`目标目录已清空，共删除 ${fileCount} 个条目`);
                }
                else {
                    this.showToast('清空失败', true);
                }
            }
            catch (e) {
                Editor.error('[resource-copy] 处理清空结果失败:', e);
            }
        },
        'copy-progress'(event, data) {
            try {
                const { current, total, fileName } = JSON.parse(data);
                const pct = Math.round((current / total) * 100);
                this.$progressBarContainer.classList.add('active');
                this.$progressLabel.classList.add('active');
                this.$progressBar.style.width = pct + '%';
                this.$progressLabel.textContent = `${current}/${total} (${pct}%) ${fileName}`;
                if (current >= total) {
                    setTimeout(() => {
                        this.$progressBarContainer.classList.remove('active');
                        this.$progressLabel.classList.remove('active');
                        this.$progressBar.style.width = '0%';
                    }, 2000);
                }
            }
            catch (e) { /* ignore */ }
        },
        'copy-log'(event, entryJson) {
            try {
                const entry = JSON.parse(entryJson);
                this.appendLogEntry(entry);
            }
            catch (e) { /* ignore */ }
        },
        'copy-log-clear'() {
            this.$logList.innerHTML = '';
        },
        'update-copy-logs'(event, logsJson) {
            try {
                const logs = JSON.parse(logsJson);
                this.$logList.innerHTML = '';
                logs.forEach((entry) => this.appendLogEntry(entry));
            }
            catch (e) {
                Editor.error('[resource-copy] 解析日志失败:', e);
            }
        },
        'undo-result'(event, resultJson) {
            try {
                const { success, restoredCount, deletedCount } = JSON.parse(resultJson);
                if (success) {
                    this.showToast(`撤销成功: 恢复 ${restoredCount} 个，删除 ${deletedCount} 个`);
                }
                else {
                    this.showToast('撤销失败或没有可撤销的操作', true);
                }
            }
            catch (e) {
                Editor.error('[resource-copy] 处理撤销结果失败:', e);
            }
        },
    },
});
