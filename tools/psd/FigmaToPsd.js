/**
 * FigmaToPsd.js — Figma 设计稿 → PSD 文件转换工具
 *
 * 使用 Figma REST API 读取设计稿，将各图层下载为 PNG 后重新组合成
 * 标准 PSD 文件，可直接接入 PsdToPrefab.js → Prefab 预制体管道。
 *
 * 用法:
 *   node tools/FigmaToPsd.js <figma-file-key-or-url> [选项]
 *
 * 选项:
 *   --token <token>     Figma 个人访问令牌（或 FIGMA_TOKEN 环境变量）
 *   --frame <name>      目标画框名（默认：第一个画框）
 *   --out <path>        输出 PSD 路径（默认：psd/<画框名>.psd）
 *   --scale <n>         图片导出倍率（默认：1，Retina 用 2）
 *   --save-img <dir>    调试：将下载的图片另存到此目录
 *   --list-frames       列出文件中所有画框名后退出
 *
 * 获取 Figma 访问令牌:
 *   Figma → 账号设置 → 安全 → 个人访问令牌 → 生成新令牌
 *
 * 图层命名规范（与 PsdToPrefab.js 完全一致，在 Figma 里按此命名）:
 *   background  → 背景（全屏 Widget + Sprite）
 *   btn_xxx     → 按钮（Button + Sprite）
 *   txt_xxx     → 文字（Label，TEXT 节点自动识别，无需图片）
 *   sp_xxx      → 精灵（Sprite）
 *   node_xxx    → 容器（无组件）
 *   progress_   → 进度条（ProgressBar）
 *   layout_     → 布局容器（Layout）
 *   #xxx        → 忽略此层（不导出）
 *   @9 后缀     → 九宫格切图（Sliced）
 *
 * 工作流:
 *   1. Figma 设计界面，按规范命名图层
 *   2. node tools/FigmaToPsd.js <file-key> --frame UI_MainMenu --out psd/UI_MainMenu.psd
 *   3. npm run psd:main-to-assets
 *
 * @author clong 2026.03.14
 */
'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { writePsd } = require('ag-psd');

const FIGMA_HOST = 'api.figma.com';
const BATCH_SIZE = 50; // Figma API 单次最多导出节点数

// ─── HTTP 工具 ─────────────────────────────────────────────────

/** HTTP GET，自动跟随 301/302/307/308 重定向，返回 { status, body } */
function httpGet(urlStr, headers = {}) {
    return new Promise((resolve, reject) => {
        try {
            const u = new URL(urlStr);
            const lib = u.protocol === 'https:' ? https : http;
            const req = lib.get(
                { hostname: u.hostname, port: u.port || undefined, path: u.pathname + u.search, headers },
                res => {
                    if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                        return httpGet(res.headers.location, headers).then(resolve).catch(reject);
                    }
                    const chunks = [];
                    res.on('data', c => chunks.push(c));
                    res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
                    res.on('error', reject);
                }
            );
            req.on('error', reject);
        } catch (e) {
            reject(e);
        }
    });
}

/** Figma REST API GET，返回解析后的 JSON */
async function figmaGet(endpoint, token) {
    const { status, body } = await httpGet(
        `https://${FIGMA_HOST}/v1${endpoint}`,
        { 'X-Figma-Token': token }
    );
    if (status !== 200) {
        let msg = body.toString().slice(0, 300);
        try { msg = JSON.parse(body).message || msg; } catch (_) { }
        throw new Error(`Figma API [${status}]: ${msg}`);
    }
    return JSON.parse(body.toString());
}

// ─── 命令行参数 ────────────────────────────────────────────────

