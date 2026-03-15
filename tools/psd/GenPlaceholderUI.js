/**
 * 占位图生成工具
 * 用 sharp 生成所有UI界面的占位图素材
 *
 * 使用: node tools/GenPlaceholderUI.js
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 颜色定义
const C = {
    green:   { r: 76, g: 175, b: 80, alpha: 1 },
    red:     { r: 244, g: 67, b: 54, alpha: 1 },
    darkGray:{ r: 69, g: 90, b: 100, alpha: 1 },
    midGray: { r: 96, g: 125, b: 139, alpha: 1 },
    black80: { r: 0, g: 0, b: 0, alpha: 0.8 },
    black60: { r: 0, g: 0, b: 0, alpha: 0.6 },
    gold:    { r: 255, g: 193, b: 7, alpha: 1 },
    white:   { r: 255, g: 255, b: 255, alpha: 1 },
    orange:  { r: 255, g: 152, b: 0, alpha: 1 },
    purple:  { r: 156, g: 39, b: 176, alpha: 1 },
    cyan:    { r: 0, g: 188, b: 212, alpha: 1 },
    darkBg:  { r: 30, g: 30, b: 40, alpha: 1 },
    panelBg: { r: 40, g: 44, b: 52, alpha: 1 },
    greenGlow: { r: 100, g: 255, b: 100, alpha: 1 },
    bloodRed:  { r: 139, g: 0, b: 0, alpha: 1 },
    starGold:  { r: 255, g: 215, b: 0, alpha: 1 },
    starGray:  { r: 120, g: 120, b: 120, alpha: 1 },
    lockGray:  { r: 80, g: 80, b: 80, alpha: 1 },
};

const PROJECT = path.resolve(__dirname, '..');
const BATTLE_UI = path.join(PROJECT, 'assets/net_battle/textures/ui');
const MAIN_UI   = path.join(PROJECT, 'assets/net_main/images/ui');

/**
 * 生成纯色矩形PNG
 */
async function genRect(w, h, color, outPath) {
    const dir = path.dirname(outPath);
    fs.mkdirSync(dir, { recursive: true });

    const r = Math.round(color.r);
    const g = Math.round(color.g);
    const b = Math.round(color.b);
    const a = Math.round((color.alpha || 1) * 255);

    await sharp({
        create: {
            width: w, height: h, channels: 4,
            background: { r, g, b, alpha: a / 255 }
        }
    }).png().toFile(outPath);
    console.log(`  ✅ ${path.relative(PROJECT, outPath)} (${w}x${h})`);
}

/**
 * 生成带边框的面板（深色底+亮色边框）
 */
async function genPanel(w, h, bgColor, borderColor, borderWidth, outPath) {
    const dir = path.dirname(outPath);
    fs.mkdirSync(dir, { recursive: true });

    const bw = borderWidth;
    // 背景
    const bg = await sharp({
        create: { width: w, height: h, channels: 4,
            background: { r: bgColor.r, g: bgColor.g, b: bgColor.b, alpha: Math.round((bgColor.alpha||1)*255)/255 }
        }
    }).png().toBuffer();

    // 内部（挖空区域）
    const inner = await sharp({
        create: { width: w - bw * 2, height: h - bw * 2, channels: 4,
            background: { r: bgColor.r, g: bgColor.g, b: bgColor.b, alpha: Math.round((bgColor.alpha||1)*255)/255 }
        }
    }).png().toBuffer();

    // 边框层
    const border = await sharp({
        create: { width: w, height: h, channels: 4,
            background: { r: borderColor.r, g: borderColor.g, b: borderColor.b, alpha: Math.round((borderColor.alpha||1)*255)/255 }
        }
    }).png().toBuffer();

    // 合成：边框底 + 内部覆盖
    await sharp(border)
        .composite([{ input: inner, left: bw, top: bw }])
        .png()
        .toFile(outPath);

    console.log(`  ✅ ${path.relative(PROJECT, outPath)} (${w}x${h}) [panel]`);
}

