import AtlasUtils from "./core/utils/AtlasUtils";
import ResLoad from "./core/utils/ResLoad";
import { TextureAtlas } from "./core/utils/spine";
import SpineUtils from "./core/utils/SpineUtils";
import Timer from "./core/utils/Timer";

const { ccclass, property, menu } = cc._decorator;
/**
 * 
 * @author clong 2025.12.20
 */
@ccclass
@menu('App/Main')
export default class App extends cc.Component {

    @property(sp.Skeleton)
    goblin: sp.Skeleton = null;

    @property(sp.Skeleton)
    goblingirl: sp.Skeleton = null;

    @property(cc.Button)
    btnChangeWeapon: cc.Button = null;

    // 武器资源列表
    private weaponList: string[] = ['1143401', '1143503', '1143506', '1143509'];
    private currentWeaponIndex: number = 0;

    constructor() {

        super();
    }

    protected start(): void {

        this.goblin.setSkin('goblin');
        this.goblin.setAnimation(0, 'walk', true);

        // 如果没有配置按钮，则动态创建
        if (!this.btnChangeWeapon) {
            this.createWeaponButton();
        } else {
            this.btnChangeWeapon.node.on('click', this.onChangeWeaponClick, this);
        }

        // 官方换肤方式
        // this._skinIdx = 1;
        // this.change();
    }

    /**
     * 动态创建武器切换按钮
     */
    private createWeaponButton(): void {
        // 创建按钮节点
        const btnNode = new cc.Node('BtnChangeWeapon');
        btnNode.parent = this.node;

        // 设置位置（右上角）
        btnNode.setPosition(0, 550);
        btnNode.setContentSize(150, 50);

        // 使用纯色背景 (使用 cc.color() 函数，兼容 JSB 环境)
        const graphics = btnNode.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(80, 80, 80, 200);
        graphics.roundRect(-75, -25, 150, 50, 8);
        graphics.fill();

        // 添加文字
        const labelNode = new cc.Node('Label');
        labelNode.parent = btnNode;
        const label = labelNode.addComponent(cc.Label);
        label.string = '切换武器';
        label.fontSize = 24;
        label.lineHeight = 30;

        // 添加按钮组件
        const button = btnNode.addComponent(cc.Button);
        button.transition = cc.Button.Transition.SCALE;
        button.zoomScale = 0.9;

        // 绑定点击事件
        btnNode.on('click', this.onChangeWeaponClick, this);

        this.btnChangeWeapon = button;
        cc.log('[App] 武器切换按钮已创建');
    }

    /**
     * 武器切换按钮点击事件
     */
    private onChangeWeaponClick(): void {
        // 切换到下一个武器
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weaponList.length;
        const weaponId = this.weaponList[this.currentWeaponIndex];

        cc.log(`[App] 切换武器: ${weaponId} (${this.currentWeaponIndex + 1}/${this.weaponList.length})`);

        this.loadAndApplyWeapon(weaponId);
    }

    /**
     * 加载并应用武器纹理
     * 注意: 只支持 RegionAttachment 挂件!!! 所以制作spine时对应武器挂件必须是 RegionAttachment
     */
    private loadAndApplyWeapon(weaponId: string): void {

        this.goblin.setSkin('goblin');
        this.goblin.setAnimation(0, 'walk', true);

        //替换盾牌 RegionAttachment
        const slotName = 'right-hand-item2';
        const attachmentName = 'shield';

        //替换匕首 挂件不是 RegionAttachment  xxxxxx
        // const slotName = 'right-hand-item';
        // const attachmentName = 'dagger';

        // ResLoad.loadRes(`weapon/${weaponId}`, 'res', cc.Texture2D, (e, texture: cc.Texture2D) => {
        AtlasUtils.loadImage(`weapon/${weaponId}`, 'res').then((atlas: TextureAtlas) => {
            if (!atlas) {
                cc.error(`[App] 加载武器失败: ${weaponId}`, atlas);
                return;
            }

            const region = atlas.findRegion(weaponId);

            const texture: cc.Texture2D = atlas['texture'];
            // cc.log(`[App] 武器加载成功: ${weaponId}, 尺寸: ${texture.width}x${texture.height}`);

            SpineUtils.changeSpineWeaponTexture(this.goblin, slotName, attachmentName, texture, region);
        });
    }

