/**
 * PSD → 预制体 工具
 * 解析PSD设计稿，自动输出 效果图 + 切图(.meta) + 预制体(.prefab) + TS类
 *
 * 使用:
 *   node tools/PsdToPrefab.js <psd文件> [选项]
 *
 * 选项:
 *   --out <dir>        预制体输出目录 (默认: output/<name>/)
 *   --img <dir>        切图输出目录 (默认: output/<name>/images/)
 *   --ts <dir>         TS类输出目录 (默认: output/<name>/)
 *   --size <WxH>       设计尺寸 (默认: 750x1334)
 *   --images-only      只生成切图
 *   --prefab-only      只生成预制体
 *
 * 命名规范:
 *   UI_xxx.psd → 界面预制体 (根节点添加Widget)
 *   Com_xxx.psd → 组件预制体 (根节点不添加Widget)
 *   com_xxx 图层 → 自定义组件引用
 *   btn_xxx    → cc.Button + cc.Sprite
 *   txt_xxx    → cc.Label (文字层不切图)
 *   sp_xxx     → cc.Sprite
 *   progress_  → cc.ProgressBar
 *   node_xxx   → 纯节点容器
 *   layout_xxx → cc.Layout
 *   background → cc.Sprite + cc.Widget(全屏)
 *   #xxx       → 忽略
 *   !xxx       → 默认隐藏(active=false)
 *   @9 后缀    → 九宫格(Sliced)
 *   @fill 后缀 → 填充模式(Filled)
 *
 * @author clong 2026.03.08
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { readPsd, initializeCanvas } = require('ag-psd');

// ag-psd 在 Node.js 中需要初始化 canvas 实现
// 提供完整的 canvas mock，让 ag-psd 能正确解码并存储像素数据
initializeCanvas(
    function (w, h) {
        // 每个 canvas 有独立的像素缓冲区，putImageData/getImageData 真正读写数据
        const _buf = new Uint8ClampedArray(w * h * 4);
        const canvas = {
            width: w, height: h, _buf,
            getContext: function () {
                return {
                    canvas: { width: w, height: h },
                    createImageData: function (w2, h2) {
                        return { width: w2, height: h2, data: new Uint8ClampedArray(w2 * h2 * 4) };
                    },
                    getImageData: function (x, y, w2, h2) {
                        const dest = new Uint8ClampedArray(w2 * h2 * 4);
                        for (let row = 0; row < h2; row++) {
                            const srcOff = ((y + row) * w + x) * 4;
                            const dstOff = row * w2 * 4;
                            dest.set(_buf.subarray(srcOff, srcOff + w2 * 4), dstOff);
                        }
                        return { width: w2, height: h2, data: dest };
                    },
                    putImageData: function (imgData, dx, dy) {
                        const { width: sw, height: sh, data } = imgData;
                        for (let row = 0; row < sh; row++) {
                            const srcOff = row * sw * 4;
                            const dstOff = ((dy + row) * w + dx) * 4;
                            _buf.set(data.subarray(srcOff, srcOff + sw * 4), dstOff);
                        }
                    },
                    drawImage: function (src, dx, dy) {
                        // 从另一个 canvas 拷贝
                        if (src && src._buf) {
                            const sw = src.width, sh = src.height;
                            for (let row = 0; row < sh; row++) {
                                const srcOff = row * sw * 4;
                                const dstOff = ((dy + row) * w + dx) * 4;
                                _buf.set(src._buf.subarray(srcOff, srcOff + sw * 4), dstOff);
                            }
                        }
                    },
                    save: function () { }, restore: function () { },
                    globalCompositeOperation: 'source-over',
                    fillRect: function () { }, clearRect: function () { },
                    fillStyle: '', globalAlpha: 1,
                };
            },
        };
        return canvas;
    },
    function (w, h) {
        return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
    }
);

const MAT_UUID = 'eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432';

// ============================================================
// 命令行参数解析
// ============================================================
function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
        psdFile: null,
        outDir: null,
        imgDir: null,
        tsDir: null,
        previewDir: null,
        designWidth: 750,
        designHeight: 1334,
        imagesOnly: false,
        prefabOnly: false,
        previewOnly: false,
        prefabName: null,   // --prefab-name: 预制体文件名（不含扩展名），默认与 PSD 同名
        scriptPath: null,   // --script: 绑定到预制体的外部 TS 脚本路径（读其 .meta 获取 UUID）
    };

    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '--out') { opts.outDir = args[++i]; }
        else if (a === '--img') { opts.imgDir = args[++i]; }
        else if (a === '--ts') { opts.tsDir = args[++i]; }
        else if (a === '--preview') { opts.previewDir = args[++i]; }
        else if (a === '--size') {
            const [w, h] = args[++i].split('x').map(Number);
            opts.designWidth = w; opts.designHeight = h;
        }
        else if (a === '--prefab-name') { opts.prefabName = args[++i]; }
        else if (a === '--script') { opts.scriptPath = args[++i]; }
        else if (a === '--images-only') { opts.imagesOnly = true; }
        else if (a === '--prefab-only') { opts.prefabOnly = true; }
        else if (a === '--preview-only') { opts.previewOnly = true; }
        else if (!a.startsWith('-')) { opts.psdFile = a; }
    }

    if (!opts.psdFile) {
        console.log('用法: node tools/PsdToPrefab.js <psd文件> [选项]');
        console.log('  --out <dir>          预制体输出目录');
        console.log('  --img <dir>          切图输出目录');
        console.log('  --ts <dir>           TS绑定层输出目录（默认与 --out 相同）');
        console.log('  --preview <dir>      效果图输出目录（默认与 --out 相同）');
        console.log('  --size <WxH>         设计尺寸 (默认: 750x1334)');
        console.log('  --prefab-name <name> 预制体文件名（默认与 PSD 同名）');
        console.log('  --script <path>      绑定到预制体的 TS 脚本（读 .meta UUID，覆盖自动生成的绑定）');
        console.log('  --preview-only       只生成效果图');
        console.log('  --images-only        只生成切图');
        console.log('  --prefab-only        只生成预制体');
        process.exit(1);
    }

    const name = path.basename(opts.psdFile, '.psd');
    const isComponent = name.startsWith('Com_') || name.startsWith('com_');
    if (!opts.prefabName) opts.prefabName = name;  // 默认与 PSD 同名
    if (!opts.outDir) opts.outDir = path.join('output', name);
    if (!opts.imgDir) opts.imgDir = path.join(opts.outDir, 'images');
    // tsDir / previewDir 不设默认值，main() 里回退到 outDir

    return { ...opts, name, isComponent };
}

// ============================================================
// UUID 生成 (确定性，基于种子)
// ============================================================
function stableUUID(seed) {
    const hash = crypto.createHash('md5').update(seed).digest('hex');
    return [hash.substr(0, 8), hash.substr(8, 4), hash.substr(12, 4),
    hash.substr(16, 4), hash.substr(20, 12)].join('-');
}

function stableFileId(seed) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';
    const hash = crypto.createHash('sha256').update(seed).digest();
    let r = '';
    for (let i = 0; i < 22; i++) r += chars[hash[i] % chars.length];
    return r;
}

// UUID 压缩 (Cocos Creator 2.4 定制格式)
// 算法：保留 UUID hex 前 5 位不变，剩余 27 位按每 3 位 hex（12-bit）转为 2 个 base64 字符
function compressUUID(uuid) {
    if (uuid.length !== 36) return uuid;
    const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const hex = uuid.replace(/-/g, ''); // 32 hex chars
    let result = hex.substr(0, 5);      // 前 5 位直通
    for (let i = 5; i < 32; i += 3) {
        const n = parseInt(hex.substr(i, 3), 16); // 3 hex = 12-bit
        result += BASE64[(n >> 6) & 0x3F]; // 高 6 位
        result += BASE64[n & 0x3F];        // 低 6 位
    }
    return result; // 5 + 9×2 = 23 字符
}

// ============================================================
// 图层名解析
// ============================================================
function parseLayerName(rawName) {
    let name = rawName.trim();
    let hidden = false;
    let ignore = false;
    let spriteType = 0; // 0=Simple, 1=Sliced, 3=Filled

    // # → 忽略
    if (name.startsWith('#')) { return { name, ignore: true, hidden: false, prefix: '', cleanName: name, spriteType: 0 }; }

    // ! → 默认隐藏
    if (name.startsWith('!')) { hidden = true; name = name.substring(1); }

    // @9 / @fill 后缀
    if (name.endsWith('@9')) { spriteType = 1; name = name.slice(0, -2); }
    else if (name.endsWith('@fill')) { spriteType = 3; name = name.slice(0, -5); }

    // 解析前缀
    const parts = name.split('_');
    const prefix = parts.length > 1 ? parts[0] : '';

    return { name, ignore, hidden, prefix, cleanName: name, spriteType };
}

// ============================================================
// PSD图层遍历 → 中间数据结构
// ============================================================
function collectLayers(psdLayer, canvasW, canvasH, parentPath = '') {
    const results = [];

    const children = psdLayer.children || [];
    // PSD图层: 底层在列表末尾，顶层在列表开头
    // Cocos: children[0]在底层 → 反转
    const reversed = [...children].reverse();

    for (const layer of reversed) {
        const parsed = parseLayerName(layer.name || 'unnamed');
        if (parsed.ignore) continue;

        const layerPath = parentPath ? `${parentPath}/${parsed.name}` : parsed.name;
        const isGroup = Array.isArray(layer.children) && layer.children.length > 0;
        const isText = !!layer.text;
        const hasPixels = !isText && !isGroup && (layer.imageData || layer.canvas);

        // 尺寸和位置
        let left = layer.left || 0;
        let top = layer.top || 0;
        let right = layer.right || left;
        let bottom = layer.bottom || top;
        let w = right - left;
        let h = bottom - top;

        // 文字图层：当 layer bounds 为空（代码生成的 PSD），回退到 text.bounds
        if (isText && w === 0 && h === 0 && layer.text) {
            const tb = layer.text.bounds;
            if (tb) {
                // ag-psd 读取时 bounds 值为 { value, units } 对象，需提取 .value
                const toNum = v => (v && typeof v === 'object') ? (v.value || 0) : (v || 0);
                const tLeft = toNum(tb.left);
                const tTop = toNum(tb.top);
                const tRight = toNum(tb.right);
                const tBottom = toNum(tb.bottom);
                if (tRight - tLeft > 0 || tBottom - tTop > 0) {
                    left = tLeft; top = tTop;
                    right = tRight; bottom = tBottom;
                    w = right - left; h = bottom - top;
                }
            }
            // 如果还是无尺寸，用 fontSize 估算高度（宽度保持 0 让 Label 自动扩展）
            if (h === 0) {
                const fs = (layer.text.style && layer.text.style.fontSize) || 24;
                h = Math.round(fs * 1.4); // 包含行高的估算
            }
        }

        // PSD → Cocos 坐标转换
        // 图层组作为纯容器固定在 (0,0)，这样子节点坐标保持相对画布中心，
        // 不会因为父节点偏移产生双重叠加
        let cocosX, cocosY, cocosW, cocosH;
        if (isGroup) {
            cocosX = 0;
            cocosY = 0;
            cocosW = 0;
            cocosH = 0;
        } else {
            cocosX = left + w / 2 - canvasW / 2;
            cocosY = canvasH / 2 - (top + h / 2);
            cocosW = w;
            cocosH = h;
        }

        const info = {
            name: parsed.name,
            path: layerPath,
            prefix: parsed.prefix,
            spriteType: parsed.spriteType,
            active: !parsed.hidden && !layer.hidden,
            x: cocosX, y: cocosY, w: cocosW, h: cocosH,
            opacity: Math.round((layer.opacity !== undefined ? layer.opacity : 1) * 255),
            isGroup,
            isText,
            hasPixels,
            textInfo: null,
            imageData: null,
            children: [],
        };

        // 文字信息
        if (isText && layer.text) {
            const t = layer.text;
            const style = (t.style || {});
            const runs = t.styleRuns || [];
            let fontSize = style.fontSize || 24;
            let fontColor = { r: 255, g: 255, b: 255 };
            let bold = false;
            let hAlign = 1; // 0=left, 1=center, 2=right

            // 从 styleRuns 获取更准确的样式
            if (runs.length > 0) {
                const s0 = runs[0].style || {};
                if (s0.fontSize) fontSize = Math.round(s0.fontSize);
                if (s0.fillColor) {
                    fontColor = {
                        r: Math.round((s0.fillColor.r || 0) * 255),
                        g: Math.round((s0.fillColor.g || 0) * 255),
                        b: Math.round((s0.fillColor.b || 0) * 255),
                    };
                }
                if (s0.fauxBold) bold = true;
            }

            // 对齐方式
            const justification = (t.paragraphStyle || {}).justification;
            if (justification === 'left') hAlign = 0;
            else if (justification === 'right') hAlign = 2;
            else hAlign = 1;

            info.textInfo = {
                string: t.text || '',
                fontSize,
                color: fontColor,
                bold,
                hAlign,
            };
        }

        // 像素数据
        if (hasPixels && layer.imageData) {
            info.imageData = layer.imageData;
        }

        // 递归处理图层组
        if (isGroup) {
            info.children = collectLayers(layer, canvasW, canvasH, layerPath);
        }

        results.push(info);
    }

    return results;
}

// ============================================================
// 切图导出
// ============================================================
async function exportImages(layers, imgDir, imageMap = {}, namePrefix = '') {
    fs.mkdirSync(imgDir, { recursive: true });

    for (const layer of layers) {
        // 递归处理子节点
        if (layer.children.length > 0) {
            await exportImages(layer.children, imgDir, imageMap, namePrefix);
        }

        if (!layer.imageData) continue;
        if (layer.isText) continue;

        const { width, height, data } = layer.imageData;
        if (width <= 0 || height <= 0) continue;

        // 像素hash去重
        const pixelHash = crypto.createHash('md5').update(Buffer.from(data.buffer)).digest('hex').substring(0, 16);

        if (imageMap[pixelHash]) {
            // 已有相同图片，复用
            layer.imageRef = imageMap[pixelHash];
            console.log(`  ♻️  ${layer.name} → 复用 ${imageMap[pixelHash].fileName}`);
            continue;
        }

        const fileName = `${layer.name}.png`;
        const filePath = path.join(imgDir, fileName);

        // 导出PNG
        await sharp(Buffer.from(data.buffer), {
            raw: { width, height, channels: 4 }
        }).png().toFile(filePath);

        // 生成 .meta
        const uuid = stableUUID(`psd_img/${layer.path}`);
        const subUuid = stableUUID(`psd_sub/${layer.path}`);
        const baseName = path.basename(fileName, '.png');

        const meta = {
            ver: '2.3.7',
            uuid: uuid,
            type: 'sprite',
            wrapMode: 'clamp',
            filterMode: 'bilinear',
            premultiplyAlpha: false,
            genMipmaps: false,
            packable: true,
            width: width,
            height: height,
            platformSettings: {},
            subMetas: {
                [baseName]: {
                    ver: '1.0.4',
                    uuid: subUuid,
                    rawTextureUuid: uuid,
                    trimType: 'auto',
                    trimThreshold: 1,
                    rotated: false,
                    offsetX: 0, offsetY: 0,
                    trimX: 0, trimY: 0,
                    width: width, height: height,
                    rawWidth: width, rawHeight: height,
                    borderTop: 0, borderBottom: 0,
                    borderLeft: 0, borderRight: 0,
                    subMetas: {}
                }
            }
        };
        fs.writeFileSync(filePath + '.meta', JSON.stringify(meta, null, 2));

        const ref = { fileName, uuid, subUuid, width, height };
        imageMap[pixelHash] = ref;
        layer.imageRef = ref;

        console.log(`  🖼️  ${fileName} (${width}x${height})`);
    }

    return imageMap;
}

// ============================================================
// 效果图生成
// 优先路径: 直接使用 psd.imageData（合并图层，含文字渲染结果）
// 降级路径: 直接从 PSD 原始图层像素数据合成（含 # 装饰层，更接近真实效果）
// ============================================================
async function generatePreview(psdFile, outDir, canvasW, canvasH, layers, imgDir, psdName) {
    const fileName = (psdName || 'preview') + '.png';
    const previewPath = path.join(outDir, fileName);

    const buf = fs.readFileSync(psdFile);

    // ── 优先路径：读 PSD 合并图层 ─────────────────────────────
    const psdMerged = readPsd(buf, { skipThumbnail: false, useImageData: true, skipLayerImageData: true });
    if (psdMerged.imageData && psdMerged.imageData.data) {
        const { width, height, data } = psdMerged.imageData;
        let hasColor = false;
        for (let i = 0; i < Math.min(data.length, 400); i += 4) {
            if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) { hasColor = true; break; }
        }
        if (hasColor) {
            await sharp(Buffer.from(data.buffer), { raw: { width, height, channels: 4 } }).png().toFile(previewPath);
            console.log(`  📸 ${fileName} (${width}x${height}) [合并图层，含文字]`);
            return;
        }
        console.log('  ⚠️  合并图层数据为空，降级到逐图层合成...');
    }

    // ── 降级路径：重新读取所有图层像素数据（含 # 装饰层）──────
    // 不经过 parseLayerName 过滤，直接访问 PSD 原始图层树
    const psdFull = readPsd(buf, { skipLayerImageData: false, skipThumbnail: true, useImageData: true });

    const toHex = (c) => `#${(c.r || 0).toString(16).padStart(2, '0')}${(c.g || 0).toString(16).padStart(2, '0')}${(c.b || 0).toString(16).padStart(2, '0')}`;

    function makeTextSvg(text, w, h, fontSize, hexColor, bold) {
        const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // 基线 = 垂直中心 + 字号×0.36（cap-height 偏移，CJK/Latin 通用，无需 dominant-baseline）
        const ty = Math.round(h * 0.5 + fontSize * 0.36);
        const fw = bold ? 'bold' : 'normal';
        return Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
            `<text x="${w / 2}" y="${ty}" font-size="${fontSize}" font-weight="${fw}" ` +
            `font-family="Microsoft YaHei,SimHei,Noto Sans CJK SC,Arial,sans-serif" ` +
            `fill="${hexColor}" text-anchor="middle">${esc}</text></svg>`
        );
    }

    const composites = [];
    let layerCount = 0;

    async function walkLayers(psdLayer) {
        const children = psdLayer.children || [];
        // ag-psd children[0] = 最上层，翻转以从底向上合成
        for (let i = children.length - 1; i >= 0; i--) {
            const layer = children[i];
            if (layer.hidden) continue;
            if (Array.isArray(layer.children) && layer.children.length > 0) {
                await walkLayers(layer); continue;
            }
            const lx = layer.left || 0, ly = layer.top || 0;
            let lw = (layer.right || lx) - lx, lh = (layer.bottom || ly) - ly;

            // 文字层：ag-psd 代码生成的 text layer 没有像素 bounds（left==right），
            // 需要从 layer.text.bounds 中获取实际位置和尺寸
            if (layer.text && lw <= 0 && lh <= 0 && layer.text.bounds) {
                const tb = layer.text.bounds;
                const pxVal = (v) => (v && typeof v === 'object' && v.value !== undefined) ? v.value : (v || 0);
                const tbL = pxVal(tb.left), tbT = pxVal(tb.top), tbR = pxVal(tb.right), tbB = pxVal(tb.bottom);
                const tbW = tbR - tbL, tbH = tbB - tbT;
                if (tbW > 0 && tbH > 0) {
                    const style = layer.text.style || {};
                    const fontSize = Math.round(style.fontSize || 24);
                    const fc = style.fillColor || { r: 255, g: 255, b: 255 };
                    const text = (layer.text.text || '').replace(/\r\n|\r/g, '\n');
                    const cx2 = Math.max(0, tbL), cy2 = Math.max(0, tbT);
                    composites.push({ input: makeTextSvg(text, tbW, tbH, fontSize, toHex(fc), !!style.fauxBold), left: cx2, top: cy2, blend: 'over' });
                    layerCount++; continue;
                }
            }

            if (lw <= 0 || lh <= 0 || lx >= canvasW || ly >= canvasH || lx + lw <= 0 || ly + lh <= 0) continue;
            const cx = Math.max(0, lx), cy = Math.max(0, ly);

            if (layer.text) {
                const style = layer.text.style || {};
                const fontSize = Math.round(style.fontSize || 24);
                const fc = style.fillColor || { r: 255, g: 255, b: 255 };
                const text = (layer.text.text || '').replace(/\r\n|\r/g, '\n');
                composites.push({ input: makeTextSvg(text, lw, lh, fontSize, toHex(fc), !!style.fauxBold), left: cx, top: cy, blend: 'over' });
                layerCount++; continue;
            }
            if (layer.imageData && layer.imageData.data) {
                const { data, width: iw, height: ih } = layer.imageData;
                if (iw > 0 && ih > 0) {
                    const pngBuf = await sharp(Buffer.from(data.buffer), { raw: { width: iw, height: ih, channels: 4 } }).png().toBuffer();
                    composites.push({ input: pngBuf, left: cx, top: cy, blend: 'over' });
                    layerCount++;
                }
            }
        }
    }

    await walkLayers(psdFull);

    const base = sharp({ create: { width: canvasW, height: canvasH, channels: 4, background: { r: 13, g: 17, b: 30, alpha: 255 } } });
    if (composites.length > 0) {
        await base.composite(composites).png().toFile(previewPath);
    } else {
        await base.png().toFile(previewPath);
    }
    console.log(`  📸 ${fileName} (${canvasW}x${canvasH}) [逐图层合成 ${layerCount} 个]`);
}

// ============================================================
// 预制体生成 (复用 GenUIPrefabs 的 PrefabBuilder 逻辑)
// ============================================================
class PrefabBuilder {
    constructor() { this.items = []; }
    _id() { return this.items.length; }

    _trs(x = 0, y = 0) {
        return {
            '__type__': 'TypedArray', 'ctor': 'Float64Array',
            'array': [x, y, 0, 0, 0, 0, 1, 1, 1, 1]
        };
    }
    _color(r = 255, g = 255, b = 255, a = 255) {
        return { '__type__': 'cc.Color', r, g, b, a };
    }
    _size(w, h) { return { '__type__': 'cc.Size', width: w, height: h }; }
    _vec2(x = 0.5, y = 0.5) { return { '__type__': 'cc.Vec2', x, y }; }
    _vec3() { return { '__type__': 'cc.Vec3', x: 0, y: 0, z: 0 }; }

    init(rootName) {
        this.items.push({
            '__type__': 'cc.Prefab', '_name': '', '_objFlags': 0, '_native': '',
            'data': { '__id__': 1 }, 'optimizationPolicy': 0,
            'asyncLoadAssets': false, 'readonly': false
        });
    }

    addNode(name, parentId, opts = {}) {
        const nodeId = this._id();
        const node = {
            '__type__': 'cc.Node', '_name': name, '_objFlags': 0,
            '_parent': parentId != null ? { '__id__': parentId } : null,
            '_children': [], '_active': opts.active !== undefined ? opts.active : true,
            '_components': [], '_prefab': null,
            '_opacity': opts.opacity || 255,
            '_color': this._color(opts.r || 255, opts.g || 255, opts.b || 255, opts.a || 255),
            '_contentSize': this._size(opts.w || 0, opts.h || 0),
            '_anchorPoint': this._vec2(0.5, 0.5),
            '_trs': this._trs(opts.x || 0, opts.y || 0),
            '_eulerAngles': this._vec3(), '_skewX': 0, '_skewY': 0,
            '_is3DNode': false, '_groupIndex': 0, 'groupIndex': 0, '_id': ''
        };
        this.items.push(node);

        const prefabInfoId = this._id();
        this.items.push({
            '__type__': 'cc.PrefabInfo',
            'root': { '__id__': 1 },
            'asset': { '__id__': 0 },
            'fileId': nodeId === 1 ? '' : stableFileId(`prefab_${name}_${nodeId}`),
            'sync': false
        });
        node._prefab = { '__id__': prefabInfoId };
        return nodeId;
    }

    addChild(parentId, childId) {
        this.items[parentId]._children.push({ '__id__': childId });
    }

    addLabel(nodeId, opts = {}) {
        const id = this._id();
        this.items.push({
            '__type__': 'cc.Label', '_name': '', '_objFlags': 0,
            'node': { '__id__': nodeId }, '_enabled': true,
            '_materials': [{ '__uuid__': MAT_UUID }],
            '_srcBlendFactor': 770, '_dstBlendFactor': 771,
            '_string': opts.string || '', '_N$string': opts.string || '',
            '_fontSize': opts.fontSize || 24,
            '_lineHeight': (opts.fontSize || 24) + 4,
            '_enableWrapText': true, '_N$file': null,
            '_isSystemFontUsed': true, '_spacingX': 0,
            '_batchAsBitmap': false, '_styleFlags': opts.bold ? 1 : 0,
            '_underlineHeight': 0,
            '_N$horizontalAlign': opts.hAlign !== undefined ? opts.hAlign : 1,
            '_N$verticalAlign': 1, '_N$fontFamily': 'Arial',
            '_N$overflow': 0, '_N$cacheMode': 0, '_id': ''
        });
        this.items[nodeId]._components.push({ '__id__': id });
        return id;
    }

    addSprite(nodeId, opts = {}) {
        const id = this._id();
        this.items.push({
            '__type__': 'cc.Sprite', '_name': '', '_objFlags': 0,
            'node': { '__id__': nodeId }, '_enabled': true,
            '_materials': [{ '__uuid__': MAT_UUID }],
            '_srcBlendFactor': 770, '_dstBlendFactor': 771,
            '_spriteFrame': opts.uuid ? { '__uuid__': opts.uuid } : null,
            '_type': opts.type || 0, '_sizeMode': 0,
            '_fillType': 0, '_fillCenter': this._vec2(0, 0),
            '_fillStart': 0, '_fillRange': opts.fillRange || 0,
            '_isTrimmedMode': true, '_atlas': null, '_id': ''
        });
        this.items[nodeId]._components.push({ '__id__': id });
        return id;
    }

    addButton(nodeId) {
        const id = this._id();
        this.items.push({
            '__type__': 'cc.Button', '_name': '', '_objFlags': 0,
            'node': { '__id__': nodeId }, '_enabled': true,
            '_normalMaterial': null, '_grayMaterial': null,
            'duration': 0.1, 'zoomScale': 1.1, 'clickEvents': [],
            '_N$interactable': true, '_N$enableAutoGrayEffect': false,
            '_N$transition': 3, '_id': ''
        });
        this.items[nodeId]._components.push({ '__id__': id });
        return id;
    }

    addProgressBar(nodeId, barSpriteCompId, totalLength) {
        const id = this._id();
        this.items.push({
            '__type__': 'cc.ProgressBar', '_name': '', '_objFlags': 0,
            'node': { '__id__': nodeId }, '_enabled': true,
            '_N$totalLength': totalLength || 200,
            '_N$barSprite': barSpriteCompId != null ? { '__id__': barSpriteCompId } : null,
            '_N$mode': 0, '_N$progress': 1, '_N$reverse': false, '_id': ''
        });
        this.items[nodeId]._components.push({ '__id__': id });
        return id;
    }

    addWidget(nodeId, opts = {}) {
        const id = this._id();
        this.items.push({
            '__type__': 'cc.Widget', '_name': '', '_objFlags': 0,
            'node': { '__id__': nodeId }, '_enabled': true,
            '_alignFlags': opts.alignFlags || 45,
            '_left': opts.left || 0, '_right': opts.right || 0,
            '_top': opts.top || 0, '_bottom': opts.bottom || 0,
            '_verticalCenter': 0, '_horizontalCenter': 0,
            '_isAbsLeft': true, '_isAbsRight': true,
            '_isAbsTop': true, '_isAbsBottom': true,
            '_isAbsHorizontalCenter': true, '_isAbsVerticalCenter': true,
            '_originalWidth': 0, '_originalHeight': 0, '_id': ''
        });
        this.items[nodeId]._components.push({ '__id__': id });
        return id;
    }

    addLayout(nodeId, opts = {}) {
        const id = this._id();
        this.items.push({
            '__type__': 'cc.Layout', '_name': '', '_objFlags': 0,
            'node': { '__id__': nodeId }, '_enabled': true,
            '_layoutType': opts.layoutType || 1,
            '_N$spacingX': opts.spacingX || 0,
            '_N$spacingY': opts.spacingY || 0,
            '_N$paddingLeft': 0, '_N$paddingRight': 0,
            '_N$paddingTop': 0, '_N$paddingBottom': 0,
            '_N$resizeMode': 0,
            '_N$verticalDirection': 1, '_N$horizontalDirection': 0,
            '_id': ''
        });
        this.items[nodeId]._components.push({ '__id__': id });
        return id;
    }

    addBlockInput(nodeId) {
        const id = this._id();
        this.items.push({
            '__type__': 'cc.BlockInputEvents', '_name': '', '_objFlags': 0,
            'node': { '__id__': nodeId }, '_enabled': true, '_id': ''
        });
        this.items[nodeId]._components.push({ '__id__': id });
        return id;
    }

    toJSON() { return JSON.stringify(this.items, null, 2); }
}

// ============================================================
// 脚本绑定（解耦：独立的后处理步骤）
// ============================================================
/**
 * 将脚本组件绑定到预制体根节点。
 * 此函数与 PrefabBuilder 完全独立，作为纯后处理步骤运行：
 * 接收已生成的 prefab JSON 字符串，注入脚本引用后返回新字符串。
 *
 * @param {string} prefabJsonStr  buildPrefab() 生成的 JSON 字符串
 * @param {string} scriptUuid     脚本 .meta 文件中的 UUID（与 generateTsMeta 同种子）
 * @returns {string}              注入脚本组件后的新 JSON 字符串
 */
