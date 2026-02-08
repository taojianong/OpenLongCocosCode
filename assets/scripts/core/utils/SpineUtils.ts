import ResLoad from "./ResLoad";
import Timer from "./Timer";
import Utils from "./Utils";

/**
 * 
 * @author clong 2023.08.21
 */
export default class SpineUtils {

    /**
     * 加载spine动画
     * @param spine 
     * @param spineName 
     * @param bundle 
     * @param defaulAniName 
     * @param loop 
     * @returns 
     */
    public static loadSpine(spine: sp.Skeleton, path: string, bundle: string = 'net_spine', defaulAniName: string = 'animation', loop = true, skin = 'default') {

        return new Promise<void>((resolve, reject) => {
            if (!path) {
                spine.skeletonData = null;
                resolve();
                return;
            }
            ResLoad.loadRes(path, bundle, sp.SkeletonData, (err, ret: sp.SkeletonData) => {
                if (err) {
                    if (cc.isValid(spine))
                        spine.skeletonData = null;
                    resolve();
                    return;
                }
                if (ret) {
                    if (cc.isValid(spine.node)) {
                        spine.skeletonData = ret;
                        if (SpineUtils.hasSkin(spine, skin)) {
                            spine.setSkin(skin);
                        }
                        if (defaulAniName != '') {
                            SpineUtils.playSpineAni(spine, defaulAniName, loop, 1);
                        }
                    }
                    resolve();
                }
            })
        })
    }

    public static hasSkin(spine: sp.Skeleton, skinName: string): boolean {

        return spine && spine['_skeleton'] && spine['_skeleton'].data['findSkin'](skinName) != null;
    }

    public static setSkin(spine: sp.Skeleton, skinName: string) {
        if (!this.hasSkin(spine, skinName)) return;
        spine.setSkin(skinName);
    }

    public static getSkins(spine: sp.Skeleton): string[] {

        const skins = spine && spine['_skeleton'] && spine['_skeleton'].data.skins;
        const out = [];
        if (skins) {
            for (let i = 0; i < skins.length; i++) {
                out.push(skins[i].name);
            }
        }
        return out;
    }

    /**
     * 播放spine动画
     * @param spine 
     * @param name 
     * @param loop 
     * @param scale 
     * @param cb 
     * @returns 
     */
    public static playSpineAni(spine: sp.Skeleton, name: string, loop: boolean, scale: number = 1) {

        const lf = this;
        return new Promise<void>((resolve, reject) => {
            if (!name) {
                resolve();
                return;
            }
            if (!spine || !spine.findAnimation(name)) {
                console.log(`%c[SpineUtils]------>缺失动画${name}`, 'color:orange');
                Timer.timer.frameOnce(1, lf, () => {
                    resolve();
                });
                return;
            }
            spine.timeScale = scale;
            spine.setAnimation(0, name, loop);
            let e = lf.getSpineAnimation(spine, name);//clong 2023.8.15
            if (!loop) {
                if (e && e.duration) {
                    Timer.timer.once(e.duration / scale, lf, () => {
                        resolve();
                    });
                } else {
                    Timer.timer.frameOnce(1, lf, () => {
                        resolve();
                    });
                }
            }
        })
    }

    /**
     * 获取spine的动画
     * @param name 
     * @returns 
     */
    public static getSpineAnimation(spine: sp.Skeleton, name: string): sp.spine.Animation {
        return spine && spine.findAnimation(name);
    }

    /**
     * 获取 spine 动作列表
     * @param spine 
     * @returns 
     */
    public static getActions(spine: sp.Skeleton): any {//string[]

        const animations = spine && spine.skeletonData && spine.skeletonData.skeletonJson && spine.skeletonData.skeletonJson.animations;
        const out = Object.keys(animations || {});
        return out;
    }

