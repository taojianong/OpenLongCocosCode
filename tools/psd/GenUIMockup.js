/**
 * UI效果图/线框图生成工具
 * 生成各界面的布局效果图（带标注）
 *
 * 使用: node tools/GenUIMockup.js
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PROJECT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(PROJECT, '策划文档/UI效果图');

const W = 750, H = 1334;

// 通用样式
const STYLES = `
    .bg { fill: #0f0f1e; }
    .panel { fill: #282c34; stroke: #64ff64; stroke-width: 2; rx: 8; }
    .btn { fill: #455a64; stroke: #fff; stroke-width: 1.5; rx: 12; }
    .btn-green { fill: #4caf50; stroke: #81c784; }
    .btn-orange { fill: #ff9800; stroke: #ffb74d; }
    .btn-red { fill: #f44336; stroke: #ef5350; }
    .txt { font-family: Arial, sans-serif; fill: #ffffff; text-anchor: middle; dominant-baseline: central; }
    .txt-sm { font-size: 16px; }
    .txt-md { font-size: 24px; }
    .txt-lg { font-size: 36px; }
    .txt-xl { font-size: 60px; font-weight: bold; }
    .txt-dim { fill: rgba(255,255,255,0.4); font-size: 14px; }
    .txt-green { fill: #64ff64; }
    .txt-gold { fill: #ffd700; }
    .txt-red { fill: #f44336; }
    .hp-bg { fill: #1a1a1a; stroke: #555; stroke-width: 1.5; rx: 6; }
    .hp-fill { fill: url(#hpGrad); rx: 4; }
    .hp-fill-low { fill: url(#hpLowGrad); rx: 4; }
    .coin { fill: #ffc107; stroke: #fff; stroke-width: 1; }
    .star-on { fill: #ffd700; stroke: #fff; stroke-width: 0.5; }
    .star-off { fill: #555; stroke: #888; stroke-width: 0.5; }
    .label { fill: rgba(100,255,100,0.6); font-size: 12px; font-family: Arial; text-anchor: middle; }
    .label-line { stroke: rgba(100,255,100,0.3); stroke-width: 1; stroke-dasharray: 4,3; }
    .divider { stroke: rgba(255,255,255,0.1); stroke-width: 1; }
    .overlay { fill: rgba(0,0,0,0.6); }
`;

const DEFS = `
    <linearGradient id="hpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#4caf50" />
        <stop offset="100%" style="stop-color:#c8e86a" />
    </linearGradient>
    <linearGradient id="hpLowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#f44336" />
        <stop offset="100%" style="stop-color:#ff7043" />
    </linearGradient>
    <linearGradient id="mainBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#0f0f1e" />
        <stop offset="40%" style="stop-color:#1a2518" />
        <stop offset="100%" style="stop-color:#0a0a0f" />
    </linearGradient>
    <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#4caf50" />
        <stop offset="100%" style="stop-color:#64ff64" />
    </linearGradient>
`;

function star(cx, cy, r, cls) {
    const pts = [];
    for (let i = 0; i < 5; i++) {
        const a1 = (i * 72 - 90) * Math.PI / 180;
        pts.push(`${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}`);
        const a2 = ((i * 72) + 36 - 90) * Math.PI / 180;
        pts.push(`${cx + r * 0.4 * Math.cos(a2)},${cy + r * 0.4 * Math.sin(a2)}`);
    }
    return `<polygon points="${pts.join(' ')}" class="${cls}"/>`;
}

function annotation(x1, y1, x2, y2, text) {
    return `
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="label-line"/>
        <text x="${x2}" y="${y2 - 6}" class="label">${text}</text>
    `;
}

// ============================================================
// 1. 战斗HUD效果图
// ============================================================
function genBattleHUD() {
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>${DEFS}</defs>
    <style>${STYLES}</style>

    <!-- 背景：模拟战斗场景 -->
    <rect width="${W}" height="${H}" fill="#2a3a2a"/>
    <text x="${W/2}" y="${H/2}" class="txt txt-dim" text-anchor="middle">[ 战斗场景区域 ]</text>

    <!-- 网格参考线 -->
    <line x1="0" y1="100" x2="${W}" y2="100" class="divider"/>
    <line x1="0" y1="${H-120}" x2="${W}" y2="${H-120}" class="divider"/>

    <!-- ===== 顶部HUD区域 ===== -->
    <rect x="0" y="0" width="${W}" height="100" fill="rgba(0,0,0,0.7)"/>

    <!-- 血条 -->
    <rect x="20" y="20" width="280" height="36" class="hp-bg"/>
    <rect x="24" y="24" width="200" height="28" class="hp-fill"/>
    <text x="160" y="38" class="txt txt-sm" font-weight="bold">75 / 100</text>
    ${annotation(160, 60, 160, 85, '玩家血条')}

    <!-- 金币 -->
    <circle cx="340" cy="38" r="18" class="coin"/>
    <text x="340" y="38" class="txt" font-size="14" font-weight="bold">$</text>
    <text x="390" y="38" class="txt txt-md txt-gold" text-anchor="start">1,250</text>
    ${annotation(370, 60, 370, 85, '金币数量')}

    <!-- 波次 -->
    <text x="600" y="30" class="txt txt-sm txt-dim">WAVE</text>
    <text x="600" y="58" class="txt txt-lg txt-green" font-weight="bold">3/5</text>
    ${annotation(600, 70, 600, 90, '波次进度')}

    <!-- 暂停按钮 -->
    <rect x="${W-70}" y="15" width="50" height="50" class="btn" rx="10"/>
    <text x="${W-45}" y="40" class="txt txt-md">||</text>
    ${annotation(W-45, 70, W-45, 90, '暂停')}

    <!-- ===== 波次提示（居中弹出） ===== -->
    <rect x="${(W-400)/2}" y="180" width="400" height="70" class="panel" opacity="0.9"/>
    <text x="${W/2}" y="210" class="txt txt-lg txt-green" font-weight="bold">第 3 波</text>
    <text x="${W/2}" y="235" class="txt txt-sm txt-dim">准备迎战！</text>
    ${annotation(W/2, 255, W/2, 280, '波次提示横幅（出现后自动消失）')}

    <!-- ===== 底部操作区 ===== -->
    <rect x="0" y="${H-120}" width="${W}" height="120" fill="rgba(0,0,0,0.5)"/>

    <!-- 弹药选择 -->
    <rect x="30" y="${H-100}" width="64" height="64" class="btn btn-orange" rx="8"/>
    <text x="62" y="${H-68}" class="txt txt-sm">普通</text>
    <rect x="110" y="${H-100}" width="64" height="64" class="btn" rx="8"/>
    <text x="142" y="${H-68}" class="txt txt-sm">穿透</text>
    <rect x="190" y="${H-100}" width="64" height="64" class="btn" rx="8"/>
    <text x="222" y="${H-68}" class="txt txt-sm">爆炸</text>
    ${annotation(142, H-30, 142, H-15, '弹药选择栏')}

    <!-- 弹药数量 -->
    <text x="62" y="${H-30}" class="txt txt-sm txt-gold">x99</text>
    <text x="142" y="${H-30}" class="txt txt-sm txt-dim">x5</text>
    <text x="222" y="${H-30}" class="txt txt-sm txt-dim">x3</text>

    <!-- 射击按钮区域提示 -->
    <circle cx="${W-100}" cy="${H-68}" r="50" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-dasharray="5,5"/>
    <text x="${W-100}" y="${H-68}" class="txt txt-sm txt-dim">触摸瞄准</text>

    <!-- 标题 -->
    <rect x="0" y="${H-20}" width="${W}" height="20" fill="rgba(100,255,100,0.1)"/>
    <text x="${W/2}" y="${H-7}" class="label">战斗HUD界面 · 750×1334 · 占位效果图</text>
    </svg>`;
    return svg;
}

// ============================================================
// 2. 结算界面效果图（胜利）
// ============================================================
function genResultVictory() {
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>${DEFS}</defs>
    <style>${STYLES}</style>

    <!-- 背景 -->
    <rect width="${W}" height="${H}" fill="#2a3a2a"/>
    <text x="${W/2}" y="200" class="txt txt-dim">[ 战斗场景（模糊） ]</text>

    <!-- 遮罩 -->
    <rect width="${W}" height="${H}" class="overlay"/>

    <!-- 结算面板 -->
    <rect x="75" y="200" width="600" height="800" class="panel"/>

    <!-- 胜利标题 -->
    <text x="${W/2}" y="300" class="txt txt-xl txt-gold">VICTORY</text>
    ${annotation(W/2, 330, W/2, 350, '胜利标题')}

    <!-- 星星评级 -->
    ${star(280, 400, 35, 'star-on')}
    ${star(375, 380, 45, 'star-on')}
    ${star(470, 400, 35, 'star-off')}
    ${annotation(375, 440, 375, 460, '星级评定（最多3星）')}

    <!-- 统计信息 -->
    <line x1="150" y1="490" x2="600" y2="490" class="divider"/>

    <text x="200" y="530" class="txt txt-sm" text-anchor="start">击杀僵尸</text>
    <text x="550" y="530" class="txt txt-md txt-green" text-anchor="end">32</text>

    <text x="200" y="580" class="txt txt-sm" text-anchor="start">获得金币</text>
    <circle cx="510" cy="575" r="14" class="coin"/>
    <text x="510" y="575" class="txt" font-size="11" font-weight="bold">$</text>
    <text x="550" y="580" class="txt txt-md txt-gold" text-anchor="end">680</text>

    <text x="200" y="630" class="txt txt-sm" text-anchor="start">用时</text>
    <text x="550" y="630" class="txt txt-md" text-anchor="end">01:45</text>

    <text x="200" y="680" class="txt txt-sm" text-anchor="start">剩余血量</text>
    <text x="550" y="680" class="txt txt-md txt-green" text-anchor="end">65%</text>

    ${annotation(375, 700, 375, 720, '战斗统计')}

    <line x1="150" y1="740" x2="600" y2="740" class="divider"/>

    <!-- 按钮 -->
    <rect x="100" y="780" width="180" height="60" class="btn" rx="12"/>
    <text x="190" y="810" class="txt txt-md">返回</text>

    <rect x="310" y="780" width="180" height="60" class="btn btn-orange" rx="12"/>
    <text x="400" y="810" class="txt txt-md">重玩</text>

    <rect x="520" y="780" width="180" height="60" class="btn btn-green" rx="12"/>
    <text x="610" y="810" class="txt txt-md">下一关</text>
    ${annotation(375, 850, 375, 870, '操作按钮')}

    <!-- 关卡信息 -->
    <text x="${W/2}" y="930" class="txt txt-sm txt-dim">第1章 · 第3关</text>

    <!-- 标题 -->
    <rect x="0" y="${H-20}" width="${W}" height="20" fill="rgba(100,255,100,0.1)"/>
    <text x="${W/2}" y="${H-7}" class="label">胜利结算界面 · 占位效果图</text>
    </svg>`;
    return svg;
}

// ============================================================
// 3. 结算界面效果图（失败）
// ============================================================
function genResultDefeat() {
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>${DEFS}</defs>
    <style>${STYLES}</style>

    <rect width="${W}" height="${H}" fill="#2a1a1a"/>
    <rect width="${W}" height="${H}" class="overlay"/>

    <!-- 结算面板 -->
    <rect x="75" y="250" width="600" height="650" class="panel" style="stroke:#f44336;"/>

    <!-- 失败标题 -->
    <text x="${W/2}" y="350" class="txt txt-xl txt-red">DEFEATED</text>

    <!-- 星星（全暗） -->
    ${star(280, 430, 35, 'star-off')}
    ${star(375, 410, 45, 'star-off')}
    ${star(470, 430, 35, 'star-off')}

    <!-- 统计 -->
    <line x1="150" y1="480" x2="600" y2="480" class="divider"/>
    <text x="200" y="520" class="txt txt-sm" text-anchor="start">击杀僵尸</text>
    <text x="550" y="520" class="txt txt-md txt-red" text-anchor="end">12</text>
    <text x="200" y="570" class="txt txt-sm" text-anchor="start">获得金币</text>
    <text x="550" y="570" class="txt txt-md txt-gold" text-anchor="end">150</text>
    <text x="200" y="620" class="txt txt-sm" text-anchor="start">到达波次</text>
    <text x="550" y="620" class="txt txt-md" text-anchor="end">2/5</text>

    <line x1="150" y1="670" x2="600" y2="670" class="divider"/>

    <!-- 提示 -->
    <text x="${W/2}" y="710" class="txt txt-sm txt-dim">升级武器可以更容易通关</text>

    <!-- 按钮 -->
    <rect x="130" y="760" width="220" height="60" class="btn" rx="12"/>
    <text x="240" y="790" class="txt txt-md">返回</text>

    <rect x="400" y="760" width="220" height="60" class="btn btn-orange" rx="12"/>
    <text x="510" y="790" class="txt txt-md">重玩</text>

    <rect x="0" y="${H-20}" width="${W}" height="20" fill="rgba(255,100,100,0.1)"/>
    <text x="${W/2}" y="${H-7}" class="label">失败结算界面 · 占位效果图</text>
    </svg>`;
    return svg;
}

// ============================================================
// 4. 主界面效果图
// ============================================================
function genMainMenu() {
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>${DEFS}</defs>
    <style>${STYLES}</style>

    <!-- 背景 -->
    <rect width="${W}" height="${H}" fill="url(#mainBg)"/>

    <!-- 顶部货币栏 -->
    <rect x="0" y="0" width="${W}" height="70" fill="rgba(0,0,0,0.5)"/>
    <circle cx="40" cy="35" r="16" class="coin"/>
    <text x="40" y="35" class="txt" font-size="12" font-weight="bold">$</text>
    <text x="65" y="35" class="txt txt-md txt-gold" text-anchor="start">12,500</text>

    <circle cx="220" cy="35" r="16" fill="#00bcd4" stroke="#fff" stroke-width="1"/>
    <text x="220" y="35" class="txt" font-size="12" font-weight="bold">◆</text>
    <text x="245" y="35" class="txt txt-md" text-anchor="start" fill="#00e5ff">350</text>

    <!-- 设置按钮 -->
    <rect x="${W-70}" y="10" width="50" height="50" class="btn" rx="10"/>
    <text x="${W-45}" y="35" class="txt txt-md">⚙</text>
    ${annotation(W-45, 65, W-45, 85, '设置')}
    ${annotation(130, 55, 130, 85, '货币显示栏')}

    <!-- Logo -->
    <text x="${W/2}" y="280" font-family="Arial" font-size="90" font-weight="bold"
        fill="none" stroke="#64ff64" stroke-width="3" text-anchor="middle">ZOMBIES</text>
    <text x="${W/2}" y="280" font-family="Arial" font-size="90" font-weight="bold"
        fill="rgba(100,255,100,0.3)" text-anchor="middle">ZOMBIES</text>
    <text x="${W/2}" y="320" class="txt txt-sm txt-dim">僵尸射击 · 反弹消灭</text>
    ${annotation(W/2, 340, W/2, 365, '游戏Logo')}

    <!-- 僵尸剪影装饰 -->
    <text x="100" y="600" font-size="120" fill="rgba(255,255,255,0.05)">🧟</text>
    <text x="550" y="500" font-size="80" fill="rgba(255,255,255,0.03)">🧟</text>

    <!-- 开始游戏按钮 -->
    <rect x="${(W-320)/2}" y="700" width="320" height="90" class="btn btn-green" rx="16"/>
    <text x="${W/2}" y="745" class="txt txt-lg" font-weight="bold">开始游戏</text>
    ${annotation(W/2, 800, W/2, 825, '主按钮')}

    <!-- 底部功能入口 -->
    <rect x="80" y="940" width="130" height="130" class="panel" rx="12"/>
    <text x="145" y="990" class="txt txt-md">🔫</text>
    <text x="145" y="1030" class="txt txt-sm">武器</text>

    <rect x="250" y="940" width="130" height="130" class="panel" rx="12"/>
    <text x="315" y="990" class="txt txt-md">🏪</text>
    <text x="315" y="1030" class="txt txt-sm">商店</text>

    <rect x="420" y="940" width="130" height="130" class="panel" rx="12"/>
    <text x="485" y="990" class="txt txt-md">📋</text>
    <text x="485" y="1030" class="txt txt-sm">任务</text>

    <rect x="590" y="940" width="130" height="130" class="panel" rx="12"/>
    <text x="655" y="990" class="txt txt-md">🏆</text>
    <text x="655" y="1030" class="txt txt-sm">排行</text>

    ${annotation(375, 1080, 375, 1105, '功能入口（武器/商店/任务/排行）')}

    <!-- 公告/活动横幅 -->
    <rect x="50" y="1140" width="650" height="80" class="panel" rx="8" opacity="0.7"/>
    <text x="${W/2}" y="1180" class="txt txt-sm txt-dim">📢 公告/活动横幅区域</text>
    ${annotation(W/2, 1225, W/2, 1250, '公告栏（可选）')}

    <!-- 版本号 -->
    <text x="${W/2}" y="${H-30}" class="txt txt-dim" font-size="12">v0.1.0</text>

    <rect x="0" y="${H-20}" width="${W}" height="20" fill="rgba(100,255,100,0.1)"/>
    <text x="${W/2}" y="${H-7}" class="label">主界面 · 占位效果图</text>
    </svg>`;
    return svg;
}

// ============================================================
// 5. 关卡选择效果图
// ============================================================
function genLevelSelect() {
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>${DEFS}</defs>
    <style>${STYLES}</style>

    <rect width="${W}" height="${H}" fill="#0f1a0f"/>

    <!-- 顶部导航 -->
    <rect x="0" y="0" width="${W}" height="80" fill="rgba(0,0,0,0.6)"/>
    <rect x="15" y="20" width="50" height="40" class="btn" rx="8"/>
    <text x="40" y="40" class="txt txt-md">←</text>
    <text x="${W/2}" y="50" class="txt txt-lg" font-weight="bold">选择关卡</text>
    ${annotation(W/2, 70, W/2, 100, '顶部导航栏')}

    <!-- 章节标题 -->
    <rect x="${(W-400)/2}" y="120" width="400" height="50" class="panel" rx="6"/>
    <text x="${W/2}" y="148" class="txt txt-md txt-gold" font-weight="bold">第一章 · 城市沦陷</text>
    ${annotation(W/2, 175, W/2, 200, '章节标题')}

    <!-- 关卡路径线 -->
    <polyline points="200,300 350,420 200,540 350,660 200,780 350,900"
        fill="none" stroke="rgba(100,255,100,0.2)" stroke-width="4" stroke-dasharray="8,6"/>

    <!-- 关卡节点 -->
    <!-- 第1关（已完成3星） -->
    <circle cx="200" cy="300" r="40" fill="#4caf50" stroke="#64ff64" stroke-width="3"/>
    <text x="200" y="295" class="txt txt-lg" font-weight="bold">1</text>
    <text x="200" y="318" class="txt" font-size="11">★★★</text>
    <text x="290" y="300" class="txt txt-sm txt-dim" text-anchor="start">荒废街道</text>

    <!-- 第2关（已完成2星） -->
    <circle cx="350" cy="420" r="40" fill="#4caf50" stroke="#64ff64" stroke-width="3"/>
    <text x="350" y="415" class="txt txt-lg" font-weight="bold">2</text>
    <text x="350" y="438" class="txt" font-size="11">★★☆</text>
    <text x="440" y="420" class="txt txt-sm txt-dim" text-anchor="start">废弃医院</text>

    <!-- 第3关（当前关） -->
    <circle cx="200" cy="540" r="45" fill="none" stroke="#ffd700" stroke-width="4"/>
    <circle cx="200" cy="540" r="38" fill="#ff9800" stroke="none"/>
    <text x="200" y="540" class="txt txt-lg" font-weight="bold">3</text>
    <text x="200" y="595" class="txt txt-sm txt-gold">当前关卡</text>
    <text x="290" y="540" class="txt txt-sm" text-anchor="start" fill="#ff9800">地下停车场</text>

    <!-- 第4关（锁定） -->
    <circle cx="350" cy="660" r="40" fill="#333" stroke="#555" stroke-width="2"/>
    <text x="350" y="660" class="txt txt-md" fill="#777">🔒</text>
    <text x="440" y="660" class="txt txt-sm txt-dim" text-anchor="start">超市废墟</text>

    <!-- 第5关（锁定） -->
    <circle cx="200" cy="780" r="40" fill="#333" stroke="#555" stroke-width="2"/>
    <text x="200" y="780" class="txt txt-md" fill="#777">🔒</text>

    <!-- 第6关（BOSS，锁定） -->
    <circle cx="350" cy="900" r="48" fill="#222" stroke="#8b0000" stroke-width="3"/>
    <text x="350" y="895" class="txt txt-md" fill="#777">🔒</text>
    <text x="350" y="920" class="txt" font-size="10" fill="#8b0000">BOSS</text>
    <text x="450" y="900" class="txt txt-sm txt-dim" text-anchor="start">最终决战</text>

    ${annotation(500, 540, 580, 540, '当前关卡高亮')}
    ${annotation(500, 660, 580, 660, '未解锁关卡')}
    ${annotation(500, 900, 580, 900, 'BOSS关卡')}

    <!-- 底部信息 -->
    <rect x="0" y="${H-140}" width="${W}" height="140" fill="rgba(0,0,0,0.5)"/>
    <text x="50" y="${H-105}" class="txt txt-sm" text-anchor="start" fill="#999">关卡 3: 地下停车场</text>
    <text x="50" y="${H-75}" class="txt txt-sm" text-anchor="start" fill="#666">波次: 5  僵尸: 45  推荐火力: ★★★</text>
    <rect x="${W-230}" y="${H-120}" width="200" height="60" class="btn btn-green" rx="12"/>
    <text x="${W-130}" y="${H-90}" class="txt txt-md" font-weight="bold">进入战斗</text>
    ${annotation(375, H-30, 375, H-15, '关卡详情 + 进入按钮')}

    <rect x="0" y="${H-20}" width="${W}" height="20" fill="rgba(100,255,100,0.1)"/>
    <text x="${W/2}" y="${H-7}" class="label">关卡选择界面 · 占位效果图</text>
    </svg>`;
    return svg;
}

// ============================================================
// 6. 加载界面效果图
// ============================================================
function genLoadingScreen() {
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>${DEFS}</defs>
    <style>${STYLES}</style>

    <rect width="${W}" height="${H}" fill="#0a0a0f"/>

    <!-- Logo -->
    <text x="${W/2}" y="500" font-family="Arial" font-size="80" font-weight="bold"
        fill="none" stroke="#64ff64" stroke-width="2" text-anchor="middle">ZOMBIES</text>
    <text x="${W/2}" y="500" font-family="Arial" font-size="80" font-weight="bold"
        fill="rgba(100,255,100,0.2)" text-anchor="middle">ZOMBIES</text>
    <text x="${W/2}" y="550" class="txt txt-sm txt-dim">Zombie Shooter</text>

    <!-- 进度条 -->
    <rect x="125" y="750" width="500" height="28" rx="14" fill="#1a1a1a" stroke="#333" stroke-width="1"/>
    <rect x="128" y="753" width="340" height="22" rx="11" fill="url(#progressGrad)"/>
    <text x="${W/2}" y="764" class="txt txt-sm" font-weight="bold">68%</text>
    ${annotation(W/2, 790, W/2, 815, '加载进度条')}

    <!-- 提示文字 -->
    <text x="${W/2}" y="860" class="txt txt-sm txt-dim">正在加载资源...</text>

    <!-- 底部小贴士 -->
    <text x="${W/2}" y="${H-100}" class="txt txt-sm txt-dim">💡 小提示：利用子弹反弹可以击杀躲在障碍物后的僵尸</text>
    ${annotation(W/2, H-70, W/2, H-50, '游戏小贴士（随机）')}

    <!-- 版权 -->
    <text x="${W/2}" y="${H-25}" class="txt txt-dim" font-size="11">© 2026 淘剑龙</text>

    <rect x="0" y="${H-20}" width="${W}" height="20" fill="rgba(100,255,100,0.1)"/>
    <text x="${W/2}" y="${H-7}" class="label">加载界面 · 占位效果图</text>
    </svg>`;
    return svg;
}

// ============================================================
// 主函数
// ============================================================
async function main() {
    console.log('🎨 开始生成UI效果图...\n');
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const pages = [
        { name: '1_战斗HUD', gen: genBattleHUD },
        { name: '2_胜利结算', gen: genResultVictory },
        { name: '3_失败结算', gen: genResultDefeat },
        { name: '4_主界面', gen: genMainMenu },
        { name: '5_关卡选择', gen: genLevelSelect },
        { name: '6_加载界面', gen: genLoadingScreen },
    ];

    for (const p of pages) {
        const svg = p.gen();
        const outPath = path.join(OUT_DIR, `${p.name}.png`);
        await sharp(Buffer.from(svg)).png().toFile(outPath);
        console.log(`  ✅ ${p.name}.png`);
    }

    console.log(`\n✨ 全部效果图生成完毕！`);
    console.log(`输出目录: ${path.relative(PROJECT, OUT_DIR)}/`);
}

main().catch(err => {
    console.error('❌ 生成失败:', err);
    process.exit(1);
});