function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
        input: null,
        token: process.env.FIGMA_TOKEN || null,
        frameName: null,
        outPath: null,
        scale: 1,
        saveImgDir: null,
        listFrames: false,
    };

    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '--token') opts.token = args[++i];
        else if (a === '--frame') opts.frameName = args[++i];
        else if (a === '--out') opts.outPath = args[++i];
        else if (a === '--scale') opts.scale = parseFloat(args[++i]) || 1;
        else if (a === '--save-img') opts.saveImgDir = args[++i];
        else if (a === '--list-frames') opts.listFrames = true;
        else if (!a.startsWith('--')) opts.input = a;
    }

    if (!opts.input) {
        console.log('用法: node tools/FigmaToPsd.js <figma-file-key-or-url> [选项]');
        console.log('');
        console.log('  --token <token>     Figma 令牌（或 FIGMA_TOKEN 环境变量）');
        console.log('  --frame <name>      目标画框名（默认：第一个画框）');
        console.log('  --out <path>        输出 PSD 路径（默认：psd/<画框名>.psd）');
        console.log('  --scale <n>         图片倍率（默认：1）');
        console.log('  --save-img <dir>    保存下载的图片（调试用）');
        console.log('  --list-frames       列出所有画框名后退出');
        console.log('');
        console.log('示例:');
        console.log('  node tools/FigmaToPsd.js https://figma.com/file/XXXXX --token figd_xxxx --frame UI_MainMenu');
        process.exit(1);
    }

    if (!opts.token) {
        console.error('❌ 缺少 Figma 访问令牌，请提供 --token 或设置环境变量：');
        console.error('   PowerShell: $env:FIGMA_TOKEN="figd_xxxx"');
        console.error('   CMD:        set FIGMA_TOKEN=figd_xxxx');
        console.error('   令牌获取:   Figma → 账号设置 → 安全 → 个人访问令牌');
        process.exit(1);
    }

    return opts;
}

// ─── 从 URL 或原始 key 提取 Figma 文件 key ─────────────────────

function extractFileKey(input) {
    const m = input.match(/figma\.com\/(?:file|design)\/([A-Za-z0-9]+)/);
    return m ? m[1] : input;
}

// ─── 节点分类 ──────────────────────────────────────────────────

// 这些类型作为"容器组"处理：递归子图层，不导出图片
const GROUP_TYPES = new Set(['GROUP', 'FRAME', 'SECTION', 'COMPONENT_SET']);

function isGroupNode(node) {
    return GROUP_TYPES.has(node.type) && Array.isArray(node.children) && node.children.length > 0;
}

function isTextNode(node) {
    return node.type === 'TEXT';
}

// ─── 收集需要导出图片的节点 ID ────────────────────────────────

function collectImageIds(node, ids = []) {
    if (!node) return ids;
    if (node.visible === false) return ids;
    if (node.name && node.name.startsWith('#')) return ids; // 忽略图层

    if (isGroupNode(node)) {
        for (const child of node.children) collectImageIds(child, ids);
    } else if (!isTextNode(node)) {
        ids.push(node.id);
    }
    return ids;
}

// ─── 批量向 Figma 申请图片导出 URL ───────────────────────────

async function requestImageUrls(fileKey, nodeIds, token, scale) {
    const result = {};
    for (let i = 0; i < nodeIds.length; i += BATCH_SIZE) {
        const batch = nodeIds.slice(i, i + BATCH_SIZE);
        // 每个 ID 单独 encode（ID 中可能含冒号）
        const idsParam = batch.map(id => encodeURIComponent(id)).join(',');
        const data = await figmaGet(
            `/images/${fileKey}?ids=${idsParam}&format=png&scale=${scale}`,
            token
        );
        if (data.err) throw new Error(`Figma 导出图片失败: ${data.err}`);
        Object.assign(result, data.images || {}); // { nodeId: url | null }
    }
    return result;
}

// ─── 颜色 / 对齐转换 ──────────────────────────────────────────

function toRgb(color) {
    if (!color) return { r: 255, g: 255, b: 255 };
    return {
        r: Math.round((color.r || 0) * 255),
        g: Math.round((color.g || 0) * 255),
        b: Math.round((color.b || 0) * 255),
    };
}

