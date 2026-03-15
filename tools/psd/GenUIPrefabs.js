/**
 * Cocos Creator 2.x 预制体生成工具
 * 生成全部UI界面的 .prefab 文件
 *
 * 使用: node tools/GenUIPrefabs.js
 *
 * 节点命名遵循 UITools 规范：
 *   btn_xxx → cc.Button
 *   txt_xxx → cc.Label
 *   sp_xxx  → cc.Sprite
 *   progress_xxx → cc.ProgressBar
 *   node_xxx → cc.Node
 */
const fs = require('fs');
const path = require('path');

const PROJECT = path.resolve(__dirname, '..');
const MAT_UUID = 'eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432'; // builtin sprite/label material

// ============================================================
// Prefab builder helpers
// ============================================================
class PrefabBuilder {
    constructor(rootName) {
        this.items = [];
        this.rootName = rootName;
        // item[0] = cc.Prefab header
        this.items.push({
            '__type__': 'cc.Prefab', '_name': '', '_objFlags': 0, '_native': '',
            'data': { '__id__': 1 },
            'optimizationPolicy': 0, 'asyncLoadAssets': false, 'readonly': false
        });
    }

    _id() { return this.items.length; }

    _trs(x = 0, y = 0, sx = 1, sy = 1) {
        return {
            '__type__': 'TypedArray', 'ctor': 'Float64Array',
            'array': [x, y, 0, 0, 0, 0, 1, sx, sy, 1]
        };
    }

    _color(r = 255, g = 255, b = 255, a = 255) {
        return { '__type__': 'cc.Color', r, g, b, a };
    }

    _size(w, h) {
        return { '__type__': 'cc.Size', 'width': w, 'height': h };
    }

    _vec2(x = 0.5, y = 0.5) {
        return { '__type__': 'cc.Vec2', x, y };
    }

    _vec3(x = 0, y = 0, z = 0) {
        return { '__type__': 'cc.Vec3', x, y, z };
    }

    /**
     * 创建节点，返回节点id
     */
    addNode(name, parentId, opts = {}) {
        const nodeId = this._id();
        const compIds = [];
        const childIds = [];

        const node = {
            '__type__': 'cc.Node',
            '_name': name,
            '_objFlags': 0,
            '_parent': parentId != null ? { '__id__': parentId } : null,
            '_children': childIds,
            '_active': opts.active !== undefined ? opts.active : true,
            '_components': compIds,
            '_prefab': null, // placeholder, will set later
            '_opacity': opts.opacity !== undefined ? opts.opacity : 255,
            '_color': this._color(opts.r || 255, opts.g || 255, opts.b || 255, opts.a || 255),
            '_contentSize': this._size(opts.w || 0, opts.h || 0),
            '_anchorPoint': this._vec2(
                opts.anchorX !== undefined ? opts.anchorX : 0.5,
                opts.anchorY !== undefined ? opts.anchorY : 0.5
            ),
            '_trs': this._trs(opts.x || 0, opts.y || 0, opts.sx || 1, opts.sy || 1),
            '_eulerAngles': this._vec3(),
            '_skewX': 0, '_skewY': 0, '_is3DNode': false,
            '_groupIndex': 0, 'groupIndex': 0, '_id': ''
        };
        this.items.push(node);

        // PrefabInfo for this node
        const prefabInfoId = this._id();
        this.items.push({
            '__type__': 'cc.PrefabInfo',
            'root': { '__id__': 1 },
            'asset': nodeId === 1 ? { '__id__': 0 } : { '__id__': 0 },
            'fileId': nodeId === 1 ? '' : this._randomFileId(),
            'sync': false
        });
        node._prefab = { '__id__': prefabInfoId };

        return { nodeId, compIds, childIds, node };
    }

    /**
     * 给父节点添加子节点引用
     */
    addChildRef(parentNodeId, childNodeId) {
        const parent = this.items[parentNodeId];
        parent._children.push({ '__id__': childNodeId });
    }

