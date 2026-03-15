/**
 * GenPsd.js — 统一的 JSON 配置驱动 PSD 生成工具
 *
 * 读取 JSON 配置文件，根据图层描述生成 PSD 文件。
 * 新增界面只需写一个 JSON 配置，无需创建新的 JS 文件。
 *
 * 用法:
 *   node tools/GenPsd.js <config.json> [选项]
 *   node tools/GenPsd.js psd/configs/UI_ResultVictory.json
 *   node tools/GenPsd.js psd/configs/UI_ResultVictory.json --out psd/UI_ResultVictory.psd
 *   node tools/GenPsd.js psd/configs/*.json          # 批量生成
 *
 * 选项:
 *   --out <path>   输出 PSD 路径（默认：psd/<name>.psd）
 *
 * JSON 配置格式见 psd/configs/ 目录下的示例文件。
 *
 * @author clong 2026.03.15
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { writePsd } = require('ag-psd');
const H = require('./PsdCanvasHelpers');

// ─── 颜色解析 ────────────────────────────────────────────

/**
 * 解析颜色值。支持：
 *   - 字符串引用: "GOLD" → 从 colorMap 查找
 *   - RGB 数组:   [255, 210, 55]
 *   - RGBA 数组:  [255, 210, 55, 200]
 *   - 对象:       { r: 255, g: 210, b: 55 }
 */
function resolveColor(val, colorMap) {
    if (typeof val === 'string') {
        const c = colorMap[val];
        if (!c) throw new Error(`未定义的颜色引用: "${val}"`);
        return c;
    }
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') return [val.r, val.g, val.b];
    return [255, 255, 255];
}

/** 将颜色转为 { r, g, b } 对象（用于 text fillColor） */
function toColorObj(val, colorMap) {
    const c = resolveColor(val, colorMap);
    return { r: c[0], g: c[1], b: c[2] };
}

// ─── 图层构建 ────────────────────────────────────────────

/**
 * 递归将 JSON 图层描述转换为 ag-psd 图层对象。
 *
 * 支持的 type:
 *   solid, gradient, button, radial, noise, overlay, star, circle, text, group
 */
function buildLayer(desc, colorMap, psdW, psdH) {
    const name = desc.name;
    const left = desc.left != null ? desc.left : 0;
    const top = desc.top != null ? desc.top : 0;
    const right = desc.right != null ? desc.right : (left + (desc.width || psdW));
    const bottom = desc.bottom != null ? desc.bottom : (top + (desc.height || psdH));
    const w = right - left;
    const h = bottom - top;
    const type = desc.type || 'group';

    // 基本属性
    const layer = { name, left, top, right, bottom };

    // hidden 支持
    if (desc.hidden) layer.hidden = true;

    switch (type) {
        case 'solid': {
            const c = resolveColor(desc.color, colorMap);
            layer.canvas = H.solidCanvas(w, h, c[0], c[1], c[2], desc.alpha != null ? desc.alpha : 255);
            break;
        }
        case 'gradient': {
            const c1 = resolveColor(desc.color1, colorMap);
            const c2 = resolveColor(desc.color2, colorMap);
            layer.canvas = H.gradientCanvas(w, h, c1, c2, desc.alpha != null ? desc.alpha : 255, desc.direction || 'vertical');
            break;
        }
        case 'button': {
            const c = resolveColor(desc.color, colorMap);
            layer.canvas = H.buttonCanvas(w, h, c);
            break;
        }
        case 'radial': {
            const c1 = resolveColor(desc.color1, colorMap);
            const c2 = resolveColor(desc.color2, colorMap);
            layer.canvas = H.radialCanvas(w, h, c1, c2, desc.alpha != null ? desc.alpha : 255);
            break;
        }
        case 'noise': {
            const c = resolveColor(desc.color, colorMap);
            layer.canvas = H.noiseCanvas(w, h, c, desc.alpha != null ? desc.alpha : 255, desc.magnitude || 10, desc.seed || 12345);
            break;
        }
        case 'overlay': {
            const c = desc.color ? resolveColor(desc.color, colorMap) : [0, 0, 0];
            layer.canvas = H.overlayCanvas(w, h, c[0], c[1], c[2], desc.alpha != null ? desc.alpha : 160);
            break;
        }
        case 'star': {
            const size = desc.size || w;
            const c1 = resolveColor(desc.color1, colorMap);
            const c2 = resolveColor(desc.color2, colorMap);
            layer.canvas = H.starCanvas(size, c1, c2);
            // 用 star size 覆盖尺寸
            layer.right = layer.left + size;
            layer.bottom = layer.top + size;
            break;
        }
        case 'circle': {
            const size = desc.size || w;
            const c = resolveColor(desc.color, colorMap);
            layer.canvas = H.circleCanvas(size, c[0], c[1], c[2]);
            layer.right = layer.left + size;
            layer.bottom = layer.top + size;
            break;
        }
        case 'text': {
            const color = toColorObj(desc.color || 'WHITE', colorMap);
            const tl = H.textLayer(
                name, desc.text || '',
                left, top, right, bottom,
                desc.fontSize || 28, color, !!desc.bold, desc.align || 'center'
            );
            // textLayer 返回完整图层对象，直接使用
            return tl;
        }
        case 'group':
        default: {
            // 容器：递归构建子图层
            if (desc.children && desc.children.length > 0) {
                layer.children = desc.children.map(child => buildLayer(child, colorMap, psdW, psdH));
            }
            break;
        }
    }

    // group 可以同时有 children 和自己的 canvas（罕见但支持）
    if (type !== 'group' && desc.children && desc.children.length > 0) {
        layer.children = desc.children.map(child => buildLayer(child, colorMap, psdW, psdH));
    }

    return layer;
}

