'use strict';

// ============================================================
// design-ruler scene-script
// 只负责在场景 Canvas 层显示设计图
// ============================================================

var CONTAINER_NAME = '__DESIGN_RULER_IMAGE_ROOT__';
var IMAGE_NODE_NAME = '__DESIGN_IMAGE_SPRITE__';

var _container = null;
var _imageNode = null;

var _designImageData = null;
var _designOpacity = 0.5;

function getRefNode() {
    var canvasNode = cc.find('Canvas');
    if (canvasNode) return canvasNode;

    // 预制体模式
    var scene = cc.director.getScene();
    if (scene && scene.children) {
        for (var i = 0; i < scene.children.length; i++) {
            var child = scene.children[i];
            if (child.name !== CONTAINER_NAME && cc.isValid(child)) {
                return child;
            }
        }
    }
    return scene;
}

function findCanvas() {
    // 先用 cc.find 快速查找
    var canvasNode = cc.find('Canvas');
    if (canvasNode) return canvasNode;
    // 预制体模式下 Canvas 可能不在根节点，遍历查找 Canvas 组件
    var scene = cc.director.getScene();
    if (scene) {
        var canvasComp = scene.getComponentInChildren(cc.Canvas);
        if (canvasComp) return canvasComp.node;
    }
    return null;
}

function ensureContainer() {
    if (_container && cc.isValid(_container)) return _container;

    var scene = cc.director.getScene();
    if (!scene) return null;

    var existing = scene.getChildByName(CONTAINER_NAME);
    if (existing && cc.isValid(existing)) {
        _container = existing;
        _imageNode = null;
    } else {
        _container = new cc.Node(CONTAINER_NAME);
        _container._objFlags |= cc.Object.Flags.DontSave | cc.Object.Flags.HideInHierarchy;
        var canvasNode = findCanvas();
        _container.parent = canvasNode || scene;
        _container.setPosition(0, 0);
        _container.zIndex = cc.macro.MIN_ZINDEX;
    }

    ensureImageNode();
    return _container;
}

function ensureImageNode() {
    if (_imageNode && cc.isValid(_imageNode)) return;

    var existing = _container.getChildByName(IMAGE_NODE_NAME);
    if (existing && cc.isValid(existing)) {
        _imageNode = existing;
        return;
    }

    _imageNode = new cc.Node(IMAGE_NODE_NAME);
    _imageNode._objFlags |= cc.Object.Flags.DontSave | cc.Object.Flags.HideInHierarchy;
    _imageNode.parent = _container;
}

function updateDesignImage() {
    if (!ensureContainer()) return;
    if (!_imageNode || !cc.isValid(_imageNode)) return;

    _imageNode.opacity = Math.round(_designOpacity * 255);

    if (!_designImageData) {
        var sprite = _imageNode.getComponent(cc.Sprite);
        if (sprite) {
            sprite.spriteFrame = null;
        }
        return;
    }

    var img = new Image();
    img.onload = function () {
        if (!_imageNode || !cc.isValid(_imageNode)) return;

        var texture = new cc.Texture2D();
        texture.initWithElement(img);
        texture.handleLoadedTexture();

        var spriteFrame = new cc.SpriteFrame(texture);
        var sprite = _imageNode.getComponent(cc.Sprite);
        if (!sprite) {
            sprite = _imageNode.addComponent(cc.Sprite);
            sprite.trim = false;
        }
        sprite.spriteFrame = spriteFrame;
        sprite.sizeMode = cc.Sprite.SizeMode.RAW;
        _imageNode.anchorX = 0.5;
        _imageNode.anchorY = 0.5;

        // 计算图片居中位置
        var canvasNode = findCanvas();
        if (canvasNode) {
            var size = canvasNode.getContentSize();
            var anchor = canvasNode.getAnchorPoint();
            var localCenter = cc.v2(
                size.width * (0.5 - anchor.x),
                size.height * (0.5 - anchor.y)
            );
            var worldCenter = canvasNode.convertToWorldSpaceAR(localCenter);
            _imageNode.setPosition(_container.convertToNodeSpaceAR(worldCenter));
        } else {
            // 预制体模式：从项目设置读取设计分辨率
            try {
                var fs = require('fs');
                var path = require('path');
                var json = JSON.parse(fs.readFileSync(path.join(Editor.projectPath, 'settings', 'project.json'), 'utf-8'));
                var w = json['design-resolution-width'] || 750;
                var h = json['design-resolution-height'] || 1334;
                _imageNode.setPosition(w / 2, h / 2);
            } catch (e) {
                _imageNode.setPosition(375, 667);
            }
        }

        _imageNode.opacity = Math.round(_designOpacity * 255);
        // Editor.log('[design-ruler] 设计图已加载到场景');
    };
    img.src = _designImageData;
}

function cleanup() {
    if (_container && cc.isValid(_container)) {
        _container.destroy();
    }
    _container = null;
    _imageNode = null;
}

//清空设计图
function clearDesignImage() {
    _designImageData = null;
    updateDesignImage();
}

// ============================================================
// 导出 IPC 方法
// ============================================================

module.exports = {
    'init': function (event) {
        ensureContainer();
        if (_designImageData) updateDesignImage();
        if (event && event.reply) event.reply(null);
    },

    'set-design-image': function (event, base64) {
        _designImageData = base64;
        updateDesignImage();
        if (event && event.reply) event.reply(null);
    },

    'clear-design-image': function (event) {
        _designImageData = null;
        updateDesignImage();
        if (event && event.reply) event.reply(null);
    },

    'set-design-opacity': function (event, opacity) {
        _designOpacity = opacity;
        if (_imageNode && cc.isValid(_imageNode)) {
            _imageNode.opacity = Math.round(_designOpacity * 255);
        }
        if (event && event.reply) event.reply(null);
    },

    //打开场景
    'open-scene': function (event) {

        let scene = cc.director.getScene();
        let sceneUuid = scene?.uuid || '';

        Editor.log(`[scene-walker]--->open-scene sceneUuid:${sceneUuid}`);

        //先使用reply回复uuid给renderer，renderer再发回ready通知main，main再调用loadSceneByUuid加载场景
        if (event && event.reply) {
            event.reply(null, sceneUuid);
        } else {
            Editor.Ipc.sendToMain('design-ruler:scene-ready', sceneUuid);
        }

        //https://docs.cocos.com/creator/2.2/manual/zh/extension/asset-management.html
        //_Scene 需要再场景脚本中调用!!!
        _Scene && _Scene.loadSceneByUuid(sceneUuid, function (error) {
            Editor.log(`[scene-walker]--->_Scene.loadSceneByUuid sceneUuid:${sceneUuid}`);
            if (error) {
                return;
            }
            Editor.log(`[scene-walker]===>加载场景完成 uuid:${sceneUuid} `);
        });
    },

    'cleanup': function (event) {
        cleanup();
        if (event && event.reply) event.reply(null);
    },
};
