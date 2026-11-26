import {
  createEmptyStyleSyncConfig,
  createStyleRuleId,
  type StyleSyncConfig,
} from './editorConfigPrettierUtils';

export interface StylePreset {
  id: string;
  nameKey: string;
  descKey: string;
  build: () => StyleSyncConfig;
}

export const COMMON_PRETTIER_PLUGINS = [
  'prettier-plugin-tailwindcss',
  '@trivago/prettier-plugin-sort-imports',
  'prettier-plugin-organize-imports',
  'prettier-plugin-packagejson',
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'vue-vite',
    nameKey: 'tools.editorConfigPrettier.presets.vueVite',
    descKey: 'tools.editorConfigPrettier.presets.vueViteDesc',
    build: () =>
      createEmptyStyleSyncConfig({
        indentStyle: 'space',
        indentSize: 2,
        endOfLine: 'lf',
        printWidth: 100,
        semi: true,
        singleQuote: true,
        trailingComma: 'all',
        arrowParens: 'always',
        vueIndentScriptAndStyle: false,
      }),
  },
  {
    id: 'react-tailwind',
    nameKey: 'tools.editorConfigPrettier.presets.reactTailwind',
    descKey: 'tools.editorConfigPrettier.presets.reactTailwindDesc',
    build: () =>
      createEmptyStyleSyncConfig({
        indentStyle: 'space',
        indentSize: 2,
        endOfLine: 'lf',
        printWidth: 80,
        semi: true,
        singleQuote: true,
        jsxSingleQuote: false,
        trailingComma: 'es5',
        arrowParens: 'always',
        plugins: ['prettier-plugin-tailwindcss'],
      }),
  },
  {
    id: 'node-backend',
    nameKey: 'tools.editorConfigPrettier.presets.nodeBackend',
    descKey: 'tools.editorConfigPrettier.presets.nodeBackendDesc',
    build: () =>
      createEmptyStyleSyncConfig({
        indentStyle: 'space',
        indentSize: 2,
        endOfLine: 'lf',
        printWidth: 100,
        semi: true,
        singleQuote: true,
        trailingComma: 'all',
        arrowParens: 'always',
        syncMaxLineLengthToEditorConfig: true,
      }),
  },
  {
    id: 'polyglot-monorepo',
    nameKey: 'tools.editorConfigPrettier.presets.polyglotMonorepo',
    descKey: 'tools.editorConfigPrettier.presets.polyglotMonorepoDesc',
    build: () =>
      createEmptyStyleSyncConfig({
        indentStyle: 'space',
        indentSize: 2,
        endOfLine: 'lf',
        printWidth: 100,
        semi: true,
        singleQuote: true,
        trailingComma: 'all',
        editorConfigOverrides: [
          {
            id: createStyleRuleId('ec'),
            enabled: true,
            glob: '*.md',
            trimTrailingWhitespace: false,
          },
          {
            id: createStyleRuleId('ec'),
            enabled: true,
            glob: '*.{py,rs,java,kt}',
            indentStyle: 'space',
            indentSize: 4,
          },
          {
            id: createStyleRuleId('ec'),
            enabled: true,
            glob: '*.go',
            indentStyle: 'tab',
            indentSize: 4,
          },
          {
            id: createStyleRuleId('ec'),
            enabled: true,
            glob: 'Makefile',
            indentStyle: 'tab',
          },
        ],
        prettierOverrides: [
          {
            id: createStyleRuleId('pr'),
            enabled: true,
            files: '*.md',
            proseWrap: 'preserve',
            tabWidth: 2,
          },
          {
            id: createStyleRuleId('pr'),
            enabled: true,
            files: '*.json, *.yml, *.yaml',
            singleQuote: false,
            tabWidth: 2,
          },
        ],
      }),
  },
  {
    id: 'minimal-tabs',
    nameKey: 'tools.editorConfigPrettier.presets.minimalTabs',
    descKey: 'tools.editorConfigPrettier.presets.minimalTabsDesc',
    build: () =>
      createEmptyStyleSyncConfig({
        indentStyle: 'tab',
        indentSize: 2,
        endOfLine: 'lf',
        printWidth: 100,
        semi: false,
        singleQuote: true,
        trailingComma: 'all',
        arrowParens: 'avoid',
        editorConfigOverrides: [
          {
            id: createStyleRuleId('ec'),
            enabled: true,
            glob: '*.md',
            indentStyle: 'space',
            indentSize: 2,
            trimTrailingWhitespace: false,
          },
          {
            id: createStyleRuleId('ec'),
            enabled: true,
            glob: '*.{yml,yaml}',
            indentStyle: 'space',
            indentSize: 2,
          },
        ],
      }),
  },
];
