'use strict';

const PKG_NAME = 'cocos-design-ruler';

function sendToMain(msg: string, ...args: any[]) {
    const fullMsg = `${PKG_NAME}:${msg}`;
    Editor.log('[design-ruler] panel sendToMain:', fullMsg);
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
}
.content {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
}
.control-section,
.add-guide-section,
.design-section,
.guides-list-section,
.tips-section {
    margin-bottom: 20px;
    padding: 12px;
    background: #404040;
    border-radius: 4px;
    border-left: 3px solid #ff6b6b;
}
.control-section h4,
.add-guide-section h4,
.design-section h4,
.guides-list-section h4,
.tips-section h4 {
    margin: 0 0 12px 0;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    color: #ffb347;
}
.control-group {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
}
.control-group label {
    font-size: 12px;
    min-width: 100px;
    color: #cccccc;
}
.control-group input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
}
.control-group input[type="color"] {
    width: 40px;
    height: 30px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
}
.control-group input[type="range"] {
    flex: 1;
    cursor: pointer;
}
.control-group input[type="file"] {
    flex: 1;
    font-size: 11px;
}
.control-group input[type="number"] {
    padding: 4px 6px;
    background: #353535;
    border: 1px solid #555;
    border-radius: 3px;
    color: #fff;
    font-size: 12px;
}
.control-group #opacity-value,
.control-group #design-opacity-value {
    min-width: 40px;
    text-align: right;
    font-size: 12px;
    color: #ffb347;
}
button {
    width: 100%;
    padding: 8px 12px;
    margin-top: 8px;
    background: #ff6b6b;
    color: #ffffff;
    border: none;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}
button:hover {
    background: #ff5252;
}
button:active {
    background: #e63946;
}
button.small-btn {
    width: auto;
    padding: 4px 10px;
    margin-top: 0;
    font-size: 11px;
}
.guides-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #505050;
    border-radius: 3px;
    background: #353535;
}
.guide-item {
    padding: 8px 10px;
    border-bottom: 1px solid #454545;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
}
.guide-item:last-child {
    border-bottom: none;
}
.guide-item span {
    color: #ffb347;
}
.guide-item .delete-btn {
    width: auto;
    padding: 4px 8px;
    margin: 0;
    background: #e63946;
    font-size: 11px;
}
.guide-item .delete-btn:hover {
    background: #d62828;
}
.tips-section {
    border-left-color: #4a90e2;
    background: #2d3436;
}
.tips-section ul {
    margin: 0;
    padding-left: 20px;
    font-size: 12px;
    color: #cccccc;
}
.tips-section li {
    margin-bottom: 6px;
}
.content::-webkit-scrollbar,
.guides-list::-webkit-scrollbar {
    width: 8px;
}
.content::-webkit-scrollbar-track,
.guides-list::-webkit-scrollbar-track {
    background: #353535;
    border-radius: 4px;
}
.content::-webkit-scrollbar-thumb,
.guides-list::-webkit-scrollbar-thumb {
    background: #555555;
    border-radius: 4px;
}
.content::-webkit-scrollbar-thumb:hover,
.guides-list::-webkit-scrollbar-thumb:hover {
    background: #666666;
}`,

    template: `
<div class="panel">
  <div class="header">
    <h3>设计标尺</h3>
  </div>
  <div class="content">
    <div class="control-section">
      <h4>标尺设置</h4>
      <div class="control-group">
        <label>启用对齐线：</label>
        <input type="checkbox" id="enable-guides" checked>
      </div>
      <div class="control-group">
        <label>对齐线颜色：</label>
        <input type="color" id="guide-color" value="#FF0000">
      </div>
      <div class="control-group">
        <label>对齐线透明度：</label>
        <input type="range" id="guide-opacity" min="0" max="100" value="80">
        <span id="opacity-value">80%</span>
      </div>
      <div class="control-group">
        <label>对齐线样式：</label>
        <select id="guide-style">
          <option value="dashed">虚线</option>
          <option value="solid">实线</option>
        </select>
      </div>
      <button id="clear-guides">清除所有对齐线</button>
    </div>
    <div class="add-guide-section">
      <h4>添加对齐线</h4>
      <div class="control-group">
        <input type="number" id="guide-position" placeholder="位置 (px)" value="100" style="width:80px;">
        <button id="add-h-guide" class="small-btn">+ 水平线</button>
        <button id="add-v-guide" class="small-btn">+ 垂直线</button>
      </div>
    </div>
    <div class="design-section">
      <h4>设计图</h4>
      <div class="control-group">
        <label>导入设计图：</label>
        <input type="file" id="design-image" accept="image/*">
      </div>
      <div class="control-group">
        <label>设计图透明度：</label>
        <input type="range" id="design-opacity" min="0" max="100" value="50">
        <span id="design-opacity-value">50%</span>
      </div>
      <button id="clear-design">清除设计图</button>
    </div>
    <div class="guides-list-section">
      <h4>对齐线列表</h4>
      <div id="guides-list" class="guides-list"></div>
    </div>
    <div class="tips-section">
      <h4>提示</h4>
      <ul>
        <li>标尺和对齐线直接显示在场景编辑器中</li>
        <li>切换场景后标尺会自动恢复</li>
        <li>临时节点不会保存到场景文件</li>
      </ul>
    </div>
  </div>