    /**
     * 添加 cc.Label 组件
     */
    addLabel(nodeId, opts = {}) {
        const compId = this._id();
        this.items.push({
            '__type__': 'cc.Label', '_name': '', '_objFlags': 0,
            'node': { '__id__': nodeId }, '_enabled': true,
            '_materials': [{ '__uuid__': MAT_UUID }],
            '_srcBlendFactor': 770, '_dstBlendFactor': 771,
            '_string': opts.string || '',
            '_N$string': opts.string || '',
            '_fontSize': opts.fontSize || 24,
            '_lineHeight': opts.lineHeight || (opts.fontSize || 24) + 4,
            '_enableWrapText': opts.wrap !== undefined ? opts.wrap : true,
            '_N$file': null, '_isSystemFontUsed': true, '_spacingX': 0,
            '_batchAsBitmap': false,
            '_styleFlags': opts.bold ? 1 : 0,
            '_underlineHeight': 0,
            '_N$horizontalAlign': opts.hAlign !== undefined ? opts.hAlign : 1,
            '_N$verticalAlign': opts.vAlign !== undefined ? opts.vAlign : 1,
            '_N$fontFamily': 'Arial',
            '_N$overflow': opts.overflow || 0,
            '_N$cacheMode': 0, '_id': ''
        });
        this.items[nodeId]._components.push({ '__id__': compId });
        return compId;
    }

    /**
     * 添加 cc.Sprite 组件
     */
    addSprite(nodeId, opts = {}) {
        const compId = this._id();
        this.items.push({
            '__type__': 'cc.Sprite', '_name': '', '_objFlags': 0,
            'node': { '__id__': nodeId }, '_enabled': true,
            '_materials': [{ '__uuid__': MAT_UUID }],
            '_srcBlendFactor': 770, '_dstBlendFactor': 771,
            '_spriteFrame': opts.spriteFrame ? { '__uuid__': opts.spriteFrame } : null,
            '_type': opts.type || 0, // 0=Simple, 1=Sliced, 2=Tiled, 3=Filled
            '_sizeMode': opts.sizeMode || 0, // 0=Custom, 1=Trimmed, 2=Raw
            '_fillType': opts.fillType || 0, // 0=Horizontal
            '_fillCenter': this._vec2(0, 0),
            '_fillStart': 0, '_fillRange': opts.fillRange || 0,
            '_isTrimmedMode': true, '_atlas': null, '_id': ''
        });
        this.items[nodeId]._components.push({ '__id__': compId });
        return compId;
    }

    /**
     * 添加 cc.Button 组件
     */
    addButton(nodeId, opts = {}) {
        const compId = this._id();
        this.items.push({
            '__type__': 'cc.Button', '_name': '', '_objFlags': 0,
            'node': { '__id__': nodeId }, '_enabled': true,
            '_normalMaterial': null, '_grayMaterial': null,
            'duration': 0.1, 'zoomScale': 1.1,
            'clickEvents': [],
            '_N$interactable': true,
            '_N$enableAutoGrayEffect': false,
            '_N$transition': opts.transition || 3, // 3=SCALE
            '_id': ''
        });
        this.items[nodeId]._components.push({ '__id__': compId });
        return compId;
    }

    /**
     * 添加 cc.ProgressBar 组件
     */
    addProgressBar(nodeId, barSpriteNodeId, opts = {}) {
        const compId = this._id();
        this.items.push({
            '__type__': 'cc.ProgressBar', '_name': '', '_objFlags': 0,
            'node': { '__id__': nodeId }, '_enabled': true,
            '_N$totalLength': opts.totalLength || 200,
            '_N$barSprite': barSpriteNodeId != null ? { '__id__': barSpriteNodeId } : null,
            '_N$mode': 0, // HORIZONTAL
            '_N$progress': opts.progress || 1,
            '_N$reverse': false, '_id': ''
        });
        this.items[nodeId]._components.push({ '__id__': compId });
        return compId;
    }

