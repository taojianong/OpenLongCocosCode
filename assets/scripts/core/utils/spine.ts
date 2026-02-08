
enum TextureFilter {
    Nearest = 9728,
    Linear = 9729,
    MipMap = 9987,
    MipMapNearestNearest = 9984,
    MipMapLinearNearest = 9985,
    MipMapNearestLinear = 9986,
    MipMapLinearLinear = 9987
}
enum TextureWrap {
    MirroredRepeat = 33648,
    ClampToEdge = 33071,
    Repeat = 10497
}

export class Texture {

    static filterFromString(text) {
        switch (text.toLowerCase()) {
            case "nearest":
                return TextureFilter.Nearest;

            case "linear":
                return TextureFilter.Linear;

            case "mipmap":
                return TextureFilter.MipMap;

            case "mipmapnearestnearest":
                return TextureFilter.MipMapNearestNearest;

            case "mipmaplinearnearest":
                return TextureFilter.MipMapLinearNearest;

            case "mipmapnearestlinear":
                return TextureFilter.MipMapNearestLinear;

            case "mipmaplinearlinear":
                return TextureFilter.MipMapLinearLinear;

            default:
                throw new Error("Unknown texture filter " + text);
        }
    };
    static wrapFromString(text) {
        switch (text.toLowerCase()) {
            case "mirroredtepeat":
                return TextureWrap.MirroredRepeat;

            case "clamptoedge":
                return TextureWrap.ClampToEdge;

            case "repeat":
                return TextureWrap.Repeat;

            default:
                throw new Error("Unknown texture wrap " + text);
        }
    };
}

export class SkeletonTexture {

    _texture: any;
    _material: any;

    _image = null;

    constructor(image) {
        this._image = image;
    }

    getImage() {
        return this._image;
    }

    setRealTexture(tex) {
        this._texture = tex;
    }
    getRealTexture() {
        return this._texture;
    }

    /**
     * 获取纹理 ID（Spine 渲染器必需）
     */
    getId() {
        if (this._texture) {
            // Cocos Creator 2.x 的 Texture2D
            if (typeof this._texture.getId === 'function') {
                return this._texture.getId();
            }
            // 尝试获取内部实现
            if (this._texture.getImpl && typeof this._texture.getImpl === 'function') {
                const impl = this._texture.getImpl();
                if (impl && typeof impl.getId === 'function') {
                    return impl.getId();
                }
                if (impl && impl._glID !== undefined) {
                    return impl._glID;
                }
            }
            // 直接属性
            if (this._texture._glID !== undefined) {
                return this._texture._glID;
            }
            if (this._texture._id !== undefined) {
                return this._texture._id;
            }
            // 使用 uuid 作为后备
            return this._texture._uuid || this._texture.__instanceId || 0;
        }
        return 0;
    }

    setFilters(minFilter, magFilter) {
        this._texture && this._texture.setFilters(minFilter, magFilter);
    }
    setWraps(uWrap, vWrap) {
        this._texture && this._texture.setWrapMode(uWrap, vWrap);
    }
    dispose() { }
}

export class TextureAtlasReader {

    index = 0;
    lines = null;

    constructor(text) {
        this.index = 0;
        this.lines = text.split(/\r\n|\r|\n/);
    }
    readLine() {
        if (this.index >= this.lines.length) return null;
        return this.lines[this.index++];
    };
    readValue() {
        var line = this.readLine();
        var colon = line.indexOf(":");
        if (-1 == colon) throw new Error("Invalid line: " + line);
        return line.substring(colon + 1).trim();
    };
    readTuple(tuple) {
        var line = this.readLine();
        var colon = line.indexOf(":");
        if (-1 == colon) throw new Error("Invalid line: " + line);
        var i = 0, lastMatch = colon + 1;
        for (; i < 3; i++) {
            var comma = line.indexOf(",", lastMatch);
            if (-1 == comma) break;
            tuple[i] = line.substr(lastMatch, comma - lastMatch).trim();
            lastMatch = comma + 1;
        }
        tuple[i] = line.substring(lastMatch).trim();
        return i + 1;
    };
}