function bindScriptToPrefab(prefabJsonStr, scriptUuid) {
    const items = JSON.parse(prefabJsonStr);
    // 根节点固定在 items[1]（items[0] 是 cc.Prefab 元信息）
    const ROOT_NODE_ID = 1;
    const newCompId = items.length;
    const compressedUuid = compressUUID(scriptUuid);

    items.push({
        '__type__': compressedUuid,
        '_name': '',
        '_objFlags': 0,
        'node': { '__id__': ROOT_NODE_ID },
        '_enabled': true,
        '_id': ''
    });
    items[ROOT_NODE_ID]._components.push({ '__id__': newCompId });

    return JSON.stringify(items, null, 2);
}

// ============================================================
// 将图层树转为预制体
// ============================================================
function buildPrefab(layers, prefabName, designW, designH, isComponent = false) {
    const b = new PrefabBuilder();
    b.init(prefabName);

    // 根节点
    const rootId = b.addNode(prefabName, null, { w: designW, h: designH });
    // 只有界面(非组件)才添加 Widget 全屏
    if (!isComponent) {
        b.addWidget(rootId, { alignFlags: 45, left: 0, right: 0, top: 0, bottom: 0 });
    }

    function processLayer(layer, parentId) {
        const nodeOpts = {
            x: layer.x, y: layer.y, w: layer.w, h: layer.h,
            active: layer.active, opacity: layer.opacity,
        };

        // 文字层设置颜色
        if (layer.isText && layer.textInfo) {
            nodeOpts.r = layer.textInfo.color.r;
            nodeOpts.g = layer.textInfo.color.g;
            nodeOpts.b = layer.textInfo.color.b;
        }

        const nodeId = b.addNode(layer.name, parentId, nodeOpts);
        b.addChild(parentId, nodeId);

        const prefix = layer.prefix;
        const isBg = layer.name === 'bg' || layer.name === 'background';
        const spriteUuid = layer.imageRef ? layer.imageRef.subUuid : null;

        // 根据前缀挂载组件
        switch (prefix) {
            case 'btn':
                b.addButton(nodeId);
                if (spriteUuid) b.addSprite(nodeId, { uuid: spriteUuid, type: layer.spriteType });
                break;

            case 'txt':
            case 'lbl':
            case 'lab':
                if (layer.isText && layer.textInfo) {
                    b.addLabel(nodeId, {
                        string: layer.textInfo.string,
                        fontSize: layer.textInfo.fontSize,
                        bold: layer.textInfo.bold,
                        hAlign: layer.textInfo.hAlign,
                    });
                } else {
                    b.addLabel(nodeId, { string: layer.name });
                }
                break;

            case 'sp':
            case 'img':
                if (spriteUuid) b.addSprite(nodeId, { uuid: spriteUuid, type: layer.spriteType });
                else b.addSprite(nodeId, { type: layer.spriteType });
                break;

            case 'progress': {
                // 查找子图层中的填充条
                let barSpriteCompId = null;
                let totalLength = layer.w;
                const fillChild = layer.children.find(c =>
                    c.name.includes('bar') || c.name.includes('fill') || c.name.includes('Fill'));
                if (fillChild) {
                    totalLength = fillChild.w;
                }
                // ProgressBar 组件挂在当前节点
                b.addProgressBar(nodeId, barSpriteCompId, totalLength);
                break;
            }

            case 'layout':
                b.addLayout(nodeId);
                break;

            case 'node':
                // 纯节点容器，不挂组件
                break;

            default:
                // 非命名规范节点
                if (isBg) {
                    if (spriteUuid) b.addSprite(nodeId, { uuid: spriteUuid });
                    else b.addSprite(nodeId);
                    b.addWidget(nodeId, { alignFlags: 45, left: 0, right: 0, top: 0, bottom: 0 });
                } else if (layer.hasPixels && spriteUuid) {
                    b.addSprite(nodeId, { uuid: spriteUuid, type: layer.spriteType });
                } else if (layer.isText && layer.textInfo) {
                    b.addLabel(nodeId, {
                        string: layer.textInfo.string,
                        fontSize: layer.textInfo.fontSize,
                        bold: layer.textInfo.bold,
                        hAlign: layer.textInfo.hAlign,
                    });
                }
                break;
        }

        // 递归处理子节点
        for (const child of layer.children) {
            processLayer(child, nodeId);
        }
    }

    for (const layer of layers) {
        processLayer(layer, rootId);
    }

    return b.toJSON();
}

