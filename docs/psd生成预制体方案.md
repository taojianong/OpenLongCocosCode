# PSD 生成预制体工具方案

> 作者：淘剑龙
> 最后更新：2026-03-15

---

## 目标

设计一个 Node.js 命令行工具，输入一个 **PSD 设计稿**，自动输出：

```
design.psd
    ├── 1. 效果图 (preview.png)
    ├── 2. 切图 (images/*.png，去重 + 生成 .meta)
    └── 3. 预制体 (xxx.prefab，绑定好切图UUID + 组件)
```

---

## AI 驱动工作流

> 按照此流程，从一句需求描述到输出所有文件，全程 AI 辅助。

### 输入格式（向 AI 描述需求）

向 Copilot/AI 描述界面需求时，遵循以下模板即可触发完整文件生成：

```
我需要一个【界面名/组件名】，包含：
- 元素1：类型（尺寸、颜色、功能说明）
- 元素2：类型（尺寸、颜色、功能说明）
- ...
文件名：UI_XXX.psd 或 Com_XXX.psd
输出到：assets/net_main/prefab（或 net_battle）
```

**示例输入：**

> 我需要一个商店界面，包含：顶部金币显示（标签 + 图标）、滚动商品列表、底部关闭按钮。  
> 文件名：`UI_Shop.psd`，输出到 `assets/net_main/prefab`。

### AI 生成步骤（5 步产出所有文件）

```
需求输入
  │
  ▼
步骤1: AI 生成 PSD 图层树设计（文档/注释）
  │      → 产出：图层命名方案（btn_/txt_/sp_等）
  │
  ▼
步骤2: 美术在 Photoshop 按图层树制作 PSD，保存到 psd/
  │      → 产出：psd/UI_Shop.psd
  │
  ▼
步骤3: 运行 PsdToPrefab 工具
  │      命令：node tools/psd/PsdToPrefab.js psd/UI_Shop.psd --out assets/net_main/prefab --img assets/net_main/images/ui
  │      → 产出A：output/UI_Shop/preview.png（效果图）
  │      → 产出B：assets/net_main/images/ui/*.png + .meta（切图）
  │      → 产出C：assets/net_main/prefab/UI_Shop.prefab（预制体，含脚本绑定）
  │      → 产出D：assets/net_main/prefab/UI_Shop.ts + .meta（TS 脚本）
  │
  ▼
步骤4: 将产出文件导入 Cocos Creator（刷新资源面板）
  │      → 预制体自动识别切图 UUID，界面可立即预览
  │
  ▼
步骤5: AI 补全 TS 业务逻辑（按钮事件、数据绑定等）
         → 产出：完整可运行的界面代码
```

### AI 提示词模板（直接粘贴使用）

#### 模板 A：生成新界面

```
请为【UI_Shop 商店界面】生成完整的开发文件：

1. PSD 图层树（含所有 btn_/txt_/sp_ 命名规范的图层）
2. 对应的 TypeScript 类（继承 BasePanel，含节点引用属性）
3. 运行 PsdToPrefab 工具的完整命令

界面需求：
- 顶部：金币图标 + 金币数量标签 + 关闭按钮
- 中间：商品列表（滚动，使用 list_ 前缀）
- 底部：购买按钮 + 价格标签

输出到 bundle：net_main
```

#### 模板 B：生成新组件

```
请为【Com_CoinBar 金币栏组件】生成完整的开发文件：

1. PSD 图层树（Com_ 前缀，不添加全屏 Widget）
2. 对应的 TypeScript 类（继承 cc.Component）
3. 运行 PsdToPrefab 工具的完整命令

组件需求：
- 金币图标（sp_icon，48×48）
- 金币数量标签（txt_count，右侧）
- 背景（sp_bg@9，九宫格）
```

#### 模板 C：批量生成一个功能模块

```
请为【装备系统】规划并生成相关文件，包括：

1. UI_Equipment.psd — 装备主界面
2. Com_EquipSlot.psd — 装备槽组件
3. Item_EquipItem.psd — 装备列表条目
4. 每个文件的 PSD 图层树 + TS 类 + 工具命令
5. 生成顺序（组件先于界面）
```

### 标准输出清单

| 文件类型              | 路径                                    | 说明                 |
| --------------------- | --------------------------------------- | -------------------- |
| PSD 设计稿            | `psd/UI_XXX.psd`                        | 美术输入             |
| 效果图                | `output/UI_XXX/preview.png`             | 工具自动生成         |
| 切图                  | `assets/net_main/images/ui/XXX/*.png`   | 工具自动生成 + .meta |
| 预制体                | `assets/net_main/prefab/UI_XXX.prefab`  | 工具自动生成         |
| TS 脚本               | `assets/net_main/prefab/UI_XXX.ts`      | 工具自动生成框架     |
| TS .meta              | `assets/net_main/prefab/UI_XXX.ts.meta` | 工具自动生成         |
| 业务逻辑（手动/AI补） | `assets/net_main/prefab/UI_XXX.ts`      | AI 补全逻辑          |

### 注意事项

- 组件（`Com_`）必须**先于**界面（`UI_`）生成，否则 `com_xxx` 引用仅为占位节点
- 脚本绑定是独立的后处理步骤，可单独重新执行而不影响布局
- UUID 是确定性生成的，重新运行工具不会导致引用断裂

---

## 整体流程

```
┌───────────┐     ┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────────┐
│ JSON配置   │ ──▶ │  PSD文件  │ ──▶ │ 解析图层树    │ ──▶ │ 切图导出   │ ──▶ │  生成预制体   │
│(psd/configs)│    │          │     │ (ag-psd)     │     │ (sharp)    │     │  (.prefab)   │
└───────────┘     └──────────┘     └──────────────┘     └───────────┘     └──────────────┘
  GenPsd.js          ↑                   │                    │                   │
  或 Figma       FigmaToPsd.js          ▼                    ▼                   ▼
  或 Photoshop                     图层树 JSON          images/*.png         xxx.prefab
                                   (中间产物)           + *.meta             + 绑定 UUID

所有工具位于 tools/psd/ 目录
```

---

## 依赖

| 库         | 用途                                  | 安装           |
| ---------- | ------------------------------------- | -------------- |
| **ag-psd** | 解析PSD图层树、文字属性、图层像素数据 | `npm i ag-psd` |
| **sharp**  | 图层像素 → PNG切图、效果图合成        | ✅ 已有        |

```bash
npm install ag-psd --save-dev
```

---

## PSD 命名规范

### 图层命名

图层名称决定生成的节点类型和组件，遵循 `前缀_名称` 格式：