/**
 * 生成圆形图标
 */
async function genCircle(size, color, outPath) {
    const dir = path.dirname(outPath);
    fs.mkdirSync(dir, { recursive: true });

    const r = size / 2;
    const svg = `<svg width="${size}" height="${size}">
        <circle cx="${r}" cy="${r}" r="${r-1}"
            fill="rgba(${color.r},${color.g},${color.b},${color.alpha || 1})"
            stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
    </svg>`;

    await sharp(Buffer.from(svg))
        .png()
        .toFile(outPath);

    console.log(`  ✅ ${path.relative(PROJECT, outPath)} (${size}x${size}) [circle]`);
}

/**
 * 生成带文字的SVG图标
 */
async function genTextIcon(w, h, bgColor, text, textColor, outPath, opts = {}) {
    const dir = path.dirname(outPath);
    fs.mkdirSync(dir, { recursive: true });

    const fontSize = opts.fontSize || Math.min(w, h) * 0.4;
    const rx = opts.rounded ? Math.min(w, h) * 0.15 : 0;
    const bgAlpha = bgColor.alpha || 1;
    const txtAlpha = textColor.alpha || 1;
    const borderSvg = opts.border
        ? `stroke="rgba(${opts.border.r},${opts.border.g},${opts.border.b},${opts.border.alpha||1})" stroke-width="3"`
        : '';

    const svg = `<svg width="${w}" height="${h}">
        <rect x="1" y="1" width="${w-2}" height="${h-2}" rx="${rx}"
            fill="rgba(${bgColor.r},${bgColor.g},${bgColor.b},${bgAlpha})"
            ${borderSvg}/>
        <text x="${w/2}" y="${h/2}" font-family="Arial,sans-serif" font-size="${fontSize}"
            font-weight="bold" fill="rgba(${textColor.r},${textColor.g},${textColor.b},${txtAlpha})"
            text-anchor="middle" dominant-baseline="central">${text}</text>
    </svg>`;

    await sharp(Buffer.from(svg))
        .png()
        .toFile(outPath);

    console.log(`  ✅ ${path.relative(PROJECT, outPath)} (${w}x${h}) "${text}"`);
}

/**
 * 生成渐变条（左到右）
 */
async function genGradientBar(w, h, colorLeft, colorRight, outPath) {
    const dir = path.dirname(outPath);
    fs.mkdirSync(dir, { recursive: true });

    const svg = `<svg width="${w}" height="${h}">
        <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:rgb(${colorLeft.r},${colorLeft.g},${colorLeft.b});stop-opacity:${colorLeft.alpha||1}" />
                <stop offset="100%" style="stop-color:rgb(${colorRight.r},${colorRight.g},${colorRight.b});stop-opacity:${colorRight.alpha||1}" />
            </linearGradient>
        </defs>
        <rect width="${w}" height="${h}" rx="4" fill="url(#g)"/>
    </svg>`;

    await sharp(Buffer.from(svg))
        .png()
        .toFile(outPath);

    console.log(`  ✅ ${path.relative(PROJECT, outPath)} (${w}x${h}) [gradient]`);
}

// ============================================================
// 素材定义
// ============================================================

async function genBattleHUD() {
    console.log('\n🎮 战斗HUD');
    const dir = path.join(BATTLE_UI, 'hud');

    // 血条
    await genPanel(300, 40, { r: 20, g: 20, b: 20, alpha: 0.8 }, C.white, 2,
        path.join(dir, 'hp_bar_bg.png'));
    await genGradientBar(290, 30, C.green, { r: 200, g: 230, b: 80, alpha: 1 },
        path.join(dir, 'hp_bar_fill.png'));
    await genGradientBar(290, 30, C.red, { r: 255, g: 120, b: 80, alpha: 1 },
        path.join(dir, 'hp_bar_fill_low.png'));

    // 金币图标
    await genCircle(48, C.gold, path.join(dir, 'coin_icon.png'));

    // 弹药图标
    await genTextIcon(64, 64, C.darkGray, '탄', C.white,
        path.join(dir, 'ammo_icon.png'), { rounded: true, border: C.orange });

    // 暂停按钮
    await genTextIcon(80, 80, C.darkGray, '||', C.white,
        path.join(dir, 'pause_btn.png'), { rounded: true, border: C.white });

    // 波次提示背景
    await genPanel(400, 80, C.black80, C.greenGlow, 2,
        path.join(dir, 'wave_banner_bg.png'));
}

