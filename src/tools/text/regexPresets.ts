export interface RegexPreset {
  id: string;
  nameZh: string;
  nameEn: string;
  category: 'common' | 'network' | 'developer' | 'format';
  pattern: string;
  flags: string;
  sampleText: string;
  descZh: string;
  descEn: string;
}

export const REGEX_PRESETS: RegexPreset[] = [
  {
    id: 'email',
    nameZh: '电子邮箱 (Email)',
    nameEn: 'Email Address',
    category: 'common',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'g',
    sampleText: `Contact our support at contact@devcrate.dev or billing@service.com.
Invalid: user@.com, test@invalid_domain, test@example`,
    descZh: '匹配常见标准格式的电子邮件地址',
    descEn: 'Matches standard internet email addresses'
  },
  {
    id: 'url',
    nameZh: '网址链接 (URL)',
    nameEn: 'URL (HTTP/HTTPS)',
    category: 'common',
    pattern: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)',
    flags: 'g',
    sampleText: `Visit official portal at https://devcrate.dev/docs?page=1#install or http://github.com/LongYinStudio.
Non-urls: ftp://127.0.0.1 or just.some.text`,
    descZh: '匹配带有 http 或 https 协议的有效网络 URL',
    descEn: 'Matches HTTP and HTTPS URLs with paths and query parameters'
  },
  {
    id: 'phone-cn',
    nameZh: '中国手机号 (11位)',
    nameEn: 'China Mobile Phone',
    category: 'common',
    pattern: '(?:\\+?86)?1[3-9]\\d{9}',
    flags: 'g',
    sampleText: `联系电话: 13812345678, +8618900001111, 19988887777
无效号码: 12345678901, 10086, 1388888`,
    descZh: '匹配中国大陆 11 位手机号码（支持 +86 前缀）',
    descEn: 'Matches 11-digit Mainland China mobile phone numbers'
  },
  {
    id: 'id-card-cn',
    nameZh: '中国身份证号 (18位)',
    nameEn: 'China ID Card (18-digit)',
    category: 'common',
    pattern: '[1-9]\\d{5}(?:18|19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]',
    flags: 'g',
    sampleText: `居民身份证示例: 110101199003072345, 44030119851218991X
无效格式: 110101900307234, 11010119900307234A`,
    descZh: '匹配中国大陆 18 位第二代居民身份证号码',
    descEn: 'Matches 18-digit Mainland China Resident Identity Card numbers'
  },
  {
    id: 'ipv4',
    nameZh: 'IPv4 地址',
    nameEn: 'IPv4 Address',
    category: 'network',
    pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b',
    flags: 'g',
    sampleText: `Server cluster IPs: 127.0.0.1, 192.168.1.100, 10.0.0.1, 255.255.255.0
Invalid IPs: 256.1.1.1, 999.0.0.0, 1.2.3.4.5`,
    descZh: '匹配合法范围 (0.0.0.0 ~ 255.255.255.255) 的 IPv4 地址',
    descEn: 'Matches valid IPv4 addresses (0.0.0.0 to 255.255.255.255)'
  },
  {
    id: 'ipv6',
    nameZh: 'IPv6 地址',
    nameEn: 'IPv6 Address',
    category: 'network',
    pattern: '(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}',
    flags: 'g',
    sampleText: `Nodes: 2001:0db8:85a3:0000:0000:8a2e:0370:7334 and fe80:0000:0000:0000:0204:61ff:fe9d:f156`,
    descZh: '匹配标准 8 组十六进制格式的完整 IPv6 地址',
    descEn: 'Matches standard 8-group hexadecimal IPv6 addresses'
  },
  {
    id: 'date-iso',
    nameZh: '日期 (YYYY-MM-DD)',
    nameEn: 'Date (YYYY-MM-DD)',
    category: 'format',
    pattern: '\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b',
    flags: 'g',
    sampleText: `Project milestones: 2026-10-31, 2026-12-25, 2027-01-01
Invalid: 2026-13-01, 2026-02-32, 26-10-31`,
    descZh: '匹配 ISO 8601 标准日期格式 YYYY-MM-DD',
    descEn: 'Matches ISO 8601 standard date format YYYY-MM-DD'
  },
  {
    id: 'time-24h',
    nameZh: '时间 (24小时制 HH:mm:ss)',
    nameEn: 'Time (24-Hour)',
    category: 'format',
    pattern: '\\b(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?\\b',
    flags: 'g',
    sampleText: `Service started at 08:30:00, cron triggered at 23:59 and 00:00:15
Invalid: 24:00:00, 12:60:00`,
    descZh: '匹配 24 小时制时间格式 (HH:mm 或 HH:mm:ss)',
    descEn: 'Matches 24-hour time format with optional seconds'
  },
  {
    id: 'hex-color',
    nameZh: '十六进制颜色码',
    nameEn: 'Hex Color Code',
    category: 'developer',
    pattern: '#(?:[A-Fa-f0-9]{8}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\\b',
    flags: 'g',
    sampleText: `Theme palette: #3b82f6 (blue), #10b981 (emerald), #fff (white), #00000080 (translucent black)
Invalid: #12345, #xyz, #1234567`,
    descZh: '匹配 CSS 3位、6位或8位 (含Alpha透明度) 的 Hex 颜色值',
    descEn: 'Matches CSS Hex color codes (3, 6, or 8 characters)'
  },
  {
    id: 'uuid',
    nameZh: 'UUID / GUID',
    nameEn: 'UUID / GUID',
    category: 'developer',
    pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
    flags: 'g',
    sampleText: `Session ID: b4f8a291-729c-4e89-a2e1-45f8e32901c2
Task trace: 550e8400-e29b-41d4-a716-446655440000`,
    descZh: '匹配 36 位连字符分隔的标准 UUID / GUID',
    descEn: 'Matches canonical 36-character hyphenated UUID/GUID'
  },
  {
    id: 'semver',
    nameZh: '语义化版本号 (SemVer)',
    nameEn: 'Semantic Version (SemVer)',
    category: 'developer',
    pattern: 'v?(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)(?:-[0-9a-zA-Z.-]+)?(?:\\+[0-9a-zA-Z.-]+)?',
    flags: 'g',
    sampleText: `Releases: v0.2.0, 1.0.0-beta.1, 2.14.3+build.2026, 0.0.1
Invalid: 1.0, 01.2.3, v1`,
    descZh: '匹配遵循 SemVer 规范的版本号（支持前缀 v 及 pre-release/build 标记）',
    descEn: 'Matches semantic versioning strings (e.g. v1.2.3-alpha.1)'
  },
  {
    id: 'chinese',
    nameZh: '中文字符 (Chinese)',
    nameEn: 'Chinese Characters',
    category: 'format',
    pattern: '[\\u4e00-\\u9fa5]+',
    flags: 'g',
    sampleText: `Hello 世界！欢迎使用 DevCrate 开发者箱。Fast & Secure.`,
    descZh: '匹配一个或连续多个 Unicode 中文字符',
    descEn: 'Matches one or more consecutive Chinese Unicode characters'
  },
  {
    id: 'html-tag',
    nameZh: 'HTML 标签',
    nameEn: 'HTML Tags',
    category: 'developer',
    pattern: '<\\/?([a-zA-Z0-9]+)(?:\\s+[^>]*)?\\/?>',
    flags: 'g',
    sampleText: `<div class="container"><h1 id="title">Hello</h1><img src="logo.png" alt="Logo" /><br/></div>`,
    descZh: '匹配 HTML 开闭标签及自闭合标签',
    descEn: 'Matches HTML opening, closing, and self-closing tags'
  },
  {
    id: 'strong-password',
    nameZh: '强密码校验 (8位以上+大小写+数字+特殊符号)',
    nameEn: 'Strong Password Rule',
    category: 'developer',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    flags: '',
    sampleText: `P@ssw0rd2026!`,
    descZh: '至少 8 位，且必须同时包含大小写字母、数字及特殊字符',
    descEn: 'At least 8 chars with uppercase, lowercase, number, and special char'
  }
];