| PSD图层名           | 生成节点名   | 自动挂载组件                | 说明       |
| ------------------- | ------------ | --------------------------- | ---------- |
| `btn_start`         | btn_start    | cc.Button + cc.Sprite       | 按钮       |
| `txt_coin`          | txt_coin     | cc.Label                    | 文字标签   |
| `sp_icon`           | sp_icon      | cc.Sprite                   | 精灵图     |
| `progress_hp`       | progress_hp  | cc.ProgressBar              | 进度条     |
| `node_panel`        | node_panel   | （无）                      | 纯节点容器 |
| `layout_items`      | layout_items | cc.Layout                   | 布局容器   |
| `bg` / `background` | background   | cc.Sprite + cc.Widget(全屏) | 背景层     |
| 其他名称            | 保持原名     | cc.Sprite（如有像素）       | 普通图层   |

### 图层组

PSD **图层组(Group)** → 生成 **cc.Node 父节点**，组内图层为子节点。

```
PSD图层面板:                    生成的节点树:
├── [组] node_topBar            ├── node_topBar
│   ├── sp_coinIcon             │   ├── sp_coinIcon (Sprite)
│   ├── txt_coin                │   ├── txt_coin (Label)
│   └── btn_pause               │   └── btn_pause (Button)
├── [组] node_bottom            ├── node_bottom
│   └── btn_start               │   └── btn_start (Button)
└── sp_bg                       └── sp_bg (Sprite, Widget全屏)
```

### 特殊命名约定

| 约定                 | 说明                             | 示例                        |
| -------------------- | -------------------------------- | --------------------------- |
| `#` 开头             | 忽略该图层，不生成节点也不切图   | `#参考线`, `#标注`          |
| `!` 开头             | 生成节点但默认隐藏(active=false) | `!node_waveBanner`          |
| `@9` 后缀            | 九宫格切图(Sprite Type=Sliced)   | `sp_panelBg@9`              |
| `@fill` 后缀         | 填充模式(Sprite Type=Filled)     | `sp_hpFill@fill`            |
| `bg` 或 `background` | 自动添加 cc.Widget 全屏铺满      | `background`                |
| `_bar` 后缀的子图层  | 识别为 ProgressBar 的填充条      | `progress_hp` 下的 `sp_bar` |

### 文字图层

PSD中的 **文字图层** 自动识别：

- 读取文字内容 → `_string`
- 读取字号 → `_fontSize`
- 读取颜色 → `_color`
- 读取对齐 → `_N$horizontalAlign`
- 是否加粗 → `_styleFlags`

**注意：** 文字图层 **不切图**，只生成 cc.Label 组件，使用系统字体。

---

## 切图规则

### 去重策略

同一张图只导出一份PNG，多处引用共享同一个UUID：

```
1. 计算每个图层像素数据的 hash
2. hash 相同 → 复用同一张 PNG 和 UUID
3. hash 不同 → 导出新 PNG
```

### 输出结构

```
output/
├── BattleHUD/                     ← 以PSD文件名为目录
│   ├── preview.png                ← 效果图（PSD合并渲染）
│   ├── images/                    ← 切图目录
│   │   ├── sp_bg.png
│   │   ├── sp_bg.png.meta         ← 自动生成的meta文件
│   │   ├── sp_coinIcon.png
│   │   ├── sp_coinIcon.png.meta
│   │   ├── btn_start.png
│   │   └── btn_start.png.meta
│   └── BattleHUD.prefab           ← 预制体文件
```

### Meta文件生成

每个切图生成对应的 `.meta` 文件，包含稳定的UUID：

```json
{
  "ver": "2.3.7",
  "uuid": "自动生成，基于文件路径hash确保稳定",
  "type": "sprite",
  "wrapMode": "clamp",
  "filterMode": "bilinear",
  "premultiplyAlpha": false,
  "genMipmaps": false,
  "packable": true,
  "width": 300,
  "height": 40,
  "platformSettings": {},
  "subMetas": {
    "文件名": {
      "ver": "1.0.4",
      "uuid": "子UUID，预制体中引用这个",
      "rawTextureUuid": "父UUID",
      "trimType": "auto",
      "trimThreshold": 1,
      "rotated": false,
      "offsetX": 0,
      "offsetY": 0,
      "trimX": 0,
      "trimY": 0,
      "width": 300,
      "height": 40,
      "rawWidth": 300,
      "rawHeight": 40,
      "borderTop": 0,
      "borderBottom": 0,
      "borderLeft": 0,
      "borderRight": 0,
      "subMetas": {}
    }
  }
}
```

**UUID稳定性：** 基于 `项目路径 + 文件名` 生成确定性UUID，相同输入永远得到相同UUID，避免每次重新生成时引用断裂。

---

## 预制体生成规则

### 坐标转换

PSD坐标系（左上角原点） → Cocos坐标系（中心锚点）：

```
cocos_x = psd_left + psd_width/2 - canvas_width/2
cocos_y = canvas_height/2 - (psd_top + psd_height/2)
```

### 节点层级

PSD图层顺序（底层在前） → Cocos子节点顺序（先添加的在底层）：

- PSD最底层图层 → Cocos children[0]
- PSD最顶层图层 → Cocos children[last]

### 组件映射详细规则

#### btn\_ → cc.Button + cc.Sprite

```json
{
  "__type__": "cc.Button",
  "duration": 0.1,
  "zoomScale": 1.1,
  "_N$transition": 3,
  "clickEvents": []
}
```

- 按钮图层的像素数据 → 切图 → cc.Sprite.\_spriteFrame 绑定UUID
- 如果按钮是图层组，组内查找 `label` 子层生成文字

#### txt\_ → cc.Label

```json
{
  "__type__": "cc.Label",
  "_string": "从PSD文字层读取",
  "_fontSize": "从PSD读取",
  "_isSystemFontUsed": true,
  "_N$fontFamily": "Arial",
  "_N$horizontalAlign": "从PSD对齐方式映射"
}
```

- 文字图层不切图
- 颜色从 `node._color` 设置

#### sp\_ → cc.Sprite

```json
{
  "__type__": "cc.Sprite",
  "_spriteFrame": { "__uuid__": "切图的subMeta UUID" },
  "_type": 0,
  "_sizeMode": 0
}
```

- `@9` 后缀 → `_type: 1` (Sliced)
- `@fill` 后缀 → `_type: 3` (Filled)

#### progress\_ → cc.ProgressBar

- 查找子图层中名称含 `bar` 或 `fill` 的 → 作为 barSprite
- 总长度 = 填充条图层的宽度

#### layout\_ → cc.Layout

```json
{
  "__type__": "cc.Layout",
  "_layoutType": 1,
  "_spacingX": 10,
  "_paddingLeft": 0,
  "_paddingRight": 0
}
```

- 根据子图层排列方向自动判断 HORIZONTAL 或 VERTICAL

#### background → cc.Sprite + cc.Widget

自动添加全屏铺满的 Widget：

```json
{
  "__type__": "cc.Widget",
  "_alignFlags": 45,
  "_left": 0,
  "_right": 0,
  "_top": 0,
  "_bottom": 0
}
```

