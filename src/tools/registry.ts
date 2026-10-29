import { markRaw } from 'vue';
import {
  Grid,
  Star,
  RefreshCw,
  Binary,
  FileCode2,
  Cpu,
  Type,
  FileJson,
  Link,
  Clock,
  Hash,
  Fingerprint,
  KeyRound,
  CalendarClock,
  FileType,
  ShieldCheck,
  Network
} from 'lucide-vue-next';
import type { CategoryInfo, ToolItem, CategoryId } from './types';

import JsonFormatter from './formatters/JsonFormatter.vue';
import Base64Text from './encoders/Base64Text.vue';
import UrlEncoder from './encoders/UrlEncoder.vue';
import JwtParser from './encoders/JwtParser.vue';
import TimestampConverter from './converters/TimestampConverter.vue';
import MimeTypes from './converters/MimeTypes.vue';
import ChmodCalculator from './converters/ChmodCalculator.vue';
import UuidGenerator from './generators/UuidGenerator.vue';
import HashGenerator from './generators/HashGenerator.vue';
import CronParser from './generators/CronParser.vue';
import TextInspector from './text/TextInspector.vue';
import HarViewer from './network/HarViewer.vue';

// 分类清单
export const categories: CategoryInfo[] = [
  { id: 'all', nameKey: 'categories.all', icon: markRaw(Grid) },
  { id: 'favorites', nameKey: 'categories.favorites', icon: markRaw(Star) },
  { id: 'converters', nameKey: 'categories.converters', icon: markRaw(RefreshCw) },
  { id: 'encoders', nameKey: 'categories.encoders', icon: markRaw(Binary) },
  { id: 'formatters', nameKey: 'categories.formatters', icon: markRaw(FileCode2) },
  { id: 'generators', nameKey: 'categories.generators', icon: markRaw(Cpu) },
  { id: 'text', nameKey: 'categories.text', icon: markRaw(Type) },
  { id: 'network', nameKey: 'categories.network', icon: markRaw(Network) },
];

// 工具注册列表
export const tools: ToolItem[] = [
  {
    id: 'json-formatter',
    categoryId: 'formatters',
    nameKey: 'tools.jsonFormatter.name',
    descKey: 'tools.jsonFormatter.desc',
    icon: markRaw(FileJson),
    keywords: ['json', 'format', 'minify', 'beautify', 'validate', '格式化', '压缩', '美化', '校验'],
    component: markRaw(JsonFormatter),
  },
  {
    id: 'base64-text',
    categoryId: 'encoders',
    nameKey: 'tools.base64Text.name',
    descKey: 'tools.base64Text.desc',
    icon: markRaw(Binary),
    keywords: ['base64', 'encode', 'decode', '编码', '解码', '转码', 'btoa', 'atob'],
    component: markRaw(Base64Text),
  },
  {
    id: 'url-encoder',
    categoryId: 'encoders',
    nameKey: 'tools.urlEncoder.name',
    descKey: 'tools.urlEncoder.desc',
    icon: markRaw(Link),
    keywords: ['url', 'uri', 'encode', 'decode', '编码', '解码', 'query', 'urlencode'],
    component: markRaw(UrlEncoder),
  },
  {
    id: 'jwt-parser',
    categoryId: 'encoders',
    nameKey: 'tools.jwtParser.name',
    descKey: 'tools.jwtParser.desc',
    icon: markRaw(KeyRound),
    keywords: ['jwt', 'token', 'decode', 'bearer', 'auth', 'claim', 'json web token', '解析', '令牌', '鉴权'],
    component: markRaw(JwtParser),
  },
  {
    id: 'timestamp',
    categoryId: 'converters',
    nameKey: 'tools.timestamp.name',
    descKey: 'tools.timestamp.desc',
    icon: markRaw(Clock),
    keywords: ['time', 'timestamp', 'date', 'unix', 'epoch', '时间戳', '日期', '时间', '转换'],
    component: markRaw(TimestampConverter),
  },
  {
    id: 'mime-types',
    categoryId: 'converters',
    nameKey: 'tools.mimeTypes.name',
    descKey: 'tools.mimeTypes.desc',
    icon: markRaw(FileType),
    keywords: [
      'mime',
      'mimetype',
      'content-type',
      'extension',
      'media',
      'file',
      'type',
      'header',
      'http',
      '媒体类型',
      '扩展名',
      '后缀',
      '标头',
      '查询',
      '文件类型'
    ],
    component: markRaw(MimeTypes),
  },
  {
    id: 'chmod-calculator',
    categoryId: 'converters',
    nameKey: 'tools.chmodCalculator.name',
    descKey: 'tools.chmodCalculator.desc',
    icon: markRaw(ShieldCheck),
    keywords: [
      'chmod',
      'permission',
      'permissions',
      'octal',
      'symbolic',
      'linux',
      'unix',
      'suid',
      'sgid',
      'sticky',
      '权限',
      '八进制',
      '符号',
      '文件权限',
      '计算器'
    ],
    component: markRaw(ChmodCalculator),
  },
  {
    id: 'hash-generator',
    categoryId: 'generators',
    nameKey: 'tools.hashGenerator.name',
    descKey: 'tools.hashGenerator.desc',
    icon: markRaw(Hash),
    keywords: ['hash', 'md5', 'sha1', 'sha256', 'sha512', '散列', '哈希', '摘要'],
    component: markRaw(HashGenerator),
  },
  {
    id: 'uuid-generator',
    categoryId: 'generators',
    nameKey: 'tools.uuidGenerator.name',
    descKey: 'tools.uuidGenerator.desc',
    icon: markRaw(Fingerprint),
    keywords: ['uuid', 'guid', 'v4', 'random', 'string', 'password', '生成器', '随机数', '密码'],
    component: markRaw(UuidGenerator),
  },
  {
    id: 'cron-parser',
    categoryId: 'generators',
    nameKey: 'tools.cronParser.name',
    descKey: 'tools.cronParser.desc',
    icon: markRaw(CalendarClock),
    keywords: ['cron', 'crontab', 'schedule', 'task', '定时任务', '调度', '计划任务', '表达式', '时间'],
    component: markRaw(CronParser),
  },
  {
    id: 'text-inspector',
    categoryId: 'text',
    nameKey: 'tools.textInspector.name',
    descKey: 'tools.textInspector.desc',
    icon: markRaw(Type),
    keywords: ['text', 'count', 'words', 'lines', 'case', 'camelCase', 'snake_case', '统计', '字数', '大小写', '驼峰'],
    component: markRaw(TextInspector),
  },
  {
    id: 'har-viewer',
    categoryId: 'network',
    nameKey: 'tools.harViewer.name',
    descKey: 'tools.harViewer.desc',
    icon: markRaw(Network),
    keywords: [
      'har',
      'http',
      'archive',
      'network',
      'request',
      'response',
      'devtools',
      'curl',
      'waterfall',
      '抓包',
      '网络',
      '请求',
      '响应',
      '瀑布流',
      '查看器',
      '分析'
    ],
    component: markRaw(HarViewer),
  },
];

export function getToolById(id: string): ToolItem | undefined {
  return tools.find(t => t.id === id);
}

export function getToolsByCategory(categoryId: CategoryId): ToolItem[] {
  if (categoryId === 'all') return tools;
  return tools.filter(t => t.categoryId === categoryId);
}
