/**
 * 
 * @author clong 2022.04.17
 */
export default class Color extends cc.Color {

    // 重命名静态属性，避免与 cc.Color 的只读属性冲突（JSB 兼容）
    // public static readonly COLOR_RED = new Color(1, 0, 0, 1);
    // public static readonly COLOR_GREEN = new Color(0, 1, 0, 1);
    // public static readonly COLOR_BLUE = new Color(0, 0, 1, 1);
    // public static readonly COLOR_CYAN = new Color(0, 1, 1, 1);
    // public static readonly COLOR_YELLOW = new Color(1, 0.92, 0.016, 1);
    // public static readonly COLOR_MAGENTA = new Color(1, 0, 1, 1);
    // public static readonly COLOR_GRAY = new Color(0.5, 0.5, 0.5, 1);
    // public static readonly COLOR_WHITE = new Color(1, 1, 1, 1);
    // public static readonly COLOR_BLACK = new Color(0, 0, 0, 1);

    public static RgbToHex(r: number, g: number, b: number): string {
        var color = r << 16 | g << 8 | b;
        var str = color.toString(16);
        while (str.length < 6) str = "0" + str;
        return "#" + str;
    }

    /**
     * 将Laya.Color转换为{#000000}颜色格式
     * @param color 
     * @returns 
     */
    public static ColorToHex(color: Color): string {
        return this.RgbToHex(color.r * 255, color.g * 255, color.b * 255);
    }

    /**
     * 将#000000转换为Laya.Color
     * @param colorHex 
     * @param alpha 
     * @returns 
     */
    public static HexToColor(colorHex: string, alpha: number = -1): Color {
        if (colorHex.startsWith("#")) {
            colorHex = colorHex.substring(1);
        }
        let cr = colorHex.substring(0, 2);
        let cg = colorHex.substring(2, 4);
        let cb = colorHex.substring(4, 6);
        let ca = colorHex.substring(6, 8);
        let nr = parseInt(cr, 16);
        let ng = parseInt(cg, 16);
        let nb = parseInt(cb, 16);
        let na = alpha > 0 ? alpha * 255 : parseInt(ca, 16);
        // return new Color(nr / 255, ng / 255, nb / 255, na);
        return new Color(nr, ng, nb, na);
    }

    /**
     * 将颜色#00000转换为对应的rgba|rgb颜色
     * @param color 
     * @param alpha 透明度
     * @returns rgba(r,g,b,a) | rgb(r,g,b)
     */
    public static toRGBA(color: string, alpha: number = 1): string {

        let c = this.HexToColor(color);
        return this.MakeStyleString(c.r, c.g, c.b, alpha);
    }

    public static MakeStyleString(r: number, g: number, b: number, a = 1.0): string {
        // function clamp(x: number, lo: number, hi: number) { return x < lo ? lo : hi < x ? hi : x; }
        r *= 255; // r = clamp(r, 0, 255);
        g *= 255; // g = clamp(g, 0, 255);
        b *= 255; // b = clamp(b, 0, 255);
        // a = clamp(a, 0, 1);
        if (a < 1) {
            return `rgba(${r},${g},${b},${a})`;
        } else {
            return `rgb(${r},${g},${b})`;
        }
    }


    public static gammaToLinearSpace(value: number): number {
        if (value <= 0.04045)
            return value / 12.92;
        else if (value < 1.0)
            return Math.pow((value + 0.055) / 1.055, 2.4);
        else
            return Math.pow(value, 2.4);
    }

    public static linearToGammaSpace(value: number): number {
        if (value <= 0.0)
            return 0.0;
        else if (value <= 0.0031308)
            return 12.92 * value;
        else if (value <= 1.0)
            return 1.055 * Math.pow(value, 0.41666) - 0.055;
        else
            return Math.pow(value, 0.41666);
    }

    public static ToV3(color: Color): cc.Vec3 {
        return new cc.Vec3(color.r, color.g, color.b);
    }

    public static ToV4(color: Color): cc.Vec4 {
        return new cc.Vec4(color.r, color.g, color.b, color.a);
    }

    //--------------------------------------------------------


    constructor(r?: number, g?: number, b?: number, a?: number) {
        super(r, g, b, a);
    }


    toLinear(out: any) {
        out.r = Color.gammaToLinearSpace(this.r);
        out.g = Color.gammaToLinearSpace(this.g);
        out.b = Color.gammaToLinearSpace(this.b);
    }
    toGamma(out: any) {
        out.r = Color.linearToGammaSpace(this.r);
        out.g = Color.linearToGammaSpace(this.g);
        out.b = Color.linearToGammaSpace(this.b);
    }
    cloneTo(destObject: any) {
        var destColor = destObject;
        destColor.r = this.r;
        destColor.g = this.g;
        destColor.b = this.b;
        destColor.a = this.a;
    }
    clone() {
        var dest = new Color();
        this.cloneTo(dest);
        return dest;
    }
}