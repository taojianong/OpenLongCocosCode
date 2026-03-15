/**
 * PsdCanvasHelpers.js — PSD 生成辅助函数库
 *
 * 提供各种 canvas 生成函数，供 GenPsd.js 调用。
 * 所有函数返回 ag-psd 兼容的 canvas 对象 { width, height, getContext }。
 *
 * @author clong 2026.03.15
 */
'use strict';

// ─── canvas 包装 ────────────────────────────────────────

function wrapCanvas(w, h, data) {
    return {
        width: w, height: h,
        getContext: () => ({ getImageData: () => ({ data, width: w, height: h }) }),
    };
}

// ─── 纯色 ───────────────────────────────────────────────

function solidCanvas(w, h, r, g, b, a = 255) {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
    }
    return wrapCanvas(w, h, data);
}

// ─── 线性渐变（默认上→下，可选左→右）────────────────────

function gradientCanvas(w, h, [r1, g1, b1], [r2, g2, b2], a = 255, direction = 'vertical') {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const t = direction === 'horizontal'
                ? (w > 1 ? x / (w - 1) : 0)
                : (h > 1 ? y / (h - 1) : 0);
            const i = (y * w + x) * 4;
            data[i] = Math.round(r1 + (r2 - r1) * t);
            data[i + 1] = Math.round(g1 + (g2 - g1) * t);
            data[i + 2] = Math.round(b1 + (b2 - b1) * t);
            data[i + 3] = a;
        }
    }
    return wrapCanvas(w, h, data);
}

// ─── 圆角按钮（高光+阴影）───────────────────────────────

function buttonCanvas(w, h, [r, g, b]) {
    const data = new Uint8ClampedArray(w * h * 4);
    const radius = Math.min(20, h * 0.3);
    function inRoundRect(px, py) {
        const cx = Math.max(radius, Math.min(w - radius, px));
        const cy = Math.max(radius, Math.min(h - radius, py));
        const dx = px - cx, dy = py - cy;
        return dx * dx + dy * dy <= radius * radius;
    }
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            if (!inRoundRect(x + 0.5, y + 0.5)) { data[i + 3] = 0; continue; }
            const t = y / (h - 1);
            const bright = t < 0.15 ? 1.45 : t < 0.5 ? 1.45 - (t - 0.15) * 1.1 : 0.84 - (t - 0.5) * 0.28;
            let pr = Math.min(255, Math.round(r * bright));
            let pg = Math.min(255, Math.round(g * bright));
            let pb = Math.min(255, Math.round(b * bright));
            if (y < 3) { pr = Math.min(255, pr + 70); pg = Math.min(255, pg + 70); pb = Math.min(255, pb + 70); }
            if (x === 0 || x === w - 1) { pr = Math.min(255, Math.round(r * 1.7)); pg = Math.min(255, Math.round(g * 1.7)); pb = Math.min(255, Math.round(b * 1.7)); }
            data[i] = pr; data[i + 1] = pg; data[i + 2] = pb; data[i + 3] = 255;
        }
    }
    return wrapCanvas(w, h, data);
}

// ─── 径向渐变（中心亮→边缘暗）───────────────────────────

function radialCanvas(w, h, [r1, g1, b1], [r2, g2, b2], a = 255) {
    const data = new Uint8ClampedArray(w * h * 4);
    const cx = w / 2, cy = h / 2, maxR = Math.sqrt(cx * cx + cy * cy);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const t = Math.min(1, Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxR);
            const i = (y * w + x) * 4;
            data[i] = Math.round(r1 + (r2 - r1) * t);
            data[i + 1] = Math.round(g1 + (g2 - g1) * t);
            data[i + 2] = Math.round(b1 + (b2 - b1) * t);
            data[i + 3] = a;
        }
    }
    return wrapCanvas(w, h, data);
}

// ─── 噪点纹理 ──────────────────────────────────────────

function noiseCanvas(w, h, [r, g, b], a = 255, mag = 10, seed = 12345) {
    const data = new Uint8ClampedArray(w * h * 4);
    let s = seed;
    const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let i = 0; i < w * h * 4; i += 4) {
        const n = (rand() - 0.5) * mag;
        data[i] = Math.max(0, Math.min(255, r + n));
        data[i + 1] = Math.max(0, Math.min(255, g + n));
        data[i + 2] = Math.max(0, Math.min(255, b + n));
        data[i + 3] = a;
    }
    return wrapCanvas(w, h, data);
}

// ─── 半透明遮罩 ─────────────────────────────────────────

function overlayCanvas(w, h, r = 0, g = 0, b = 0, a = 160) {
    return solidCanvas(w, h, r, g, b, a);
}

// ─── 五角星 ─────────────────────────────────────────────

function starCanvas(size, [r, g, b], [r2, g2, b2]) {
    const data = new Uint8ClampedArray(size * size * 4);
    const cx = size / 2, cy = size / 2;
    const outerR = size * 0.45, innerR = size * 0.18;
    const points = [];
    for (let i = 0; i < 5; i++) {
        const aOuter = (i * 72 - 90) * Math.PI / 180;
        const aInner = ((i * 72) + 36 - 90) * Math.PI / 180;
        points.push([cx + outerR * Math.cos(aOuter), cy + outerR * Math.sin(aOuter)]);
        points.push([cx + innerR * Math.cos(aInner), cy + innerR * Math.sin(aInner)]);
    }
    function pointInStar(px, py) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const [xi, yi] = points[i], [xj, yj] = points[j];
            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            if (pointInStar(x + 0.5, y + 0.5)) {
                const t = y / (size - 1);
                data[i] = Math.round(r + (r2 - r) * t);
                data[i + 1] = Math.round(g + (g2 - g) * t);
                data[i + 2] = Math.round(b + (b2 - b) * t);
                data[i + 3] = 255;
            } else {
                data[i + 3] = 0;
            }
        }
    }
    return wrapCanvas(size, size, data);
}

// ─── 圆形 ───────────────────────────────────────────────

function circleCanvas(size, r, g, b) {
    const data = new Uint8ClampedArray(size * size * 4);
    const cx = size / 2, cy = size / 2, radius = size / 2 - 2;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x - cx, dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const i = (y * size + x) * 4;
            if (dist <= radius) {
                data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
            } else if (dist <= radius + 1) {
                const aa = Math.round((radius + 1 - dist) * 255);
                data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = aa;
            }
        }
    }
    return wrapCanvas(size, size, data);
}

// ─── 文字图层 ───────────────────────────────────────────

function textLayer(name, text, left, top, right, bottom, fontSize = 28, color = { r: 255, g: 255, b: 255 }, bold = false, align = 'center') {
    return {
        name,
        left, top, right, bottom,
        text: {
            text,
            style: {
                fontSize,
                fillColor: color,
                justification: align,
                fauxBold: bold,
                font: { name: 'Arial' },
            },
            bounds: {
                left: { units: 'Pixels', value: left },
                top: { units: 'Pixels', value: top },
                right: { units: 'Pixels', value: right },
                bottom: { units: 'Pixels', value: bottom },
            },
        },
    };
}

module.exports = {
    solidCanvas,
    gradientCanvas,
    buttonCanvas,
    radialCanvas,
    noiseCanvas,
    overlayCanvas,
    starCanvas,
    circleCanvas,
    textLayer,
};
