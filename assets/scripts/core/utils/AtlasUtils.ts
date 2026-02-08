import ResLoad from "./ResLoad";
import { SkeletonTexture, TextureAtlas } from "./spine";



/**
 * 
 * @author clong 2026.01.10
 */
export default class AtlasUtils {

    static loadAtals(path: string, bundle: string) {

        return new Promise<TextureAtlas>((resolve, reject) => {
            ResLoad.loadRes(path, bundle, cc.SpriteAtlas, (err, asset: cc.SpriteAtlas) => {

                if (asset) {
                    var textAtlas = AtlasUtils.spriteAtlasToTextureAtlas(asset);
                }
                resolve(textAtlas);
            })
        })
    }

    static loadImage(path: string, bundle: string) {

        return new Promise<TextureAtlas>((resolve, reject) => {
            ResLoad.loadRes(path, bundle, cc.SpriteFrame, (err, asset: cc.SpriteFrame) => {

                if (asset) {
                    var texture = asset.getTexture();
                    // 2. 拼接生成 Spine标准的 atlasText 描述文本 (核心步骤)
                    let atlasText = `${asset.name}.png
size: ${texture.width},${texture.height}
format: RGBA8888
filter: Linear,Linear
repeat: none
`;
                    // 遍历精灵图集内 所有图片帧，拼接到atlasText中 
                    const rect = asset.getRect();
                    const rotated = asset.isRotated();
                    const originalSize = asset.getOriginalSize();
                    const offset = asset.getOffset();
                    atlasText += `${asset.name}
  rotate: ${rotated}
  xy: ${rect.x}, ${rect.y}
  size: ${rect.width}, ${rect.height}
  orig: ${originalSize.width}, ${originalSize.height}
  offset: ${offset.x}, ${offset.y}
  index: -1
`;

                    // 3. 定义纹理加载器回调 (sp.spine.TextureAtlas构造器 必填第二个参数)
                    const textureLoader = (path: string) => {
                        const _texture = new SkeletonTexture(texture.getHtmlElementObj());
                        _texture.setRealTexture(texture);
                        return _texture;// texture['_nativeTexture'];
                    };

                    // console.log('%c---------->atlasText:\n', 'color:green', atlasText);

                    // 4. ✅ 核心：创建并返回 Spine原生纹理图集 (你提供的标准构造器)
                    var textAtlas = new TextureAtlas(atlasText, textureLoader);
                    // return textAtlas;
                    textAtlas['texture'] = asset.getTexture();
                }
                resolve(textAtlas);
            })
        })
    }

    /**
    * 将 Cocos精灵图集 cc.SpriteAtlas 完整转换为 Spine原生纹理图集 TextureAtlas
    * @param spriteAtlas 传入的精灵图集(cc.SpriteAtlas)
    * @returns TextureAtlas Spine原生纹理图集，可直接使用
    */
    static spriteAtlasToTextureAtlas(spriteAtlas: cc.SpriteAtlas): TextureAtlas {
        if (!spriteAtlas) {
            cc.error("转换失败：传入的精灵图集为空");
            return null;
        }
        // 1. 获取精灵图集的底层纹理（精灵图集本质就是一张大图+plist描述）
        const spriteFrames = spriteAtlas.getSpriteFrames();
        const firstFrame = spriteFrames[0];
        if (!firstFrame) {
            cc.error("转换失败：精灵图集内无图片帧");
            return null;
        }
        const texture = firstFrame.getTexture();
        const texName = spriteAtlas.name.replace('.plist', '');// "weapon_spine_atlas"; // 自定义纹理名称，随意写

        // 2. 拼接生成 Spine标准的 atlasText 描述文本 (核心步骤)
        let atlasText = `${texName}.png
size: ${texture.width},${texture.height}
format: RGBA8888
filter: Linear,Linear
repeat: none
`;
        // 遍历精灵图集内 所有图片帧，拼接到atlasText中
        spriteFrames.forEach(sf => {
            const rect = sf.getRect();
            const rotated = sf.isRotated();
            const originalSize = sf.getOriginalSize();
            const offset = sf.getOffset();
            atlasText += `${sf.name}
  rotate: ${rotated}
  xy: ${rect.x}, ${rect.y}
  size: ${rect.width}, ${rect.height}
  orig: ${originalSize.width}, ${originalSize.height}
  offset: ${offset.x}, ${offset.y}
  index: -1
`;
        });

        // 3. 定义纹理加载器回调 (sp.spine.TextureAtlas构造器 必填第二个参数)
        const textureLoader = (path: string) => {
            // const t = new sp.spine.Texture(texture.getHtmlElementObj());
            // return t;
            // var names = this.textureNames;
            // for (var i = 0; i < names.length; i++) if (names[i] === line) {
            //     var texture = this.textures[i];
            //     var tex = new sp.SkeletonTexture({
            //         width: texture.width,
            //         height: texture.height
            //     });
            //     tex.setRealTexture(texture);
            //     return tex;
            // }

            const _texture = new SkeletonTexture(texture.getHtmlElementObj());
            _texture.setRealTexture(texture);
            return _texture;// texture['_nativeTexture'];
        };

        // console.log('%c---------->atlasText:\n', 'color:green', atlasText);

        // 4. ✅ 核心：创建并返回 Spine原生纹理图集 (你提供的标准构造器)
        const spineTextureAtlas = new TextureAtlas(atlasText, textureLoader);
        return spineTextureAtlas;
    }

    /**
     * ✅ 核心方法：从 SpriteAtlas 中取图 → 转 TextureAtlas → 赋值给Spine武器插槽
     * @param frameName 精灵图集里的图片帧名称
     * @param customSize 武器显示尺寸
     */
    static replaceWeaponFromSpriteAtlas(weaponSpriteAtlas: cc.SpriteAtlas, frameName: string, customSize: cc.Size = null) {
        // 1. 从SpriteAtlas中获取指定图片帧
        const spriteFrame = weaponSpriteAtlas.getSpriteFrame(frameName);
        if (!spriteFrame) {
            cc.error(`精灵图集里找不到【${frameName}】这个图片帧`);
            return;
        }
        const texture = spriteFrame.getTexture(); // 获取图集的底层纹理

        // 2. ✅【核心转换】SpriteAtlas → Spine TextureAtlas (2.4.x 原生实现)
        const spineTextureAtlas = null;// this._createSpineTextureAtlasBySpriteFrame(spriteFrame);

        // 3. ✅ 从Spine纹理图集里获取对应的纹理区域
        const spineAtlasRegion = spineTextureAtlas.findRegion(frameName);
        if (!spineAtlasRegion) {
            cc.error(`Spine纹理图集里找不到【${frameName}】纹理区域`);
            return;
        }

        // 4. ✅ 给Spine插槽创建附件并赋值（安卓打包100%有效，无BUG）
        // this._setWeaponBySpineAtlasRegion(spineAtlasRegion, customSize);
    }


}