    /**
     * 添加 cc.Widget 组件
     */
    addWidget(nodeId, opts = {}) {
        const compId = this._id();
        this.items.push({
            '__type__': 'cc.Widget', '_name': '', '_objFlags': 0,
            'node': { '__id__': nodeId }, '_enabled': true,
            '_alignFlags': opts.alignFlags || 0,
            '_left': opts.left || 0, '_right': opts.right || 0,
            '_top': opts.top || 0, '_bottom': opts.bottom || 0,
            '_verticalCenter': opts.vCenter || 0,
            '_horizontalCenter': opts.hCenter || 0,
            '_isAbsLeft': true, '_isAbsRight': true,
            '_isAbsTop': true, '_isAbsBottom': true,
            '_isAbsHorizontalCenter': true, '_isAbsVerticalCenter': true,
            '_originalWidth': 0, '_originalHeight': 0,
            '_id': ''
        });
        this.items[nodeId]._components.push({ '__id__': compId });
        return compId;
    }

    /**
     * 添加 cc.BlockInputEvents 组件
     */
    addBlockInput(nodeId) {
        const compId = this._id();
        this.items.push({
            '__type__': 'cc.BlockInputEvents', '_name': '', '_objFlags': 0,
            'node': { '__id__': nodeId }, '_enabled': true, '_id': ''
        });
        this.items[nodeId]._components.push({ '__id__': compId });
        return compId;
    }

    _randomFileId() {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';
        let r = '';
        for (let i = 0; i < 22; i++) r += chars[Math.floor(Math.random() * chars.length)];
        return r;
    }

    /**
     * 快捷方法：创建子节点并自动关联到父节点
     */
    createChild(name, parentId, opts = {}) {
        const child = this.addNode(name, parentId, opts);
        this.addChildRef(parentId, child.nodeId);
        return child;
    }

    toJSON() {
        return JSON.stringify(this.items, null, 2);
    }

    save(filePath) {
        const dir = path.dirname(filePath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, this.toJSON(), 'utf8');
    }
}

// ============================================================
// Widget align flags
// ============================================================
const ALIGN = {
    TOP: 1, VMID: 2, BOT: 4,
    LEFT: 8, HMID: 16, RIGHT: 32
};

// ============================================================
// 1. BattleHUD
// ============================================================
function buildBattleHUD() {
    const b = new PrefabBuilder('BattleHUD');

    // Root node (full screen)
    const root = b.addNode('BattleHUD', null, { w: 750, h: 1334 });

    // --- Top bar ---
    const topBar = b.createChild('topBar', root.nodeId, { w: 750, h: 100, y: 617, anchorY: 1 });
    b.addWidget(topBar.nodeId, { alignFlags: ALIGN.TOP | ALIGN.LEFT | ALIGN.RIGHT, top: 0, left: 0, right: 0 });
    b.addSprite(topBar.nodeId); // dark background

    // HP bar container
    const hpNode = b.createChild('progress_hp', topBar.nodeId, { w: 280, h: 36, x: -195, y: -20 });
    // HP bar fill (sprite with filled type)
    const hpFill = b.createChild('sp_hpFill', hpNode.nodeId, { w: 270, h: 28 });
    const hpFillSpriteId = b.addSprite(hpFill.nodeId, { type: 3, fillType: 0, fillRange: 1 }); // FILLED
    b.addProgressBar(hpNode.nodeId, hpFillSpriteId, { totalLength: 270, progress: 1 });
    // HP text
    const hpTxt = b.createChild('txt_hp', hpNode.nodeId, { w: 280, h: 36 });
    b.addLabel(hpTxt.nodeId, { string: '100/100', fontSize: 18, bold: true });

    // Coin display
    const coinNode = b.createChild('node_coin', topBar.nodeId, { x: 40, y: -20, w: 150, h: 40 });
    const coinIcon = b.createChild('sp_coinIcon', coinNode.nodeId, { w: 36, h: 36, x: -50 });
    b.addSprite(coinIcon.nodeId);
    const coinTxt = b.createChild('txt_coin', coinNode.nodeId, { w: 100, h: 36, x: 20 });
    b.addLabel(coinTxt.nodeId, { string: '0', fontSize: 22, bold: true, hAlign: 0 });

    // Wave display
    const waveNode = b.createChild('node_wave', topBar.nodeId, { x: 220, y: -20, w: 100, h: 60 });
    const waveLbl = b.createChild('txt_waveLabel', waveNode.nodeId, { w: 100, h: 20, y: 15 });
    b.addLabel(waveLbl.nodeId, { string: 'WAVE', fontSize: 14 });
    const waveTxt = b.createChild('txt_wave', waveNode.nodeId, { w: 100, h: 36, y: -10 });
    b.addLabel(waveTxt.nodeId, { string: '1/5', fontSize: 28, bold: true });

    // Pause button
    const pauseBtn = b.createChild('btn_pause', topBar.nodeId, { x: 325, y: -25, w: 50, h: 50 });
    b.addButton(pauseBtn.nodeId);
    const pauseTxt = b.createChild('label', pauseBtn.nodeId, { w: 50, h: 50 });
    b.addLabel(pauseTxt.nodeId, { string: '||', fontSize: 24, bold: true });

    // --- Wave banner (center, hidden by default) ---
    const waveBanner = b.createChild('node_waveBanner', root.nodeId, { w: 400, h: 70, y: 400, active: false });
    b.addSprite(waveBanner.nodeId);
    const bannerTxt = b.createChild('txt_waveBanner', waveBanner.nodeId, { w: 400, h: 70 });
    b.addLabel(bannerTxt.nodeId, { string: '第 1 波', fontSize: 32, bold: true });

    // --- Bottom bar ---
    const bottomBar = b.createChild('node_bottom', root.nodeId, { w: 750, h: 120, y: -547, anchorY: 0 });
    b.addWidget(bottomBar.nodeId, { alignFlags: ALIGN.BOT | ALIGN.LEFT | ALIGN.RIGHT, bottom: 0, left: 0, right: 0 });
    b.addSprite(bottomBar.nodeId);

    // Ammo slots
    for (let i = 0; i < 3; i++) {
        const names = ['普通', '穿透', '爆炸'];
        const slot = b.createChild(`btn_ammo${i}`, bottomBar.nodeId, { w: 64, h: 64, x: -270 + i * 80, y: 20 });
        b.addButton(slot.nodeId);
        b.addSprite(slot.nodeId);
        const slotTxt = b.createChild('label', slot.nodeId, { w: 64, h: 30, y: 0 });
        b.addLabel(slotTxt.nodeId, { string: names[i], fontSize: 16 });
        const countTxt = b.createChild(`txt_ammoCount${i}`, slot.nodeId, { w: 64, h: 20, y: -45 });
        b.addLabel(countTxt.nodeId, { string: 'x99', fontSize: 14 });
    }

    return b;
}

