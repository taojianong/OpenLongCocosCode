// import { director, Event as CCEvent, game, Input, Scene } from "cc";
import Loader from "./Loader";
import Matrix from "./Matrix";
import Point from "./Point";
import Pool from "./Pool";
import Stage from "./Stage";
import Handler from "./Handler";
import Timer from "../utils/Timer";

/**
 * 
 * @author clong 2022.04.09
 */
export default class Laya {

    public static Point: typeof Point = Point;

    public static Event: typeof cc.Event = cc.Event;

    public static Handler: typeof Handler = Handler;
    public static Loader: typeof Loader = Loader;

    public static Pool: typeof Pool = Pool;

    public static Matrix: typeof Matrix = Matrix;

    public static stage: Stage = null;

    public static timer: Timer = new Timer();

    public static updateTimer: Timer = new Timer();

    public static loader: Loader = null;//new Loader();

    constructor() {

    }

    public static init(): void {

        this.stage = new Stage();
        this.timer = new Timer();
        this.updateTimer = new Timer();
        this.loader = new Loader();

        if (CC_PREVIEW) {
            //键盘事件
            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

            //鼠标事件
            this.TouchScreen();
        }
    }

    static isAddClick = false;
    /**
     * 触摸屏幕事件监听
     * @returns 
     */
    public static TouchScreen() {
        if (this.isAddClick) {
            return;
        }
        this.isAddClick = true;

        //@ts-ignore
        var i = cc.EventListener.create({
            //@ts-ignore
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: false,// 是否吞噬触摸事件
            onTouchBegan(e) {
                // const t = cc.find('Canvas').convertToNodeSpaceAR(e.getLocation());
                cc.director.emit("TouchScreen", e);
            },
            // onTouchMoved: (touch, event) => {
            //     cc.director.emit("TouchScreenMove", touch, event);
            // },
            // onTouchEnded: (touch, event) => {
            //     cc.director.emit("TouchScreenEnd", touch, event);
            // },
        });
        //@ts-ignore
        cc.internal.eventManager.addListener(i, -1);

        if (CC_PREVIEW) {
            //@ts-ignore
            var i1 = cc.EventListener.create({
                //@ts-ignore
                event: cc.EventListener.MOUSE,
                swallowTouches: false,
                onMouseDown(e) {
                    // cc.director.emit("onMouseDown", e);
                    cc.director.emit("mousedown", e);
                },
                onMouseMove(e) {
                    // cc.director.emit("MouseMove", e);
                    cc.director.emit("mousemove", e);
                },
                onMouseUp(e) {
                    // cc.director.emit("MouseUp", e);
                    cc.director.emit("mouseup", e);
                }
            });
            //@ts-ignore
            cc.internal.eventManager.addListener(i1, -1);
        }
    }

    /**是否按下ctrl键 */
    public static isCtrl: boolean = false;

    private static onKeyUp(e: cc.Event.EventKeyboard): void {
        if (CC_PREVIEW) {
            if (e.keyCode == 17) {
                this.isCtrl = false;
            }
        }
    }

    private static onKeyDown(e: cc.Event.EventKeyboard): void {
        if (CC_PREVIEW) {

            const lf = this;
            if (e.keyCode == 17) {//ctrl
                this.isCtrl = true;
            } else if (e.keyCode == 67) {//c
                // if (KeyValueComp.focusEidtBox) {
                //     if (navigator.clipboard) {
                //         navigator.clipboard.writeText(KeyValueComp.focusEidtBox.string);
                //         Log.log(lf, `复制数据 str: ` + KeyValueComp.focusEidtBox.string);
                //         MsgHints.show(`复制数据 str: ` + KeyValueComp.focusEidtBox.string);
                //     }
                // }
            } else if (e.keyCode == 86) {//v
                // if (KeyValueComp.focusEidtBox) {
                //     if (navigator.clipboard) {
                //         navigator.clipboard.readText().then((text) => {
                //             KeyValueComp.focusEidtBox.string = text;
                //             Log.log(lf, `粘贴数据 str: ` + KeyValueComp.focusEidtBox.string);
                //         });
                //     }
                // }
            }
        }
    }

    /**
     * 当前场景
     */
    public static get scene(): cc.Scene {
        return cc.director.getScene();
    }
} 