// ============================================================
// 生成 TypeScript 类文件（节点绑定层，勿手动修改）
// ============================================================
function generateTsClass(layers, className, isComponent) {
    const properties = [];
    const componentImports = new Set();
    const propNames = new Set();
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');

    const isUI = className.startsWith('UI_');
    const isItem = className.startsWith('Item_');

    // 递归收集所有有前缀的节点（匹配 UITools.parseComp 的类型映射）
    function collectProps(layerList) {
        for (const layer of layerList) {
            const prefix = layer.prefix;
            if (!prefix) {
                // 无前缀图层（如 background）：不生成属性，但递归其子节点
                if (layer.children.length > 0) collectProps(layer.children);
                continue;
            }
            if (propNames.has(layer.name)) {
                if (layer.children.length > 0) collectProps(layer.children);
                continue;
            }
            propNames.add(layer.name);

            let propType = 'cc.Node';
            switch (prefix) {
                case 'btn': propType = 'cc.Button'; break;
                case 'tog': case 'toggle': propType = 'cc.Toggle'; break;
                case 'txt': case 'lbl': case 'lab': propType = 'cc.Label'; break;
                case 'sp': case 'img': propType = 'cc.Sprite'; break;
                case 'progress': propType = 'cc.ProgressBar'; break;
                case 'edit': propType = 'cc.EditBox'; break;
                case 'rich': propType = 'cc.RichText'; break;
                case 'sv': propType = 'cc.ScrollView'; break;
                case 'list': {
                    propType = 'List';
                    componentImports.add('List');
                    break;
                }
                case 'vlist': {
                    propType = 'ListView';
                    componentImports.add('ListView');
                    break;
                }
                case 'com': {
                    // com_topBar -> Com_TopBar
                    const componentName = 'Com_' + layer.name.substring(4, 5).toUpperCase() + layer.name.substring(5);
                    propType = componentName;
                    componentImports.add(componentName);
                    break;
                }
                default: propType = 'cc.Node'; break;
            }

            properties.push({ name: layer.name, type: propType });

            // 递归子节点（com_ 图层内容属于子组件，不递归）
            if (layer.children.length > 0 && prefix !== 'com') {
                collectProps(layer.children);
            }
        }
    }

    collectProps(layers);

    // 生成属性代码
    let propsCode = '';
    for (const prop of properties) {
        propsCode += `    ${prop.name}: ${prop.type} = null;\n`;
    }

    // 生成 import 语句
    let componentImportsCode = '';
    for (const compName of componentImports) {
        if (compName === 'List') {
            componentImportsCode += `import List from "../../scripts/game/ui/component/List";\n`;
        } else if (compName === 'ListView') {
            componentImportsCode += `import ListView from "../../scripts/game/ui/component/ListView";\n`;
        } else {
            componentImportsCode += `import ${compName} from "./comp/${compName}";\n`;
        }
    }
    if (componentImportsCode) componentImportsCode += '\n';

    const header =
        `// [自动生成 - 勿手动修改]
// 预制体节点绑定层：${className}.prefab
// 由 PsdToPrefab 工具根据 PSD 图层自动生成，重新导出 PSD 时会覆盖此文件
// 业务逻辑请在继承此类的面板脚本中实现，生成时间：${year}.${month}.${day}
`;

    if (isUI) {
        return `${header}
import UIBase from "../../UIBase";
${componentImportsCode}const { ccclass } = cc._decorator;

@ccclass('${className}')
export default class ${className} extends UIBase {
${propsCode}}
`;
    } else if (isItem) {
        return `${header}
import ListItem from "../../component/ListItem";
${componentImportsCode}const { ccclass } = cc._decorator;

@ccclass('${className}')
export default class ${className} extends ListItem {
${propsCode}}
`;
    } else {
        // Com_ 组件
        return `${header}
${componentImportsCode}const { ccclass } = cc._decorator;

@ccclass('${className}')
export default class ${className} extends cc.Component {
${propsCode}}
`;
    }
}