// ============================================================
// 2. ResultVictory
// ============================================================
function buildResultVictory() {
    const b = new PrefabBuilder('ResultVictory');

    // Root (full screen overlay)
    const root = b.addNode('ResultVictory', null, { w: 750, h: 1334 });

    // Background (dark overlay)
    const bg = b.createChild('background', root.nodeId, { w: 750, h: 1334, r: 0, g: 0, b: 0, a: 150 });
    b.addSprite(bg.nodeId);
    b.addBlockInput(bg.nodeId);
    b.addWidget(bg.nodeId, { alignFlags: ALIGN.TOP | ALIGN.BOT | ALIGN.LEFT | ALIGN.RIGHT, top: 0, bottom: 0, left: 0, right: 0 });

    // Main panel
    const main = b.createChild('main', root.nodeId, { w: 600, h: 750 });
    b.addSprite(main.nodeId, { type: 1 }); // sliced

    // Title
    const title = b.createChild('txt_title', main.nodeId, { w: 500, h: 100, y: 280 });
    b.addLabel(title.nodeId, { string: 'VICTORY', fontSize: 56, bold: true });

    // Stars container
    const stars = b.createChild('node_stars', main.nodeId, { w: 300, h: 80, y: 180 });
    for (let i = 0; i < 3; i++) {
        const star = b.createChild(`sp_star${i}`, stars.nodeId, { w: 70, h: 70, x: -90 + i * 90 });
        b.addSprite(star.nodeId);
    }

    // Stats
    const statsY = [60, 10, -40, -90];
    const statsLabel = ['击杀僵尸', '获得金币', '用时', '剩余血量'];
    const statsValue = ['0', '0', '00:00', '100%'];
    const statsNames = ['kill', 'coin', 'time', 'hp'];
    for (let i = 0; i < 4; i++) {
        const lbl = b.createChild(`txt_statsLabel${i}`, main.nodeId, { w: 200, h: 30, x: -120, y: statsY[i] });
        b.addLabel(lbl.nodeId, { string: statsLabel[i], fontSize: 20, hAlign: 0 });
        const val = b.createChild(`txt_${statsNames[i]}`, main.nodeId, { w: 200, h: 30, x: 120, y: statsY[i] });
        b.addLabel(val.nodeId, { string: statsValue[i], fontSize: 22, bold: true, hAlign: 2 });
    }

    // Buttons
    const btnBack = b.createChild('btn_back', main.nodeId, { w: 160, h: 56, x: -180, y: -220 });
    b.addButton(btnBack.nodeId); b.addSprite(btnBack.nodeId, { type: 1 });
    const btnBackLbl = b.createChild('label', btnBack.nodeId, { w: 160, h: 56 });
    b.addLabel(btnBackLbl.nodeId, { string: '返回', fontSize: 22 });

    const btnReplay = b.createChild('btn_replay', main.nodeId, { w: 160, h: 56, y: -220 });
    b.addButton(btnReplay.nodeId); b.addSprite(btnReplay.nodeId, { type: 1 });
    const btnReplayLbl = b.createChild('label', btnReplay.nodeId, { w: 160, h: 56 });
    b.addLabel(btnReplayLbl.nodeId, { string: '重玩', fontSize: 22 });

    const btnNext = b.createChild('btn_next', main.nodeId, { w: 160, h: 56, x: 180, y: -220 });
    b.addButton(btnNext.nodeId); b.addSprite(btnNext.nodeId, { type: 1 });
    const btnNextLbl = b.createChild('label', btnNext.nodeId, { w: 160, h: 56 });
    b.addLabel(btnNextLbl.nodeId, { string: '下一关', fontSize: 22 });

    return b;
}