    /**
    * @param skinName 要替换的部件皮肤名称
    * @param slotName 要替换的部件的插槽名称
    * @param targetAttaName  Spine中皮肤占位符的名字
     */
    public static changeSlot(spine: sp.Skeleton, skinName: string, slotName: string, targetAttaName: string) {
        if (skinName == null) return;
        //查找局部皮肤
        let skeletonData = spine.skeletonData.getRuntimeData();
        let targetSkin: sp.spine.Skin = skeletonData.findSkin(skinName);
        if (!targetSkin) return;

        //查找局部皮肤下的插槽与附件
        let targetSkinSlotIndex = skeletonData.findSlotIndex(slotName);
        let atta = targetSkin.getAttachment(targetSkinSlotIndex, targetAttaName);
        if (!atta && targetAttaName != "") {
            // console.log("皮肤未找到", skinName, targetAttaName)
        }

        //查找全身皮肤下的插槽
        let curSlot = spine.findSlot(slotName);

        //替换全身皮肤插槽的附件 
        curSlot?.setAttachment(atta);
    }

    //#region 骨骼动画 
    public static PlaySkeletonLoad(node: cc.Node, node_path: string, aniName: string, res_path: string, bundle: string, finish: Function = null, loop: boolean = false, layer: number = 0, skin: string = null, timeScale: number = 1, onStart: Function = null) {
        if (!node) {
            console.error("node is null");
            finish && finish(null);
            return;
        }
        node.active = true;
        let _node = Utils.getChildByPath(node, node_path);
        let self = this;
        if (_node) {
            _node.active = true;
            let _skeleton = _node.getComponent(sp.Skeleton);
            if (_skeleton) {
                ResLoad.loadRes(res_path, bundle, sp.SkeletonData, (err, res: sp.SkeletonData) => {
                    if (err != null || res == null) {
                        console.error('load skeleton error', res_path, bundle, err);
                        onStart && onStart(false);
                        finish && finish(null);
                        return;
                    }
                    if (cc.isValid(_skeleton)) {
                        _skeleton.skeletonData = res;
                        self.PlaySkeleton(_skeleton, aniName, finish, loop, layer, skin);
                        onStart && onStart(true);
                    }
                });
            }
        }
    }
    public static PlaySkeleton(_skeleton: sp.Skeleton, aniName: string, finish: Function = null, loop: boolean = false, layer: number = 0, skin: string = null) {
        return new Promise<void>((resolve) => {
            if (_skeleton && _skeleton.node) {
                if (_skeleton) {
                    skin && _skeleton.setSkin(skin);
                    _skeleton.setAnimation(layer, aniName, loop);

                }
                if (loop) {
                    resolve();
                }
                else {
                    _skeleton.setCompleteListener(() => {
                        finish && finish(_skeleton.node);
                        _skeleton.setCompleteListener(null);
                        resolve();
                    });
                }
            }
            else {
                resolve();
            }
        });
    }
    public static PlaySkeletonNode(node: cc.Node, path: string, aniName: string, finish: Function = null, loop: boolean = false, layer: number = 0) {
        if (!node) {
            console.error("node is null");
            finish && finish(false);
            return;
        }
        node.active = true;
        let _node = Utils.getChildByPath(node, path);
        if (_node) {
            _node.active = true;
            let _skeleton = _node.getComponent(sp.Skeleton);
            if (_skeleton) {
                this.PlaySkeleton(_skeleton, aniName, finish, loop, layer);
                return
            }
        }
        finish && finish(false);
    }
    public static async PlaySkeletons(node: cc.Node, path: string, aniNames: string[], finish: Function = null, loops: boolean[] = [], layer: number = 0) {
        for (let index = 0; index < aniNames.length; index++) {
            await SpineUtils.PlaySkeletonNode(node, path, aniNames[index], null, loops[index] || false, layer);
        }
        finish && finish();


    }
    //#endregion