export interface CheatsheetItem {
  categoryZh: string;
  categoryEn: string;
  items: Array<{
    token: string;
    descZh: string;
    descEn: string;
    example?: string;
  }>;
}

export const CHEATSHEET_DATA: CheatsheetItem[] = [
  {
    categoryZh: '字符组 (Character Classes)',
    categoryEn: 'Character Classes',
    items: [
      { token: '.', descZh: '匹配除换行符以外的任意字符（点号模式下包含换行）', descEn: 'Any character except newline' },
      { token: '\\d', descZh: '匹配任意数字字符 [0-9]', descEn: 'Any digit [0-9]' },
      { token: '\\D', descZh: '匹配任意非数字字符 [^0-9]', descEn: 'Any non-digit [^0-9]' },
      { token: '\\w', descZh: '匹配字母、数字、下划线 [a-zA-Z0-9_]', descEn: 'Word character [a-zA-Z0-9_]' },
      { token: '\\W', descZh: '匹配非单词字符', descEn: 'Non-word character' },
      { token: '\\s', descZh: '匹配空白字符 (空格、Tab、换行等)', descEn: 'Whitespace character (space, tab, newline)' },
      { token: '\\S', descZh: '匹配非空白字符', descEn: 'Non-whitespace character' },
      { token: '[abc]', descZh: '匹配字符集合内的任意一个字符', descEn: 'Any character in set' },
      { token: '[^abc]', descZh: '否定字符组，匹配不在集合内的字符', descEn: 'Any character NOT in set' },
      { token: '[a-z]', descZh: '匹配指定范围内的字符 (如 a 到 z)', descEn: 'Range of characters' }
    ]
  },
  {
    categoryZh: '边界与锚点 (Anchors & Boundaries)',
    categoryEn: 'Anchors & Boundaries',
    items: [
      { token: '^', descZh: '匹配输入字符串或多行模式下的行首', descEn: 'Start of string or start of line (multiline)' },
      { token: '$', descZh: '匹配输入字符串或多行模式下的行尾', descEn: 'End of string or end of line (multiline)' },
      { token: '\\b', descZh: '匹配单词边界', descEn: 'Word boundary' },
      { token: '\\B', descZh: '匹配非单词边界', descEn: 'Non-word boundary' }
    ]
  },
  {
    categoryZh: '量词 (Quantifiers)',
    categoryEn: 'Quantifiers',
    items: [
      { token: '*', descZh: '匹配 0 次或多次 (贪婪)', descEn: '0 or more matches (greedy)' },
      { token: '+', descZh: '匹配 1 次或多次 (贪婪)', descEn: '1 or more matches (greedy)' },
      { token: '?', descZh: '匹配 0 次或 1 次 (可选)', descEn: '0 or 1 match (optional)' },
      { token: '{n}', descZh: '精确匹配 n 次', descEn: 'Exactly n matches' },
      { token: '{n,}', descZh: '至少匹配 n 次', descEn: 'At least n matches' },
      { token: '{n,m}', descZh: '匹配 n 到 m 次', descEn: 'Between n and m matches' },
      { token: '*? / +?', descZh: '非贪婪量词，匹配尽可能少的内容', descEn: 'Lazy / non-greedy match' }
    ]
  },
  {
    categoryZh: '分组与断言 (Groups & Lookaround)',
    categoryEn: 'Groups & Lookaround',
    items: [
      { token: '(abc)', descZh: '捕获组 (Capturing group)，可被编号 $1, $2 引用', descEn: 'Capturing group' },
      { token: '(?:abc)', descZh: '非捕获组 (Non-capturing group)，仅分组不记录捕获', descEn: 'Non-capturing group' },
      { token: '(?<name>abc)', descZh: '具名捕获组 (Named capturing group)', descEn: 'Named capturing group' },
      { token: 'a|b', descZh: '或条件 (Alternation)，匹配 a 或 b', descEn: 'Or condition (matches a or b)' },
      { token: '(?=abc)', descZh: '正向前瞻 (Positive lookahead)，要求右侧紧跟 abc 但不消耗字符', descEn: 'Positive lookahead' },
      { token: '(?!abc)', descZh: '负向前瞻 (Negative lookahead)，要求右侧不能紧跟 abc', descEn: 'Negative lookahead' },
      { token: '(?<=abc)', descZh: '正向后瞻 (Positive lookbehind)，要求左侧紧随 abc', descEn: 'Positive lookbehind' },
      { token: '(?<!abc)', descZh: '负向后瞻 (Negative lookbehind)，要求左侧不能是 abc', descEn: 'Negative lookbehind' }
    ]
  }
];

