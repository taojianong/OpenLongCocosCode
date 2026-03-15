// UI_MainHome 是由 PsdToPrefab 自动生成的节点绑定层（勿手动修改节点属性）
// 生成路径: output/UI_MainHome/UI_MainHome.ts → 复制到此目录下的 generated/ 文件夹
import UI_MainHome from './generated/UI_MainHome';

const { ccclass, menu } = cc._decorator;

/**
 * MainHome - 业务逻辑
 * 节点引用声明在父类 UI_MainHome（自动生成）中
 * @author clong 2026.03.15
 */
@ccclass
@menu('UI/MainHomePanel')
export default class MainHomePanel extends UI_MainHome {

    protected onAfterShow(): void {
        // TODO: 界面显示后，填充 UI 数据
    }

    public onBtnClick(btn: any, e?: string): void {
        super.onBtnClick(btn, e);
        // TODO: 按钮点击处理
    }
}