### 预制体根节点

根节点自动挂载 `cc.Widget` 组件，left/right/top/bottom 初始值为 0，铺满父容器：

```json
{
  "__type__": "cc.Widget",
  "_alignFlags": 45,
  "_left": 0,
  "_right": 0,
  "_top": 0,
  "_bottom": 0
}
```

---

## 使用方法

### 命令行

```bash
# 基本用法
node tools/psd/PsdToPrefab.js design.psd

# 指定输出目录
node tools/psd/PsdToPrefab.js design.psd --out assets/net_battle/prefab/ui

# 指定切图输出目录
node tools/psd/PsdToPrefab.js design.psd --img assets/net_battle/textures/ui

# 只生成切图不生成预制体
node tools/psd/PsdToPrefab.js design.psd --images-only

# 只生成预制体（已有切图）
node tools/psd/PsdToPrefab.js design.psd --prefab-only

# 指定设计尺寸（默认750x1334）
node tools/psd/PsdToPrefab.js design.psd --size 750x1334
```

### NPM Scripts

```json
{
  "scripts": {
    "psd": "node tools/psd/PsdToPrefab.js",
    "psd:gen": "node tools/psd/GenPsd.js",
    "psd:gen-all": "node tools/psd/GenPsd.js psd/configs/*.json",
    "psd:battle": "node tools/psd/PsdToPrefab.js psd/BattleHUD.psd --out assets/net_battle/prefab/ui",
    "psd:main": "node tools/psd/PsdToPrefab.js psd/MainMenu.psd --out assets/net_main/prefab"
  }
}
```

---

## 工作流

### 美术出图流程

```
1. 美术在 Photoshop 中按命名规范制作界面
   ├── 图层组用 node_/layout_ 前缀
   ├── 按钮用 btn_ 前缀
   ├── 文字用 txt_ 前缀
   ├── 图片用 sp_ 前缀
   └── 参考标注用 # 前缀（会被忽略）

2. 保存 PSD 文件到 psd/ 目录

3. 运行命令
   $ node tools/psd/PsdToPrefab.js psd/BattleHUD.psd

4. 输出:
   ✅ 效果图: output/BattleHUD/preview.png
   ✅ 切图: output/BattleHUD/images/*.png + .meta
   ✅ 预制体: output/BattleHUD/BattleHUD.prefab

5. 在 Cocos Creator 中刷新资源面板
   → 预制体自动绑定切图
   → 拖入场景即可预览
   → 挂载脚本组件即可使用
```

### 迭代更新流程

```
美术修改PSD → 重新运行命令 → 切图UUID不变 → 预制体自动更新 → 代码无需修改
```

---

## PSD模板图层结构示例（BattleHUD）

```
📁 BattleHUD (750x1334)
├── #标注参考                        ← 忽略
├── [组] node_topBar
│   ├── sp_topBarBg                  ← 顶栏背景图
│   ├── [组] progress_hp
│   │   ├── sp_hpBg                  ← 血条背景
│   │   └── sp_hpFill@fill           ← 血条填充（填充模式）
│   ├── sp_coinIcon                  ← 金币图标
│   ├── txt_coin [文字:"0"]          ← 金币数量
│   ├── txt_wave [文字:"1/5"]        ← 波次
│   └── btn_pause                    ← 暂停按钮图
├── !node_waveBanner                 ← 默认隐藏
│   ├── sp_bannerBg@9                ← 九宫格背景
│   └── txt_waveBanner [文字:"第1波"]
├── [组] node_bottom
│   ├── sp_bottomBg                  ← 底栏背景
│   ├── btn_ammo0                    ← 弹药按钮1
│   ├── btn_ammo1                    ← 弹药按钮2
│   └── btn_ammo2                    ← 弹药按钮3
└── background                       ← 全屏背景（自动Widget铺满）
```

---

## 技术细节

### ag-psd 关键数据结构

```typescript
interface Layer {
  name: string; // 图层名
  hidden: boolean; // 是否隐藏
  left: number; // 左边界 (px)
  top: number; // 上边界 (px)
  right: number; // 右边界 (px)
  bottom: number; // 下边界 (px)
  opacity: number; // 透明度 0~1
  imageData?: {
    // 像素数据 (Node.js环境)
    width: number;
    height: number;
    data: Uint8ClampedArray; // RGBA
  };
  children?: Layer[]; // 子图层（图层组时存在）
  text?: {
    // 文字图层属性
    text: string;
    style: {
      font: { name: string };
      fontSize: number;
      fillColor: { r; g; b };
      justification: string; // 'left'|'center'|'right'
      fauxBold: boolean;
    };
  };
}
```

### 确定性UUID生成

```javascript
const crypto = require("crypto");

function generateStableUUID(seed) {
  const hash = crypto.createHash("md5").update(seed).digest("hex");
  return [
    hash.substr(0, 8),
    hash.substr(8, 4),
    hash.substr(12, 4),
    hash.substr(16, 4),
    hash.substr(20, 12),
  ].join("-");
}

// 同一路径永远得到同一UUID，不会因重新生成而断裂
const uuid = generateStableUUID("net_battle/textures/ui/hud/sp_coinIcon");
```

---

## 界面与组件区分（新增）

### 命名规则

通过 PSD 文件名前缀区分界面、组件和列表项：

| 文件名              | 类型   | 根节点Widget | 生成TS类           | 基类         | 说明               |
| ------------------- | ------ | ------------ | ------------------ | ------------ | ------------------ |
| `UI_BattleHUD.psd`  | 界面   | ✅ 添加      | `UI_BattleHUD.ts`  | BasePanel    | 完整界面，全屏铺满 |
| `Com_CoinItem.psd`  | 组件   | ❌ 不添加    | `Com_CoinItem.ts`  | cc.Component | 可复用组件         |
| `Item_ShopItem.psd` | 列表项 | ❌ 不添加    | `Item_ShopItem.ts` | ListItem     | 列表条目组件       |

### 图层中的组件引用

图层名以特定前缀开头表示引用自定义组件：

```
PSD图层面板:
├── UI_Shop (根节点)
│   ├── com_topBar          ← 引用 Com_TopBar 组件
│   ├── list_items          ← List 组件（滚动列表）
│   ├── com_coinItem_1      ← 引用 Com_CoinItem 组件实例1
│   ├── com_coinItem_2      ← 引用 Com_CoinItem 组件实例2
│   └── btn_close
```

**组件前缀说明：**

| 图层前缀 | 组件类型   | 说明                               |
| -------- | ---------- | ---------------------------------- |
| `com_`   | 自定义组件 | 引用 Com_xxx 组件                  |
| `list_`  | List 组件  | 滚动列表容器，需配合 Item_xxx 使用 |