export class TextureAtlasRegion {

    u = 0;
    v = 0;
    u2 = 0;
    v2 = 0;
    width = 0;
    height = 0;
    rotate = false;
    offsetX = 0;
    offsetY = 0;
    originalWidth = 0;
    originalHeight = 0;

    name = '';
    page = null;
    degrees = 0;

    index = 0;
    x = 0;
    y = 0;
    texture = null;
}

export class TextureAtlasPage {

    name = '';
    width = 0;
    height = 0;
    minFilter = '';
    magFilter = '';
    uWrap = 0;
    vWrap = 0;
    texture = null;
}

export class TextureAtlas {

    pages = null;
    regions = null;

    constructor(atlasText, textureLoader) {
        this.pages = new Array();
        this.regions = new Array();
        this.load(atlasText, textureLoader);
    }
    load(atlasText, textureLoader) {
        if (null == textureLoader) throw new Error("textureLoader cannot be null.");
        var reader = new TextureAtlasReader(atlasText);
        var tuple = new Array(4);
        var page = null;
        while (true) {
            var line = reader.readLine();
            if (null == line) break;
            line = line.trim();
            if (0 == line.length) page = null; else if (page) {
                var region = new TextureAtlasRegion();
                region.name = line;
                region.page = page;
                var rotateValue = reader.readValue();
                "true" == rotateValue.toLocaleLowerCase() ? region.degrees = 90 : "false" == rotateValue.toLocaleLowerCase() ? region.degrees = 0 : region.degrees = parseFloat(rotateValue);
                region.rotate = 90 == region.degrees;
                reader.readTuple(tuple);
                var x = parseInt(tuple[0]);
                var y = parseInt(tuple[1]);
                reader.readTuple(tuple);
                var width = parseInt(tuple[0]);
                var height = parseInt(tuple[1]);
                region.u = x / page.width;
                region.v = y / page.height;
                if (region.rotate) {
                    region.u2 = (x + height) / page.width;
                    region.v2 = (y + width) / page.height;
                } else {
                    region.u2 = (x + width) / page.width;
                    region.v2 = (y + height) / page.height;
                }
                region.x = x;
                region.y = y;
                region.width = Math.abs(width);
                region.height = Math.abs(height);
                4 == reader.readTuple(tuple) && 4 == reader.readTuple(tuple) && reader.readTuple(tuple);
                region.originalWidth = parseInt(tuple[0]);
                region.originalHeight = parseInt(tuple[1]);
                reader.readTuple(tuple);
                region.offsetX = parseInt(tuple[0]);
                region.offsetY = parseInt(tuple[1]);
                region.index = parseInt(reader.readValue());
                region.texture = page.texture;
                this.regions.push(region);
            } else {
                page = new TextureAtlasPage();
                page.name = line;
                if (2 == reader.readTuple(tuple)) {
                    page.width = parseInt(tuple[0]);
                    page.height = parseInt(tuple[1]);
                    reader.readTuple(tuple);
                }
                reader.readTuple(tuple);
                page.minFilter = Texture.filterFromString(tuple[0]);
                page.magFilter = Texture.filterFromString(tuple[1]);
                var direction = reader.readValue();
                page.uWrap = TextureWrap.ClampToEdge;
                page.vWrap = TextureWrap.ClampToEdge;
                "x" == direction ? page.uWrap = TextureWrap.Repeat : "y" == direction ? page.vWrap = TextureWrap.Repeat : "xy" == direction && (page.uWrap = page.vWrap = TextureWrap.Repeat);
                page.texture = textureLoader(line);
                page.texture.setFilters(page.minFilter, page.magFilter);
                page.texture.setWraps(page.uWrap, page.vWrap);
                page.width = page.texture.getImage().width;
                page.height = page.texture.getImage().height;
                this.pages.push(page);
            }
        }
    };
    findRegion(name) {
        for (var i = 0; i < this.regions.length; i++) if (this.regions[i].name == name) return this.regions[i];
        return null;
    };
    dispose() {
        for (var i = 0; i < this.pages.length; i++) this.pages[i].texture.dispose();
    };
}