    /**
     * 替换spine武器
     * @param spine 
     * @param slotName 
     * @param attachmentName 
     * @param texture 
     * @param scale 缩放比例，默认1.0
     */
    static changeSpineWeaponTexture(spine: sp.Skeleton, slotName: string, attachmentName: string,
        texture: cc.Texture2D, region: sp.spine.TextureRegion, scale: number = 0.5) {

        // 平台兼容性处理
        if (cc.sys.isNative) {
            cc.warn('[SpineUtils] 原生平台应使用 replaceWeaponTexture 方法');
            this.replaceWeaponTexture(spine, slotName, attachmentName, texture, scale)
            return false;
        } else if (cc.sys.platform === cc.sys.WECHAT_GAME || cc.sys.platform === cc.sys.BYTEDANCE_GAME) {
            // 微信小游戏和抖音小游戏平台
            return this.changeSpineWeaponTextureMiniGame(spine, slotName, attachmentName, texture, scale);
        } else {
            // Web平台和其他平台
            if (cc.isValid(spine)) {

                // 武器挂件应该用这种方式
                let weaponSlot = spine.getAttachment(slotName, attachmentName);
                if (weaponSlot) {
                    let region = this.CreateRegion(texture, spine);
                    weaponSlot.setRegion?.(region);

                    // 设置 attachment 的显示尺寸（缩放）
                    weaponSlot.width = texture.width * scale;
                    weaponSlot.height = texture.height * scale;

                    weaponSlot.updateOffset?.();
                    return true;
                } else {

                    // 创建武器附件
                    const weaponSlot: sp.spine.Slot = spine.findSlot(slotName);
                    const weaponAttachment = weaponSlot?.getAttachment().copy() as sp.spine.RegionAttachment;
                    weaponAttachment.setRegion?.(region);//安卓端无setRegion方法
                    weaponSlot?.setAttachment(weaponAttachment);
                }
            }
            return false;
        }
    }

    /**
     * 安卓端替换武器
     * @param slotName 
     * @param attachmentName 
     * @param texture 
     */
    static replaceWeaponTexture(spine: sp.Skeleton, slotName: string, attachmentName: string, texture: cc.Texture2D, scale = 1) {

        if (cc.sys.isNative) {
            // 直接传递 renderer::Texture 原生指针和尺寸信息
            // 新API: updateRegion(skeleton, slotName, attachmentName, nativeTexture, width, height, scale)
            // @ts-ignore
            const nativeTexture = texture.getImpl();
            const width = texture.width;
            const height = texture.height;

            cc.log("[App] nativeTexture:", nativeTexture, "width:", width, "height:", height);

            // @ts-ignore
            const nativeSkeleton = spine._nativeSkeleton;
            cc.log("[App] nativeSkeleton:", nativeSkeleton);

            // @ts-ignore
            if (nativeSkeleton && sp.spine.updateRegion) {
                try {
                    // @ts-ignore
                    const result = sp.spine.updateRegion(
                        nativeSkeleton,
                        slotName,
                        attachmentName,
                        nativeTexture,
                        width,
                        height,
                        scale
                    );
                    cc.log("[App] updateRegion result:", result);
                } catch (e) {
                    cc.error("[App] updateRegion error:", e);
                }
            } else {
                cc.warn("[App] _nativeSkeleton or updateRegion not found");
            }
        }
    }

    /**
     * 专门为小游戏平台优化的武器贴图更换方法
     */
    private static changeSpineWeaponTextureMiniGame(spine: sp.Skeleton, slotName: string, attachmentName: string,
        texture: cc.Texture2D, scale: number = 0.5): boolean {

        try {
            cc.log(`[SpineUtils] 小游戏平台更换武器: ${slotName}.${attachmentName}`);

            // 检查基础条件
            if (!cc.isValid(spine) || !texture) {
                cc.error('[SpineUtils] 参数无效');
                return false;
            }

            // 检查 Spine API 可用性
            if (!sp.spine || !sp.spine.TextureAtlasPage || !sp.spine.TextureAtlasRegion) {
                cc.warn('[SpineUtils] 小游戏平台 Spine API 不完整，尝试兼容模式');
                return this.changeSpineWeaponTextureCompatible(spine, slotName, attachmentName, texture, scale);
            }

            // 获取 attachment
            let weaponSlot = spine.getAttachment(slotName, attachmentName);
            if (!weaponSlot) {
                cc.warn(`[SpineUtils] 找不到 attachment: ${slotName}.${attachmentName}`);
                return false;
            }

            // 创建兼容的 region
            let region = this.CreateRegionCompatible(texture, spine);
            if (!region) {
                cc.warn('[SpineUtils] 创建 region 失败');
                return false;
            }

            // 应用新的贴图
            if (weaponSlot.setRegion) {
                weaponSlot.setRegion(region);
            }

            // 设置尺寸和更新
            weaponSlot.width = texture.width * scale;
            weaponSlot.height = texture.height * scale;

            if (weaponSlot.updateOffset) {
                weaponSlot.updateOffset();
            }

            cc.log('[SpineUtils] 小游戏平台武器更换成功');
            return true;

        } catch (error) {
            cc.error('[SpineUtils] 小游戏平台更换武器异常:', error);
            return false;
        }
    }

