/**
 * 资源加载
 * @author clong 2025.12.06
 */
export default class ResLoad {

    static cahcedBundles: string[] = [];
    static ResPathMap: Map<string, string> = new Map();

    public static resCache: { [key: string]: { [key: string]: any } } = {};
    public static loadingCount = {};

    /**
     * 异步加载bundle
     * @param bundleName 
     * @returns 
     */
    public static async loadBundle(bundleName: string) {
        return new Promise<cc.AssetManager.Bundle>(async (resolve, reject) => {

            // if (cc.sys.platform == cc.sys.WECHAT_GAME &&
            //     ['RoomScene', 'Sea', 'GameScene'].includes(bundleName)) {
            //     await WeChat.loadWxSubpkg(bundleName);
            // }

            let b = cc.assetManager.getBundle(bundleName);
            if (b != null) {
                resolve(b);
                return;
            }
            cc.assetManager.loadBundle(bundleName, (error, bundle: cc.AssetManager.Bundle) => {
                if (error) {
                    console.error('load bundle:', error);
                    resolve(null);
                    return;
                }
                resolve(bundle);
            })
        })
    }

    /**
     * 释放bundle资源
     * @param bundleName 
     * @returns 
     */
    public static releaseBundle(bundleName: string): void {
        let b = cc.assetManager.getBundle(bundleName);
        if (b != null) {
            b.releaseAll();
            cc.assetManager.removeBundle(b);
            delete this.resCache[bundleName];
            return;
        }
    }

    /**
     * 从bundle中加载资源
     * @param path 
     * @param bundleName 
     * @param type 
     * @param onComplete 
     * @param onProgress 
     * @returns 
     */
    public static loadRes<T extends cc.Asset>(path: string, bundleName: string, type: typeof cc.Asset, onComplete: (error: Error, assets: T) => void, onProgress?: (finish: number, total: number, item: cc.AssetManager.RequestItem) => void,) {
        if (this.resCache[bundleName] !== undefined && this.resCache[bundleName][path] !== undefined && cc.isValid(this.resCache[bundleName][path])) {
            onComplete(null, this.resCache[bundleName][path])
            return;
        }
        let bundle = cc.assetManager.getBundle(bundleName);
        this.resCache[bundleName] = this.resCache[bundleName] || [];
        if (bundle != null) {
            if (!this.loadingCount[path]) this.loadingCount[path] = 0;
            this.loadingCount[path]++;
            bundle.load(path, type as typeof cc.Asset, (onProgress == null) ? (() => { }) : onProgress, (e, res: T) => {
                if (e == null) {
                    this.resCache[bundleName][path] = res;
                    res['path'] = path;
                } else {
                    console.warn(path, bundleName);
                    console.warn(e);
                }
                this.loadingCount[path]--;
                onComplete(e, res)
            });
            return;
        }
        if (!this.loadingCount[path]) this.loadingCount[path] = 0;
        this.loadingCount[path]++
        cc.assetManager.loadBundle(bundleName, (error, bundle: cc.AssetManager.Bundle) => {
            if (error) {
                cc.log(error);
                this.loadingCount[path]--
                return
            }

            // this.CalcBundleResPath(bundle);
            bundle.load(path, type as typeof cc.Asset, (onProgress == null) ? (() => { }) : onProgress, (e, res: T) => {
                if (e != null) {
                    console.error(e);
                    return;
                } else {
                    this.resCache[bundleName][path] = res;
                    res['path'] = path;
                }
                this.loadingCount[path]--
                onComplete(e, res)
            })
        })
    }

    /**
     * 异步加载资源
     * @param path 
     * @param bundleName 
     * @param type 
     * @returns 
     */
    public static loadResASync<T extends cc.Asset>(path: string, bundleName: string, type: typeof cc.Asset) {
        const lf = this;
        return new Promise<any>((resolve, rejcet) => {
            lf.loadRes(path, bundleName, type, (e, res) => {
                if (e) {
                    console.warn(path, `未找到资源 path:${path} bundle:${bundleName}`);
                    resolve(null);
                    return;
                }
                resolve(res);
            })
        })
    }