async function genResultScreen() {
    console.log('\n🏆 结算界面');
    const dir = path.join(BATTLE_UI, 'result');

    // 结算面板背景
    await genPanel(600, 800, C.panelBg, C.greenGlow, 3,
        path.join(dir, 'result_panel_bg.png'));

    // 胜利标题
    await genTextIcon(500, 120, { r: 0, g: 0, b: 0, alpha: 0 }, 'VICTORY',
        C.starGold, path.join(dir, 'victory_title.png'), { fontSize: 64 });

    // 失败标题
    await genTextIcon(500, 120, { r: 0, g: 0, b: 0, alpha: 0 }, 'DEFEATED',
        C.red, path.join(dir, 'defeat_title.png'), { fontSize: 64 });

    // 星星
    await genStar(80, C.starGold, path.join(dir, 'star_on.png'));
    await genStar(80, C.starGray, path.join(dir, 'star_off.png'));

    // 按钮
    await genTextIcon(200, 70, C.green, '重玩', C.white,
        path.join(dir, 'btn_replay.png'), { rounded: true });
    await genTextIcon(200, 70, C.orange, '下一关', C.white,
        path.join(dir, 'btn_next.png'), { rounded: true });
    await genTextIcon(200, 70, C.darkGray, '返回', C.white,
        path.join(dir, 'btn_back.png'), { rounded: true });
}

/**
 * 生成五角星
 */
async function genStar(size, color, outPath) {
    const dir = path.dirname(outPath);
    fs.mkdirSync(dir, { recursive: true });

    const cx = size / 2, cy = size / 2, r = size / 2 - 4;
    const points = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 72 - 90) * Math.PI / 180;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
        points.push(`${cx + r * 0.4 * Math.cos(innerAngle)},${cy + r * 0.4 * Math.sin(innerAngle)}`);
    }

    const svg = `<svg width="${size}" height="${size}">
        <polygon points="${points.join(' ')}"
            fill="rgb(${color.r},${color.g},${color.b})"
            stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    </svg>`;

    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`  ✅ ${path.relative(PROJECT, outPath)} (${size}x${size}) [star]`);
}

async function genMainMenu() {
    console.log('\n🏠 主界面');
    const dir = path.join(MAIN_UI, 'main');

    // 主界面背景（暗色渐变）
    const bgSvg = `<svg width="750" height="1334">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:rgb(15,15,30);stop-opacity:1" />
                <stop offset="50%" style="stop-color:rgb(25,35,25);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgb(10,10,15);stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="750" height="1334" fill="url(#bg)"/>
        <text x="375" y="300" font-family="Arial" font-size="24" fill="rgba(100,255,100,0.3)"
            text-anchor="middle">[ 主界面背景 - 待替换 ]</text>
    </svg>`;
    fs.mkdirSync(dir, { recursive: true });
    await sharp(Buffer.from(bgSvg)).png().toFile(path.join(dir, 'main_bg.png'));
    console.log(`  ✅ assets/net_main/images/ui/main/main_bg.png (750x1334)`);

    // 游戏Logo
    await genTextIcon(500, 200, { r: 0, g: 0, b: 0, alpha: 0 }, 'ZOMBIES',
        C.greenGlow, path.join(dir, 'game_logo.png'), { fontSize: 80 });

    // 按钮
    await genTextIcon(300, 90, C.green, '开始游戏', C.white,
        path.join(dir, 'btn_start.png'), { rounded: true, fontSize: 32 });
    await genTextIcon(80, 80, C.midGray, '⚙', C.white,
        path.join(dir, 'btn_setting.png'), { rounded: true, fontSize: 40 });
    await genTextIcon(120, 120, C.orange, '商店', C.white,
        path.join(dir, 'btn_shop.png'), { rounded: true, fontSize: 28 });

    // 货币图标
    await genCircle(48, C.gold, path.join(dir, 'coin_icon.png'));
    await genCircle(48, C.cyan, path.join(dir, 'diamond_icon.png'));
}

