export type MimeCategory =
  | 'all'
  | 'common'
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'font'
  | 'archive'
  | 'application'
  | 'model';

export interface MimeItem {
  id: string;
  mime: string;
  extensions: string[];
  category: Exclude<MimeCategory, 'all' | 'common'>;
  isCommon?: boolean;
  isBinary: boolean;
  charsetNeeded?: boolean;
  descriptionZh: string;
  descriptionEn: string;
  aliases?: string[];
  headerExample?: string;
  nginxConfig?: string;
}

export const mimeItems: MimeItem[] = [
  // ==================== Web & Text ====================
  {
    id: 'html',
    mime: 'text/html',
    extensions: ['html', 'htm'],
    category: 'text',
    isCommon: true,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'HTML 超文本标记语言网页文档',
    descriptionEn: 'HyperText Markup Language web document',
    aliases: [],
    headerExample: 'Content-Type: text/html; charset=utf-8',
    nginxConfig: 'text/html html htm;'
  },
  {
    id: 'css',
    mime: 'text/css',
    extensions: ['css'],
    category: 'text',
    isCommon: true,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'CSS 层叠样式表',
    descriptionEn: 'Cascading Style Sheets',
    aliases: [],
    headerExample: 'Content-Type: text/css; charset=utf-8',
    nginxConfig: 'text/css css;'
  },
  {
    id: 'javascript',
    mime: 'text/javascript',
    extensions: ['js', 'mjs', 'cjs'],
    category: 'text',
    isCommon: true,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'JavaScript 脚本与模块代码',
    descriptionEn: 'JavaScript script and module file',
    aliases: ['application/javascript', 'application/x-javascript'],
    headerExample: 'Content-Type: text/javascript; charset=utf-8',
    nginxConfig: 'text/javascript js mjs cjs;'
  },
  {
    id: 'typescript',
    mime: 'text/typescript',
    extensions: ['ts', 'mts', 'cts'],
    category: 'text',
    isCommon: true,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'TypeScript 强类型源码文件',
    descriptionEn: 'TypeScript source code',
    aliases: ['application/typescript'],
    headerExample: 'Content-Type: text/typescript; charset=utf-8',
    nginxConfig: 'text/typescript ts mts cts;'
  },
  {
    id: 'plain-text',
    mime: 'text/plain',
    extensions: ['txt', 'text', 'log', 'ini', 'conf', 'env'],
    category: 'text',
    isCommon: true,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: '纯文本文件、运行日志与配置文件',
    descriptionEn: 'Plain text, log and configuration file',
    aliases: [],
    headerExample: 'Content-Type: text/plain; charset=utf-8',
    nginxConfig: 'text/plain txt log ini conf;'
  },
  {
    id: 'markdown',
    mime: 'text/markdown',
    extensions: ['md', 'markdown'],
    category: 'text',
    isCommon: true,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'Markdown 轻量级标记文档',
    descriptionEn: 'Markdown formatted document',
    aliases: ['text/x-markdown'],
    headerExample: 'Content-Type: text/markdown; charset=utf-8',
    nginxConfig: 'text/markdown md markdown;'
  },
  {
    id: 'csv',
    mime: 'text/csv',
    extensions: ['csv'],
    category: 'text',
    isCommon: true,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: '逗号分隔值数据表格',
    descriptionEn: 'Comma-Separated Values table data',
    aliases: ['application/csv'],
    headerExample: 'Content-Type: text/csv; charset=utf-8',
    nginxConfig: 'text/csv csv;'
  },
  {
    id: 'xml-text',
    mime: 'text/xml',
    extensions: ['xml', 'xsl', 'xsd'],
    category: 'text',
    isCommon: true,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'XML 可扩展标记语言文档',
    descriptionEn: 'eXtensible Markup Language document',
    aliases: ['application/xml'],
    headerExample: 'Content-Type: text/xml; charset=utf-8',
    nginxConfig: 'text/xml xml xsl;'
  },
  {
    id: 'yaml',
    mime: 'application/yaml',
    extensions: ['yaml', 'yml'],
    category: 'text',
    isCommon: true,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'YAML 人性化数据序列化配置文件',
    descriptionEn: 'YAML Ain\'t Markup Language config file',
    aliases: ['text/yaml', 'text/x-yaml', 'application/x-yaml'],
    headerExample: 'Content-Type: application/yaml; charset=utf-8',
    nginxConfig: 'application/yaml yaml yml;'
  },
  {
    id: 'calendar',
    mime: 'text/calendar',
    extensions: ['ics', 'ifb'],
    category: 'text',
    isCommon: false,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'iCalendar 日历事件与约会交换文件',
    descriptionEn: 'iCalendar scheduling and event data',
    aliases: [],
    headerExample: 'Content-Type: text/calendar; charset=utf-8',
    nginxConfig: 'text/calendar ics;'
  },
  {
    id: 'vcard',
    mime: 'text/vcard',
    extensions: ['vcf', 'vcard'],
    category: 'text',
    isCommon: false,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'vCard 电子名片与通讯录格式',
    descriptionEn: 'vCard electronic business card format',
    aliases: ['text/x-vcard'],
    headerExample: 'Content-Type: text/vcard; charset=utf-8'
  },
  {
    id: 'event-stream',
    mime: 'text/event-stream',
    extensions: [],
    category: 'text',
    isCommon: true,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'SSE (Server-Sent Events) 服务器推送事件流',
    descriptionEn: 'Server-Sent Events continuous HTTP stream',
    aliases: [],
    headerExample: 'Content-Type: text/event-stream; charset=utf-8'
  },

  // ==================== Application & Data ====================
  {
    id: 'json',
    mime: 'application/json',
    extensions: ['json', 'map'],
    category: 'application',
    isCommon: true,
    isBinary: false,
    charsetNeeded: false,
    descriptionZh: 'JSON JavaScript 对象表示法数据交换格式',
    descriptionEn: 'JavaScript Object Notation data interchange format',
    aliases: ['text/json'],
    headerExample: 'Content-Type: application/json',
    nginxConfig: 'application/json json map;'
  },
  {
    id: 'json-ld',
    mime: 'application/ld+json',
    extensions: ['jsonld'],
    category: 'application',
    isCommon: false,
    isBinary: false,
    charsetNeeded: false,
    descriptionZh: 'JSON-LD 关联数据交换格式 (常用于 SEO 结构化数据)',
    descriptionEn: 'JSON-LD Linked Data for structured data',
    aliases: [],
    headerExample: 'Content-Type: application/ld+json'
  },
  {
    id: 'wasm',
    mime: 'application/wasm',
    extensions: ['wasm'],
    category: 'application',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'WebAssembly 编译型高效二进制字节码',
    descriptionEn: 'WebAssembly binary executable format',
    aliases: [],
    headerExample: 'Content-Type: application/wasm',
    nginxConfig: 'application/wasm wasm;'
  },
  {
    id: 'octet-stream',
    mime: 'application/octet-stream',
    extensions: ['bin', 'dat', 'dmp', 'exe', 'dll'],
    category: 'application',
    isCommon: true,
    isBinary: true,
    descriptionZh: '通用任意未知二进制字节流（常用于强制浏览器下载）',
    descriptionEn: 'Arbitrary binary byte stream (default for downloads)',
    aliases: [],
    headerExample: 'Content-Type: application/octet-stream; Content-Disposition: attachment; filename="file.bin"',
    nginxConfig: 'application/octet-stream bin exe dll;'
  },
  {
    id: 'form-urlencoded',
    mime: 'application/x-www-form-urlencoded',
    extensions: [],
    category: 'application',
    isCommon: true,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: '标准 HTTP POST 表单键值对 URL 编码',
    descriptionEn: 'Standard HTTP POST form key-value URL encoded',
    aliases: [],
    headerExample: 'Content-Type: application/x-www-form-urlencoded; charset=utf-8'
  },
  {
    id: 'multipart-form-data',
    mime: 'multipart/form-data',
    extensions: [],
    category: 'application',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'HTTP 多部分表单数据（常用于带文件上传的表单提交）',
    descriptionEn: 'Multipart form data (typically for file uploads)',
    aliases: [],
    headerExample: 'Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...'
  },
  {
    id: 'sql',
    mime: 'application/sql',
    extensions: ['sql'],
    category: 'application',
    isCommon: false,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'SQL 数据库结构与查询脚本',
    descriptionEn: 'Structured Query Language script',
    aliases: ['text/x-sql'],
    headerExample: 'Content-Type: application/sql; charset=utf-8'
  },
  {
    id: 'shell-script',
    mime: 'application/x-sh',
    extensions: ['sh', 'bash', 'zsh'],
    category: 'application',
    isCommon: false,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'Unix / Linux Shell 命令行脚本',
    descriptionEn: 'Unix / Linux Shell execution script',
    aliases: ['text/x-sh'],
    headerExample: 'Content-Type: application/x-sh; charset=utf-8'
  },
  {
    id: 'graphql-json',
    mime: 'application/graphql+json',
    extensions: [],
    category: 'application',
    isCommon: false,
    isBinary: false,
    descriptionZh: 'GraphQL 查询响应 JSON 数据',
    descriptionEn: 'GraphQL query response payload',
    aliases: ['application/graphql'],
    headerExample: 'Content-Type: application/graphql+json; charset=utf-8'
  },
  {
    id: 'ndjson',
    mime: 'application/x-ndjson',
    extensions: ['ndjson', 'jsonl'],
    category: 'application',
    isCommon: false,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: '换行符分隔的 JSON 数据流 (Newline Delimited JSON)',
    descriptionEn: 'Newline Delimited JSON stream format',
    aliases: ['application/jsonlines'],
    headerExample: 'Content-Type: application/x-ndjson; charset=utf-8'
  },
  {
    id: 'webmanifest',
    mime: 'application/manifest+json',
    extensions: ['webmanifest'],
    category: 'application',
    isCommon: false,
    isBinary: false,
    descriptionZh: 'PWA 渐进式网页应用清单配置',
    descriptionEn: 'Progressive Web App Manifest',
    aliases: [],
    headerExample: 'Content-Type: application/manifest+json',
    nginxConfig: 'application/manifest+json webmanifest;'
  },
  {
    id: 'toml',
    mime: 'application/toml',
    extensions: ['toml'],
    category: 'application',
    isCommon: false,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'TOML 易读配置文件格式 (常用于 Cargo / Python)',
    descriptionEn: 'Tom\'s Obvious Minimal Language config',
    aliases: ['text/x-toml'],
    headerExample: 'Content-Type: application/toml; charset=utf-8'
  },
  {
    id: 'sqlite',
    mime: 'application/vnd.sqlite3',
    extensions: ['sqlite', 'sqlite3', 'db'],
    category: 'application',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'SQLite 单文件嵌入式关系型数据库',
    descriptionEn: 'SQLite embedded database file',
    aliases: ['application/x-sqlite3'],
    headerExample: 'Content-Type: application/vnd.sqlite3'
  },

  // ==================== Images ====================
  {
    id: 'png',
    mime: 'image/png',
    extensions: ['png'],
    category: 'image',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'PNG 可移植网络无损位图图形',
    descriptionEn: 'Portable Network Graphics lossless image',
    aliases: ['image/x-png'],
    headerExample: 'Content-Type: image/png',
    nginxConfig: 'image/png png;'
  },
  {
    id: 'jpeg',
    mime: 'image/jpeg',
    extensions: ['jpg', 'jpeg', 'jpe', 'jfif'],
    category: 'image',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'JPEG / JPG 有损高压缩率位图摄影照片',
    descriptionEn: 'Joint Photographic Experts Group photo image',
    aliases: ['image/pjpeg', 'image/jpg'],
    headerExample: 'Content-Type: image/jpeg',
    nginxConfig: 'image/jpeg jpeg jpg;'
  },
  {
    id: 'webp',
    mime: 'image/webp',
    extensions: ['webp'],
    category: 'image',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'WebP 现代化网页高效图片格式（支持有损、无损与透明通道）',
    descriptionEn: 'WebP modern web image with superior compression',
    aliases: [],
    headerExample: 'Content-Type: image/webp',
    nginxConfig: 'image/webp webp;'
  },
  {
    id: 'gif',
    mime: 'image/gif',
    extensions: ['gif'],
    category: 'image',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'GIF 图像互换格式（支持短循环动图）',
    descriptionEn: 'Graphics Interchange Format (supports animations)',
    aliases: [],
    headerExample: 'Content-Type: image/gif',
    nginxConfig: 'image/gif gif;'
  },
  {
    id: 'svg',
    mime: 'image/svg+xml',
    extensions: ['svg', 'svgz'],
    category: 'image',
    isCommon: true,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'SVG 可缩放矢量图形（XML 格式，任意分辨率无损）',
    descriptionEn: 'Scalable Vector Graphics XML vector format',
    aliases: [],
    headerExample: 'Content-Type: image/svg+xml; charset=utf-8',
    nginxConfig: 'image/svg+xml svg svgz;'
  },
  {
    id: 'avif',
    mime: 'image/avif',
    extensions: ['avif'],
    category: 'image',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'AVIF 新一代基于 AV1 编解码器超高压缩比图像',
    descriptionEn: 'AV1 Image File Format next-generation compressed image',
    aliases: [],
    headerExample: 'Content-Type: image/avif',
    nginxConfig: 'image/avif avif;'
  },
  {
    id: 'ico',
    mime: 'image/x-icon',
    extensions: ['ico', 'cur'],
    category: 'image',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'Windows 图标与 Favicon 网站捷径图标',
    descriptionEn: 'Windows Icon and web favicon image',
    aliases: ['image/vnd.microsoft.icon'],
    headerExample: 'Content-Type: image/x-icon',
    nginxConfig: 'image/x-icon ico;'
  },
  {
    id: 'bmp',
    mime: 'image/bmp',
    extensions: ['bmp'],
    category: 'image',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'Windows BMP 标准无压缩位图',
    descriptionEn: 'Bitmap image file',
    aliases: ['image/x-ms-bmp'],
    headerExample: 'Content-Type: image/bmp',
    nginxConfig: 'image/x-ms-bmp bmp;'
  },
  {
    id: 'tiff',
    mime: 'image/tiff',
    extensions: ['tif', 'tiff'],
    category: 'image',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'TIFF 标签图像文件格式（印刷与扫描行业常用）',
    descriptionEn: 'Tagged Image File Format for high-quality printing',
    aliases: ['image/x-tiff'],
    headerExample: 'Content-Type: image/tiff',
    nginxConfig: 'image/tiff tif tiff;'
  },
  {
    id: 'heic',
    mime: 'image/heic',
    extensions: ['heic', 'heif'],
    category: 'image',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'HEIC / HEIF 高效图像文件容器（苹果设备原生相片）',
    descriptionEn: 'High Efficiency Image Container format used by Apple',
    aliases: ['image/heif'],
    headerExample: 'Content-Type: image/heic'
  },
  {
    id: 'photoshop',
    mime: 'image/vnd.adobe.photoshop',
    extensions: ['psd'],
    category: 'image',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'Adobe Photoshop 分层图像工程设计文件',
    descriptionEn: 'Adobe Photoshop layered image project',
    aliases: ['image/x-photoshop'],
    headerExample: 'Content-Type: image/vnd.adobe.photoshop'
  },

  // ==================== Audio ====================
  {
    id: 'mp3',
    mime: 'audio/mpeg',
    extensions: ['mp3', 'mpga'],
    category: 'audio',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'MP3 MPEG-1 Audio Layer III 流行音频格式',
    descriptionEn: 'MPEG-1 Audio Layer III compressed audio',
    aliases: ['audio/mp3'],
    headerExample: 'Content-Type: audio/mpeg',
    nginxConfig: 'audio/mpeg mp3;'
  },
  {
    id: 'wav',
    mime: 'audio/wav',
    extensions: ['wav'],
    category: 'audio',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'WAV 微软与 IBM 联合开发的波形音频（无损或未压缩）',
    descriptionEn: 'Waveform Audio File Format lossless audio',
    aliases: ['audio/x-wav', 'audio/wave'],
    headerExample: 'Content-Type: audio/wav',
    nginxConfig: 'audio/x-wav wav;'
  },
  {
    id: 'ogg-audio',
    mime: 'audio/ogg',
    extensions: ['ogg', 'oga', 'spx'],
    category: 'audio',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'Ogg Vorbis 开源多媒体音频',
    descriptionEn: 'Ogg Vorbis open audio container',
    aliases: ['audio/vorbis'],
    headerExample: 'Content-Type: audio/ogg',
    nginxConfig: 'audio/ogg ogg;'
  },
  {
    id: 'aac',
    mime: 'audio/aac',
    extensions: ['aac'],
    category: 'audio',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'AAC 高级音频编码（高压缩与音质平衡）',
    descriptionEn: 'Advanced Audio Coding standard',
    aliases: ['audio/x-aac'],
    headerExample: 'Content-Type: audio/aac'
  },
  {
    id: 'flac',
    mime: 'audio/flac',
    extensions: ['flac'],
    category: 'audio',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'FLAC 免费无损音频压缩编解码器',
    descriptionEn: 'Free Lossless Audio Codec',
    aliases: ['audio/x-flac'],
    headerExample: 'Content-Type: audio/flac'
  },
  {
    id: 'm4a',
    mime: 'audio/mp4',
    extensions: ['m4a', 'mp4a'],
    category: 'audio',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'M4A MPEG-4 音频文件（苹果音乐常见）',
    descriptionEn: 'MPEG-4 Audio container file',
    aliases: ['audio/x-m4a'],
    headerExample: 'Content-Type: audio/mp4',
    nginxConfig: 'audio/x-m4a m4a;'
  },
  {
    id: 'webm-audio',
    mime: 'audio/webm',
    extensions: ['weba'],
    category: 'audio',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'WebM 音频流（包含 Opus 或 Vorbis 编码）',
    descriptionEn: 'WebM open audio format for web playback',
    aliases: [],
    headerExample: 'Content-Type: audio/webm'
  },
  {
    id: 'opus',
    mime: 'audio/opus',
    extensions: ['opus'],
    category: 'audio',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'Opus 极低延迟语音与互动音乐高效编码格式',
    descriptionEn: 'Opus interactive low-latency audio codec',
    aliases: [],
    headerExample: 'Content-Type: audio/opus'
  },
  {
    id: 'midi',
    mime: 'audio/midi',
    extensions: ['mid', 'midi', 'kar'],
    category: 'audio',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'MIDI 乐器数字接口音乐数据',
    descriptionEn: 'Musical Instrument Digital Interface audio',
    aliases: ['audio/x-midi'],
    headerExample: 'Content-Type: audio/midi',
    nginxConfig: 'audio/midi mid midi kar;'
  },

  // ==================== Video ====================
  {
    id: 'mp4',
    mime: 'video/mp4',
    extensions: ['mp4', 'm4v'],
    category: 'video',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'MP4 MPEG-4 Part 14 现代跨平台通用视频',
    descriptionEn: 'MPEG-4 Part 14 universal video container',
    aliases: [],
    headerExample: 'Content-Type: video/mp4',
    nginxConfig: 'video/mp4 mp4;'
  },
  {
    id: 'webm-video',
    mime: 'video/webm',
    extensions: ['webm'],
    category: 'video',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'WebM HTML5 网页开放免版税视频格式 (VP8/VP9/AV1)',
    descriptionEn: 'WebM open web video format',
    aliases: [],
    headerExample: 'Content-Type: video/webm',
    nginxConfig: 'video/webm webm;'
  },
  {
    id: 'quicktime',
    mime: 'video/quicktime',
    extensions: ['mov', 'qt'],
    category: 'video',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'Apple QuickTime 影片文件',
    descriptionEn: 'Apple QuickTime movie format',
    aliases: [],
    headerExample: 'Content-Type: video/quicktime',
    nginxConfig: 'video/quicktime mov;'
  },
  {
    id: 'matroska',
    mime: 'video/x-matroska',
    extensions: ['mkv'],
    category: 'video',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'Matroska MKV 多媒体容器（常用于多音轨高清视频封装）',
    descriptionEn: 'Matroska Multimedia Container for HD video',
    aliases: [],
    headerExample: 'Content-Type: video/x-matroska'
  },
  {
    id: 'avi',
    mime: 'video/x-msvideo',
    extensions: ['avi'],
    category: 'video',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'AVI 微软视听交错格式视频',
    descriptionEn: 'Audio Video Interleave container by Microsoft',
    aliases: ['video/avi'],
    headerExample: 'Content-Type: video/x-msvideo'
  },
  {
    id: 'mpeg-ts',
    mime: 'video/mp2t',
    extensions: ['ts'],
    category: 'video',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'MPEG-2 传输流（常用于 HLS 视频切片分发）',
    descriptionEn: 'MPEG-2 Transport Stream segment file',
    aliases: [],
    headerExample: 'Content-Type: video/mp2t',
    nginxConfig: 'video/mp2t ts;'
  },
  {
    id: 'hls-playlist',
    mime: 'application/vnd.apple.mpegurl',
    extensions: ['m3u8'],
    category: 'video',
    isCommon: true,
    isBinary: false,
    charsetNeeded: true,
    descriptionZh: 'HLS (HTTP Live Streaming) 流媒体播放列表索引',
    descriptionEn: 'HTTP Live Streaming M3U8 playlist index',
    aliases: ['application/x-mpegURL'],
    headerExample: 'Content-Type: application/vnd.apple.mpegurl; charset=utf-8',
    nginxConfig: 'application/vnd.apple.mpegurl m3u8;'
  },
  {
    id: 'flv',
    mime: 'video/x-flv',
    extensions: ['flv'],
    category: 'video',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'FLV Adobe Flash 视频流文件',
    descriptionEn: 'Adobe Flash video file',
    aliases: [],
    headerExample: 'Content-Type: video/x-flv',
    nginxConfig: 'video/x-flv flv;'
  },

  // ==================== Documents ====================
  {
    id: 'pdf',
    mime: 'application/pdf',
    extensions: ['pdf'],
    category: 'document',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'PDF Adobe 便携式文档格式（跨平台版面保真）',
    descriptionEn: 'Portable Document Format',
    aliases: ['application/x-pdf'],
    headerExample: 'Content-Type: application/pdf',
    nginxConfig: 'application/pdf pdf;'
  },
  {
    id: 'docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensions: ['docx'],
    category: 'document',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'Microsoft Word 现代 OpenXML 文档',
    descriptionEn: 'Microsoft Word OpenXML document',
    aliases: [],
    headerExample: 'Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    nginxConfig: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document docx;'
  },
  {
    id: 'doc',
    mime: 'application/msword',
    extensions: ['doc', 'dot'],
    category: 'document',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'Microsoft Word 97-2003 传统二进制文档',
    descriptionEn: 'Microsoft Word 97-2003 binary document',
    aliases: [],
    headerExample: 'Content-Type: application/msword',
    nginxConfig: 'application/msword doc;'
  },
  {
    id: 'xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensions: ['xlsx'],
    category: 'document',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'Microsoft Excel 现代 OpenXML 电子数据表格',
    descriptionEn: 'Microsoft Excel OpenXML spreadsheet',
    aliases: [],
    headerExample: 'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    nginxConfig: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet xlsx;'
  },
  {
    id: 'xls',
    mime: 'application/vnd.ms-excel',
    extensions: ['xls', 'xlt', 'xla'],
    category: 'document',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'Microsoft Excel 97-2003 传统工作表',
    descriptionEn: 'Microsoft Excel 97-2003 spreadsheet',
    aliases: [],
    headerExample: 'Content-Type: application/vnd.ms-excel',
    nginxConfig: 'application/vnd.ms-excel xls;'
  },
  {
    id: 'pptx',
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extensions: ['pptx'],
    category: 'document',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'Microsoft PowerPoint 现代 OpenXML 演示文稿',
    descriptionEn: 'Microsoft PowerPoint OpenXML presentation',
    aliases: [],
    headerExample: 'Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation',
    nginxConfig: 'application/vnd.openxmlformats-officedocument.presentationml.presentation pptx;'
  },
  {
    id: 'ppt',
    mime: 'application/vnd.ms-powerpoint',
    extensions: ['ppt', 'pps', 'pot'],
    category: 'document',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'Microsoft PowerPoint 97-2003 传统演示幻灯片',
    descriptionEn: 'Microsoft PowerPoint 97-2003 presentation',
    aliases: [],
    headerExample: 'Content-Type: application/vnd.ms-powerpoint',
    nginxConfig: 'application/vnd.ms-powerpoint ppt;'
  },
  {
    id: 'epub',
    mime: 'application/epub+zip',
    extensions: ['epub'],
    category: 'document',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'EPUB 开放电子书流式排版格式',
    descriptionEn: 'Electronic Publication digital ebook format',
    aliases: [],
    headerExample: 'Content-Type: application/epub+zip'
  },
  {
    id: 'rtf',
    mime: 'application/rtf',
    extensions: ['rtf'],
    category: 'document',
    isCommon: false,
    isBinary: false,
    descriptionZh: 'RTF 富文本格式文档',
    descriptionEn: 'Rich Text Format document',
    aliases: ['text/rtf'],
    headerExample: 'Content-Type: application/rtf',
    nginxConfig: 'application/rtf rtf;'
  },
  {
    id: 'odt',
    mime: 'application/vnd.oasis.opendocument.text',
    extensions: ['odt'],
    category: 'document',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'OpenDocument 开放文档文本格式 (LibreOffice / OpenOffice)',
    descriptionEn: 'OpenDocument Text document',
    aliases: [],
    headerExample: 'Content-Type: application/vnd.oasis.opendocument.text'
  },
  {
    id: 'ods',
    mime: 'application/vnd.oasis.opendocument.spreadsheet',
    extensions: ['ods'],
    category: 'document',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'OpenDocument 开放表格文档',
    descriptionEn: 'OpenDocument Spreadsheet',
    aliases: [],
    headerExample: 'Content-Type: application/vnd.oasis.opendocument.spreadsheet'
  },

  // ==================== Fonts ====================
  {
    id: 'woff2',
    mime: 'font/woff2',
    extensions: ['woff2'],
    category: 'font',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'WOFF 2.0 Web 开放字体格式 (Brotli 超高压缩网页首选)',
    descriptionEn: 'Web Open Font Format 2.0 standard',
    aliases: ['application/font-woff2'],
    headerExample: 'Content-Type: font/woff2',
    nginxConfig: 'font/woff2 woff2;'
  },
  {
    id: 'woff',
    mime: 'font/woff',
    extensions: ['woff'],
    category: 'font',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'WOFF 1.0 Web 开放字体格式',
    descriptionEn: 'Web Open Font Format 1.0',
    aliases: ['application/font-woff', 'application/x-font-woff'],
    headerExample: 'Content-Type: font/woff',
    nginxConfig: 'font/woff woff;'
  },
  {
    id: 'ttf',
    mime: 'font/ttf',
    extensions: ['ttf'],
    category: 'font',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'TrueType 跨平台字体格式',
    descriptionEn: 'TrueType Font format',
    aliases: ['application/x-font-ttf', 'font/truetype'],
    headerExample: 'Content-Type: font/ttf',
    nginxConfig: 'font/ttf ttf;'
  },
  {
    id: 'otf',
    mime: 'font/otf',
    extensions: ['otf'],
    category: 'font',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'OpenType 开放字体格式（支持高级排版字形特性）',
    descriptionEn: 'OpenType Font format',
    aliases: ['application/x-font-opentype', 'font/opentype'],
    headerExample: 'Content-Type: font/otf',
    nginxConfig: 'font/otf otf;'
  },
  {
    id: 'eot',
    mime: 'application/vnd.ms-fontobject',
    extensions: ['eot'],
    category: 'font',
    isCommon: false,
    isBinary: true,
    descriptionZh: '微软 Embedded OpenType 嵌入式网页字体 (IE 传统兼容)',
    descriptionEn: 'Embedded OpenType font for legacy Internet Explorer',
    aliases: [],
    headerExample: 'Content-Type: application/vnd.ms-fontobject',
    nginxConfig: 'application/vnd.ms-fontobject eot;'
  },

  // ==================== Archives & Packages ====================
  {
    id: 'zip',
    mime: 'application/zip',
    extensions: ['zip'],
    category: 'archive',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'ZIP 通用压缩归档文件',
    descriptionEn: 'ZIP standard compressed archive',
    aliases: ['application/x-zip-compressed'],
    headerExample: 'Content-Type: application/zip',
    nginxConfig: 'application/zip zip;'
  },
  {
    id: 'gzip',
    mime: 'application/gzip',
    extensions: ['gz', 'gzip'],
    category: 'archive',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'Gzip GNU 压缩数据流',
    descriptionEn: 'Gzip compressed archive file',
    aliases: ['application/x-gzip'],
    headerExample: 'Content-Type: application/gzip',
    nginxConfig: 'application/gzip gz;'
  },
  {
    id: 'tar',
    mime: 'application/x-tar',
    extensions: ['tar'],
    category: 'archive',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'Tar 打包归档文件 (Tape Archive)',
    descriptionEn: 'Tape Archive file container',
    aliases: ['application/tar'],
    headerExample: 'Content-Type: application/x-tar'
  },
  {
    id: 'seven-zip',
    mime: 'application/x-7z-compressed',
    extensions: ['7z'],
    category: 'archive',
    isCommon: true,
    isBinary: true,
    descriptionZh: '7-Zip 超高压缩率归档文件',
    descriptionEn: '7-Zip high-compression archive',
    aliases: [],
    headerExample: 'Content-Type: application/x-7z-compressed',
    nginxConfig: 'application/x-7z-compressed 7z;'
  },
  {
    id: 'rar',
    mime: 'application/vnd.rar',
    extensions: ['rar'],
    category: 'archive',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'WinRAR 专有压缩分卷包',
    descriptionEn: 'RAR multi-volume compressed archive',
    aliases: ['application/x-rar-compressed'],
    headerExample: 'Content-Type: application/vnd.rar',
    nginxConfig: 'application/x-rar-compressed rar;'
  },
  {
    id: 'bzip2',
    mime: 'application/x-bzip2',
    extensions: ['bz2', 'bz'],
    category: 'archive',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'Bzip2 高压缩算法归档',
    descriptionEn: 'Bzip2 compressed data archive',
    aliases: ['application/x-bzip'],
    headerExample: 'Content-Type: application/x-bzip2'
  },
  {
    id: 'xz',
    mime: 'application/x-xz',
    extensions: ['xz'],
    category: 'archive',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'XZ 基于 LZMA2 算法的开源压缩包',
    descriptionEn: 'XZ LZMA2-compressed data archive',
    aliases: [],
    headerExample: 'Content-Type: application/x-xz'
  },
  {
    id: 'apk',
    mime: 'application/vnd.android.package-archive',
    extensions: ['apk'],
    category: 'archive',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'Android 安卓应用程序安装包',
    descriptionEn: 'Android Application Package',
    aliases: [],
    headerExample: 'Content-Type: application/vnd.android.package-archive'
  },
  {
    id: 'deb',
    mime: 'application/vnd.debian.binary-package',
    extensions: ['deb', 'udeb'],
    category: 'archive',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'Debian / Ubuntu Linux 二进制安装软件包',
    descriptionEn: 'Debian / Ubuntu Linux software package',
    aliases: ['application/x-deb'],
    headerExample: 'Content-Type: application/vnd.debian.binary-package',
    nginxConfig: 'application/x-debian-package deb udeb;'
  },
  {
    id: 'rpm',
    mime: 'application/x-redhat-package-manager',
    extensions: ['rpm'],
    category: 'archive',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'RedHat / CentOS RPM 软件包',
    descriptionEn: 'RedHat Package Manager archive',
    aliases: ['application/x-rpm'],
    headerExample: 'Content-Type: application/x-redhat-package-manager',
    nginxConfig: 'application/x-redhat-package-manager rpm;'
  },
  {
    id: 'dmg',
    mime: 'application/x-apple-diskimage',
    extensions: ['dmg'],
    category: 'archive',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'macOS 苹果系统虚拟磁盘映像文件',
    descriptionEn: 'Apple Mac OS X Disk Image',
    aliases: [],
    headerExample: 'Content-Type: application/x-apple-diskimage'
  },
  {
    id: 'iso',
    mime: 'application/x-iso9660-image',
    extensions: ['iso'],
    category: 'archive',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'ISO 9660 光盘介质原始镜像',
    descriptionEn: 'ISO 9660 optical disc image',
    aliases: ['application/x-iso-image'],
    headerExample: 'Content-Type: application/x-iso9660-image'
  },

  // ==================== 3D & Models ====================
  {
    id: 'gltf-json',
    mime: 'model/gltf+json',
    extensions: ['gltf'],
    category: 'model',
    isCommon: false,
    isBinary: false,
    descriptionZh: 'glTF 2.0 现代 3D 场景与模型描述 JSON 格式',
    descriptionEn: 'glTF 2.0 3D scene description format (JSON)',
    aliases: [],
    headerExample: 'Content-Type: model/gltf+json'
  },
  {
    id: 'gltf-binary',
    mime: 'model/gltf-binary',
    extensions: ['glb'],
    category: 'model',
    isCommon: true,
    isBinary: true,
    descriptionZh: 'GLB glTF 单文件二进制 3D 模型格式 (含纹理与网格)',
    descriptionEn: 'GLB binary container for glTF 3D models',
    aliases: [],
    headerExample: 'Content-Type: model/gltf-binary'
  },
  {
    id: 'obj',
    mime: 'model/obj',
    extensions: ['obj'],
    category: 'model',
    isCommon: false,
    isBinary: false,
    descriptionZh: 'Wavefront OBJ 3D 几何模型文件',
    descriptionEn: 'Wavefront OBJ 3D geometry format',
    aliases: ['text/plain'],
    headerExample: 'Content-Type: model/obj'
  },
  {
    id: 'stl',
    mime: 'model/stl',
    extensions: ['stl'],
    category: 'model',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'STL 3D 打印与立体制版三角网格模型',
    descriptionEn: 'Standard Triangle Language for 3D printing',
    aliases: ['application/sla'],
    headerExample: 'Content-Type: model/stl'
  },
  {
    id: 'usdz',
    mime: 'model/vnd.usdz+zip',
    extensions: ['usdz'],
    category: 'model',
    isCommon: false,
    isBinary: true,
    descriptionZh: 'USDZ 苹果 AR 与 3D 场景通用压缩文件',
    descriptionEn: 'Universal Scene Description zip for Apple AR',
    aliases: [],
    headerExample: 'Content-Type: model/vnd.usdz+zip'
  }
];

