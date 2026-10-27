# Changelog

这个文件记录项目的主要发布变更。

## [0.1.0] - 2026-10-26

### Added

- **项目初始化与核心架构搭建**：
  - 基于 **Tauri 2 + Vue 3 + TypeScript + Tailwind CSS** 搭建跨平台本地离线开发者工具箱基础架构。
  - 设计模块化与插件化工具注册机制 (`src/tools/registry.ts`)，工具独立解耦，支持低成本横向扩展。
  - 提供标准化工具容器 (`ToolContainer`)、通用多功能文本编辑组件 (`TextEditorBox`) 与带动画反馈的复制组件 (`CopyButton`)。
- **系统级基础能力**：
  - **主题模式切换**：支持浅色明亮 (Light)、深色暗黑 (Dark) 及跟随操作系统 (System) 三种主题色彩模式，配置自动持久化存储。
  - **多语言国际化 (i18n)**：完整支持简体中文 (`zh-CN`) 与英文 (`en-US`)，实现界面文本与工具元信息 100% 覆盖。
  - **全局快捷搜索与收藏体系**：支持全局快捷键 `Ctrl+K` / `⌘K` 快速聚焦搜索，支持按工具名称、简介和拼音关键词即时过滤；支持一键加星收藏与卡片式仪表盘总览。
  - **自适应侧边栏导航**：支持侧边栏展开与折叠紧凑模式，收起时图标与高亮背景严格几何居中对齐，顶栏支持联动展开。
- **内置首批 7 款高频实用工具**：
  - **JSON 格式化 / 校验**：支持 2/4 格空格与 Tab 缩进美化、单行压缩、双引号转义/反转义及 JSON 语法实时高亮报错定位。
  - **Base64 文本编解码**：支持 UTF-8 安全转码（中文不乱码）、URL-Safe 模式切换与实时双向同步。
  - **URL 编解码**：支持 `encodeURI` 与 `encodeURIComponent` 两种模式自由切换及 Query 参数快速解析。
  - **Unix 时间戳转换**：支持当前时间动态流逝时钟（可暂停）、秒/毫秒戳互转、本地时间/UTC/ISO 8601 双向精准换算。
  - **UUID / 随机生成器**：批量生成 UUID v4、大小写/连字符选项，额外支持高强度安全随机密码与 Token 生成。
  - **Hash 哈希散列计算器**：利用 Web Crypto 原生硬件加速，秒算 MD5、SHA-1、SHA-256、SHA-384、SHA-512。
  - **文本分析与命名风格转换**：字符/词数/行数/字节统计，支持 camelCase、PascalCase、snake_case、kebab-case、CONSTANT_CASE 等主流命名法一键转换。
- **桌面原生配置与自动化构建**：
  - 设计并引入 DevCrate 官方专属品牌 Logo。
  - 生成包含 16px 至 512px 全尺寸带 Alpha 通道的桌面全平台图标（Windows `.ico`、macOS `.icns`、Linux/窗口 `.png`）。
  - 配置 Windows NSIS 安装包自定义 `installerIcon` 与中文字符支持。
  - 配置 GitHub Actions 跨平台自动化编译与打包流水线（Ubuntu、macOS、Windows）。
