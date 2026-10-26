<div align="center">
  <img src="public/logo.png" width="96" height="96" alt="DevCrate Logo" />
  <h1>DevCrate</h1>
  <p>面向开发者的本地离线工具箱，基于 Tauri 2 + Vue 3。</p>
</div>

## 特性

- 本地离线运行，数据不离机
- 浅色 / 深色 / 跟随系统主题
- 中英文多语言
- 全局快捷搜索 (`Ctrl+K` / `⌘K`) 与常用工具收藏

## 内置工具

- **格式化**：JSON 格式化 / 校验 / 压缩
- **编解码**：Base64 文本编解码（UTF-8、URL-Safe）、URL 编解码
- **转换器**：Unix 时间戳双向转换（秒 / 毫秒）
- **生成器**：UUID v4 生成、随机字符/密码生成、Hash 散列计算 (MD5, SHA-1/256/512)
- **文本处理**：字数/行数统计、大小写与命名风格转换 (camelCase, snake_case 等)

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动桌面端调试
pnpm tauri dev

# 打包构建前端
pnpm build
```

## 添加新工具

在 `src/tools/` 对应分类目录下创建组件，并在 `src/tools/registry.ts` 中登记即可自动引入。

## License

MIT
