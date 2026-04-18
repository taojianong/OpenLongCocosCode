'use strict';

const RESOURCE_PKG_NAME = 'cocos-design-ruler';

interface CopyRule {
    id: string;
    enabled: boolean;
    sourceDir: string;
    targetDir: string;
    copyRule: 'all' | 'prefix';
    filePrefix?: string;
    recursive?: boolean;
}

function sendResourceToMain(msg: string, ...args: any[]) {
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
}
.header {
    padding: 15px;
    border-bottom: 1px solid #505050;
    background: #2a2a2a;
}
.header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #ff6b6b;
}
.content {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
}
.rules-list {
    margin-bottom: 15px;
    max-height: calc(100% - 120px);
    overflow-y: auto;
}
.rule-item {
    background: #404040;
    border: 1px solid #505050;
    border-radius: 4px;
    margin-bottom: 10px;
    padding: 12px;
}
.rule-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}
.rule-header input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
}
.rule-number {
    font-size: 12px;
    color: #ffb347;
    min-width: 20px;
}
.rule-actions {
    margin-left: auto;
    display: flex;
    gap: 5px;
}
.rule-fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.field-row {
    display: flex;
    align-items: center;
    gap: 8px;
}
.field-label {
    font-size: 11px;
    color: #cccccc;
    min-width: 60px;
}
.field-input {
    flex: 1;
    padding: 6px 8px;
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
    padding: 5px 10px;
    background: #555;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 11px;
    cursor: pointer;
    white-space: nowrap;
}
.browse-btn:hover {
    background: #666;
}
.rule-select {
    padding: 5px;
    background: #353535;
    border: 1px solid #555;
    border-radius: 3px;
    color: #fff;
    font-size: 11px;
}
.rule-actions-btns {
    margin-top: 10px;
    display: flex;
    gap: 8px;
}
.copy-btn {
    flex: 1;
    padding: 6px;
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
    padding: 6px 10px;
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
    gap: 10px;
    padding-top: 10px;
    border-top: 1px solid #505050;
}
.bottom-btn {
    flex: 1;
    padding: 10px;
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
.prefix-input {
    flex: 1;
    padding: 6px 8px;
    background: #353535;
    border: 1px solid #555;
    border-radius: 3px;
    color: #fff;
    font-size: 11px;
}
.prefix-input:disabled {
    background: #2a2a2a;
    color: #888;
}
.root-dir-section {
    margin-bottom: 20px;
    padding: 12px;
    background: #404040;
    border-radius: 4px;
    border-left: 3px solid #4a90e2;
}
.root-dir-section h4 {
    margin: 0 0 12px 0;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    color: #ffb347;
}
.root-dir-item {
    margin-bottom: 10px;
}
.root-dir-item:last-child {
    margin-bottom: 0;
}
.root-dir-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}
.root-dir-label {
    font-size: 12px;
    color: #cccccc;
    min-width: 80px;
}
.export-dir-list {
    margin-top: 10px;
}
.export-dir-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}
.export-dir-item input {
    flex: 1;
}
.remove-dir-btn {
    padding: 4px 8px;
    background: #e63946;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 11px;
    cursor: pointer;
}
.remove-dir-btn:hover {
    background: #d62828;
}
.add-dir-btn {
    width: auto;
    padding: 6px 12px;
    margin-top: 8px;
    background: #4a90e2;
}
.add-dir-btn:hover {
    background: #357abd;
}
.path-type-badge {
    font-size: 10px;
    padding: 2px 6px;
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
    font-size: 10px;
    color: #888;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
::-webkit-scrollbar {
    width: 8px;
}
::-webkit-scrollbar-track {
    background: #353535;
    border-radius: 4px;
}
::-webkit-scrollbar-thumb {
    background: #555555;
    border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
    background: #666666;
}`,

    template: `
<div class="panel">
  <div class="header">
    <h3>资源拷贝</h3>
  </div>
  <div class="content">
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
        <button id="add-export-root" class="bottom-btn add-dir-btn">+ 添加导出目录</button>
      </div>
    </div>
    <div id="rules-list" class="rules-list"></div>
    <div class="bottom-actions">
      <button id="select-all-btn" class="bottom-btn secondary">全部选中</button>
      <button id="copy-all-btn" class="bottom-btn">全部拷贝</button>
    </div>
  </div>
</div>`,

    $: {
        sourceRoot: '#source-root',
        browseSourceRoot: '#browse-source-root',
        exportRootList: '#export-root-list',
        addExportRoot: '#add-export-root',
        rulesList: '#rules-list',
        selectAllBtn: '#select-all-btn',
        copyAllBtn: '#copy-all-btn',
    },

    ready(this: any) {
        this._rules = [];
        this._rootConfig = {
            sourceRoot: '',
            exportRoots: []
        };

        this.$browseSourceRoot.addEventListener('click', () => {
            sendResourceToMain('browse-root-dir', JSON.stringify({ type: 'source' }));
        });

        this.$addExportRoot.addEventListener('click', () => {
            sendResourceToMain('browse-root-dir', JSON.stringify({ type: 'export' }));
        });

        this.$sourceRoot.addEventListener('change', (e: any) => {
            this._rootConfig.sourceRoot = e.target.value;
            sendResourceToMain('save-root-dirs', JSON.stringify(this._rootConfig));
            this.renderRules(); // 重新渲染规则以更新路径类型
        });

        this.$selectAllBtn.addEventListener('click', () => {
            const allSelected = this._rules.every((r: CopyRule) => r.enabled);
            this._rules.forEach((r: CopyRule) => r.enabled = !allSelected);
            this.saveRules();
            this.renderRules();
        });

        this.$copyAllBtn.addEventListener('click', () => {
            const enabledRules = this._rules.filter((r: CopyRule) => r.enabled);
            if (enabledRules.length === 0) {
                Editor.warn('请先选择要拷贝的规则');
                return;
            }
            sendResourceToMain('copy-all-resources', JSON.stringify(enabledRules));
        });

        sendResourceToMain('get-copy-rules');
        sendResourceToMain('get-root-dirs');
    },

    firstLoad(this: any, rules: CopyRule[]) {
        this._rules = rules;
        if (!this._rules || this._rules.length === 0) {
            this.addRule();
        } else {
            this.renderRules();
        }
    },

    renderExportRoots(this: any) {
        const list = this.$exportRootList;
        list.innerHTML = '';

        if (!this._rootConfig.exportRoots || this._rootConfig.exportRoots.length === 0) {
            list.innerHTML = '<div style="padding:8px;color:#888;font-size:11px;">暂无导出根目录</div>';
            return;
        }

        Editor.log('[resource-copy] Rendering export roots:', this._rootConfig.exportRoots);

        this._rootConfig.exportRoots.forEach((root: string, index: number) => {
            const item = document.createElement('div');
            item.className = 'export-dir-item';
            item.innerHTML = `
                <input type="text" class="field-input" value="" data-index="${index}" placeholder="导出根目录">
                    <button class="browse-btn" data-action="browse-export" data-index="${index}">浏览</button>
                    <button class="remove-dir-btn" data-index="${index}">删除</button>
            `;
            list.appendChild(item);
        });

        Array.from(list.querySelectorAll('.export-dir-item .field-input')).forEach((input: any) => {
            const index = parseInt(input.dataset.index);
            input.value = this._rootConfig.exportRoots[index] || '';
            Editor.log('[resource-copy] Set export root input value:', index, input.value);
        });

        Array.from(list.querySelectorAll('.export-dir-item .browse-btn')).forEach((btn: any) => {
            btn.addEventListener('click', (e: any) => {
                const index = e.target.dataset.index;
                sendResourceToMain('browse-root-dir', JSON.stringify({ type: 'export-edit', index }));
            });
        });

        Array.from(list.querySelectorAll('.export-dir-item .remove-dir-btn')).forEach((btn: any) => {
            btn.addEventListener('click', (e: any) => {
                const index = parseInt(e.target.dataset.index);
                this._rootConfig.exportRoots.splice(index, 1);
                sendResourceToMain('save-root-dirs', JSON.stringify(this._rootConfig));
                this.renderExportRoots();
                this.renderRules(); // 重新渲染规则以更新路径类型
            });
        });

        Editor.log('[resource-copy] Export roots rendered');
    },

    addRule(this: any) {
        const newRule: CopyRule = {
            id: Date.now().toString(),
            enabled: true,
            sourceDir: '',
            targetDir: '',
            copyRule: 'all',
            recursive: true,
        };
        this._rules.push(newRule);
        this.saveRules();
        this.renderRules();
    },

    deleteRule(this: any, id: string) {
        this._rules = this._rules.filter((r: CopyRule) => r.id !== id);
        this.saveRules();
        this.renderRules();
    },

    saveRules(this: any) {
        sendResourceToMain('save-copy-rules', JSON.stringify(this._rules));
    },

    copySingleRule(this: any, id: string) {
        const rule = this._rules.find((r: CopyRule) => r.id === id);
        if (rule) {
            sendResourceToMain('copy-single-resource', JSON.stringify(rule));
        }
    },

    getPathType(this: any, filePath: string): 'relative' | 'absolute' | '' {
        if (!filePath) return '';
        if (/^[a-zA-Z]:\\/.test(filePath) || /^\//.test(filePath)) {
            return 'absolute';
        }
        return 'relative';
    },

    getResolvedPath(this: any, filePath: string, type: 'source' | 'target'): string {
        if (!filePath) return '';
        if (this.getPathType(filePath) === 'absolute') return filePath;

        if (type === 'source') {
            if (!this._rootConfig.sourceRoot) return filePath;
            return this._rootConfig.sourceRoot.replace(/[\\\/]$/, '') + '\\' + filePath;
        } else {
            if (!this._rootConfig.exportRoots || this._rootConfig.exportRoots.length === 0) return filePath;
            return this._rootConfig.exportRoots
                .filter((r: string) => r)
                .map((r: string) => r.replace(/[\\\/]$/, '') + '\\' + filePath)
                .join(' | ');
        }
    },

    renderRules(this: any) {
        const list = this.$rulesList;
        list.innerHTML = '';

        if (!this._rules || this._rules.length === 0) {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:#888;font-size:12px;">暂无拷贝规则</div>';
            return;
        }

        this._rules.forEach((rule: CopyRule, index: number) => {
            const sourceType = this.getPathType(rule.sourceDir);
            const targetType = this.getPathType(rule.targetDir);
            const sourceTypeText = sourceType === 'relative' ? '相对' : '绝对';
            const targetTypeText = targetType === 'relative' ? '相对' : '绝对';
            const resolvedSource = this.getResolvedPath(rule.sourceDir, 'source');
            const resolvedTarget = this.getResolvedPath(rule.targetDir, 'target');

            const item = document.createElement('div');
            item.className = 'rule-item';
            item.innerHTML = `
                <div class="rule-header">
                    <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-id="${rule.id}">
                    <span class="rule-number">#${index + 1}</span>
                    <div class="rule-actions">
                        <button class="copy-btn" data-id="${rule.id}">拷贝</button>
                        <button class="delete-btn" data-id="${rule.id}">删除</button>
                    </div>
                </div>
                <div class="rule-fields">
                    <div class="field-row">
                        <span class="field-label">源目录:</span>
                        <input type="text" class="field-input" placeholder="选择源目录" value="${rule.sourceDir}" data-field="sourceDir" data-id="${rule.id}">
                        <button class="browse-btn" data-action="browse-source" data-id="${rule.id}">浏览</button>
                        <span class="path-type-badge ${sourceType}">${sourceTypeText}</span>
                    </div>
                    <div class="resolved-path" style="padding-left:68px">→ ${resolvedSource}</div>
                    <div class="field-row">
                        <span class="field-label">目标目录:</span>
                        <input type="text" class="field-input" placeholder="选择目标目录" value="${rule.targetDir}" data-field="targetDir" data-id="${rule.id}">
                        <button class="browse-btn" data-action="browse-target" data-id="${rule.id}">浏览</button>
                        <span class="path-type-badge ${targetType}">${targetTypeText}</span>
                    </div>
                    <div class="resolved-path" style="padding-left:68px">→ ${resolvedTarget}</div>
                    <div class="field-row">
                        <span class="field-label">拷贝模式:</span>
                        <label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer">
                            <input type="checkbox" ${rule.recursive !== false ? 'checked' : ''} data-field="recursive" data-id="${rule.id}">
                            递归子目录
                        </label>
                    </div>
                    <div class="field-row">
                        <span class="field-label">文件筛选:</span>
                        <select class="rule-select" data-field="copyRule" data-id="${rule.id}">
                            <option value="all" ${rule.copyRule === 'all' ? 'selected' : ''}>全部文件</option>
                            <option value="prefix" ${rule.copyRule === 'prefix' ? 'selected' : ''}>文件名开头</option>
                        </select>
                        <input type="text" class="prefix-input" placeholder="文件名前缀" value="${rule.filePrefix || ''}" data-field="filePrefix" data-id="${rule.id}" ${rule.copyRule !== 'prefix' ? 'disabled' : ''}>
                    </div>
                </div>
            `;
            list.appendChild(item);
        });

        // 使用 textContent 设置输入框的值，避免特殊字符问题
        list.querySelectorAll('.rule-item .field-input').forEach((input: any) => {
            const rule = this._rules.find((r: CopyRule) => r.id === input.dataset.id);
            if (rule) {
                input.value = rule[input.dataset.field] || '';
            }
        });

        list.querySelector('input[type="checkbox"]')?.addEventListener('change', (e: any) => {
            const id = e.target.dataset.id;
            const rule = this._rules.find((r: CopyRule) => r.id === id);
            if (rule) {
                rule.enabled = e.target.checked;
                this.saveRules();
            }
        });

        list.querySelectorAll('.delete-btn').forEach((btn: any) => {
            btn.addEventListener('click', (e: any) => {
                this.deleteRule(e.target.dataset.id);
            });
        });

        list.querySelectorAll('.copy-btn').forEach((btn: any) => {
            btn.addEventListener('click', (e: any) => {
                this.copySingleRule(e.target.dataset.id);
            });
        });

        list.querySelectorAll('.browse-btn').forEach((btn: any) => {
            btn.addEventListener('click', (e: any) => {
                const id = e.target.dataset.id;
                const action = e.target.dataset.action;
                sendResourceToMain('browse-directory', JSON.stringify({ id, action }));
            });
        });

        Array.from(list.querySelectorAll('.rule-item .field-input')).forEach((input: any) => {
            input.addEventListener('change', (e: any) => {
                const id = e.target.dataset.id;
                const field = e.target.dataset.field;
                const rule = this._rules.find((r: CopyRule) => r.id === id);
                if (rule) {
                    rule[field] = e.target.value;
                    this.saveRules();
                }
            });
        });

        list.querySelectorAll('.rule-item .rule-select').forEach((select: any) => {
            select.addEventListener('change', (e: any) => {
                const id = e.target.dataset.id;
                const rule = this._rules.find((r: CopyRule) => r.id === id);
                if (rule) {
                    rule.copyRule = e.target.value;
                    const prefixInput = e.target.parentElement.querySelector('.prefix-input');
                    if (prefixInput) {
                        prefixInput.disabled = rule.copyRule !== 'prefix';
                    }
                    this.saveRules();
                }
            });
        });

        list.querySelectorAll('.rule-item .prefix-input').forEach((input: any) => {
            input.addEventListener('change', (e: any) => {
                const id = e.target.dataset.id;
                const rule = this._rules.find((r: CopyRule) => r.id === id);
                if (rule) {
                    rule.filePrefix = e.target.value;
                    this.saveRules();
                }
            });
        });

        list.querySelectorAll('.rule-item input[data-field="recursive"]').forEach((checkbox: any) => {
            checkbox.addEventListener('change', (e: any) => {
                const id = e.target.dataset.id;
                const rule = this._rules.find((r: CopyRule) => r.id === id);
                if (rule) {
                    rule.recursive = e.target.checked;
                    this.saveRules();
                }
            });
        });

        const addBtn = document.createElement('button');
        addBtn.className = 'bottom-btn secondary';
        addBtn.style.marginTop = '15px';
        addBtn.textContent = '+ 添加条目';
        addBtn.addEventListener('click', () => this.addRule());
        list.appendChild(addBtn);

        // 设置输入框的初始值，在事件监听器绑定后
        Array.from(list.querySelectorAll('.rule-item .field-input')).forEach((input: any) => {
            const rule = this._rules.find((r: CopyRule) => r.id === input.dataset.id);
            if (rule) {
                input.value = rule[input.dataset.field] || '';
                Editor.log('[resource-copy] Set rule input value:', input.dataset.id, input.dataset.field, input.value);
            }
        });

        Array.from(list.querySelectorAll('.rule-item .rule-select')).forEach((select: any) => {
            const rule = this._rules.find((r: CopyRule) => r.id === select.dataset.id);
            if (rule) {
                const prefixInput = select.parentElement.querySelector('.prefix-input');
                if (prefixInput) {
                    prefixInput.disabled = rule.copyRule !== 'prefix';
                }
            }
        });

        Array.from(list.querySelectorAll('.rule-item .prefix-input')).forEach((input: any) => {
            const rule = this._rules.find((r: CopyRule) => r.id === input.dataset.id);
            if (rule) {
                input.value = rule.filePrefix || '';
            }
        });
    },

    messages: {
        'update-copy-rules'(this: any, event: any, rulesJson: string) {
            try {
                const rules = JSON.parse(rulesJson);
                this.firstLoad(rules);
            } catch (e: any) {
                Editor.error('[resource-copy] 解析规则失败:', e);
            }
        },
        'update-root-dirs'(this: any, event: any, configJson: string) {
            try {
                this._rootConfig = JSON.parse(configJson);
                this.$sourceRoot.value = this._rootConfig.sourceRoot || '';
                this.renderExportRoots();
                this.renderRules(); // 重新渲染规则以更新路径类型
            } catch (e: any) {
                Editor.error('[resource-copy] 解析根目录配置失败:', e);
            }
        },
        'directory-selected'(this: any, event: any, data: string) {
            try {
                const { id, path, action } = JSON.parse(data);
                Editor.log('[resource-copy] directory-selected:', { id, path, action });
                const rule = this._rules.find((r: CopyRule) => r.id === id);
                if (rule) {
                    if (action === 'browse-source') {
                        rule.sourceDir = path;
                    } else {
                        rule.targetDir = path;
                    }
                    Editor.log('[resource-copy] Updated rule:', rule);
                }
                // 先保存规则
                this.saveRules();
                // 然后重新渲染规则列表
                this.renderRules();
            } catch (e: any) {
                Editor.error('[resource-copy] 处理目录选择失败:', e);
            }
        },
        'root-dir-selected'(this: any, event: any, data: string) {
            try {
                const { type, path, index } = JSON.parse(data);
                Editor.log('[resource-copy] root-dir-selected:', { type, path, index });
                if (type === 'source') {
                    this._rootConfig.sourceRoot = path;
                    this.$sourceRoot.value = path;
                } else if (type === 'export') {
                    this._rootConfig.exportRoots.push(path);
                } else if (type === 'export-edit') {
                    this._rootConfig.exportRoots[index] = path;
                }
                // 先保存根目录配置
                sendResourceToMain('save-root-dirs', JSON.stringify(this._rootConfig));
                // 然后渲染导出根目录列表和规则列表
                this.renderExportRoots();
                this.renderRules(); // 重新渲染规则以更新路径类型
            } catch (e: any) {
                Editor.error('[resource-copy] 处理根目录选择失败:', e);
            }
        },
        'meta-refresh-result'(this: any, event: any, resultJson: string) {
            try {
                const { count } = JSON.parse(resultJson);
                if (count > 0) {
                    Editor.log('[resource-copy] meta文件已生成:', count, '个');
                }
            } catch (e: any) {
                Editor.error('[resource-copy] 处理meta刷新结果失败:', e);
            }
        },
    },
});
