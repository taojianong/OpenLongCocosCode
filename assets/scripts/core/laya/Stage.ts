/**
 * 舞台
 * @author clong 2022.04.09
 */
export default class Stage {// extends EventTarget

    public width: number = 1334;//| undefined
    public height: number = 750;//| undefined 

    public node: cc.Node | null = null;

    public scrollRect: cc.Rect | null = null;

    private _scaleX: number = 1;
    private _scaleY: number = 1;

    constructor() {

        // super();
    }

    init(node: cc.Node) {

        // fgui.GRoot.create();

        let self = this;

        this.node = node;
        // this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        // this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);

        // cc.view.setDesignResolutionSize(750, 1334, cc.ResolutionPolicy.FIXED_HEIGHT);
        cc.view.setDesignResolutionSize(1334, 750, cc.ResolutionPolicy.FIXED_WIDTH);

        self.onResize();
        cc.view.setResizeCallback(() => {
            var scene = cc.director.getScene();
            scene && scene.getComponentsInChildren(cc.Widget).forEach(wg => {
                wg.updateAlignment();
                self.onResize();
            });
        });
    }

    private onResize(): void {

        let self = this;
        let windowSize = cc.view.getCanvasSize();// cc.screen.windowSize;//屏幕尺寸
        let visibleSize = cc.view.getVisibleSize();//可视区域尺寸
        //https://blog.csdn.net/qq_43287088/article/details/106562554
        //视图中canvas尺寸
        console.log("canvas size:", windowSize);// view.getCanvasSize()
        //屏幕尺寸
        console.log("frame size", visibleSize);// view.getFrameSize()
        //视图中窗口可见区域尺寸
        console.log("visible Size:", visibleSize);
        //设计分辨率
        console.log("DesignResolutionSize Size:", cc.view.getDesignResolutionSize());

        // console.log("GRoot Size:" + fgui.GRoot.inst.width + "," + fgui.GRoot.inst.height);

        // self.width = Math.ceil(windowSize.width);
        // self.height = Math.ceil(windowSize.height);

        self.width = Math.ceil(visibleSize.width);
        self.height = Math.ceil(visibleSize.height);

        this._scaleX = visibleSize.width / windowSize.width;
        this._scaleY = visibleSize.height / windowSize.height;

        // EventMgr.event('RESIZE');
    }

    on(type: string, callback: any, target?: unknown, useCapture?: any): void {
        this.node!.on(type, callback, target, useCapture);
    }

    off(type: string, callback: any, target?: unknown, useCapture?: any): void {
        this.node!.off(type, callback, target, useCapture);
    }

    /**
     * 可视区域对应实际屏幕像素的区域缩放
     */
    public get scaleX(): number {

        return this._scaleX;
    }

    /**
     * 可视区域对应实际屏幕像素的区域缩放
     */
    public get scaleY(): number {

        return this._scaleY;
    }

    /**鼠标位置X */
    // public get mouseX(): number {
    //     let pos1: cc.Vec2 = fgui.GRoot.inst.getTouchPosition();
    //     return pos1.x;
    // }

    // /**鼠标位置Y */
    // public get mouseY(): number {
    //     let pos1: cc.Vec2 = fgui.GRoot.inst.getTouchPosition();
    //     return pos1.y;
    // }
}