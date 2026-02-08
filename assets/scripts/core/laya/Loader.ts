import Handler from "./Handler";
/**
 * 
 * @author clong 2022.04.09
 */
export default class Loader {

    public static readonly ANIMATIONCLIP: string = "ANIMATIONCLIP";

    public static readonly BUFFER: string = "BUFFER";

    public static readonly ATLAS: string = "ATLAS";

    public static readonly HIERARCHY: string = "HIERARCHY";

    public static readonly IMAGE: string = "IMAGE";

    public static readonly SOUND: string = "SOUND";

    constructor() {

    }

    /**
     * <p>加载资源。资源加载错误时，本对象会派发 Event.ERROR 事件，事件回调参数值为加载出错的资源地址。</p>
     * <p>因为返回值为 LoaderManager 对象本身，所以可以使用如下语法：loaderManager.load(...).load(...);</p>
     * @param url 要加载的单个资源地址或资源信息数组。比如：简单数组：["a.png","b.png"]；复杂数组[{url:"a.png",type:Loader.IMAGE,size:100,priority:1},{url:"b.json",type:Loader.JSON,size:50,priority:1}]。
     * @param complete 加载结束回调。根据url类型不同分为2种情况：1. url为String类型，也就是单个资源地址，如果加载成功，则回调参数值为加载完成的资源，否则为null；2. url为数组类型，指定了一组要加载的资源，如果全部加载成功，则回调参数值为true，否则为false。
     * @param progress 加载进度回调。回调参数值为当前资源的加载进度信息(0-1)。
     * @param type 资源类型。比如：Loader.IMAGE。
     * @param priority (default = 1)加载的优先级，优先级高的优先加载。有0-4共5个优先级，0最高，4最低。
     * @param cache 是否缓存加载结果。
     * @param group 分组，方便对资源进行管理。
     * @param ignoreCache 是否忽略缓存，强制重新加载。
     * @param useWorkerLoader (default = false)是否使用worker加载（只针对IMAGE类型和ATLAS类型，并且浏览器支持的情况下生效）
     * @return 此 LoaderManager 对象本身。
     */
    public load(url: string, complete?: Handler | null, progress?: Handler | null, type?: string | null, priority?: number): void {

        //https://fanyi.baidu.com/#zh/en/%E5%87%A0%E4%BD%95
        if (type == Loader.IMAGE) {
            // cc.resources.load(url, cc.SpriteFrame, null, (err: any, data: cc.SpriteFrame) => {
            //     complete && complete.runWith(data);
            // });
        }
    }

    public clearRes(url: string): void {

        cc.resources.release(url);
    }
}