export function generateCodeSnippet(language: string, pattern: string, flags: string, sample: string): string {
  const safeSample = sample.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  const safePattern = pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  switch (language) {
    case 'javascript':
      return `const text = "${safeSample}";
const regex = /${pattern}/${flags};

// 1. 查找所有匹配
for (const match of text.matchAll(regex)) {
  console.log("Match found:", match[0], "at index:", match.index);
  if (match.length > 1) {
    console.log("Captured groups:", match.slice(1));
  }
}

// 2. 检查是否匹配
const hasMatch = regex.test(text);
console.log("Has match:", hasMatch);`;

    case 'python': {
      const pyFlags: string[] = [];
      if (flags.includes('i')) pyFlags.push('re.IGNORECASE');
      if (flags.includes('m')) pyFlags.push('re.MULTILINE');
      if (flags.includes('s')) pyFlags.push('re.DOTALL');
      const flagArg = pyFlags.length > 0 ? `, ${pyFlags.join(' | ')}` : '';

      return `import re

text = """${sample}"""
pattern = r"${pattern}"

# 1. 查找所有匹配对象
matches = re.finditer(pattern, text${flagArg})
for match in matches:
    print(f"Match: {match.group(0)} at ({match.start()}, {match.end()})")
    print(f"Groups: {match.groups()}")

# 2. 检查是否存在匹配
has_match = bool(re.search(pattern, text${flagArg}))
print("Has match:", has_match)`;
    }

    case 'go':
      return `package main

import (
\t"fmt"
\t"regexp"
)

func main() {
\ttext := \`${sample}\`
\t// Go regexp 不直接支持全局 /g 标志，使用 FindAll 系列函数
\tre := regexp.MustCompile(\`${pattern}\`)

\tmatches := re.FindAllStringSubmatch(text, -1)
\tfor i, match := range matches {
\t\tfmt.Printf("Match %d: %s\\n", i+1, match[0])
\t\tif len(match) > 1 {
\t\t\tfmt.Printf("  Groups: %v\\n", match[1:])
\t\t}
\t}
}`;

    case 'rust':
      return `use regex::Regex;

fn main() {
    let text = r#"${sample}"#;
    let re = Regex::new(r#"${pattern}"#).unwrap();

    for cap in re.captures_iter(text) {
        println!("Match: {}", &cap[0]);
        for (i, group) in cap.iter().enumerate().skip(1) {
            if let Some(m) = group {
                println!("  Group {}: {}", i, m.as_str());
            }
        }
    }
}`;

    case 'java':
      return `import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RegexDemo {
    public static void main(String[] args) {
        String text = "${safeSample}";
        Pattern pattern = Pattern.compile("${safePattern}");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            System.out.println("Match: " + matcher.group() + " at " + matcher.start());
            for (int i = 1; i <= matcher.groupCount(); i++) {
                System.out.println("  Group " + i + ": " + matcher.group(i));
            }
        }
    }
}`;

    case 'php':
      return `<?php
$text = "${safeSample}";
$pattern = '/${pattern}/${flags}';

if (preg_match_all($pattern, $text, $matches, PREG_OFFSET_CAPTURE)) {
    foreach ($matches[0] as $index => $match) {
        echo "Match: " . $match[0] . " at offset: " . $match[1] . PHP_EOL;
    }
}
?>`;

    default:
      return '';
  }
}
