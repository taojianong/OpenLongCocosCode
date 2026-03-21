# 设计标尺插件 (design-ruler)

在 Cocos Creator 2.x 场景编辑器中叠加显示标尺刻度、对齐线和设计图。

## 原理

利用 `scene-script` 机制在场景进程中创建临时 `cc.Node`，用 `cc.Graphics` 绘制标尺和对齐线，用 `cc.Sprite` 显示设计图。临时节点标记为 `DontSave | HideInHierarchy`，不会污染场景文件。

通信链路：
```
面板(panel) → Editor.Ipc.sendToMain → 主进程(main.ts)
主进程 → Editor.Scene.callSceneScript → 场景进程(scene-script.js)
主进程 → Editor.Ipc.sendToPanel → 面板(更新UI)
```

## 文件结构

```
packages/design-ruler/
├── package.json         # 插件配置（菜单、面板、scene-script 入口）
├── main.ts              # 主进程 IPC 路由，缓存状态，转发消息
├── scene-script.js      # 场景进程，cc.Graphics 绘制标尺/对齐线
├── editor.d.ts          # Editor API 类型声明
├── tsconfig.json        # TypeScript 编译配置
├── panels/
│   ├── index.ts         # 面板导出
│   └── panel.ts         # 面板 UI + IPC 通信
└── dist/                # 编译输出
    ├── main.js
    └── panels/
        ├── index.js
        └── panel.js
```

## 使用方法

### 打开面板

菜单栏 → **扩展** → **设计标尺** → **打开面板**

### 功能

- **标尺刻度**：场景视图中自动显示水平/垂直标尺（每 10px 小刻度，每 100px 大刻度）
- **对齐线**：在面板中输入位置，点击「+ 水平线」或「+ 垂直线」添加
- **设计图叠加**：在面板中导入 PNG/JPG 设计图，调整透明度
- **切换显示**：菜单栏 → 扩展 → 设计标尺 → 切换显示
- **场景恢复**：切换场景后标尺和对齐线自动恢复

### 面板控件

| 控件 | 说明 |
|------|------|
| 启用对齐线 | 开关标尺和对齐线的显示 |
| 对齐线颜色 | 选择对齐线和标尺的颜色 |
| 对齐线透明度 | 调整对齐线透明度 |
| 位置输入 + 水平线/垂直线 | 在指定像素位置添加对齐线 |
| 导入设计图 | 选择图片文件叠加到场景中 |
| 设计图透明度 | 调整设计图透明度 |
| 清除按钮 | 清除所有对齐线或设计图 |

## 开发

```bash
cd packages/design-ruler

# 编译
npm run build

# 监听模式
npm run watch
```

编译后重启 Cocos Creator 编辑器生效。