    private changeAtlasWeapon() {

        const lf = this;
        AtlasUtils.loadImage('images/item_9', 'res').then((atlas: TextureAtlas) => {
            if (!atlas) {
                return;
            }

            if (cc.sys.isNative) {
                // 直接传递 renderer::Texture 原生指针和尺寸信息
                const texture: cc.Texture2D = atlas['texture'];
                // @ts-ignore
                const nativeTexture = texture.getImpl();
                const width = texture.width;
                const height = texture.height;

                // @ts-ignore
                const nativeSkeleton = this.goblin._nativeSkeleton;
                // @ts-ignore
                if (nativeSkeleton && sp.spine.updateRegion) {
                    // 新API: updateRegion(skeleton, slotName, attachmentName, nativeTexture, width, height, scale)
                    // @ts-ignore
                    const result = sp.spine.updateRegion(
                        nativeSkeleton,
                        "right-hand-item2",  // slotName
                        "right-hand-item2",  // attachmentName (通常与slotName相同)
                        nativeTexture,
                        width,
                        height,
                        0.3  // scale
                    );
                    cc.log("[App] updateRegion result:", result);
                } else {
                    cc.warn("[App] _nativeSkeleton or updateRegion not found");
                }
                // cc.log("native", this.tex2d.width, this.tex2d.height);
            } else {
                const region = atlas.findRegion('item_9');
                // console.log(region);

                const weaponSlot: sp.spine.Slot = lf.goblin.findSlot('right-hand-item2');

                const weaponAttachment = weaponSlot?.getAttachment().copy() as sp.spine.RegionAttachment;
                weaponAttachment.setRegion?.(region);//安卓端无setRegion方法

                weaponSlot?.setAttachment(weaponAttachment);
            }
        })
    }

    private _skinIdx = 0;
    private parts = null;

    //这个是官方两个spine换肤方式
    change() {

        this.parts = ["left-arm", "left-shoulder", "left-hand"];
        this.goblin.setSkin('goblin');
        this.goblin.setAnimation(0, 'walk', true);

        if (this._skinIdx == 0) {
            this._skinIdx = 1;
            for (let i = 0; i < this.parts.length; i++) {
                let goblin = this.goblin.findSlot(this.parts[i]);
                let goblingirl = this.goblingirl.findSlot(this.parts[i]);

                let skeletonData = this.goblingirl.skeletonData.getRuntimeData();
                let targetSkin: sp.spine.Skin = skeletonData.findSkin('goblingirl');
                let targetSkinSlotIndex = skeletonData.findSlotIndex(this.parts[i]);
                let attachment = targetSkin.getAttachment(targetSkinSlotIndex, this.parts[i]); //goblingirl.getAttachment();

                goblin.setAttachment(attachment);
            }

            let skeletonData2 = this.goblin.skeletonData.getRuntimeData();
            const spear = skeletonData2.defaultSkin.attachments[2].spear;
            const dagger = skeletonData2.defaultSkin.attachments[2].dagger;

            const weapon: sp.spine.Slot = this.goblin.findSlot('left-hand-item');
            weapon?.setAttachment(dagger);

            const weapon1: sp.spine.Slot = this.goblin.findSlot('right-hand-item');
            weapon1?.setAttachment(null);

        } else if (this._skinIdx == 1) {
            this._skinIdx = 0;
            this.goblin.setSkin('goblin');
            this.goblin.setSlotsToSetupPose();
        }
    }

    protected update(dt: number): void {
        Timer.timer._update(dt);
    }

    protected onDestroy(): void {


    }
}
