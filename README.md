# Komari Arona & Plana

> **非商业同人作品**
> 本主题中的阿洛娜 / 普拉娜形象版权归 Nexon / Yostar《蔚蓝档案》所有，
> 属非商业同人素材，可自由用于非商业目的的传播，**不得用于任何商业用途**。
>
> Fan-made, non-commercial. Arona & Plana are © Nexon / Yostar (Blue Archive).
> Free to use and redistribute for non-commercial purposes; commercial use is not permitted.

一个 Komari 监控主题，支持**日间 / 夜间双形态**：日间为阿洛娜（蔚蓝档案蓝白），夜间为普拉娜（深紫近黑）。切换主题时角色形象、header logo、加载页主视觉与整套配色整体切换。

## 特性

- 🌗 **双形态主题** - 浅色 = 阿洛娜 / 深色 = 普拉娜，吉祥物与配色整体切换，支持跟随系统
- ✨ **电子粒子特效** - 全屏 canvas 光点，颜色随主题变化，尊重 `prefers-reduced-motion`
- 📊 **双视图模式** - 网格视图和表格视图自由切换
- 🌐 **多语言支持** - 内置中文/英文/日语切换
- 📡 **WebSocket 实时监控** - 实时数据更新
- 📈 **延迟分析** - 节点延迟详情页，支持 EWMA 平滑、多时间范围、任务级延迟与丢包率统计
- 📱 **响应式设计** - 完美适配各种设备
- 🏳️ **国旗图标** - 支持全球国家和地区旗帜显示

## 安装

1. 将 `dist/` 与 `komari-theme.json` 打成 ZIP
2. 上传到 Komari 主题
3. 在 Komari 配置中选择 **Komari Arona & Plana**

> 打包产物含非商业同人素材，可自由分享，请勿用于商业用途。

## 项目结构

```
komari-arona-plana/
├── .github/
│   └── workflows/
│       ├── test.yml           # CI 测试（node 测试 + var 检查 + 文件存在检查）
│       └── release.yml        # 仅本地打包（刻意不创建 GitHub Release）
├── dist/
│   ├── assets/
│   │   ├── css/              # 样式模块
│   │   │   ├── base.css      # 基础样式 + 主题变量 + 双形态切换规则
│   │   │   ├── header.css    # 头部
│   │   │   ├── stats.css     # 统计
│   │   │   ├── welcome.css   # 欢迎区域
│   │   │   ├── preloader.css # 预加载器
│   │   │   ├── nodes-grid.css  # 节点网格视图
│   │   │   ├── nodes-table.css # 节点表格视图
│   │   │   ├── nodes.css       # 节点动画+响应式
│   │   │   ├── modal-base.css  # 模态框基础结构
│   │   │   ├── modal-info.css  # 模态框信息面板
│   │   │   ├── modal-charts.css # 模态框图表
│   │   │   ├── modal-latency.css # 模态框延迟分析
│   │   │   ├── modal.css       # 模态框动画+响应式
│   │   │   └── footer.css    # 页脚
│   │   ├── flags/            # 国旗 SVG 图标（按需加载）
│   │   ├── img/              # 图片资源（arona-* / plana-* 为双形态素材）
│   │   ├── logo/             # 系统图标
│   │   └── js/
│   │       ├── app.js        # 应用入口
│   │       ├── particles.js  # 电子粒子特效（可选，按需加载）
│   │       ├── core/         # 核心状态与常量
│   │       │   ├── state.js
│   │       │   ├── constants.js
│   │       │   └── error-boundary.js
│   │       ├── i18n/         # 国际化
│   │       │   └── index.js  # zh-CN / en / ja + t() / tr()
│   │       ├── services/     # 通信层
│   │       ├── ui/           # UI 渲染
│   │       ├── algorithms/    # 数据处理算法
│   │       └── utils/        # 工具函数
│   └── index.html             # 主页面
├── test/                      # 测试
├── komari-theme.json          # 主题配置
├── package.json               # 项目配置
├── eslint.config.js          # ESLint v9+ flat config
└── README.md
```

## 主题与素材

| 主题 | 角色 | 配色 | 素材 |
|------|------|------|------|
| `light` | 阿洛娜 | 蔚蓝档案蓝白 | `assets/img/arona-*.webp` |
| `dark` | 普拉娜 | 深紫近黑 + 品红/紫 | `assets/img/plana-*.webp` |

切换由 CSS 驱动：`base.css` 里 `.brand-light` / `.brand-dark` 与 `.mascot-light` / `.mascot-dark` 两组类随 `<html data-theme>` 互斥显示，无需 JS 参与图片切换。

`<head>` 里有一段内联脚本，在任何样式表加载前设好 `data-theme`，避免加载页阶段先闪浅色再跳深色。

## 配置选项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `default_theme` | select | system | 默认主题（light/dark/system） |
| `default_view` | select | grid | 默认视图（grid/table） |
| `show_uptime` | switch | true | 显示运行时间 |
| `show_network_speed` | switch | true | 显示网络速度 |
| `show_traffic_tags` | switch | false | 显示流量标签 |
| `icon_bounce` | switch | true | 图标跳动动画 |
| `sakura_enabled` | switch | true | 电子粒子特效（键名为历史遗留，现控制电子粒子） |
| `preloader_enabled` | switch | true | 显示加载页面 |
| `mascot_enabled` | switch | true | 显示欢迎小人 |
| `mascot_url` | string | - | 自定义小人图片URL（设置后两个主题都用这张） |
| `pc_background_url` | string | - | PC端自定义背景URL（支持图片和视频） |
| `mobile_background_url` | string | - | 手机端自定义背景URL（支持图片和视频） |
| `refresh_interval` | number | 2 | 刷新间隔（秒） |
| `custom_footer` | string | - | 自定义页脚文本 |

> `sakura_enabled` 的键名是历史遗留。它直接对应已保存的配置值，改名会让既有站点的设置失效并回落默认，因此保留键名、只更新显示文案。

## 开发

### 本地预览

使用本地 HTTP 服务器预览（ESM 不支持 `file://` 协议）：

```bash
cd dist && python -m http.server 8080
```

> 静态服务器没有 Komari 的 RPC 接口，仪表盘会报「加载失败」并重试。这是**预期行为**：加载页、主题切换、双形态素材都可在这一层完整验证；要看真实数据请装进 Komari 实例。

### 修改主题

1. 修改 `dist/` 目录下的文件
2. 更新 `komari-theme.json` 配置
3. 跑 `npm test` 与 `npm run lint:check`

### 重新生成角色素材

素材由全身立绘裁出头肩景后导出，生成脚本在仓库外（需要 Pillow）：

```bash
python -I make_assets.py
```

## 许可证

代码与样式采用 MIT License（见 `LICENSE`）。

**角色形象素材不在 MIT 覆盖范围内** —— 阿洛娜 / 普拉娜版权归 Nexon / Yostar，属非商业同人素材，可在官方同人指引范围内自由传播，不得用于商业用途。详见 `LICENSE` 末尾的 NOTICE 段。

## 相关链接

- [Komari Monitor](https://github.com/komari-monitor/komari)
- [Blue Archive](https://bluearchive.jp/)（角色形象出处，版权归 Nexon / Yostar）