</div>`,

    $: {
        enableGuides: '#enable-guides',
        guideColor: '#guide-color',
        guideOpacity: '#guide-opacity',
        opacityValue: '#opacity-value',
        clearGuidesBtn: '#clear-guides',
        guidePosition: '#guide-position',
        addHGuideBtn: '#add-h-guide',
        addVGuideBtn: '#add-v-guide',
        designImage: '#design-image',
        designOpacity: '#design-opacity',
        designOpacityValue: '#design-opacity-value',
        clearDesignBtn: '#clear-design',
        guidesList: '#guides-list',
        guideStyle: '#guide-style',
    },

    ready(this: any) {
        this._guides = [];

        // 面板打开时主动触发场景初始化
        sendToMain('scene-ready');

        // 启用/禁用对齐线
        this.$enableGuides.addEventListener('change', (e: any) => {
            sendToMain('set-guides-enabled', e.target.checked);
        });

        // 对齐线颜色
        this.$guideColor.addEventListener('change', (e: any) => {
            sendToMain('set-guide-color', e.target.value);
        });

        // 对齐线透明度
        this.$guideOpacity.addEventListener('input', (e: any) => {
            const value = e.target.value;
            this.$opacityValue.textContent = value + '%';
            sendToMain('set-guide-opacity', parseInt(value) / 100);
        });

        // 清除所有对齐线
        this.$clearGuidesBtn.addEventListener('click', () => {
            sendToMain('clear-guides');
            this._guides = [];
            this.renderGuidesList();
        });

        // 添加水平对齐线
        this.$addHGuideBtn.addEventListener('click', () => {
            const pos = parseInt(this.$guidePosition.value) || 100;
            sendToMain('add-guide', { type: 'h', position: pos });
            this._guides.push({ type: 'h', position: pos });
            this.renderGuidesList();
        });

        // 添加垂直对齐线
        this.$addVGuideBtn.addEventListener('click', () => {
            const pos = parseInt(this.$guidePosition.value) || 100;
            sendToMain('add-guide', { type: 'v', position: pos });
            this._guides.push({ type: 'v', position: pos });
            this.renderGuidesList();
        });

        // 设计图导入
        this.$designImage.addEventListener('change', (e: any) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev: any) => {
                sendToMain('set-design-image', ev.target.result);
            };
            reader.readAsDataURL(file);
        });

        // 设计图透明度
        this.$designOpacity.addEventListener('input', (e: any) => {
            const value = e.target.value;
            this.$designOpacityValue.textContent = value + '%';
            sendToMain('set-design-opacity', parseInt(value) / 100);
        });

        // 清除设计图
        this.$clearDesignBtn.addEventListener('click', () => {
            sendToMain('clear-design-image');
            this.$designImage.value = '';
        });

        // 对齐线样式
        this.$guideStyle.addEventListener('change', (e: any) => {
            sendToMain('set-default-dashed', e.target.value === 'dashed');
        });
    },

    renderGuidesList(this: any) {
        const list = this.$guidesList;
        list.innerHTML = '';

        if (!this._guides || this._guides.length === 0) {
            list.innerHTML = '<div style="padding:8px;color:#888;font-size:12px;">暂无对齐线</div>';
            return;
        }

        this._guides.forEach((guide: any, index: number) => {
            const item = document.createElement('div');
            item.className = 'guide-item';
            item.innerHTML = `
                <span>${guide.type === 'h' ? '水平' : '垂直'}</span>
                <input type="number" value="${guide.position}" style="width:60px;padding:2px 4px;background:#353535;border:1px solid #555;border-radius:2px;color:#ffb347;font-size:12px;text-align:center;">
                <span>px</span>
                <button data-index="${index}" class="delete-btn">删除</button>
            `;
            // 位置编辑
            const input = item.querySelector('input');
            if (input) {
                input.addEventListener('change', () => {
                    const newPos = parseInt(input.value) || 0;
                    this._guides[index].position = newPos;
                    // 先删除旧的再添加新的
                    sendToMain('remove-guide', index);
                    sendToMain('add-guide', { type: guide.type, position: newPos });
                });
            }
            item.querySelector('.delete-btn')?.addEventListener('click', () => {
                sendToMain('remove-guide', index);
                this._guides.splice(index, 1);
                this.renderGuidesList();
            });
            list.appendChild(item);
        });
    },

    messages: {
        'update-guides-list'(this: any, event: any, guidesData: any) {
            Editor.log('[design-ruler] panel received guides:', typeof guidesData, JSON.stringify(guidesData));
            if (Array.isArray(guidesData)) {
                this._guides = guidesData;
            } else if (typeof guidesData === 'string') {
                try { this._guides = JSON.parse(guidesData); } catch (e) { this._guides = []; }
            } else {
                this._guides = [];
            }
            this.renderGuidesList();
        },
    },
});