**注意：** `com_` 和 `list_` 图层不会自动挂载组件脚本，需要手动在生成的预制体中添加组件引用。

### PSD 设计规范（Photoshop 操作指南）

#### 1. 文件命名

在 Photoshop 中保存 PSD 文件时，文件名必须遵循以下规范：

| 文件名格式          | 用途       | 示例                |
| ------------------- | ---------- | ------------------- |
| `UI_界面名.psd`     | 完整界面   | `UI_Shop.psd`       |
| `Com_组件名.psd`    | 自定义组件 | `Com_TopBar.psd`    |
| `Item_列表项名.psd` | 列表条目   | `Item_ShopItem.psd` |

**操作步骤：**

1. 在 Photoshop 中完成设计
2. 点击 **文件 → 存储为**
3. 文件名输入：`UI_Shop.psd` 或 `Com_TopBar.psd`
4. 保存到项目的 `psd/` 目录

#### 2. 图层命名规则

##### 基础组件图层

按照前面的命名规范设置图层名称：

```
UI_Shop.psd
├── background           ← 背景（自动全屏）
├── node_topBar          ← 顶部容器
│   ├── sp_bg            ← 背景图
│   ├── txt_title        ← 标题文字
│   └── btn_close        ← 关闭按钮
├── node_content         ← 内容区域
└── node_bottom          ← 底部容器
```

##### 引用自定义组件

当需要在界面中引用已有的自定义组件时，图层名使用 `com_组件名` 格式：

**示例：引用 Com_TopBar 组件**

```
UI_Shop.psd
├── com_topBar           ← 引用 Com_TopBar.psd 组件
├── node_content
└── btn_close
```

**Photoshop 操作：**

1. 在图层面板中，创建一个新图层或图层组
2. 双击图层名称进行重命名
3. 输入：`com_topBar`（对应 `Com_TopBar.psd`）
4. 该图层可以是占位图或空白图层组

**命名规则：**

- `com_topBar` → 引用 `Com_TopBar` 组件
- `com_coinItem` → 引用 `Com_CoinItem` 组件
- `com_playerInfo` → 引用 `Com_PlayerInfo` 组件

##### 添加 List 滚动列表

当需要添加滚动列表时，图层名使用 `list_列表名` 格式：

**示例：添加商品列表**

```
UI_Shop.psd
├── com_topBar
├── list_shopItems       ← 滚动列表容器
├── node_bottom
└── btn_close
```

**Photoshop 操作：**

1. 创建一个图层组（用于表示列表区域）
2. 重命名为：`list_shopItems`
3. 在组内可以放置占位图或示例条目

**注意：**

- List 组件需要配合 `Item_xxx.psd` 使用
- 例如 `list_shopItems` 通常使用 `Item_ShopItem.psd` 作为条目模板

#### 3. 完整示例：UI_Shop.psd

```
📁 UI_Shop.psd (750x1334)
├── background                    ← 全屏背景
├── com_topBar                    ← 引用 Com_TopBar 组件
├── [组] node_content
│   ├── sp_contentBg              ← 内容区背景
│   ├── list_shopItems            ← 商品列表（滚动）
│   ├── com_coinDisplay_1         ← 金币显示组件实例1
│   └── com_coinDisplay_2         ← 金币显示组件实例2
├── [组] node_bottom
│   ├── sp_bottomBg
│   ├── btn_buy                   ← 购买按钮
│   └── txt_price                 ← 价格文字
└── btn_close                     ← 关闭按钮
```

**对应的组件文件：**

- `Com_TopBar.psd` → 顶部栏组件
- `Com_CoinDisplay.psd` → 金币显示组件
- `Item_ShopItem.psd` → 商品列表条目

#### 4. 设计工作流程

```
1. 设计独立组件
   ├── 创建 Com_TopBar.psd（顶部栏）
   ├── 创建 Com_CoinDisplay.psd（金币显示）
   └── 创建 Item_ShopItem.psd（商品条目）

2. 设计主界面
   ├── 创建 UI_Shop.psd
   ├── 使用 com_topBar 引用顶部栏组件
   ├── 使用 com_coinDisplay 引用金币组件
   └── 使用 list_shopItems 添加滚动列表

3. 生成预制体
   ├── 先生成组件：node tools/psd/PsdToPrefab.js Com_TopBar.psd
   ├── 再生成界面：node tools/psd/PsdToPrefab.js UI_Shop.psd
   └── 在 Cocos Creator 中手动关联组件引用
```

#### 5. 注意事项

- **组件必须先生成**：引用的 `Com_xxx` 组件必须先生成预制体，否则界面中的 `com_xxx` 图层只是占位节点
- **手动关联引用**：生成的预制体中，`com_xxx` 和 `list_xxx` 节点需要在 Cocos Creator 中手动添加组件脚本
- **图层可以是占位**：`com_xxx` 图层在 PSD 中可以是空白图层组或占位图，主要用于标记位置和尺寸
- **命名大小写**：`com_topBar` 对应 `Com_TopBar`，首字母自动转换为大写

---

## 自动生成 TypeScript 类（新增）

### 生成规则

每个 PSD 文件自动生成对应的 TS 类文件：

```
UI_BattleHUD.psd  →  UI_BattleHUD.ts + UI_BattleHUD.prefab
Com_CoinItem.psd  →  Com_CoinItem.ts + Com_CoinItem.prefab
```

### 类文件模板

#### 界面类模板 (UI\_) - 继承 BasePanel

```typescript
import BasePanel from "../../../core/component/BasePanel";

const { ccclass, property } = cc._decorator;
/**
 *
 * @author clong 2026.03.08
 */
@ccclass
export default class UI_BattleHUD extends BasePanel {
  btn_start: cc.Node = null;
  txt_coin: cc.Label = null;

  constructor() {
    super();
  }

  protected afteronLoad(): void {
    //
  }

  onShow(data: any): void {
    //
  }

  onBtnClicked(e: any, name: string) {
    if (name == "btn_close") {
      this.close();
    }
  }

  onHide(): void {
    super.onHide();
  }
}
```

#### 组件类模板 (Com\_) - 继承 cc.Component

```typescript
/**
 *
 * @author clong 2026.03.08
 */
export default class Com_CoinItem extends cc.Component {
  @property(cc.Sprite)
  sp_icon: cc.Sprite = null;

  @property(cc.Label)
  txt_count: cc.Label = null;

  constructor() {
    super();
  }
}
```

#### 列表项模板 (Item\_) - 继承 ListItem

```typescript
import ListItem from "../base/ListItem";
/**
 *
 * @author clong 2026.03.08
 */
export default class Item_ShopItem extends ListItem {
  @property(cc.Sprite)
  sp_icon: cc.Sprite = null;

  @property(cc.Label)
  txt_name: cc.Label = null;

  constructor() {
    super();
  }
}
```

### 节点引用自动生成规则