// ============================================================
// 3. ResultDefeat
// ============================================================
function buildResultDefeat() {
    const b = new PrefabBuilder('ResultDefeat');

    const root = b.addNode('ResultDefeat', null, { w: 750, h: 1334 });

    const bg = b.createChild('background', root.nodeId, { w: 750, h: 1334, r: 0, g: 0, b: 0, a: 150 });
    b.addSprite(bg.nodeId); b.addBlockInput(bg.nodeId);
    b.addWidget(bg.nodeId, { alignFlags: ALIGN.TOP | ALIGN.BOT | ALIGN.LEFT | ALIGN.RIGHT, top: 0, bottom: 0, left: 0, right: 0 });

    const main = b.createChild('main', root.nodeId, { w: 600, h: 600 });
    b.addSprite(main.nodeId, { type: 1 });

    const title = b.createChild('txt_title', main.nodeId, { w: 500, h: 100, y: 220 });
    b.addLabel(title.nodeId, { string: 'DEFEATED', fontSize: 56, bold: true });

    // Stats
    const statsY = [80, 30, -20];
    const statsLabel = ['击杀僵尸', '获得金币', '到达波次'];
    const statsValue = ['0', '0', '0/0'];
    const statsNames = ['kill', 'coin', 'wave'];
    for (let i = 0; i < 3; i++) {
        const lbl = b.createChild(`txt_statsLabel${i}`, main.nodeId, { w: 200, h: 30, x: -120, y: statsY[i] });
        b.addLabel(lbl.nodeId, { string: statsLabel[i], fontSize: 20, hAlign: 0 });
        const val = b.createChild(`txt_${statsNames[i]}`, main.nodeId, { w: 200, h: 30, x: 120, y: statsY[i] });
        b.addLabel(val.nodeId, { string: statsValue[i], fontSize: 22, bold: true, hAlign: 2 });
    }

    // Tip
    const tip = b.createChild('txt_tip', main.nodeId, { w: 400, h: 30, y: -80 });
    b.addLabel(tip.nodeId, { string: '升级武器可以更容易通关', fontSize: 16 });

    // Buttons
    const btnBack = b.createChild('btn_back', main.nodeId, { w: 200, h: 56, x: -120, y: -180 });
    b.addButton(btnBack.nodeId); b.addSprite(btnBack.nodeId, { type: 1 });
    const btnBackLbl = b.createChild('label', btnBack.nodeId, { w: 200, h: 56 });
    b.addLabel(btnBackLbl.nodeId, { string: '返回', fontSize: 22 });

    const btnReplay = b.createChild('btn_replay', main.nodeId, { w: 200, h: 56, x: 120, y: -180 });
    b.addButton(btnReplay.nodeId); b.addSprite(btnReplay.nodeId, { type: 1 });
    const btnReplayLbl = b.createChild('label', btnReplay.nodeId, { w: 200, h: 56 });
    b.addLabel(btnReplayLbl.nodeId, { string: '重玩', fontSize: 22 });

    return b;
}