    public static loadReses<T extends cc.Asset>(paths: string[], bundleName: string, type: typeof cc.Asset, onComplete: (error: Error, assets: T[]) => boolean, onProgress?: (finish: number, total: number, item: cc.AssetManager.RequestItem) => void,) {

        let path = paths.join("");
        if (!this.loadingCount[path]) this.loadingCount[path] = 0;
        this.loadingCount[path]++;

        let needPaths: string[] = [];
        let fullPath = "";
        paths.forEach(p => {
            fullPath = bundleName + "/" + p;
            if (!this.resCache[fullPath]) {
                needPaths.push(p);
            }
        });

        if (needPaths.length == 0) {
            let rs = [];
            paths.forEach(p => {
                fullPath = bundleName + "/" + p;
                let info = this.resCache[fullPath];
                if (info && cc.isValid(info.asset, true)) {
                    this.cacheAsset(info.asset, fullPath);
                    rs.push(info.asset);
                }
            });

            setTimeout(() => {
                if (onComplete && !onComplete(null, rs)) {
                    paths.forEach(p => {
                        fullPath = bundleName + "/" + p;
                        // this.releaseAssetByFullPath(fullPath);
                    });
                }
                this.loadingCount[path]--;
            }, 0);
            return;
        }


        this.loadBundle(bundleName).then(bundle => {
            bundle.load(needPaths, type as typeof cc.Asset, (onProgress == null) ? (() => { }) : onProgress, (e, rets) => {
                if (e != null) {
                    onComplete(e, null);
                    this.loadingCount[path]--;
                    return;
                }

                for (let i = 0; i < needPaths.length; i++) {
                    fullPath = bundleName + "/" + needPaths[i];
                    let asset = rets[i];
                    if (cc.isValid(asset, true)) {
                        this.cacheAsset(asset, fullPath);
                        asset['path'] = needPaths[i];
                    }
                }

                let rs = [];
                rs = rets;

                if (!onComplete(e, rs)) {
                    paths.forEach(p => {
                        fullPath = bundleName + "/" + p;
                        // this.releaseAssetByFullPath(fullPath);
                    });
                }

                this.loadingCount[path]--;
            })
        })
    }

    public static cacheAsset(asset: cc.Asset, url: string) {
        // if (this.resCache.has(url)) {
        //     this.resCache.get(url).refCount++;
        //     // console.log("cacheAsset : ", url, this.resCache.get(url).refCount);
        // } else {
        //     // console.log("cacheAsset : ", url, 1);
        //     this.resCache.set(url, { asset: asset, url: url, refCount: 1 });
        //     asset.addRef();
        // }
    }

    /**
     * 获取预制体
     * @param path 
     * @param bundleName 
     * @returns 
     */
    public static getPrefab(path: string, bundleName: string): cc.Prefab {
        return this.getRes(path, bundleName, cc.Prefab);
    }

    /**
     * 获取资源
     * @param path 
     * @param bundleName 
     * @param type 
     * @param useCache 
     * @returns 
     */
    public static getRes<T extends cc.Asset>(path: string, bundleName: string, type: typeof cc.Asset, useCache = true): T {
        if (useCache) {
            if (this.resCache[bundleName] !== undefined && this.resCache[bundleName][path] !== undefined) {
                return this.resCache[bundleName][path];
            }
        }
        const bundle = cc.assetManager.getBundle(bundleName);
        return bundle?.get(path, type as typeof cc.Asset) as T;
    }

    public static releaseAssetByName(bundleName: string, path: string) {
        // this.releaseAssetByFullPath(bundleName + "/" + path);
    }

    public static releaseAssetsInBunlde(bundle: string) {
        let url = bundle + "/";
        let removeList: string[] = [];

        for (const key in this.resCache) {
            const info = this.resCache[key];
            if (info.url.startsWith(url)) {
                removeList.push(key);
            }
        }

        if (removeList.length > 0) {
            removeList.forEach(path => {
                let info = this.resCache[path];
                cc.assetManager.releaseAsset(info.asset);
                delete this.resCache[path];
            });
        }
    }

    public static releaseUnusedAssets() {
        setTimeout(() => {
            let removeList: string[] = [];
            for (const key in this.resCache) {
                const info = this.resCache[key];
                if (info.refCount <= 0) {
                    removeList.push(key);
                }
            }

            if (removeList.length > 0) {
                removeList.forEach(path => {
                    let info = this.resCache[path];
                    cc.assetManager.releaseAsset(info.asset);
                    delete this.resCache[path];
                });
            }
        }, 100);
    }
}