(() => {
    'use strict';

    // ============================================================
    // Design Ruler 插件 - 场景编辑器标尺覆盖层
    // ============================================================
    // 功能：
    // 1. 在场景编辑器顶部和左侧绘制带刻度的标尺
    // 2. 支持拖拽创建水平/垂直对齐线
    // 3. 标尺和对齐线随场景缩放和平移自动调整
    // 4. 自动调整场景工具栏位置避免被标尺遮挡
    // ============================================================

    // 防止重复注入
    if (window.__designRulerInjected) return;
    window.__designRulerInjected = true;

    // 清理旧的注入元素（用于插件重载）
    var _isReload = !!document.getElementById('__design-ruler-overlay__');
    var _oldOverlay = document.getElementById('__design-ruler-overlay__');
    if (_oldOverlay) _oldOverlay.parentNode.removeChild(_oldOverlay);
    var _oldDrag = document.getElementById('__design-ruler-drag__');
    if (_oldDrag) _oldDrag.parentNode.removeChild(_oldDrag);
    var _oldPanel = document.getElementById('__design-ruler-panel__');
    if (_oldPanel) _oldPanel.parentNode.removeChild(_oldPanel);

    const electron = require('electron');

    // ============================================================
    // 全局状态
    // ============================================================
    var state = {
        visible: false,           // 标尺是否显示
        guidesEnabled: true,      // 对齐线是否启用
        guideColor: '#00FF00',    // 对齐线颜色
        guideOpacity: 0.8,        // 对齐线不透明度
        guides: [],               // 对齐线数组 [{type:'h'|'v', position:number, dashed:boolean}]
        zoom: 1,                  // 当前缩放比例
        defaultDashed: true,      // 新对齐线默认是否虚线
        sceneOffset: { x: 0, y: 0 }, // 场景偏移量（预留，未使用）
    };

    // 常量定义
    var RULER_SIZE = 25;          // 标尺宽度/高度（像素）

    // 拖拽状态
    var _dragging = -1;           // 正在拖拽的对齐线索引（-1表示无）
    var _dragType = '';           // 拖拽类型：'h'水平 或 'v'垂直
    var _mouseInGuideZone = false; // 鼠标是否在对齐线或标尺区域
    var _creatingFromRuler = false; // 是否正在从标尺拖出新对齐线
    var _dragOffset = 0;          // 鼠标点击位置相对于对齐线的偏移

    // ============================================================
    // 创建标尺覆盖层 Canvas
    // ============================================================
    var overlay = document.createElement('canvas');
    overlay.id = '__design-ruler-overlay__';
    overlay.style.cssText = [
        'position: fixed',
        'top: 0',
        'left: 0',
        'width: 100%',
        'height: 100%',
        'pointer-events: none', // 不阻挡鼠标事件
        'z-index: 9998',        // 在场景之上，拖拽层之下
        'display: none',
    ].join(';');
    document.body.appendChild(overlay);

    var ctx = overlay.getContext('2d');

    // ============================================================
    // 场景编辑器区域检测
    // ============================================================
    // 场景编辑器区域缓存（避免频繁重新计算 DOM 位置）
    var _cachedRect = null;
    var _rectCacheTime = 0;
    var RECT_CACHE_DURATION = 500; // 缓存有效期 500ms

    /**
     * 获取场景编辑器的实际渲染区域
     * 通过识别最大宽度的居中 ui-panel-frame 元素确定场景面板
     * 排除 tab 标签栏高度，并处理控制台等其他面板的遮挡
     * @returns {Object} 包含 left, top, width, height, right, bottom, panelTop 的矩形区域
     */
    function getSceneRect() {
        var now = Date.now();
        // 使用缓存避免频繁 DOM 查询
        if (_cachedRect && now - _rectCacheTime < RECT_CACHE_DURATION) {
            return _cachedRect;
        }

        var frames = document.querySelectorAll('ui-panel-frame');
        var best = null;
        var bestFrame = null;

        // 1. 查找场景面板：宽度最大且位置居中的 frame
        for (var i = 0; i < frames.length; i++) {
            var r = frames[i].getBoundingClientRect();

            // 场景面板特征：足够大（>400px）且在中间位置（100-500px）
            if (r.width > 400 && r.height > 50 && r.left > 100 && r.left < 500) {
                if (!best || r.width > best.width) {
                    // 计算 tab 栏高度（需排除）
                    var tabHeight = 20; // 默认值
                    var shadow = frames[i].shadowRoot;
                    if (shadow) {
                        var divs = shadow.querySelectorAll('div > div');
                        if (divs.length >= 1) {
                            tabHeight = divs[0].getBoundingClientRect().height;
                        }
                    }

                    // 构建实际画布区域（排除 tab 栏）
                    best = {
                        left: r.left,
                        top: r.top + tabHeight,
                        width: r.width,
                        height: r.height - tabHeight,
                        right: r.right,
                        bottom: r.bottom,
                        panelTop: r.top, // 保留原始 top 用于坐标计算
                    };
                    bestFrame = frames[i];
                }
            }
        }

        if (best) {
            // 2. 裁剪被其他面板遮挡的区域（如控制台上移时）
            for (var j = 0; j < frames.length; j++) {
                if (frames[j] === bestFrame) continue;

                var fr = frames[j].getBoundingClientRect();
                if (fr.width < 200) continue; // 忽略窄面板（如侧边栏）

                // 检测从下方遮挡的面板
                if (fr.top > best.top && fr.top < best.bottom) {
                    // 只有水平方向大面积重叠（>50%）才认为是遮挡
                    var hOverlap = Math.min(fr.right, best.right) - Math.max(fr.left, best.left);
                    if (hOverlap > best.width * 0.5) {
                        best.bottom = fr.top; // 裁剪底部
                        best.height = best.bottom - best.top;
                    }
                }
            }

            _cachedRect = best;
            _rectCacheTime = now;
            return _cachedRect;
        }

        // 3. 回退：使用默认硬编码值
        _cachedRect = { left: 208, top: 119, width: 663, height: 453 };
        _rectCacheTime = now;
        return _cachedRect;
    }

    // ============================================================
    // 场景相机与缩放比例
    // ============================================================

    /**
     * 获取场景当前缩放比例
     * @returns {number} 缩放比例（默认 1.0）
     */
    function detectZoom() {
        try {
            var workspace = window._Scene && window._Scene.getEditingWorkspace && window._Scene.getEditingWorkspace();
            if (workspace && workspace.cameraSetting && workspace.cameraSetting.operating2D) {
                return workspace.cameraSetting.operating2D.scale;
            }
        } catch (e) { }
        return state.zoom || 1;
    }

    /**
     * 获取场景 2D 相机设置对象
     * 包含 scale（缩放）、xAxis（X轴偏移）、yAxis（Y轴偏移）
     * @returns {Object|null} 相机设置对象或 null
     */
    function getSceneCamera() {
        try {
            var workspace = window._Scene && window._Scene.getEditingWorkspace && window._Scene.getEditingWorkspace();
            if (workspace && workspace.cameraSetting && workspace.cameraSetting.operating2D) {
                return workspace.cameraSetting.operating2D;
            }
        } catch (e) { }
        return null;
    }

    // ============================================================
    // 标尺绘制主流程
    // ============================================================

    /**
     * 调整 canvas 尺寸以匹配窗口大小
     * 避免重复调整，仅在尺寸变化时执行
     */
    function resizeCanvas() {
        if (overlay.width !== window.innerWidth || overlay.height !== window.innerHeight) {
            overlay.width = window.innerWidth;
            overlay.height = window.innerHeight;
        }
    }

    /**
     * 主绘制函数
     * 每次绘制包括：标尺背景、刻度、对齐线
     * 会在窗口 resize 和定时器中被调用
     */
    function draw() {
        if (!ctx) return;

        // 确保 canvas 尺寸正确
        resizeCanvas();
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        // 标尺隐藏或对齐线禁用时不绘制
        if (!state.visible || !state.guidesEnabled) return;

        // 获取场景编辑器区域
        var rect = getSceneRect();
        if (!rect || rect.width <= 0) return;

        // 获取场景相机状态（缩放和偏移）
        var cam = getSceneCamera();
        var zoom = cam ? cam.scale : (state.zoom || 1);
        var xAxis = cam ? cam.xAxis : 0;
        var yAxis = cam ? cam.yAxis : 0;
        state.zoom = zoom; // 更新状态中的缩放值

        // 依次绘制：背景 -> 刻度 -> 对齐线
        drawRulerBg(rect, zoom);
        drawRulerTicks(rect, zoom, xAxis, yAxis);
        drawGuides(rect, zoom);
    }

    // ============================================================
    // 场景工具栏自适应调整（标尺显示时避免遮挡）
    // ============================================================

    /**
     * 递归搜索 Shadow DOM 树中的元素
     * @param {ShadowRoot|Document} root - 搜索起点（shadowRoot 或 document）
     * @param {string} selector - CSS 选择器
     * @returns {Element|null} 找到的元素或 null
     */
    function deepQuerySelector(root, selector) {
        // 先在当前层级查找
        var result = root.querySelector(selector);
        if (result) return result;

        // 递归搜索所有嵌套的 shadowRoot
        var children = root.querySelectorAll('*');
        for (var i = 0; i < children.length; i++) {
            if (children[i].shadowRoot) {
                result = deepQuerySelector(children[i].shadowRoot, selector);
                if (result) return result;
            }
        }
        return null;
    }

    /**
     * 调整场景编辑器顶部工具栏位置
     * 当标尺显示时，将 editButtons 和 helpText 向下偏移 RULER_SIZE 像素
     * 避免被标尺覆盖
     */
    function adjustSceneUI() {
        // 查找场景面板的所有 ui-panel-frame 元素
        var frames = document.querySelectorAll('ui-panel-frame');
        var editButtons = null;
        var helpText = null;

        // 遍历所有 frame，在其 shadowRoot 中递归搜索目标元素
        for (var i = 0; i < frames.length; i++) {
            var shadow = frames[i].shadowRoot;
            if (!shadow) continue;

            // editButtons 是 ID，helpText 是 ID
            var eb = deepQuerySelector(shadow, '#editButtons');
            var ht = deepQuerySelector(shadow, '#helpText');

            if (eb) editButtons = eb;
            if (ht) helpText = ht;

            // 如果两个元素都找到了，可以提前退出循环
            if (editButtons && helpText) break;
        }

        // 回退到全局查找（某些情况下元素可能不在 shadowRoot 中）
        if (!editButtons) editButtons = document.querySelector('#editButtons');
        if (!helpText) helpText = document.querySelector('#helpText');

        // 应用变换：标尺显示时下移，隐藏时恢复
        var transform = state.visible ? 'translateY(' + RULER_SIZE + 'px)' : '';

        if (editButtons) {
            editButtons.style.transition = 'transform 0.2s ease';
            editButtons.style.transform = transform;
        }

        if (helpText) {
            helpText.style.transition = 'transform 0.2s ease';
            helpText.style.transform = transform;
        }
    }

    /**
     * 绘制标尺背景
     * 包括顶部水平标尺、左侧垂直标尺和左上角缩放比显示区域
     * @param {Object} rect - 场景编辑器矩形区域
     * @param {number} zoom - 当前缩放比例
     */
    function drawRulerBg(rect, zoom) {
        // 半透明深灰色背景（顶部水平标尺 + 左侧垂直标尺）
        ctx.fillStyle = 'rgba(30, 30, 30, 0.85)';
        ctx.fillRect(rect.left, rect.top, rect.width, RULER_SIZE); // 顶部横条
        ctx.fillRect(rect.left, rect.top + RULER_SIZE, RULER_SIZE, rect.height - RULER_SIZE); // 左侧竖条

        // 左上角方块（更深的颜色）
        ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
        ctx.fillRect(rect.left, rect.top, RULER_SIZE, RULER_SIZE);

        // 在左上角显示当前缩放百分比
        var percentage = Math.round(zoom * 100) + '%';
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(percentage, rect.left + RULER_SIZE / 2, rect.top + RULER_SIZE / 2);
        ctx.textBaseline = 'alphabetic'; // 恢复默认基线
    }

    /**
     * 绘制标尺刻度和数字标签
     * 根据缩放比例自动调整刻度密度，保持视觉效果合理
     * @param {Object} rect - 场景编辑器矩形区域
     * @param {number} zoom - 当前缩放比例
     * @param {number} xAxis - 场景原点 X 轴屏幕坐标（相对面板左边）
     * @param {number} yAxis - 场景原点 Y 轴屏幕坐标（相对面板底部，向上为负）
     */
    function drawRulerTicks(rect, zoom, xAxis, yAxis) {
        // === 1. 计算自适应刻度间距 ===
        var baseStep = 10; // 场景坐标系中的基础步长（像素）
        var pixelStep = baseStep * zoom; // 屏幕上的实际像素步长

        // 刻度太密集时增大步长
        while (pixelStep < 5) {
            baseStep *= 2;
            pixelStep = baseStep * zoom;
        }

        // 刻度太稀疏时减小步长
        while (pixelStep > 40 && baseStep > 5) {
            baseStep /= 2;
            pixelStep = baseStep * zoom;
        }

        // 刻度层级：小刻度、中刻度(5倍)、大刻度(10倍,带数字)
        var bigStepMultiple = 5;
        var majorStepMultiple = 10;

        // === 2. 计算场景原点在屏幕上的位置 ===
        var areaLeft = rect.left + RULER_SIZE;
        var areaTop = rect.top + RULER_SIZE;
        var areaW = rect.width - RULER_SIZE;
        var areaH = rect.height - RULER_SIZE;

        // 场景坐标原点映射到屏幕坐标
        // xAxis: 相对面板左边的偏移
        // yAxis: 相对面板底部的偏移（Cocos Y轴向上为正）
        var panelLeft = rect.left;
        var originX = panelLeft + xAxis;
        var originY = rect.bottom + yAxis;

        // === 3. 绘制水平刻度（X轴）===
        var startSceneX = Math.floor((areaLeft - originX) / pixelStep) * baseStep;
        var hCount = Math.ceil(areaW / pixelStep) + 2;

        for (var i = 0; i <= hCount; i++) {
            var sceneX = startSceneX + i * baseStep; // 场景坐标
            var x = originX + sceneX * zoom; // 转换为屏幕坐标

            // 跳过可视区域外的刻度
            if (x < areaLeft) continue;
            if (x > rect.left + rect.width) break;

            // 判断刻度级别
            var isMajor = (Math.round(sceneX / baseStep) % majorStepMultiple === 0);
            var isBig = (Math.round(sceneX / baseStep) % bigStepMultiple === 0);
            var tickHeight = isMajor ? RULER_SIZE * 0.4 : (isBig ? RULER_SIZE * 0.6 : RULER_SIZE * 0.3);

            // 先绘制主刻度数字标签（从顶部开始，避免被刻度线覆盖）
            if (isMajor) {
                ctx.fillStyle = '#cccccc';
                ctx.font = '9px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(sceneX.toString(), x, rect.top + 2);
            }

            // 再绘制刻度线（从底部向上，不覆盖数字）
            ctx.strokeStyle = isMajor ? '#ffffff' : (isBig ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)');
            ctx.lineWidth = isMajor ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(x, rect.top + RULER_SIZE);
            ctx.lineTo(x, rect.top + RULER_SIZE - tickHeight);
            ctx.stroke();
        }

        // === 4. 绘制垂直刻度（Y轴）===
        // 注意：Cocos Creator 的 Y 轴向上为正，但屏幕坐标向下递增
        var topSceneY = Math.ceil((originY - areaTop) / pixelStep) * baseStep;
        var vCount = Math.ceil(areaH / pixelStep) + 2;

        for (var j = 0; j <= vCount; j++) {
            var sceneY = topSceneY - j * baseStep; // 场景坐标（从上到下递减）
            var y = originY - sceneY * zoom; // 转换为屏幕坐标

            // 跳过可视区域外的刻度
            if (y < areaTop) continue;
            if (y > rect.top + rect.height) break;

            // 判断刻度级别
            var isMajor2 = (Math.round(sceneY / baseStep) % majorStepMultiple === 0);
            var isBig2 = (Math.round(sceneY / baseStep) % bigStepMultiple === 0);
            var tickWidth = isMajor2 ? RULER_SIZE * 0.4 : (isBig2 ? RULER_SIZE * 0.6 : RULER_SIZE * 0.3);

            // 先绘制主刻度数字标签（旋转90度，放在左侧约14px区域）
            if (isMajor2) {
                ctx.save();
                ctx.fillStyle = '#cccccc';
                ctx.font = '9px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.translate(rect.left + 8, y);
                ctx.rotate(-Math.PI / 2); // 逆时针旋转90度
                ctx.fillText(sceneY.toString(), 0, 0);
                ctx.restore();
            }

            // 再绘制刻度线（从右向左，避免覆盖数字区域）
            ctx.strokeStyle = isMajor2 ? '#ffffff' : (isBig2 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)');
            ctx.lineWidth = isMajor2 ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(rect.left + RULER_SIZE, y);
            ctx.lineTo(rect.left + RULER_SIZE - tickWidth, y);
            ctx.stroke();
        }
    }

    function drawGuides(rect, zoom) {
        if (state.guides.length === 0) return;

        var cam = getSceneCamera();
        var xAxis = cam ? cam.xAxis : 0;
        var yAxis = cam ? cam.yAxis : 0;
        var panelLeft = rect.left;
        var originX = panelLeft + xAxis;
        var originY = rect.bottom + yAxis;

        var guideArea = {
            left: rect.left + RULER_SIZE,
            top: rect.top + RULER_SIZE,
            width: rect.width - RULER_SIZE,
            height: rect.height - RULER_SIZE,
        };

        state.guides.forEach(function (guide, idx) {
            var isActive = (_dragging === idx);

            // 裁剪到编辑区域，超出部分不显示
            ctx.save();
            ctx.beginPath();
            ctx.rect(guideArea.left, guideArea.top, guideArea.width, guideArea.height);
            ctx.clip();

            ctx.strokeStyle = isActive ? '#ffffff' : state.guideColor;
            ctx.globalAlpha = isActive ? 1 : state.guideOpacity;
            ctx.lineWidth = isActive ? 3 : 2;

            // 虚线/实线
            var isDashed = guide.dashed !== undefined ? guide.dashed : state.defaultDashed;
            if (isDashed) {
                ctx.setLineDash([6, 3]);
            } else {
                ctx.setLineDash([]);
            }

            ctx.beginPath();
            if (guide.type === 'h') {
                // 水平线：场景Y坐标转屏幕坐标
                var y = originY - guide.position * zoom;
                ctx.moveTo(guideArea.left, y);
                ctx.lineTo(guideArea.left + guideArea.width, y);
            } else {
                // 垂直线：场景X坐标转屏幕坐标
                var x = originX + guide.position * zoom;
                ctx.moveTo(x, guideArea.top);
                ctx.lineTo(x, guideArea.top + guideArea.height);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;

            // 位置标签：先画背景块再画文字，确保不被线覆盖
            ctx.font = 'bold 10px Arial';
            ctx.textBaseline = 'alphabetic';
            var label = guide.position + 'px';
            var labelW = ctx.measureText(label).width;
            if (guide.type === 'h') {
                var labelY = originY - guide.position * zoom;
                // 水平线：数字在线上方，背景块盖住线
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = '#1e1e1e';
                ctx.fillRect(guideArea.left + 2, labelY - 15, labelW + 6, 14);
                ctx.globalAlpha = isActive ? 1 : state.guideOpacity;
                ctx.fillStyle = isActive ? '#ffffff' : state.guideColor;
                ctx.fillText(label, guideArea.left + 20, labelY - 3);
            } else {
                var labelX = originX + guide.position * zoom;
                var lineHalfW = (isActive ? 3 : 2) / 2;
                var bgX = labelX + lineHalfW + 2;
                // 垂直线：数字显示在线右侧，背景块从线边缘开始
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = '#1e1e1e';
                ctx.fillRect(bgX, guideArea.top + 2, labelW + 6, 14);
                ctx.globalAlpha = isActive ? 1 : state.guideOpacity;
                ctx.fillStyle = isActive ? '#ffffff' : state.guideColor;
                ctx.fillText(label, bgX + 13, guideArea.top + 13);
            }
            ctx.globalAlpha = 1;
            ctx.restore();
        });
    }

    // ============================================================
    // 鼠标拖动对齐线
    // ============================================================
    function findNearbyGuide(mx, my) {
        var rect = getSceneRect();
        if (!rect) return -1;

        var cam = getSceneCamera();
        var zoom = cam ? cam.scale : (state.zoom || 1);
        var xAxis = cam ? cam.xAxis : 0;
        var yAxis = cam ? cam.yAxis : 0;
        var panelLeft = rect.left;
        var originX = panelLeft + xAxis;
        var originY = rect.bottom + yAxis;

        var guideLeft = rect.left + RULER_SIZE;
        var guideTop = rect.top + RULER_SIZE;
        var threshold = 8;

        for (var i = 0; i < state.guides.length; i++) {
            var g = state.guides[i];
            if (g.type === 'h') {
                var gy = originY - g.position * zoom;
                if (Math.abs(my - gy) < threshold && mx >= guideLeft) return i;
            } else {
                var gx = originX + g.position * zoom;
                if (Math.abs(mx - gx) < threshold && my >= guideTop) return i;
            }
        }
        return -1;
    }

    // 用一个透明的 div 来捕获鼠标事件（只在需要时启用 pointer-events）
    var dragLayer = document.createElement('div');
    dragLayer.id = '__design-ruler-drag__';
    dragLayer.style.cssText = [
        'position: fixed',
        'top: 0',
        'left: 0',
        'width: 100%',
        'height: 100%',
        'pointer-events: none',
        'z-index: 9999',
        'cursor: default',
    ].join(';');
    document.body.appendChild(dragLayer);

    // ============================================================
    // 悬浮控制面板
    // ============================================================
    var floatPanel = document.createElement('div');
    floatPanel.id = '__design-ruler-panel__';
    floatPanel.style.cssText = [
        'display: none',
        'align-items: center',
        'gap: 8px',
        'padding: 0 8px',
        'border-left: 1px solid #444',
        'height: 100%',
        'font-size: 12px',
        'color: #ccc',
        'user-select: none',
        'flex-shrink: 0',
    ].join(';');

    floatPanel.innerHTML = [
        '<span style="color:#999;font-size:11px;font-weight:bold;white-space:nowrap;padding:0 4px;">DR</span>',
        // 标尺开关
        '<div style="display:flex;align-items:center;gap:4px;">',
        '  <span style="white-space:nowrap;font-size:12px;color:rgb(189,189,189);">标尺</span>',
        '  <div id="__dr-ruler-toggle__" style="width:28px;height:14px;border-radius:7px;background:#555;cursor:pointer;position:relative;flex-shrink:0;">',
        '    <div id="__dr-ruler-knob__" style="position:absolute;top:2px;left:2px;width:10px;height:10px;border-radius:50%;background:rgb(189,189,189);transition:left 0.15s;"></div>',
        '  </div>',
        '</div>',
        // 对齐线
        '<button id="__dr-clear-guides__" style="background:rgb(65,65,65);border:1px solid #555;color:rgb(189,189,189);border-radius:3px;padding:1px 7px;cursor:pointer;font-size:12px;white-space:nowrap;">清除线</button>',
        // 设计图
        '<button id="__dr-load-image__" style="background:rgb(65,65,65);border:1px solid #555;color:rgb(189,189,189);border-radius:3px;padding:1px 7px;cursor:pointer;font-size:12px;white-space:nowrap;">设计图</button>',
        '<button id="__dr-clear-image__" style="background:rgb(65,65,65);border:1px solid #555;color:rgb(189,189,189);border-radius:3px;padding:1px 7px;cursor:pointer;font-size:12px;white-space:nowrap;">清除图</button>',
        '<input id="__dr-opacity__" type="range" min="0" max="100" value="50" style="width:60px;accent-color:rgb(189,189,189);flex-shrink:0;">',
        '<span id="__dr-opacity-label__" style="color:rgb(189,189,189);font-size:12px;white-space:nowrap;min-width:28px;">50%</span>',
        // 重载插件
        '<button id="__dr-reload__" style="background:rgb(65,65,65);border:1px solid #555;color:rgb(189,189,189);border-radius:3px;padding:1px 7px;cursor:pointer;font-size:12px;white-space:nowrap;">重载</button>',
        '<input id="__dr-file-input__" type="file" accept="image/*" style="display:none;">',
    ].join('');

    // 等编辑器 header 加载完再插入
    function tryInsertPanel() {
        var header = document.querySelector('HEADER');
        if (!header) return false;
        header.appendChild(floatPanel);
        floatPanel.style.display = 'flex';
        return true;
    }

    var _panelShowTimer = setInterval(function () {
        if (tryInsertPanel()) {
            clearInterval(_panelShowTimer);
            updateRulerToggle();
        }
    }, 500);

    // 标尺开关
    function updateRulerToggle() {
        var toggle = document.getElementById('__dr-ruler-toggle__');
        var knob = document.getElementById('__dr-ruler-knob__');
        if (!toggle || !knob) return;
        var on = state.visible;
        toggle.style.background = on ? '#4af' : '#555';
        knob.style.left = on ? '16px' : '2px';
        adjustSceneUI();
    }
    floatPanel.addEventListener('click', function (e) {
        var t = e.target;
        var toggle = document.getElementById('__dr-ruler-toggle__');
        var knob = document.getElementById('__dr-ruler-knob__');
        if (toggle && (t === toggle || toggle.contains(t))) {
            state.visible = !state.visible;
            overlay.style.display = state.visible ? 'block' : 'none';
            updateRulerToggle();
            draw();
            adjustSceneUI();
            // 通知主进程保存状态
            Editor.Ipc.sendToMain('cocos-design-ruler:visible-changed', state.visible);
        } else if (t.id === '__dr-clear-guides__') {
            state.guides = [];
            draw();
        } else if (t.id === '__dr-load-image__') {
            document.getElementById('__dr-file-input__').click();
        } else if (t.id === '__dr-clear-image__') {
            Editor.Ipc.sendToMain('cocos-design-ruler:clear-design-image');
        } else if (t.id === '__dr-reload__') {
            window.__designRulerInjected = false;
            try {
                if (typeof Editor !== 'undefined' && Editor.Ipc && Editor.Ipc.sendToMain) {
                    Editor.log('[design-ruler] reload clicked - sending reinject via Editor.Ipc');
                    Editor.Ipc.sendToMain('cocos-design-ruler:reinject');
                } else if (electron && electron.ipcRenderer) {
                    electron.ipcRenderer.send('editor:send2main', 'cocos-design-ruler:reinject');
                }
            } catch (e) {
                console.error('[design-ruler] reinject error:', e);
            }
        }
    });
    floatPanel.querySelector('#__dr-file-input__').addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        var filePath = file.path || '';
        var reader = new FileReader();
        reader.onload = function (ev) {
            Editor.Ipc.sendToMain('cocos-design-ruler:set-design-image', ev.target.result, filePath);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    });
    floatPanel.querySelector('#__dr-opacity__').addEventListener('input', function () {
        var val = parseFloat(this.value) / 100;
        document.getElementById('__dr-opacity-label__').textContent = this.value + '%';
        Editor.Ipc.sendToMain('cocos-design-ruler:set-design-opacity', val);
    });

    // 全局鼠标移动检测（在 capture 阶段，不影响编辑器）
    document.addEventListener('mousemove', function (e) {
        if (_dragging >= 0) return;

        var rect = getSceneRect();
        if (!rect) return;

        var mx = e.clientX;
        var my = e.clientY;

        // 检查是否在对齐线附近
        var idx = findNearbyGuide(mx, my);
        if (idx >= 0) {
            var g = state.guides[idx];
            overlay.style.cursor = g.type === 'h' ? 'ns-resize' : 'ew-resize';
            _mouseInGuideZone = true;
            return;
        }

        // 检查是否在标尺区域
        var inTopRuler = mx >= rect.left + RULER_SIZE && mx <= rect.left + rect.width &&
            my >= rect.top && my < rect.top + RULER_SIZE;
        var inLeftRuler = mx >= rect.left && mx < rect.left + RULER_SIZE &&
            my >= rect.top + RULER_SIZE && my <= rect.top + rect.height;

        if (inTopRuler) {
            overlay.style.cursor = 'ew-resize';
            _mouseInGuideZone = true;
        } else if (inLeftRuler) {
            overlay.style.cursor = 'ns-resize';
            _mouseInGuideZone = true;
        } else {
            overlay.style.cursor = 'default';
            _mouseInGuideZone = false;
        }
    }, true);

    // 鼠标按下：拖动已有对齐线 或 从标尺拖出新对齐线
    document.addEventListener('mousedown', function (e) {
        if (!state.visible || !state.guidesEnabled) return;

        var rect = getSceneRect();
        if (!rect) return;

        var mx = e.clientX;
        var my = e.clientY;

        // 先检查是否点击了已有对齐线
        var idx = findNearbyGuide(mx, my);
        if (idx >= 0) {
            var g = state.guides[idx];
            var cam = getSceneCamera();
            var zoom = cam ? cam.scale : (state.zoom || 1);
            var xAxis = cam ? cam.xAxis : 0;
            var yAxis = cam ? cam.yAxis : 0;
            var originX = rect.left + xAxis;
            var originY = rect.bottom + yAxis;
            // 记录点击位置与对齐线的偏移，避免拖动时跳动
            if (g.type === 'h') {
                _dragOffset = my - (originY - g.position * zoom);
            } else {
                _dragOffset = mx - (originX + g.position * zoom);
            }
            _dragging = idx;
            _dragType = g.type;
            _creatingFromRuler = false;
            dragLayer.style.pointerEvents = 'auto';
            dragLayer.style.cursor = _dragType === 'h' ? 'ns-resize' : 'ew-resize';
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // 检查是否点击了顶部标尺区域（拖出水平线）
        var inTopRuler = mx >= rect.left + RULER_SIZE && mx <= rect.left + rect.width &&
            my >= rect.top && my < rect.top + RULER_SIZE;
        // 检查是否点击了左侧标尺区域（拖出垂直线）
        var inLeftRuler = mx >= rect.left && mx < rect.left + RULER_SIZE &&
            my >= rect.top + RULER_SIZE && my <= rect.top + rect.height;

        if (inTopRuler) {
            // 从顶部标尺拖出水平线，计算场景坐标
            var cam = getSceneCamera();
            var zoom = cam ? cam.scale : (state.zoom || 1);
            var yAxis = cam ? cam.yAxis : 0;
            var originY = rect.bottom + yAxis;
            var sceneY = Math.round((originY - my) / zoom);
            state.guides.push({ type: 'h', position: sceneY, dashed: state.defaultDashed });
            _dragging = state.guides.length - 1;
            _dragType = 'h';
            _creatingFromRuler = true;
            dragLayer.style.pointerEvents = 'auto';
            dragLayer.style.cursor = 'ns-resize';
            draw();
            e.preventDefault();
            e.stopPropagation();
        } else if (inLeftRuler) {
            // 从左侧标尺拖出垂直线，计算场景坐标
            var cam = getSceneCamera();
            var zoom = cam ? cam.scale : (state.zoom || 1);
            var xAxis = cam ? cam.xAxis : 0;
            var panelLeft = rect.left;
            var originX = panelLeft + xAxis;
            var sceneX = Math.round((mx - originX) / zoom);
            state.guides.push({ type: 'v', position: sceneX, dashed: state.defaultDashed });
            _dragging = state.guides.length - 1;
            _dragType = 'v';
            _creatingFromRuler = true;
            dragLayer.style.pointerEvents = 'auto';
            dragLayer.style.cursor = 'ew-resize';
            draw();
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    // 拖动中
    dragLayer.addEventListener('mousemove', function (e) {
        if (_dragging < 0) return;

        var rect = getSceneRect();
        if (!rect) return;

        var cam = getSceneCamera();
        var zoom = cam ? cam.scale : (state.zoom || 1);
        var xAxis = cam ? cam.xAxis : 0;
        var yAxis = cam ? cam.yAxis : 0;
        var originX = rect.left + xAxis;
        var originY = rect.bottom + yAxis;

        if (_dragType === 'h') {
            var sceneY = Math.round((originY - (e.clientY - _dragOffset)) / zoom);
            state.guides[_dragging].position = sceneY;
        } else {
            var sceneX = Math.round(((e.clientX - _dragOffset) - originX) / zoom);
            state.guides[_dragging].position = sceneX;
        }
        draw();
    });

    // 拖动结束
    function endDrag() {
        if (_dragging >= 0) {
            var guide = state.guides[_dragging];
            if (_creatingFromRuler) {
                Editor.log('[design-ruler] 从标尺拖出对齐线:', guide.type, guide.position + 'px');
            } else {
                Editor.log('[design-ruler] 对齐线移动到:', guide.type, guide.position + 'px');
            }
            // 通知主进程更新
            Editor.Ipc.sendToMain('cocos-design-ruler:guide-moved', JSON.stringify(state.guides));
        }
        _dragging = -1;
        _creatingFromRuler = false;
        dragLayer.style.pointerEvents = 'none';
        dragLayer.style.cursor = 'default';
    }

    dragLayer.addEventListener('mouseup', endDrag);
    dragLayer.addEventListener('mouseleave', endDrag);

    // ============================================================
    // IPC 监听
    // ============================================================
    function onMessage(channel, handler) {
        electron.ipcRenderer.on(channel, handler);
    }

    onMessage('design-ruler:update-state', function (event, newState) {
        if (newState.guideColor) state.guideColor = newState.guideColor;
        if (newState.guideOpacity !== undefined) state.guideOpacity = newState.guideOpacity;
        if (newState.guidesEnabled !== undefined) state.guidesEnabled = newState.guidesEnabled;
        if (newState.visible !== undefined) {
            state.visible = newState.visible;
            overlay.style.display = state.visible ? 'block' : 'none';
            updateRulerToggle();
            adjustSceneUI();
        }
        if (newState.guides) state.guides = newState.guides;
        draw();
    });

    onMessage('design-ruler:add-guide', function (event, guide) {
        state.guides.push(guide);
        draw();
    });

    onMessage('design-ruler:remove-guide', function (event, index) {
        if (index >= 0 && index < state.guides.length) {
            state.guides.splice(index, 1);
        }
        draw();
    });

    onMessage('design-ruler:clear-guides', function () {
        state.guides = [];
        draw();
    });

    onMessage('design-ruler:set-guide-color', function (event, color) {
        state.guideColor = color;
        draw();
    });

    onMessage('design-ruler:set-guide-opacity', function (event, opacity) {
        state.guideOpacity = opacity;
        draw();
    });

    onMessage('design-ruler:set-guides-enabled', function (event, enabled) {
        state.guidesEnabled = enabled;
        draw();
    });

    onMessage('design-ruler:set-default-dashed', function (event, dashed) {
        state.defaultDashed = dashed;
        draw();
    });

    onMessage('design-ruler:show', function () {
        state.visible = true;
        overlay.style.display = 'block';
        draw();
    });

    onMessage('design-ruler:toggle-visible', function () {
        state.visible = !state.visible;
        overlay.style.display = state.visible ? 'block' : 'none';
        draw();
        adjustSceneUI();
    });

    onMessage('design-ruler:cleanup', function () {
        var el = document.getElementById('__design-ruler-overlay__');
        if (el) el.parentNode.removeChild(el);
        var dl = document.getElementById('__design-ruler-drag__');
        if (dl) dl.parentNode.removeChild(dl);
        state.visible = false;
        adjustSceneUI();
        window.__designRulerInjected = false;
    });

    // ============================================================
    // 窗口 resize / 定时重绘
    // ============================================================
    window.addEventListener('resize', function () {
        _cachedRect = null;
        draw();
    });

    setInterval(function () {
        if (state.visible) {
            _cachedRect = null;
            draw();
        }
    }, 100);

    draw();
    console.log('[design-ruler] overlay 已注入');

    function showToast(msg) {
        var toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = [
            'position:fixed', 'bottom:40px', 'left:50%',
            'transform:translateX(-50%)',
            'background:rgba(40,40,40,0.9)', 'color:#fff',
            'padding:6px 16px', 'border-radius:4px',
            'font-size:13px', 'z-index:99999',
            'pointer-events:none',
            'opacity:1', 'transition:opacity 0.4s',
        ].join(';');
        document.body.appendChild(toast);
        setTimeout(function () { toast.style.opacity = '0'; }, 1500);
        setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 2000);
    }

    setTimeout(function () { if (_isReload) showToast('design-ruler 重载成功'); }, 600);
})();