// ============================================================
// 4. MainMenu
// ============================================================
function buildMainMenu() {
    const b = new PrefabBuilder('MainMenu');

    const root = b.addNode('MainMenu', null, { w: 750, h: 1334 });

    // Background
    const bg = b.createChild('sp_bg', root.nodeId, { w: 750, h: 1334 });
    b.addSprite(bg.nodeId);
    b.addWidget(bg.nodeId, { alignFlags: ALIGN.TOP | ALIGN.BOT | ALIGN.LEFT | ALIGN.RIGHT, top: 0, bottom: 0, left: 0, right: 0 });

    // Top currency bar
    const topBar = b.createChild('node_topBar', root.nodeId, { w: 750, h: 70, y: 632, anchorY: 1 });
    b.addWidget(topBar.nodeId, { alignFlags: ALIGN.TOP | ALIGN.LEFT | ALIGN.RIGHT, top: 0, left: 0, right: 0 });
    b.addSprite(topBar.nodeId);

    // Coin
    const coinIcon = b.createChild('sp_coinIcon', topBar.nodeId, { w: 32, h: 32, x: -310 });
    b.addSprite(coinIcon.nodeId);
    const coinTxt = b.createChild('txt_coin', topBar.nodeId, { w: 100, h: 32, x: -240 });
    b.addLabel(coinTxt.nodeId, { string: '0', fontSize: 20, bold: true, hAlign: 0 });

    // Diamond
    const diamondIcon = b.createChild('sp_diamondIcon', topBar.nodeId, { w: 32, h: 32, x: -130 });
    b.addSprite(diamondIcon.nodeId);
    const diamondTxt = b.createChild('txt_diamond', topBar.nodeId, { w: 100, h: 32, x: -60 });
    b.addLabel(diamondTxt.nodeId, { string: '0', fontSize: 20, bold: true, hAlign: 0 });

    // Settings button
    const btnSetting = b.createChild('btn_setting', topBar.nodeId, { w: 50, h: 50, x: 325 });
    b.addButton(btnSetting.nodeId); b.addSprite(btnSetting.nodeId);

    // Logo
    const logo = b.createChild('sp_logo', root.nodeId, { w: 500, h: 200, y: 350 });
    b.addSprite(logo.nodeId);

    // Start button
    const btnStart = b.createChild('btn_start', root.nodeId, { w: 300, h: 90, y: 50 });
    b.addButton(btnStart.nodeId); b.addSprite(btnStart.nodeId, { type: 1 });
    const startLbl = b.createChild('label', btnStart.nodeId, { w: 300, h: 90 });
    b.addLabel(startLbl.nodeId, { string: '开始游戏', fontSize: 32, bold: true });

    // Bottom function buttons
    const funcNames = ['weapon', 'shop', 'mission', 'rank'];
    const funcLabels = ['武器', '商店', '任务', '排行'];
    for (let i = 0; i < 4; i++) {
        const btn = b.createChild(`btn_${funcNames[i]}`, root.nodeId, {
            w: 130, h: 130, x: -240 + i * 170, y: -230
        });
        b.addButton(btn.nodeId); b.addSprite(btn.nodeId, { type: 1 });
        const lbl = b.createChild('label', btn.nodeId, { w: 130, h: 30, y: -35 });
        b.addLabel(lbl.nodeId, { string: funcLabels[i], fontSize: 18 });
    }

    // Banner
    const banner = b.createChild('node_banner', root.nodeId, { w: 650, h: 80, y: -420 });
    b.addSprite(banner.nodeId, { type: 1 });
    const bannerTxt = b.createChild('txt_banner', banner.nodeId, { w: 600, h: 40 });
    b.addLabel(bannerTxt.nodeId, { string: '公告', fontSize: 18 });

    return b;
}