根据图层前缀自动推断 `@property` 类型：

| 图层前缀               | 生成类型         | 示例                                                  |
| ---------------------- | ---------------- | ----------------------------------------------------- |
| `btn_`                 | `cc.Node`        | `btn_start: cc.Node = null;`                          |
| `txt_`, `lbl_`, `lab_` | `cc.Label`       | `txt_coin: cc.Label = null;`                          |
| `sp_`, `img_`          | `cc.Sprite`      | `sp_icon: cc.Sprite = null;`                          |
| `progress_`            | `cc.ProgressBar` | `progress_hp: cc.ProgressBar = null;`                 |
| `list_`                | `cc.Node`        | `list_items: cc.Node = null;`                         |
| `node_`, `layout_`     | `cc.Node`        | `node_panel: cc.Node = null;`                         |
| `com_`                 | **组件类型**     | `com_topBar: Com_TopBar = null;` **(自动生成import)** |

**注意：**

- 只为第一层子节点生成引用，嵌套子节点需要手动添加
- `com_` 前缀会自动识别为组件引用，生成对应的组件类型和 import 语句

### 组件引用功能（新增）

当图层名以 `com_` 开头时，自动识别为组件引用：

**示例：**

```
PSD 图层: com_topBar
生成代码:
  - import Com_TopBar from "./comp/Com_TopBar";
  - com_topBar: Com_TopBar = null;
```

**命名转换规则：**

- `com_topBar` → `Com_TopBar`（首字母大写，com* 替换为 Com*）
- `com_coinItem` → `Com_CoinItem`
- `com_playerInfo` → `Com_PlayerInfo`

### 脚本挂载（解耦两步流程）

脚本绑定与预制体布局生成完全分离，分两个独立步骤执行：

**Step A — 生成纯布局预制体**（`buildPrefab`，不含脚本）

**Step B — 后处理注入脚本引用**（`bindScriptToPrefab`，独立函数）

最终注入到根节点的脚本组件格式（`__type__` 为脚本 UUID 的压缩形式）：

```json
{
  "__type__": "3097fbMLK8JxBa55vc313900",
  "_name": "",
  "_objFlags": 0,
  "node": { "__id__": 1 },
  "_enabled": true,
  "_id": ""
}
```

> 这与 Cocos Creator Editor 实际写入 prefab 的格式一致（可参考 `zombie.prefab` 中的自定义脚本条目）。

**解耦优势：**

- `buildPrefab()` 只关心布局，不接收 `tsUuid` 参数，可独立测试
- `bindScriptToPrefab(prefabJson, scriptUuid)` 独立可复用，可对任意 prefab JSON 后处理
- 如需跳过脚本绑定（纯布局预览），直接不调用 `bindScriptToPrefab` 即可

### .meta 文件自动生成（新增）

每个 TS 文件自动生成对应的 `.meta` 文件，包含稳定的 UUID：

```json
{
  "ver": "1.0.8",
  "uuid": "3097fb8a-b451-308e-a88a-5cbb5c313900",
  "isPlugin": false,
  "loadPluginInWeb": true,
  "loadPluginInNative": true,
  "loadPluginInEditor": false,
  "subMetas": {}
}
```

**UUID 稳定性：** 基于文件路径生成确定性 UUID，相同路径永远得到相同 UUID，避免引用断裂。

### 输出结构

```
output/
├── UI_BattleHUD/
│   ├── preview.png
│   ├── images/
│   │   └── *.png + .meta
│   ├── UI_BattleHUD.prefab      ← 预制体（已挂载脚本）
│   ├── UI_BattleHUD.ts          ← 界面类
│   └── UI_BattleHUD.ts.meta     ← 脚本 meta 文件
├── Com_CoinItem/
│   ├── preview.png
│   ├── images/
│   │   └── *.png + .meta
│   ├── Com_CoinItem.prefab
│   └── comp/                     ← 组件 TS 放在 comp 子目录
│       ├── Com_CoinItem.ts
│       └── Com_CoinItem.ts.meta
└── Item_ShopItem/
    ├── preview.png
    ├── images/
    │   └── *.png + .meta
    ├── Item_ShopItem.prefab
    └── items/                    ← 列表项 TS 放在 items 子目录
        ├── Item_ShopItem.ts
        └── Item_ShopItem.ts.meta
```

---

## 实战示例：主界面（UI_MainMenu）完整流程

> 对应设计稿：`psd/UI_MainMenu.psd`
> 对应效果图：`策划文档/UI效果图/4_主界面.png`
> 最后更新：2026-03-14（新增选关按钮）

### 第一步：PSD 图层结构设计

按照以下图层树在 Photoshop 中制作设计稿，文件保存为 `psd/UI_MainMenu.psd`：

```
📁 UI_MainMenu.psd  (750 × 1334)
│
├── [组] node_topBar                  ← 顶部状态栏
│   ├── btn_setting                   ← 齿轮设置按钮  80×80  右上角
│   ├── sp_coinIcon                   ← 金币图标      48×48
│   └── txt_coin [文字:"10000"]       ← 金币数量 Label，系统字体
│
├── [组] node_center                  ← 中部主区域
│   ├── sp_logo                       ← 游戏 Logo    500×200
│   ├── btn_start                     ← 开始游戏按钮  300×90  绿色主按钮
│   ├── btn_levelSelect               ← 选择关卡按钮  260×80  黄色次按钮（新增）
│   └── [组] node_progress            ← 进度提示区
│       ├── sp_progressBg@9           ← 进度背景（九宫格）
│       └── txt_progress [文字:"当前进度：第 1 关"]  ← 进度文本 Label
│
├── [组] node_bottom                  ← 底部入口区
│   └── btn_shop                      ← 商城按钮     120×120  金色
│
└── background                        ← 全屏背景图   750×1334（自动 Widget 铺满）
```

**特殊约定：**

- `background` → 自动添加 `cc.Widget` 全屏铺满，无需手动设置
- `sp_progressBg@9` 的 `@9` 后缀 → 生成 `Sprite Type = Sliced` 九宫格
- `txt_coin`、`txt_progress` 等文字图层 → 自动读取 PSD 字号、颜色，**不切图只生成 Label**
- 参考线和标注图层以 `#` 开头，会被工具自动忽略（如 `#参考线`、`#尺寸标注`）

---

### 第二步：检查命名规范

在运行工具之前，对照下表检查图层命名是否正确：