// ============================================================
// 生成 TS .meta 文件
// ============================================================
function generateTsMeta(scriptName) {
    const uuid = stableUUID(`psd_script/${scriptName}`);
    return JSON.stringify({
        ver: '1.0.8',
        uuid: uuid,
        isPlugin: false,
        loadPluginInWeb: true,
        loadPluginInNative: true,
        loadPluginInEditor: false,
        subMetas: {}
    }, null, 2);
}

// ============================================================
// 主流程
// ============================================================
async function main() {
    const opts = parseArgs();

    console.log(`\n🎨 PSD → 预制体工具`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  PSD文件: ${opts.psdFile}`);
    console.log(`  预制体名: ${opts.prefabName}${opts.prefabName !== opts.name ? ' (TS类: ' + opts.name + ')' : ''}`);
    console.log(`  类型: ${opts.isComponent ? '组件' : '界面'}`);
    console.log(`  设计尺寸: ${opts.designWidth}x${opts.designHeight}`);
    console.log(`  输出目录: ${opts.outDir}`);
    console.log(`  切图目录: ${opts.imgDir}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // 1. 读取PSD
    console.log('📂 读取PSD...');
    const psdBuf = fs.readFileSync(opts.psdFile);
    const psd = readPsd(psdBuf, { skipThumbnail: true, useImageData: true });
    const canvasW = psd.width;
    const canvasH = psd.height;
    console.log(`  画布尺寸: ${canvasW}x${canvasH}`);
    console.log(`  图层数: ${psd.children ? psd.children.length : 0}`);

    // 2. 解析图层树
    console.log('\n🌲 解析图层树...');
    const layers = collectLayers(psd, canvasW, canvasH);
    function printTree(ls, depth = 0) {
        for (const l of ls) {
            const indent = '  '.repeat(depth + 1);
            const flags = [];
            if (!l.active) flags.push('隐藏');
            if (l.isText) flags.push(`文字:"${l.textInfo?.string || ''}"`);
            if (l.isGroup) flags.push('组');
            if (l.hasPixels) flags.push('图像');
            const flagStr = flags.length ? ` [${flags.join(', ')}]` : '';
            console.log(`${indent}${l.isGroup ? '📁' : '  '} ${l.name} (${l.w}x${l.h})${flagStr}`);
            if (l.children.length > 0) printTree(l.children, depth + 1);
        }
    }
    printTree(layers);

    // 3. 切图（preview-only 模式也需要先切图，效果图基于切图文件合成）
    if (!opts.prefabOnly) {
        console.log('\n✂️  导出切图...');
        fs.mkdirSync(opts.outDir, { recursive: true });
        const imageMap = {};
        await exportImages(layers, opts.imgDir, imageMap);
        const count = Object.keys(imageMap).length;
        console.log(`  共导出 ${count} 张图片`);
    }

    // 4. 效果图（从已导出的 PNG 文件合成，确保像素正确）
    if (!opts.prefabOnly && !opts.imagesOnly) {
        const previewOutDir = opts.previewDir || opts.outDir;
        console.log('\n📸 生成效果图...');
        fs.mkdirSync(previewOutDir, { recursive: true });
        await generatePreview(opts.psdFile, previewOutDir, canvasW, canvasH, layers, opts.imgDir, opts.name);
    }

    // 仅效果图/切图模式：完成后退出
    if (opts.previewOnly || opts.imagesOnly) {
        console.log('\n✨ 完成！');
        if (opts.previewOnly) console.log(`  📸 ${path.join(opts.outDir, 'preview.png')}`);
        return;
    }

    // 5. TypeScript 类（先生成以获取UUID）
    let tsUuid = null;
    let panelUuid = null;  // UI_ 界面的 Panel 脚本 UUID
    if (!opts.imagesOnly) {
        console.log('\n📝 生成 TypeScript 类...');
        const tsCode = generateTsClass(layers, opts.name, opts.isComponent);

        // 根据类型决定子目录（优先使用 --ts 指定目录）
        let tsDir = opts.tsDir || opts.outDir;
        if (!opts.tsDir) {
            if (opts.name.startsWith('Com_')) {
                tsDir = path.join(opts.outDir, 'comp');
            } else if (opts.name.startsWith('Item_')) {
                tsDir = path.join(opts.outDir, 'items');
            }
        }

        fs.mkdirSync(tsDir, { recursive: true });
        const tsPath = path.join(tsDir, `${opts.name}.ts`);
        fs.writeFileSync(tsPath, tsCode);

        // 生成 .meta 文件（使用脚本名称生成稳定 UUID）
        const tsMetaContent = generateTsMeta(opts.name);
        fs.writeFileSync(tsPath + '.meta', tsMetaContent);

        console.log(`  ✅ ${tsPath}`);
        console.log(`  ✅ ${tsPath}.meta`);

        // 保存 TS UUID 供预制体使用（使用相对路径）
        tsUuid = stableUUID(`psd_script/${opts.name}`);

        // 5b. UI_ 界面自动生成 Panel 业务逻辑层（首次创建，不覆盖已有文件）
        const isUI = opts.name.startsWith('UI_');
        if (isUI && !opts.isComponent) {
            // UI_MainHome → MainHomePanel
            const baseName = opts.name.substring(3); // 去掉 'UI_' 前缀
            const panelName = baseName + 'Panel';
            const panelDir = path.join(tsDir, '..'); // Panel 放在 generated/ 的上级目录
            const panelPath = path.join(panelDir, `${panelName}.ts`);

            if (!fs.existsSync(panelPath)) {
                console.log(`\n📝 首次创建 Panel 业务逻辑层: ${panelName}.ts`);
                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');

                const panelCode = `// ${opts.name} 是由 PsdToPrefab 自动生成的节点绑定层（勿手动修改节点属性）
// 生成路径: output/${opts.name}/${opts.name}.ts → 复制到此目录下的 generated/ 文件夹
import ${opts.name} from './generated/${opts.name}';

const { ccclass, menu } = cc._decorator;

/**
 * ${baseName} - 业务逻辑
 * 节点引用声明在父类 ${opts.name}（自动生成）中
 * @author clong ${year}.${month}.${day}
 */
@ccclass
@menu('UI/${panelName}')
export default class ${panelName} extends ${opts.name} {

    protected onAfterShow(): void {
        // TODO: 界面显示后，填充 UI 数据
    }

    public onBtnClick(btn: any, e?: string): void {
        super.onBtnClick(btn, e);
        // TODO: 按钮点击处理
    }
}
`;
                fs.mkdirSync(panelDir, { recursive: true });
                fs.writeFileSync(panelPath, panelCode);
                console.log(`  ✅ ${panelPath}`);

                // 生成 Panel 的 .meta（使用 Panel 名称作为种子，UUID 与 UI_ 类不同）
                const panelMetaContent = generateTsMeta(panelName);
                fs.writeFileSync(panelPath + '.meta', panelMetaContent);
                console.log(`  ✅ ${panelPath}.meta`);
            } else {
                console.log(`\n📝 Panel 已存在，跳过: ${panelPath}`);
            }

            // Panel 脚本的 UUID 用于预制体绑定（优先于 UI_ 绑定层）
            panelUuid = stableUUID(`psd_script/${panelName}`);
        }
    }

    // 6. 预制体 + 脚本绑定（两步解耦）
    if (!opts.imagesOnly) {
        console.log('\n🔧 生成预制体...');
        // Step A: 纯布局，不涉及脚本
        let prefabJson = buildPrefab(layers, opts.prefabName, canvasW, canvasH, opts.isComponent);
        // Step B: 独立的脚本绑定后处理
        // 优先级: --script 指定 > Panel 脚本（UI_界面）> 自动生成的 UI_/Com_ 脚本
        let bindUuid = panelUuid || tsUuid;
        if (opts.scriptPath) {
            const metaPath = opts.scriptPath + '.meta';
            if (fs.existsSync(metaPath)) {
                const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                bindUuid = meta.uuid || bindUuid;
                console.log(`  📎 绑定脚本: ${path.basename(opts.scriptPath)} (${bindUuid})`);
            } else {
                console.warn(`  ⚠️  未找到脚本 meta: ${metaPath}，跳过脚本绑定`);
                bindUuid = null;
            }
        }
        if (bindUuid) {
            prefabJson = bindScriptToPrefab(prefabJson, bindUuid);
            if (panelUuid && !opts.scriptPath) {
                const baseName = opts.name.substring(3);
                console.log(`  📎 绑定脚本: ${baseName}Panel (Panel业务层，而非${opts.name}绑定层)`);
            }
        }
        const prefabPath = path.join(opts.outDir, `${opts.prefabName}.prefab`);
        fs.mkdirSync(opts.outDir, { recursive: true });
        fs.writeFileSync(prefabPath, prefabJson);
        console.log(`  ✅ ${prefabPath}`);
    }

    console.log('\n✨ 完成！');
    console.log(`输出目录: ${opts.outDir}/`);
    if (!opts.prefabOnly) console.log(`  📸 preview.png`);
    if (!opts.prefabOnly) console.log(`  ✂️  images/`);
    if (!opts.imagesOnly) console.log(`  🔧 ${opts.prefabName}.prefab`);
    if (!opts.imagesOnly) console.log(`  📝 ${opts.name}.ts (绑定层)`);
    if (!opts.imagesOnly && panelUuid) {
        const baseName = opts.name.substring(3);
        console.log(`  📝 ${baseName}Panel.ts (业务逻辑层，绑定到预制体)`);
    }
}

main().catch(err => {
    console.error('\n❌ 错误:', err.message);
    console.error(err.stack);
    process.exit(1);
});