function toJustification(figmaAlign) {
    return { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justifyAll' }[figmaAlign] || 'left';
}

// ─── 构建 PSD 图层树 ──────────────────────────────────────────

/**
 * 将 Figma 节点树递归转换为 ag-psd 图层数组。
 *
 * 坐标系对齐：
 *   Figma 使用文档绝对坐标（absoluteBoundingBox），
 *   PSD 使用画框内相对坐标（left/top 相对画框左上角）。
 *
 * 图层顺序对齐：
 *   Figma: children[0] = 视觉最底层，children[last] = 最顶层
 *   ag-psd: children[0] = 最顶层（Photoshop 图层面板约定）
 *   → 需要 reverse
 */
function buildLayers(nodes, frameLeft, frameTop, idCanvas) {
    if (!nodes || !nodes.length) return [];

    const layers = [];

    // 反转：Figma 底→顶 转换为 ag-psd 顶→底
    for (const node of [...nodes].reverse()) {
        if (node.visible === false) continue;
        if (node.name && node.name.startsWith('#')) continue;

        const box = node.absoluteBoundingBox;
        if (!box) continue;

        const left = Math.round(box.x - frameLeft);
        const top = Math.round(box.y - frameTop);
        const right = Math.round(left + box.width);
        const bottom = Math.round(top + box.height);
        const name = node.name || 'unnamed';

        if (isGroupNode(node)) {
            // ── 容器：递归子图层
            layers.push({
                name, left, top, right, bottom,
                children: buildLayers(node.children, frameLeft, frameTop, idCanvas),
            });

        } else if (isTextNode(node)) {
            // ── 文字：直接使用 Figma 文字属性，无需图片
            const style = node.style || {};
            const solidFill = (node.fills || []).find(f => f.type === 'SOLID' && f.visible !== false);
            const fillColor = toRgb(solidFill && solidFill.color);

            layers.push({
                name, left, top, right, bottom,
                text: {
                    text: node.characters || '',
                    style: {
                        fontSize: style.fontSize || 24,
                        fillColor,
                        justification: toJustification(style.textAlignHorizontal),
                        fauxBold: style.fontWeight > 600,
                    },
                    // ag-psd 要求 bounds 使用 { units:'Pixels', value:n } 格式
                    bounds: {
                        left: { units: 'Pixels', value: left },
                        top: { units: 'Pixels', value: top },
                        right: { units: 'Pixels', value: right },
                        bottom: { units: 'Pixels', value: bottom },
                    },
                },
            });

        } else {
            // ── 图片：使用已下载的像素数据
            const canvas = idCanvas[node.id];
            if (!canvas) continue; // 下载失败或为空节点，跳过
            layers.push({ name, left, top, right, bottom, canvas });
        }
    }

    return layers;
}

// ─── 在 Figma 文件中查找目标画框 ──────────────────────────────

function findFrame(file, frameName) {
    const all = [];
    for (const page of (file.document.children || [])) {
        for (const node of (page.children || [])) {
            if (node.type === 'FRAME' || node.type === 'COMPONENT') {
                all.push(node);
                if (!frameName || node.name === frameName) return { frame: node, all };
            }
        }
    }
    return { frame: null, all };
}

// ─── 主流程 ───────────────────────────────────────────────────

async function main() {
    const opts = parseArgs();
    const fileKey = extractFileKey(opts.input);

    console.log('\n🎨 Figma → PSD 转换工具');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  文件 ID: ${fileKey}`);

    // 1. 读取 Figma 文件结构
    console.log('\n📂 读取 Figma 文件...');
    const file = await figmaGet(`/files/${fileKey}`, opts.token);
    console.log(`  名称: ${file.name}`);
    console.log(`  最后修改: ${new Date(file.lastModified).toLocaleString('zh-CN')}`);

    // --list-frames 模式：仅列出画框
    if (opts.listFrames) {
        const { all } = findFrame(file, null);
        console.log('\n📋 画框列表:');
        if (!all.length) { console.log('  （无画框）'); return; }
        all.forEach(f => {
            const b = f.absoluteBoundingBox || {};
            console.log(`  • ${f.name}  (${Math.round(b.width || 0)}×${Math.round(b.height || 0)})`);
        });
        return;
    }

    // 2. 找到目标画框
    const { frame, all } = findFrame(file, opts.frameName);
    if (!frame) {
        console.error(`\n❌ 未找到画框${opts.frameName ? ` "${opts.frameName}"` : ''}`);
        if (all.length) console.error(`  可用画框: ${all.map(f => f.name).join(', ')}`);
        else console.error('  文件中没有任何画框，请检查文件 key 是否正确');
        process.exit(1);
    }

    const fb = frame.absoluteBoundingBox || { x: 0, y: 0, width: 750, height: 1334 };
    const W = Math.round(fb.width);
    const H = Math.round(fb.height);
    console.log(`\n  画框: "${frame.name}"  ${W}×${H}`);

    // 3. 收集需要导出图片的节点 ID
    const imageIds = collectImageIds(frame);
    console.log(`  图片节点: ${imageIds.length} 个`);

    // 4. 向 Figma 申请图片 URL，然后并行下载
    const idCanvas = {};
    if (imageIds.length > 0) {
        console.log('\n📤 请求 Figma 图片 URL...');
        const idUrl = await requestImageUrls(fileKey, imageIds, opts.token, opts.scale);

        console.log('⬇️  下载图片...');
        if (opts.saveImgDir) fs.mkdirSync(opts.saveImgDir, { recursive: true });

        let done = 0;
        const urls = imageIds.map(id => ({ id, url: idUrl[id] })).filter(x => x.url);
        const total = urls.length;

        await Promise.all(urls.map(async ({ id, url }) => {
            try {
                const { status, body } = await httpGet(url);
                if (status !== 200) throw new Error(`HTTP ${status}`);

                // 可选：保存调试图片
                if (opts.saveImgDir) {
                    fs.writeFileSync(
                        path.join(opts.saveImgDir, `${id.replace(/[:/\\]/g, '_')}.png`),
                        body
                    );
                }

                // 解码 PNG → RGBA 原始数据
                const { data, info } = await sharp(body).ensureAlpha().raw()
                    .toBuffer({ resolveWithObject: true });
                const rgba = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
                const { width, height } = info;

                idCanvas[id] = {
                    width, height,
                    getContext: () => ({ getImageData: () => ({ data: rgba, width, height }) }),
                };

                done++;
                process.stdout.write(`\r  已下载 ${done}/${total} `);
            } catch (e) {
                process.stdout.write('\n');
                console.warn(`  ⚠️  跳过 "${id}": ${e.message}`);
            }
        }));

        console.log(`\n  下载完成 ${done}/${total}`);
    }

    // 5. 构建 PSD 图层树
    console.log('\n🌲 构建 PSD 图层树...');
    const layers = buildLayers(frame.children || [], fb.x, fb.y, idCanvas);

    function countAll(ls) {
        return ls.reduce((n, l) => n + 1 + (l.children ? countAll(l.children) : 0), 0);
    }
    console.log(`  总图层数: ${countAll(layers)}`);

    // 6. 写入 PSD
    const outPath = opts.outPath || path.join('psd', `${frame.name}.psd`);
    fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });

    console.log(`\n💾 写入 PSD: ${outPath}`);
    const buf = Buffer.from(writePsd({ width: W, height: H, children: layers }));
    fs.writeFileSync(outPath, buf);

    const sizeMB = (buf.length / 1024 / 1024).toFixed(2);
    console.log(`\n✨ 完成！  ${outPath}  (${sizeMB} MB)`);
    console.log('\n下一步：运行 PsdToPrefab 生成预制体');
    console.log(`  node tools/PsdToPrefab.js ${outPath}`);
    console.log('  或: npm run psd:main-to-assets  (如果画框名为 UI_MainMenu)');
}

main().catch(err => {
    process.stdout.write('\n');
    console.error('❌ 错误:', err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
});