| 图层名            | 期望组件                    | 说明                    |
| ----------------- | --------------------------- | ----------------------- |
| `background`      | cc.Sprite + cc.Widget(全屏) | 全屏背景必须命名为这个  |
| `node_topBar`     | cc.Node                     | 纯容器，无 Sprite       |
| `btn_setting`     | cc.Button + cc.Sprite       | 切图 + 绑定按钮事件     |
| `sp_coinIcon`     | cc.Sprite                   | 切图，不挂按钮          |
| `txt_coin`        | cc.Label                    | 不切图，读取文字内容    |
| `sp_logo`         | cc.Sprite                   | 切图 Logo               |
| `btn_start`       | cc.Button + cc.Sprite       | 绿色开始按钮            |
| `btn_levelSelect` | cc.Button + cc.Sprite       | 黄色选关按钮（新增）    |
| `sp_progressBg@9` | cc.Sprite（Sliced）         | 九宫格，供 Label 背景用 |
| `txt_progress`    | cc.Label                    | 显示进度文字            |
| `btn_shop`        | cc.Button + cc.Sprite       | 商城入口                |

---

### 第三步：运行导出工具

PSD 制作完成并保存到 `psd/UI_MainMenu.psd` 后，在项目根目录执行：

```bash
# 标准导出（生成预制体 + 切图 + TS 类 + 效果图）
node tools/psd/PsdToPrefab.js psd/UI_MainMenu.psd --out assets/net_main/prefab --img assets/net_main/images/ui/main
```

或使用 npm script（需提前在 package.json 中注册）：

```bash
npm run psd:main
```

对应 `package.json` 配置：

```json
{
  "scripts": {
    "psd:main": "node tools/psd/PsdToPrefab.js psd/UI_MainMenu.psd --out assets/net_main/prefab --img assets/net_main/images/ui/main"
  }
}
```

---

### 第四步：工具输出结果

运行成功后，在 `output/UI_MainMenu/` 目录下生成以下文件：

```
output/UI_MainMenu/
├── preview.png                      ← ✅ 效果图（PSD 合并渲染，同步更新 UI效果图）
│
├── images/                          ← ✅ 切图目录
│   ├── background.png
│   ├── background.png.meta
│   ├── btn_setting.png
│   ├── btn_setting.png.meta
│   ├── sp_coinIcon.png
│   ├── sp_coinIcon.png.meta
│   ├── sp_logo.png
│   ├── sp_logo.png.meta
│   ├── btn_start.png
│   ├── btn_start.png.meta
│   ├── btn_levelSelect.png          ← 选关按钮切图（新增）
│   ├── btn_levelSelect.png.meta
│   ├── sp_progressBg.png
│   ├── sp_progressBg.png.meta
│   └── btn_shop.png
│   └── btn_shop.png.meta
│
├── UI_MainMenu.prefab               ← ✅ 预制体（节点树 + 组件绑定 + 切图UUID）
├── UI_MainMenu.prefab.meta
│
├── UI_MainMenu.ts                   ← ✅ 自动生成 TS 类（挂载到预制体根节点）
└── UI_MainMenu.ts.meta
```

---

### 第五步：自动生成的 TS 类

工具根据图层命名自动生成如下类文件，放置在 `output/UI_MainMenu/UI_MainMenu.ts`：

```typescript
import BasePanel from "../../../core/component/BasePanel";

const { ccclass, property } = cc._decorator;
/**
 * 主界面
 * @author clong 2026.03.14
 */
@ccclass
export default class UI_MainMenu extends BasePanel {
  // ── 顶部栏 ──────────────────────────────────────────
  @property(cc.Node)
  btn_setting: cc.Node = null;

  @property(cc.Label)
  txt_coin: cc.Label = null;

  // ── 中部主区域 ───────────────────────────────────────
  @property(cc.Node)
  btn_start: cc.Node = null;

  @property(cc.Node)
  btn_levelSelect: cc.Node = null; // 选择关卡按钮（新增）

  @property(cc.Label)
  txt_progress: cc.Label = null; // 当前进度文本

  // ── 底部 ─────────────────────────────────────────────
  @property(cc.Node)
  btn_shop: cc.Node = null;

  constructor() {
    super();
  }

  protected afteronLoad(): void {
    // 初始化进度文本
  }

  onShow(data: any): void {
    // 刷新金币、进度显示
  }

  onBtnClicked(e: any, name: string) {
    if (name === "btn_start") {
      // 直接进入当前进度关卡
    } else if (name === "btn_levelSelect") {
      // 打开关卡选择界面
    } else if (name === "btn_shop") {
      // 打开商城
    } else if (name === "btn_setting") {
      // 打开设置面板
    }
  }

  onHide(): void {
    super.onHide();
  }
}
```

---

### 第六步：导入 Cocos Creator

将生成文件复制/导入到项目对应 Bundle 目录后：

```
assets/net_main/
├── prefab/
│   ├── UI_MainMenu.prefab
│   └── UI_MainMenu.prefab.meta
└── images/
    └── ui/
        └── main/
            ├── background.png  (.meta)
            ├── btn_start.png   (.meta)
            ├── btn_levelSelect.png (.meta)     ← 新增
            └── ... (其余切图)

assets/scripts/game/
└── ui/
    └── UI_MainMenu.ts
    └── UI_MainMenu.ts.meta
```

**在 Cocos Creator 编辑器中完成以下操作：**

1. **确认资源导入** — 检查 `net_main/` Bundle 中的切图和预制体是否已经识别
2. **打开预制体** — 双击 `UI_MainMenu.prefab`
3. **手动挂载脚本** — 由于当前脚本UUID挂载存在已知问题，需要：
   - 选中预制体根节点
   - `属性检查器` → `添加组件` → 搜索 `UI_MainMenu` → 确认挂载
4. **绑定节点引用** — 将预制体中对应节点拖到脚本属性槽中：
   - `btn_start` → 拖入 btn_start 节点
   - `btn_levelSelect` → 拖入 btn_levelSelect 节点（新增）
   - `txt_coin` → 拖入 txt_coin 节点
   - `txt_progress` → 拖入 txt_progress 节点（新增）
   - 其余节点同理
5. **注册到 WindowInfos** — 在 `WindowInfos.UI` 中添加主界面入口（如未注册）：

```typescript
// assets/scripts/game/ui/WindowInfos.ts
export const MainMenu = {
  path: "prefab/UI_MainMenu",
  bundle: "net_main",
  mode: CacheMode.Temporary,
  priority: UILayer.Normal,
  immediately: false,
  duration: 0.3,
};
```

---

### 流程总览