// ============================================================
// 5. LevelSelect
// ============================================================
function buildLevelSelect() {
    const b = new PrefabBuilder('LevelSelect');

    const root = b.addNode('LevelSelect', null, { w: 750, h: 1334 });

    // Background
    const bg = b.createChild('sp_bg', root.nodeId, { w: 750, h: 1334 });
    b.addSprite(bg.nodeId);
    b.addWidget(bg.nodeId, { alignFlags: ALIGN.TOP | ALIGN.BOT | ALIGN.LEFT | ALIGN.RIGHT, top: 0, bottom: 0, left: 0, right: 0 });

    // Top nav bar
    const navBar = b.createChild('node_navBar', root.nodeId, { w: 750, h: 80, y: 627, anchorY: 1 });
    b.addWidget(navBar.nodeId, { alignFlags: ALIGN.TOP | ALIGN.LEFT | ALIGN.RIGHT, top: 0, left: 0, right: 0 });
    b.addSprite(navBar.nodeId);

    const btnBack = b.createChild('btn_back', navBar.nodeId, { w: 50, h: 40, x: -325 });
    b.addButton(btnBack.nodeId);
    const backLbl = b.createChild('label', btnBack.nodeId, { w: 50, h: 40 });
    b.addLabel(backLbl.nodeId, { string: '←', fontSize: 24, bold: true });

    const titleTxt = b.createChild('txt_title', navBar.nodeId, { w: 300, h: 40 });
    b.addLabel(titleTxt.nodeId, { string: '选择关卡', fontSize: 30, bold: true });

    // Chapter title
    const chapterBg = b.createChild('node_chapter', root.nodeId, { w: 400, h: 50, y: 540 });
    b.addSprite(chapterBg.nodeId, { type: 1 });
    const chapterTxt = b.createChild('txt_chapter', chapterBg.nodeId, { w: 400, h: 50 });
    b.addLabel(chapterTxt.nodeId, { string: '第一章', fontSize: 22, bold: true });

    // Scroll view for levels
    const scrollNode = b.createChild('node_levelScroll', root.nodeId, { w: 700, h: 900, y: 0 });

    // Level nodes container
    const levelContainer = b.createChild('node_levelContainer', scrollNode.nodeId, { w: 700, h: 900 });

    // Sample level nodes (6 levels)
    const positions = [
        { x: -100, y: 300 }, { x: 100, y: 180 }, { x: -100, y: 60 },
        { x: 100, y: -60 }, { x: -100, y: -180 }, { x: 100, y: -300 }
    ];
    for (let i = 0; i < 6; i++) {
        const lvl = b.createChild(`btn_level${i}`, levelContainer.nodeId, {
            w: 80, h: 80, x: positions[i].x, y: positions[i].y
        });
        b.addButton(lvl.nodeId); b.addSprite(lvl.nodeId);
        const lvlTxt = b.createChild('label', lvl.nodeId, { w: 80, h: 40 });
        b.addLabel(lvlTxt.nodeId, { string: `${i + 1}`, fontSize: 28, bold: true });
    }

    // Bottom info bar
    const bottomBar = b.createChild('node_bottom', root.nodeId, { w: 750, h: 120, y: -547, anchorY: 0 });
    b.addWidget(bottomBar.nodeId, { alignFlags: ALIGN.BOT | ALIGN.LEFT | ALIGN.RIGHT, bottom: 0, left: 0, right: 0 });
    b.addSprite(bottomBar.nodeId);

    const levelName = b.createChild('txt_levelName', bottomBar.nodeId, { w: 300, h: 24, x: -140, y: 25 });
    b.addLabel(levelName.nodeId, { string: '关卡名称', fontSize: 18, hAlign: 0 });
    const levelInfo = b.createChild('txt_levelInfo', bottomBar.nodeId, { w: 300, h: 24, x: -140, y: -5 });
    b.addLabel(levelInfo.nodeId, { string: '波次: 5  僵尸: 45', fontSize: 14, hAlign: 0 });

    const btnEnter = b.createChild('btn_enter', bottomBar.nodeId, { w: 180, h: 56, x: 225, y: 0 });
    b.addButton(btnEnter.nodeId); b.addSprite(btnEnter.nodeId, { type: 1 });
    const enterLbl = b.createChild('label', btnEnter.nodeId, { w: 180, h: 56 });
    b.addLabel(enterLbl.nodeId, { string: '进入战斗', fontSize: 22, bold: true });

    return b;
}

