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
  Fingerprint
} from 'lucide-vue-next';
import type { CategoryInfo, ToolItem, CategoryId } from './types';

import JsonFormatter from './formatters/JsonFormatter.vue';
import Base64Text from './encoders/Base64Text.vue';
import UrlEncoder from './encoders/UrlEncoder.vue';
import TimestampConverter from './converters/TimestampConverter.vue';
import UuidGenerator from './generators/UuidGenerator.vue';
import HashGenerator from './generators/HashGenerator.vue';
import TextInspector from './text/TextInspector.vue';

// 分类清单
export const categories: CategoryInfo[] = [
  { id: 'all', nameKey: 'categories.all', icon: markRaw(Grid) },
  { id: 'favorites', nameKey: 'categories.favorites', icon: markRaw(Star) },
  { id: 'converters', nameKey: 'categories.converters', icon: markRaw(RefreshCw) },
  { id: 'encoders', nameKey: 'categories.encoders', icon: markRaw(Binary) },
  { id: 'formatters', nameKey: 'categories.formatters', icon: markRaw(FileCode2) },
  { id: 'generators', nameKey: 'categories.generators', icon: markRaw(Cpu) },
  { id: 'text', nameKey: 'categories.text', icon: markRaw(Type) },
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
    id: 'timestamp',
    categoryId: 'converters',
    nameKey: 'tools.timestamp.name',
    descKey: 'tools.timestamp.desc',
    icon: markRaw(Clock),
    keywords: ['time', 'timestamp', 'date', 'unix', 'epoch', '时间戳', '日期', '时间', '转换'],
    component: markRaw(TimestampConverter),
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
    id: 'text-inspector',
    categoryId: 'text',
    nameKey: 'tools.textInspector.name',
    descKey: 'tools.textInspector.desc',
    icon: markRaw(Type),
    keywords: ['text', 'count', 'words', 'lines', 'case', 'camelCase', 'snake_case', '统计', '字数', '大小写', '驼峰'],
    component: markRaw(TextInspector),
  },
];

export function getToolById(id: string): ToolItem | undefined {
  return tools.find(t => t.id === id);
}

export function getToolsByCategory(categoryId: CategoryId): ToolItem[] {
  if (categoryId === 'all') return tools;
  return tools.filter(t => t.categoryId === categoryId);
}