```
AI 辅助
  → 描述需求：主界面需要哪些功能入口、交互逻辑、视觉风格
  → AI 输出：UI美术资源方案.md（素材清单、布局草图、交互说明）
        ↓
美术方案
  → 确认素材清单（background/logo/btn_start/btn_levelSelect/...）
  → 确认布局设计（各元素尺寸、位置区域、配色方案）
  → 参考：策划文档/UI美术资源方案.md
        ↓
Photoshop 制作 PSD
  → 图层命名遵循 btn_/txt_/sp_/node_/layout_/background 规范
  → 文件保存为 psd/UI_MainMenu.psd
        ↓
运行导出工具
  node tools/psd/PsdToPrefab.js psd/UI_MainMenu.psd ...
        ↓
工具自动产出
  ├── preview.png        ← 效果图（存入 策划文档/UI效果图/4_主界面.png）
  ├── images/*.png+meta  ← 切图（拷贝到 net_main/images/ui/main/）
  ├── UI_MainMenu.prefab ← 预制体（拷贝到 net_main/prefab/）
  └── UI_MainMenu.ts     ← TS 类（拷贝到 scripts/game/ui/）
        ↓
Cocos Creator 导入
  ├── 确认资源识别
  ├── 手动挂载脚本 UI_MainMenu.ts 到预制体根节点
  ├── 绑定节点属性（btn_start, btn_levelSelect, txt_coin 等）
  └── 确认 WindowInfos.ts 注册
        ↓
代码逻辑（UI_MainMenu.ts）
  └── 实现按钮点击：开始游戏 / 选择关卡 / 商城 / 设置
```

---

## 已知问题

### 脚本组件挂载问题

**问题描述：**
生成的预制体文件中，脚本组件虽然已按照 Cocos Creator 格式挂载（使用压缩 UUID 作为 `__type__`），但在 Cocos Creator 编辑器中打开预制体时，脚本组件无法正确识别或加载。

**当前实现：**

```json
{
  "__type__": "GMhqyJxA7vTetfP3PrtJbA", // 压缩后的 UUID
  "_name": "",
  "_objFlags": 0,
  "node": { "__id__": 1 },
  "_enabled": true,
  "_id": ""
}
```

**可能原因：**

1. 压缩 UUID 算法与 Cocos Creator 实际使用的算法不一致
2. 预制体中缺少其他必要的元数据字段
3. TS 脚本的 .meta 文件格式不完整
4. 脚本组件的引用路径或注册机制有问题

**临时解决方案：**
生成预制体后，在 Cocos Creator 编辑器中手动重新挂载脚本组件。

**待解决：**
需要进一步研究 Cocos Creator 2.4.15 的预制体格式和脚本组件挂载机制，对比手动挂载脚本后生成的预制体文件，找出差异并修复。

---

## JSON 配置驱动生成 PSD（GenPsd.js）

> 工具路径：`tools/psd/GenPsd.js`
> 辅助库：`tools/psd/PsdCanvasHelpers.js`
> 配置目录：`psd/configs/`
> 作者：clong 2026.03.15

### 概述

使用 JSON 配置文件声明式描述界面图层树，由统一的 `GenPsd.js` 工具读取配置生成 PSD 文件。新增界面只需写一个 JSON，无需创建新的 JS 文件。

```
psd/configs/UI_xxx.json → GenPsd.js → psd/UI_xxx.psd → PsdToPrefab.js → 预制体
```

### 命令行用法

```bash
# 生成单个界面
node tools/psd/GenPsd.js psd/configs/UI_ResultVictory.json

# 指定输出路径
node tools/psd/GenPsd.js psd/configs/UI_ResultVictory.json --out psd/UI_ResultVictory.psd

# 批量生成所有配置
npm run psd:gen-all
```

### JSON 配置格式

每个 JSON 文件放在 `psd/configs/` 目录下，结构如下：

```json
{
  "name": "UI_ResultVictory",
  "width": 750,
  "height": 1334,
  "colors": {
    "WHITE": [255, 255, 255],
    "GOLD": [255, 210, 55],
    "BTN_START": [44, 152, 58]
  },
  "layers": [
    { "type": "text", "name": "txt_title", "text": "VICTORY!", ... },
    { "type": "button", "name": "btn_next", "color": "BTN_START", ... },
    { "type": "group", "name": "node_stats", "children": [...] },
    { "type": "noise", "name": "background", ... }
  ]
}
```

### 图层类型

| JSON type  | 生成效果           | 必须参数              | 可选参数                  |
| ---------- | ------------------ | --------------------- | ------------------------- |
| `solid`    | 纯色矩形           | `color`               | `alpha`                   |
| `gradient` | 线性渐变           | `color1`, `color2`    | `alpha`, `direction`      |
| `button`   | 圆角按钮（高光+阴影）| `color`              |                           |
| `radial`   | 径向渐变（光晕）   | `color1`, `color2`    | `alpha`                   |
| `noise`    | 噪点纹理           | `color`               | `alpha`, `magnitude`, `seed` |
| `overlay`  | 半透明遮罩         | `color`               | `alpha`                   |
| `star`     | 五角星             | `size`, `color1`, `color2` |                      |
| `circle`   | 圆形               | `size`, `color`       |                           |
| `text`     | 文字图层           | `text`, `fontSize`    | `color`, `bold`, `align`  |
| `group`    | 容器（递归子图层） | `children`            |                           |

### 颜色定义

颜色支持两种写法：
- **引用名称**：`"color": "GOLD"` — 从顶层 `colors` 查找
- **RGB 数组**：`"color": [255, 210, 55]` — 直接使用

### 现有配置文件

| 配置文件                         | 对应界面         |
| -------------------------------- | ---------------- |
| `psd/configs/UI_MainMenu.json`   | 主菜单           |
| `psd/configs/UI_MainHome.json`   | 标签页主界面     |
| `psd/configs/UI_ResultVictory.json` | 胜利结算      |
| `psd/configs/UI_ResultDefeat.json`  | 失败结算      |
| `psd/configs/BattleHUD_demo.json`   | 战斗HUD Demo  |

### 新增界面流程

```
1. 在 psd/configs/ 下创建 UI_NewPanel.json
   → 定义 name、width、height、colors、layers
      ↓
2. 运行 GenPsd 生成 PSD
   node tools/psd/GenPsd.js psd/configs/UI_NewPanel.json
      ↓
3. 运行 PsdToPrefab 生成预制体
   node tools/psd/PsdToPrefab.js psd/UI_NewPanel.psd --out ...
      ↓
4. Cocos Creator 导入 + 挂载脚本
```

---

## Figma → PSD 转换工具（FigmaToPsd.js）

> 工具路径：`tools/psd/FigmaToPsd.js`
> 作者：clong 2026.03.14
> 依赖：`ag-psd`（写入 PSD）、`sharp`（图片解码）

### 概述

使用 Figma REST API 读取设计稿，将各图层下载为 PNG 后重新组合成标准 PSD 文件，可直接接入 `PsdToPrefab.js → Prefab` 预制体管道。

```
Figma 设计稿 → FigmaToPsd.js → PSD 文件 → PsdToPrefab.js → 预制体 + 切图 + TS
```

（所有工具均位于 `tools/psd/` 目录）

### 前置准备

**获取 Figma 访问令牌：**

1. 打开 Figma → 账号设置 → 安全 → 个人访问令牌
2. 点击「生成新令牌」
3. 设置环境变量或命令行传入：
   ```bash
   # PowerShell
   $env:FIGMA_TOKEN="figd_xxxx"
   # CMD
   set FIGMA_TOKEN=figd_xxxx
   ```