async function genLevelSelect() {
    console.log('\n🗺️ 关卡选择');
    const dir = path.join(MAIN_UI, 'level');

    // 关卡选择背景
    const bgSvg = `<svg width="750" height="1334">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:rgb(20,25,20);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgb(10,15,10);stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="750" height="1334" fill="url(#bg)"/>
        <text x="375" y="300" font-family="Arial" font-size="24" fill="rgba(100,255,100,0.3)"
            text-anchor="middle">[ 关卡选择背景 - 待替换 ]</text>
    </svg>`;
    fs.mkdirSync(dir, { recursive: true });
    await sharp(Buffer.from(bgSvg)).png().toFile(path.join(dir, 'level_bg.png'));
    console.log(`  ✅ assets/net_main/images/ui/level/level_bg.png (750x1334)`);

    // 关卡节点（解锁）
    await genTextIcon(100, 100, C.green, '1', C.white,
        path.join(dir, 'level_node_unlock.png'), { rounded: true, border: C.greenGlow, fontSize: 36 });

    // 关卡节点（锁定）
    await genTextIcon(100, 100, C.lockGray, '🔒', C.starGray,
        path.join(dir, 'level_node_lock.png'), { rounded: true, fontSize: 36 });

    // 章节标题条
    await genPanel(400, 60, C.darkGray, C.gold, 2,
        path.join(dir, 'chapter_title_bg.png'));
}

async function genLoadingScreen() {
    console.log('\n⏳ 加载界面');
    const dir = path.join(MAIN_UI, 'loading');

    // 加载背景
    const bgSvg = `<svg width="750" height="1334">
        <rect width="750" height="1334" fill="rgb(10,10,15)"/>
        <text x="375" y="600" font-family="Arial" font-size="60" font-weight="bold"
            fill="rgba(100,255,100,0.6)" text-anchor="middle">ZOMBIES</text>
        <text x="375" y="700" font-family="Arial" font-size="24" fill="rgba(255,255,255,0.3)"
            text-anchor="middle">Loading...</text>
    </svg>`;
    fs.mkdirSync(dir, { recursive: true });
    await sharp(Buffer.from(bgSvg)).png().toFile(path.join(dir, 'loading_bg.png'));
    console.log(`  ✅ assets/net_main/images/ui/loading/loading_bg.png (750x1334)`);

    // 进度条背景
    await genPanel(500, 30, { r: 30, g: 30, b: 30, alpha: 1 }, C.midGray, 2,
        path.join(dir, 'progress_bg.png'));

    // 进度条填充
    await genGradientBar(490, 24, C.green, C.greenGlow,
        path.join(dir, 'progress_fill.png'));
}

// ============================================================
// 主函数
// ============================================================

async function main() {
    console.log('🎨 开始生成UI占位图...\n');
    console.log(`输出目录:`);
    console.log(`  战斗UI: ${path.relative(PROJECT, BATTLE_UI)}`);
    console.log(`  主界面UI: ${path.relative(PROJECT, MAIN_UI)}`);

    await genBattleHUD();
    await genResultScreen();
    await genMainMenu();
    await genLevelSelect();
    await genLoadingScreen();

    console.log('\n✨ 全部占位图生成完毕！');
    console.log('提示: 在 Cocos Creator 中刷新资源面板即可看到新素材');
}

main().catch(err => {
    console.error('❌ 生成失败:', err);
    process.exit(1);
});