// ─── 命令行参数解析 ──────────────────────────────────────

function parseArgs() {
    const args = process.argv.slice(2);
    const inputs = [];
    let outPath = null;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--out') { outPath = args[++i]; }
        else if (!args[i].startsWith('--')) { inputs.push(args[i]); }
    }

    if (inputs.length === 0) {
        console.log('用法: node tools/GenPsd.js <config.json> [选项]');
        console.log('');
        console.log('  --out <path>   输出 PSD 路径（默认：psd/<name>.psd）');
        console.log('');
        console.log('示例:');
        console.log('  node tools/GenPsd.js psd/configs/UI_ResultVictory.json');
        console.log('  node tools/GenPsd.js psd/configs/*.json');
        process.exit(1);
    }

    return { inputs, outPath };
}

// ─── 单个配置文件处理 ────────────────────────────────────

function processConfig(configPath, outPath) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw);

    const name = config.name || path.basename(configPath, '.json');
    const psdW = config.width || 750;
    const psdH = config.height || 1334;

    // 构建颜色映射表
    const colorMap = {};
    if (config.colors) {
        for (const [key, val] of Object.entries(config.colors)) {
            colorMap[key] = Array.isArray(val) ? val : [val.r || 0, val.g || 0, val.b || 0];
        }
    }

    // 构建图层树
    const layers = (config.layers || []).map(desc => buildLayer(desc, colorMap, psdW, psdH));

    // 统计图层总数
    function countAll(ls) {
        return ls.reduce((n, l) => n + 1 + (l.children ? countAll(l.children) : 0), 0);
    }

    // 写入 PSD
    const out = outPath || path.join('psd', `${name}.psd`);
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    const buffer = Buffer.from(writePsd({ width: psdW, height: psdH, children: layers }));
    fs.writeFileSync(out, buffer);

    const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
    console.log(`\u2705 ${name}.psd  (${psdW}\u00d7${psdH}, ${countAll(layers)} layers, ${sizeMB} MB)`);
    console.log(`   \u2192 ${out}`);

    return out;
}

// ─── 主流程 ──────────────────────────────────────────────

function main() {
    const { inputs, outPath } = parseArgs();

    console.log('\n\ud83c\udfa8 GenPsd \u2014 JSON \u914d\u7f6e\u9a71\u52a8 PSD \u751f\u6210\u5de5\u5177');
    console.log('\u2500'.repeat(40));

    const results = [];
    for (const input of inputs) {
        try {
            // 只有单个文件时才使用 --out
            const out = inputs.length === 1 ? outPath : null;
            results.push(processConfig(input, out));
        } catch (e) {
            console.error(`\u274c ${path.basename(input)}: ${e.message}`);
            if (process.env.DEBUG) console.error(e.stack);
        }
    }

    if (results.length > 0) {
        console.log(`\n\u2728 \u5b8c\u6210\uff01\u5171\u751f\u6210 ${results.length} \u4e2a PSD \u6587\u4ef6`);
        console.log('\n\u4e0b\u4e00\u6b65\uff1a');
        results.forEach(r => {
            console.log(`  node tools/PsdToPrefab.js ${r}`);
        });
    }
}

main();