### 命令行用法

```bash
node tools/psd/FigmaToPsd.js <figma-file-key-or-url> [选项]
```

| 选项             | 说明                                       | 默认值            |
| ---------------- | ------------------------------------------ | ----------------- |
| `--token <tok>`  | Figma 个人访问令牌（或 `FIGMA_TOKEN` 环境变量） | 环境变量          |
| `--frame <name>` | 目标画框名                                 | 第一个画框        |
| `--out <path>`   | 输出 PSD 路径                              | `psd/<画框名>.psd` |
| `--scale <n>`    | 图片导出倍率（Retina 用 2）                | 1                 |
| `--save-img <dir>` | 调试：将下载的图片另存到此目录           | 不保存            |
| `--list-frames`  | 列出文件中所有画框名后退出                 | —                 |

**示例：**

```bash
# 列出所有画框
node tools/psd/FigmaToPsd.js https://figma.com/file/XXXXX --token figd_xxxx --list-frames

# 导出指定画框为 PSD
node tools/psd/FigmaToPsd.js https://figma.com/file/XXXXX --token figd_xxxx --frame UI_MainMenu --out psd/UI_MainMenu.psd

# 2倍分辨率导出
node tools/psd/FigmaToPsd.js XXXXX --frame UI_Shop --scale 2
```

### Figma 图层命名规范

在 Figma 中按以下规范命名图层，与 PsdToPrefab.js 完全一致：

| Figma 图层名         | 生成节点类型                | 说明                       |
| -------------------- | --------------------------- | -------------------------- |
| `background`         | cc.Sprite + cc.Widget(全屏) | 背景层，自动铺满           |
| `btn_xxx`            | cc.Button + cc.Sprite       | 按钮，自动切图             |
| `txt_xxx`            | cc.Label                    | 文字，自动读取文字属性（不切图） |
| `sp_xxx`             | cc.Sprite                   | 精灵图，自动切图           |
| `node_xxx`           | cc.Node（无组件）           | 纯容器                     |
| `progress_xxx`       | cc.ProgressBar              | 进度条                     |
| `layout_xxx`         | cc.Layout                   | 布局容器                   |
| `com_xxx`            | 自定义组件引用              | 引用 Com_Xxx 组件          |
| `list_xxx`           | 滚动列表容器                | 配合 Item_Xxx 使用         |
| 以 `#` 开头          | （忽略）                    | 不导出、不生成节点         |
| 以 `!` 开头          | 默认隐藏节点                | active=false               |
| 后缀 `@9`            | cc.Sprite（Sliced）         | 九宫格切图                 |
| 后缀 `@fill`         | cc.Sprite（Filled）         | 填充模式                   |

### Figma 节点类型处理

工具对 Figma 节点按以下规则分类处理：

| Figma 节点类型                              | 处理方式                 |
| ------------------------------------------- | ------------------------ |
| GROUP / FRAME / SECTION / COMPONENT_SET     | 作为容器组，递归子图层   |
| TEXT                                        | 读取文字属性（字号、颜色、对齐、加粗），不下载图片 |
| 其他（RECTANGLE / ELLIPSE / VECTOR 等）     | 下载 PNG 图片，作为图片图层写入 PSD |
| `visible: false` 的节点                      | 跳过                     |
| 名称以 `#` 开头的节点                        | 跳过                     |

### 坐标与图层顺序

**坐标系对齐：**
- Figma 使用文档绝对坐标（`absoluteBoundingBox`）
- PSD 使用画框内相对坐标（`left/top` 相对画框左上角）
- 转换：`psd_left = figma_x - frame_x`，`psd_top = figma_y - frame_y`

**图层顺序对齐：**
- Figma：`children[0]` = 视觉最底层，`children[last]` = 最顶层
- PSD (ag-psd)：`children[0]` = 最顶层（Photoshop 图层面板约定）
- 工具内部自动 reverse 处理

### 完整工作流：Figma → 预制体

```
1. 在 Figma 中设计界面，按上述命名规范命名图层
      ↓
2. 运行 FigmaToPsd 导出 PSD
   node tools/psd/FigmaToPsd.js <file-key> --frame UI_MainMenu --out psd/UI_MainMenu.psd
      ↓
3. 运行 PsdToPrefab 生成预制体 + 切图 + TS
   node tools/psd/PsdToPrefab.js psd/UI_MainMenu.psd --out assets/net_main/prefab --img assets/net_main/images/ui/main
      ↓
4. 在 Cocos Creator 中导入资源、挂载脚本、绑定节点
```

### 注意事项

- Figma API 单次最多导出 50 个节点图片，工具会自动分批请求
- 文字节点直接读取 Figma 文字属性写入 PSD，无需下载图片
- `--scale 2` 可导出 Retina 2x 分辨率，但 PSD 画布尺寸不变，图片更清晰
- 输出的 PSD 文件可直接用 Photoshop 打开检查或二次编辑

---

## 扩展计划

| 功能                 | 优先级     | 说明                                     |
| -------------------- | ---------- | ---------------------------------------- |
| 基础PSD→Prefab       | ⭐⭐⭐⭐⭐ | 核心功能 ✅ 已完成                       |
| 文字图层解析         | ⭐⭐⭐⭐⭐ | 自动读取字号/颜色/内容 ✅ 已完成         |
| 九宫格检测           | ⭐⭐⭐⭐   | @9后缀 + 自动计算border ✅ 已完成        |
| 图层去重             | ⭐⭐⭐⭐   | hash相同只导出一份 ✅ 已完成             |
| **界面/组件区分**    | ⭐⭐⭐⭐⭐ | **UI\_/Com\_/Item\_ 前缀区分** ✅ 已完成 |
| **自动生成TS类**     | ⭐⭐⭐⭐⭐ | **自动生成脚本并挂载 + .meta** ✅ 已完成 |
| **组件引用功能**     | ⭐⭐⭐⭐⭐ | **com\_ 前缀自动生成import** ✅ 已完成   |
| **Figma→PSD转换**    | ⭐⭐⭐⭐   | **FigmaToPsd.js** ✅ 已完成              |
| **JSON配置驱动GenPsd** | ⭐⭐⭐⭐⭐ | **GenPsd.js + JSON 配置** ✅ 已完成       |
| Watch模式            | ⭐⭐⭐     | 监听PSD变化自动重新生成                  |
| 多PSD批量处理        | ⭐⭐⭐     | 支持通配符 `psd/*.psd`                   |
| 图集打包             | ⭐⭐       | 小图自动合成TexturePacker图集            |
| 动画帧支持           | ⭐⭐       | 识别 `frame_01` `frame_02` 命名          |
| Cocos Creator 插件版 | ⭐         | 集成到编辑器菜单                         |
