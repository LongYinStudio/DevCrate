# DevCrate

<div align="center">
  <img src="./public/logo.png" alt="DevCrate Logo" width="80" height="80" />
  <p>现代跨平台本地离线开发者工具箱，基于 Tauri 2 与 Vue 3 构建。</p>
  <p>所有工具纯本地运行，零网络依赖，保障数据隐私安全。</p>
  <p>
    简体中文 | <a href="./README.en-US.md">English</a>
  </p>
</div>

## 截图

| ![](.github/assets/1.png) | ![](.github/assets/2.png) |
| ------------------------- | ------------------------- |
| ![](.github/assets/3.png) | ![](.github/assets/4.png) |

## 内置工具

### 格式化工具
- **JSON 格式化 / 校验**：缩进美化、单行压缩、转义处理、树形视图与语法智能修复

### 编码与解码
- **JWT 解析器**：Token 结构反解、标准声明过期分析与本地 HMAC 签名校验
- **Base64 编解码**：支持 UTF-8 字符集与 URL-Safe 模式
- **URL 编解码**：支持完整 URI 与组件参数模式，Query 参数实时解析

### 转换器
- **Chmod 权限计算器**：八进制 (0755)、符号表示法 (-rwxr-xr-x) 与复选框矩阵即时互转，支持特殊权限位与命令生成
- **MIME 类型查询**：文件扩展名与 MIME 媒体类型双向检索，支持文件推断与 HTTP 标头复制
- **Unix 时间戳转换**：实时时钟、秒与毫秒时间戳、本地时间与 UTC/ISO 8601 双向换算

### 生成器
- **Cron 表达式生成 / 解析**：自然语言解读、未来执行时间预测与可视化参数构建
- **Hash 计算器**：原生硬件加速计算 MD5、SHA-1、SHA-256、SHA-384、SHA-512
- **UUID / 密码生成器**：批量生成 UUID v4、自定义规则高强度随机密码与 Token

### 文本处理
- **HTML 标签去除**：智能剥离标签并提取清晰易读的纯文本，支持块级换行、HTML 实体解码、超链接与图片提取、标签白名单及空白规整
- **正则表达式测试器**：实时语法高亮匹配、捕获组拆解分析、正则文本替换、常用高频规则库及多语言代码生成
- **文本分析与命名风格转换**：字符/词数/行数/字节统计，支持主流编程命名法互转

### 网络工具
- **端口扫描与占用排查**：高并发 TCP 端口连通性探测、知名服务识别，本机活跃监听端口排查及占用进程一键释放
- **HAR 文件查看器**：HTTP 抓包归档文件 (.har) 深度可视化分析，支持瀑布流、请求/响应标头、载荷、Cookie、时序耗时与 cURL 生成

## 安装

### Arch Linux (AUR)

```bash
yay -S devcrate
# 或
paru -S devcrate
```

### macOS (Homebrew)

```bash
brew install --cask LongYinStudio/tap/devcrate
```

也可以从 [Releases](https://github.com/LongYinStudio/DevCrate/releases/latest) 下载 `.dmg` 安装包。

### 其他平台

前往 [Releases](https://github.com/LongYinStudio/DevCrate/releases/latest) 下载对应平台的安装包：

- Windows: `.exe`
- Linux: `.deb` / `.rpm`

## License

MIT