/**
 * 辅助函数：根据文件名推断扩展名
 */
export function extractExtension(filename: string): string {
  const clean = filename.trim().toLowerCase();
  if (!clean) return '';
  // 处理 .tar.gz 等多后缀
  if (clean.endsWith('.tar.gz')) return 'tar.gz';
  if (clean.endsWith('.tar.bz2')) return 'tar.bz2';
  if (clean.endsWith('.tar.xz')) return 'tar.xz';
  const parts = clean.split(/[/\\]/).pop() || clean;
  const lastDot = parts.lastIndexOf('.');
  if (lastDot <= 0) return '';
  return parts.slice(lastDot + 1);
}

/**
 * 辅助函数：根据扩展名查找 MIME
 */
export function findByExtension(ext: string): MimeItem | undefined {
  const clean = ext.replace(/^\./, '').toLowerCase().trim();
  if (!clean) return undefined;
  return mimeItems.find(item => item.extensions.includes(clean));
}

/**
 * 辅助函数：根据 MIME 精确查找
 */
export function findByMime(mime: string): MimeItem | undefined {
  const clean = mime.toLowerCase().trim();
  if (!clean) return undefined;
  return mimeItems.find(item => item.mime.toLowerCase() === clean || item.aliases?.some(a => a.toLowerCase() === clean));
}