// ============================================================
// 6. LoadingUI
// ============================================================
function buildLoadingUI() {
    const b = new PrefabBuilder('LoadingUI');

    const root = b.addNode('LoadingUI', null, { w: 750, h: 1334 });

    // Background
    const bg = b.createChild('sp_bg', root.nodeId, { w: 750, h: 1334, r: 10, g: 10, b: 15 });
    b.addSprite(bg.nodeId);
    b.addWidget(bg.nodeId, { alignFlags: ALIGN.TOP | ALIGN.BOT | ALIGN.LEFT | ALIGN.RIGHT, top: 0, bottom: 0, left: 0, right: 0 });

    // Logo
    const logo = b.createChild('sp_logo', root.nodeId, { w: 400, h: 160, y: 200 });
    b.addSprite(logo.nodeId);

    // Progress bar
    const progressNode = b.createChild('progress_loading', root.nodeId, { w: 500, h: 28, y: -100 });
    b.addSprite(progressNode.nodeId, { type: 1 }); // bg
    const progressFill = b.createChild('sp_progressFill', progressNode.nodeId, { w: 490, h: 22, anchorX: 0, x: -245 });
    const fillSpriteId = b.addSprite(progressFill.nodeId, { type: 3, fillType: 0, fillRange: 1 });
    b.addProgressBar(progressNode.nodeId, fillSpriteId, { totalLength: 490, progress: 0 });

    // Percent text
    const percentTxt = b.createChild('txt_percent', root.nodeId, { w: 100, h: 30, y: -140 });
    b.addLabel(percentTxt.nodeId, { string: '0%', fontSize: 18, bold: true });

    // Loading text
    const loadingTxt = b.createChild('txt_loading', root.nodeId, { w: 300, h: 30, y: -175 });
    b.addLabel(loadingTxt.nodeId, { string: '正在加载资源...', fontSize: 16 });

    // Tip
    const tipTxt = b.createChild('txt_tip', root.nodeId, { w: 600, h: 40, y: -550 });
    b.addLabel(tipTxt.nodeId, { string: '利用子弹反弹可以击杀躲在障碍物后的僵尸', fontSize: 16 });

    return b;
}

// ============================================================
// Main
// ============================================================
function main() {
    console.log('🔧 开始生成UI预制体...\n');

    const prefabs = [
        { name: 'BattleHUD', build: buildBattleHUD, dir: 'assets/net_battle/prefab/ui' },
        { name: 'ResultVictory', build: buildResultVictory, dir: 'assets/net_battle/prefab/ui' },
        { name: 'ResultDefeat', build: buildResultDefeat, dir: 'assets/net_battle/prefab/ui' },
        { name: 'MainMenu', build: buildMainMenu, dir: 'assets/net_main/prefab' },
        { name: 'LevelSelect', build: buildLevelSelect, dir: 'assets/net_main/prefab' },
        { name: 'LoadingUI', build: buildLoadingUI, dir: 'assets/prefab' },
    ];

    for (const p of prefabs) {
        const builder = p.build();
        const filePath = path.join(PROJECT, p.dir, `${p.name}.prefab`);
        builder.save(filePath);
        console.log(`  ✅ ${path.relative(PROJECT, filePath)}`);
    }

    console.log('\n✨ 全部预制体生成完毕！');
    console.log('提示: 在 Cocos Creator 中刷新资源面板');
    console.log('注意: 节点命名遵循 UITools 规范（btn_/txt_/sp_/progress_/node_）');
    console.log('      脚本组件需要在编辑器中手动挂载或通过代码 addComponent');
}

main();