    /**
     * 兼容模式的武器贴图更换（当标准 API 不可用时）
     */
    private static changeSpineWeaponTextureCompatible(spine: sp.Skeleton, slotName: string, attachmentName: string,
        texture: cc.Texture2D, scale: number = 0.5): boolean {

        try {
            cc.log('[SpineUtils] 使用兼容模式更换武器');

            // 简化处理：直接修改 attachment 的属性
            let weaponSlot = spine.getAttachment(slotName, attachmentName);
            if (!weaponSlot) {
                return false;
            }

            // 尝试直接设置纹理相关属性
            // 注意：这依赖于具体的 Spine 运行时实现
            if ('rendererObject' in weaponSlot) {
                // @ts-ignore
                weaponSlot.rendererObject = texture;
            }

            // 设置基本属性
            weaponSlot.width = texture.width * scale;
            weaponSlot.height = texture.height * scale;

            return true;
        } catch (error) {
            cc.error('[SpineUtils] 兼容模式更换武器失败:', error);
            return false;
        }
    }

    public static CreateRegion(texture, spine) {
        let SkeletonTextureCls = sp["SkeletonTexture"];
        let skeletonTexture = new SkeletonTextureCls()
        skeletonTexture.setRealTexture(texture)

        let page = new sp.spine.TextureAtlasPage()
        page.name = texture.name;
        page.uWrap = sp.spine.TextureWrap.ClampToEdge
        page.vWrap = sp.spine.TextureWrap.ClampToEdge
        page.texture = skeletonTexture;
        page.texture.setWraps(page.uWrap, page.vWrap)
        page.width = texture.width;
        page.height = texture.height;

        let region = new sp.spine.TextureAtlasRegion()
        region.page = page
        region.width = texture.width
        region.height = texture.height
        region.originalWidth = texture.width
        region.originalHeight = texture.height

        region.rotate = false;
        region.u = 0
        region.v = 0
        region.u2 = 1
        region.v2 = 1
        region.texture = skeletonTexture;
        return region
    }

    /**
     * 为小游戏平台创建兼容的 Region（简化版本）
     */
    public static CreateRegionCompatible(texture: cc.Texture2D, spine: sp.Skeleton) {
        try {
            // 检查必要的 Spine 类是否存在
            if (!sp.spine || !sp.spine.TextureAtlasPage || !sp.spine.TextureAtlasRegion) {
                cc.warn('[SpineUtils] Spine 核心类不可用');
                return null;
            }

            // 尝试创建 SkeletonTexture
            let skeletonTexture: any = null;
            try {
                let SkeletonTextureCls = sp["SkeletonTexture"];
                if (SkeletonTextureCls) {
                    skeletonTexture = new SkeletonTextureCls();
                    skeletonTexture.setRealTexture(texture);
                }
            } catch (e) {
                cc.warn('[SpineUtils] 创建 SkeletonTexture 失败:', e);
                return null;
            }

            // 创建 TextureAtlasPage
            let page = new sp.spine.TextureAtlasPage();
            page.name = texture.name || 'weapon_texture';
            page.uWrap = sp.spine.TextureWrap.ClampToEdge;
            page.vWrap = sp.spine.TextureWrap.ClampToEdge;

            if (skeletonTexture) {
                page.texture = skeletonTexture;
                try {
                    page.texture.setWraps(page.uWrap, page.vWrap);
                } catch (e) {
                    cc.warn('[SpineUtils] 设置纹理包裹模式失败:', e);
                }
            }

            page.width = texture.width;
            page.height = texture.height;

            // 创建 TextureAtlasRegion
            let region = new sp.spine.TextureAtlasRegion();
            region.page = page;
            region.width = texture.width;
            region.height = texture.height;
            region.originalWidth = texture.width;
            region.originalHeight = texture.height;
            region.rotate = false;
            region.u = 0;
            region.v = 0;
            region.u2 = 1;
            region.v2 = 1;

            if (skeletonTexture) {
                region.texture = skeletonTexture;
            }

            return region;
        } catch (error) {
            cc.error('[SpineUtils] CreateRegionCompatible 失败:', error);
            return null;
        }
    }
}