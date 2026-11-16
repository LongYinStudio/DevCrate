import { parseConfig, DEFAULT_CONVERT_OPTIONS } from '../converters/configConverterUtils';

export type PermissionAccess = 'default' | 'read' | 'write' | 'none';
export type PermissionScope =
  | 'contents'
  | 'packages'
  | 'pages'
  | 'id-token'
  | 'pull-requests'
  | 'issues'
  | 'actions'
  | 'deployments'
  | 'checks'
  | 'security-events';

export type PermissionsPreset = 'default' | 'read-all' | 'write-all' | 'custom';

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface DispatchInput {
  name: string;
  description: string;
  required: boolean;
  defaultValue: string;
  type: 'string' | 'boolean' | 'choice' | 'environment';
  options: string; // comma-separated for choice
}

export interface WorkflowTriggers {
  push: {
    enabled: boolean;
    branches: string;
    branchesIgnore: string;
    tags: string;
    paths: string;
  };
  pullRequest: {
    enabled: boolean;
    branches: string;
    types: string;
    paths: string;
  };
  workflowDispatch: {
    enabled: boolean;
    inputs: DispatchInput[];
  };
  schedule: {
    enabled: boolean;
    crons: string[];
  };
  release: {
    enabled: boolean;
    types: string;
  };
  workflowCall: {
    enabled: boolean;
  };
}

export interface MatrixAxis {
  key: string;
  values: string; // comma-separated
}

export interface WorkflowStep {
  uid: string;
  id: string;
  name: string;
  kind: 'uses' | 'run';
  uses: string;
  withParams: KeyValuePair[];
  run: string;
  shell: string;
  workingDirectory: string;
  env: KeyValuePair[];
  ifExpr: string;
  continueOnError: boolean;
  disabled: boolean;
}

export interface WorkflowJob {
  uid: string;
  id: string;
  name: string;
  runsOn: string;
  needs: string[];
  ifExpr: string;
  timeoutMinutes: number | null;
  continueOnError: boolean;
  environment: string;
  strategy: {
    enabled: boolean;
    failFast: boolean;
    maxParallel: number | null;
    matrix: MatrixAxis[];
  };
  env: KeyValuePair[];
  steps: WorkflowStep[];
}

export interface WorkflowConfig {
  filename: string;
  name: string;
  runName: string;
  triggers: WorkflowTriggers;
  permissionsPreset: PermissionsPreset;
  permissions: Record<PermissionScope, PermissionAccess>;
  concurrency: {
    enabled: boolean;
    group: string;
    cancelInProgress: boolean;
  };
  env: KeyValuePair[];
  defaultsShell: string;
  defaultsWorkingDirectory: string;
  jobs: WorkflowJob[];
}

export interface WorkflowFormatOptions {
  indentSize: 2 | 4;
  includeHeaderComment: boolean;
}

export interface WorkflowLintIssue {
  level: 'error' | 'warning';
  code: string;
  detail?: string;
}

export interface ActionCatalogItem {
  id: string;
  name: string;
  uses: string;
  category: 'vcs' | 'setup' | 'cache' | 'docker' | 'release' | 'security';
  descZh: string;
  descEn: string;
  defaultStepName: string;
  defaultWith: KeyValuePair[];
}

export interface WorkflowPreset {
  id: string;
  nameKey: string;
  descKey: string;
  build: () => WorkflowConfig;
}

export const PERMISSION_SCOPES: PermissionScope[] = [
  'contents',
  'packages',
  'pages',
  'id-token',
  'pull-requests',
  'issues',
  'actions',
  'deployments',
  'checks',
  'security-events'
];

export const RUNNER_OPTIONS = [
  'ubuntu-latest',
  'ubuntu-24.04',
  'ubuntu-22.04',
  'macos-latest',
  'macos-14',
  'windows-latest',
  'self-hosted',
  '${{ matrix.os }}'
];

export const CRON_QUICK_PRESETS = [
  { labelZh: '每天凌晨 02:00 (UTC)', labelEn: 'Daily at 02:00 UTC', expr: '0 2 * * *' },
  { labelZh: '每周一 03:00 (UTC)', labelEn: 'Weekly on Mon 03:00 UTC', expr: '0 3 * * 1' },
  { labelZh: '每 6 小时', labelEn: 'Every 6 hours', expr: '0 */6 * * *' },
  { labelZh: '每月 1 日 00:00 (UTC)', labelEn: 'Monthly 1st 00:00 UTC', expr: '0 0 1 * *' }
];

let uidSeq = 1;
export function nextWorkflowUid(prefix = 'wf'): string {
  return `${prefix}_${uidSeq++}`;
}

export function createDefaultPermissions(): Record<PermissionScope, PermissionAccess> {
  return {
    contents: 'read',
    packages: 'default',
    pages: 'default',
    'id-token': 'default',
    'pull-requests': 'default',
    issues: 'default',
    actions: 'default',
    deployments: 'default',
    checks: 'default',
    'security-events': 'default'
  };
}

export function createEmptyStep(kind: 'uses' | 'run' = 'run'): WorkflowStep {
  return {
    uid: nextWorkflowUid('step'),
    id: '',
    name: kind === 'uses' ? 'Checkout repository' : 'Run script',
    kind,
    uses: kind === 'uses' ? 'actions/checkout@v4' : '',
    withParams: [],
    run: kind === 'run' ? 'echo "Hello GitHub Actions"' : '',
    shell: '',
    workingDirectory: '',
    env: [],
    ifExpr: '',
    continueOnError: false,
    disabled: false
  };
}

export function createEmptyJob(id = 'build', name = 'Build'): WorkflowJob {
  return {
    uid: nextWorkflowUid('job'),
    id,
    name,
    runsOn: 'ubuntu-latest',
    needs: [],
    ifExpr: '',
    timeoutMinutes: null,
    continueOnError: false,
    environment: '',
    strategy: {
      enabled: false,
      failFast: true,
      maxParallel: null,
      matrix: []
    },
    env: [],
    steps: [
      {
        ...createEmptyStep('uses'),
        name: 'Checkout code',
        uses: 'actions/checkout@v4'
      },
      {
        ...createEmptyStep('run'),
        name: 'Run tests',
        run: 'echo "Running checks..."'
      }
    ]
  };
}

function createBaseTriggers(): WorkflowTriggers {
  return {
    push: {
      enabled: true,
      branches: 'main',
      branchesIgnore: '',
      tags: '',
      paths: ''
    },
    pullRequest: {
      enabled: true,
      branches: 'main',
      types: '',
      paths: ''
    },
    workflowDispatch: {
      enabled: true,
      inputs: []
    },
    schedule: {
      enabled: false,
      crons: ['0 2 * * *']
    },
    release: {
      enabled: false,
      types: 'published'
    },
    workflowCall: {
      enabled: false
    }
  };
}

// ============================================================================
// 精选常用官方与社区 Actions 目录
// ============================================================================

export const ACTION_CATALOG: ActionCatalogItem[] = [
  {
    id: 'checkout',
    name: 'actions/checkout',
    uses: 'actions/checkout@v4',
    category: 'vcs',
    descZh: '检出仓库代码到 Runner 工作区',
    descEn: 'Check out repository under $GITHUB_WORKSPACE',
    defaultStepName: 'Checkout code',
    defaultWith: []
  },
  {
    id: 'setup-node',
    name: 'actions/setup-node',
    uses: 'actions/setup-node@v4',
    category: 'setup',
    descZh: '安装 Node.js 环境并配置包管理器缓存',
    descEn: 'Set up Node.js environment with package manager cache',
    defaultStepName: 'Setup Node.js',
    defaultWith: [
      { key: 'node-version', value: '22' },
      { key: 'cache', value: 'npm' }
    ]
  },
  {
    id: 'pnpm-setup',
    name: 'pnpm/action-setup',
    uses: 'pnpm/action-setup@v4',
    category: 'setup',
    descZh: '安装 pnpm 包管理器',
    descEn: 'Install pnpm package manager',
    defaultStepName: 'Setup pnpm',
    defaultWith: [{ key: 'version', value: '10' }]
  },
  {
    id: 'setup-bun',
    name: 'oven-sh/setup-bun',
    uses: 'oven-sh/setup-bun@v2',
    category: 'setup',
    descZh: '安装 Bun 运行时与包管理器',
    descEn: 'Set up Bun runtime and package manager',
    defaultStepName: 'Setup Bun',
    defaultWith: [{ key: 'bun-version', value: 'latest' }]
  },
  {
    id: 'setup-python',
    name: 'actions/setup-python',
    uses: 'actions/setup-python@v5',
    category: 'setup',
    descZh: '安装 Python 环境并启用 pip / poetry 缓存',
    descEn: 'Set up Python and optionally cache dependencies',
    defaultStepName: 'Setup Python',
    defaultWith: [
      { key: 'python-version', value: '3.12' },
      { key: 'cache', value: 'pip' }
    ]
  },
  {
    id: 'setup-go',
    name: 'actions/setup-go',
    uses: 'actions/setup-go@v5',
    category: 'setup',
    descZh: '安装 Go 工具链并缓存模块',
    descEn: 'Set up Go environment with module cache',
    defaultStepName: 'Setup Go',
    defaultWith: [
      { key: 'go-version', value: '1.23' },
      { key: 'cache', value: 'true' }
    ]
  },
  {
    id: 'setup-java',
    name: 'actions/setup-java',
    uses: 'actions/setup-java@v4',
    category: 'setup',
    descZh: '安装 JDK (Temurin / Corretto / Zulu)',
    descEn: 'Set up Java JDK distribution',
    defaultStepName: 'Setup Java',
    defaultWith: [
      { key: 'distribution', value: 'temurin' },
      { key: 'java-version', value: '21' },
      { key: 'cache', value: 'maven' }
    ]
  },
  {
    id: 'rust-toolchain',
    name: 'dtolnay/rust-toolchain',
    uses: 'dtolnay/rust-toolchain@stable',
    category: 'setup',
    descZh: '安装 Rust 工具链与 rustfmt / clippy 组件',
    descEn: 'Install Rust toolchain with optional components',
    defaultStepName: 'Setup Rust toolchain',
    defaultWith: [{ key: 'components', value: 'rustfmt, clippy' }]
  },
  {
    id: 'rust-cache',
    name: 'Swatinem/rust-cache',
    uses: 'Swatinem/rust-cache@v2',
    category: 'cache',
    descZh: '智能缓存 Cargo 依赖与 target 构建产物',
    descEn: 'Smart caching for Rust Cargo dependencies and artifacts',
    defaultStepName: 'Cache Rust dependencies',
    defaultWith: []
  },
  {
    id: 'cache',
    name: 'actions/cache',
    uses: 'actions/cache@v4',
    category: 'cache',
    descZh: '通用构建缓存加速（依赖目录或编译产物）',
    descEn: 'Cache dependencies and build outputs to speed up workflows',
    defaultStepName: 'Cache build dependencies',
    defaultWith: [
      { key: 'path', value: '~/.cache' },
      { key: 'key', value: "${{ runner.os }}-cache-${{ hashFiles('**/lock*') }}" }
    ]
  },
  {
    id: 'upload-artifact',
    name: 'actions/upload-artifact',
    uses: 'actions/upload-artifact@v4',
    category: 'cache',
    descZh: '上传构建产物供其他 Job 或下载使用',
    descEn: 'Upload build artifacts from workflow run',
    defaultStepName: 'Upload build artifacts',
    defaultWith: [
      { key: 'name', value: 'dist-artifacts' },
      { key: 'path', value: 'dist/' },
      { key: 'retention-days', value: '7' }
    ]
  },
  {
    id: 'download-artifact',
    name: 'actions/download-artifact',
    uses: 'actions/download-artifact@v4',
    category: 'cache',
    descZh: '下载前置 Job 上传的构建产物',
    descEn: 'Download artifacts uploaded by previous jobs',
    defaultStepName: 'Download artifacts',
    defaultWith: [{ key: 'name', value: 'dist-artifacts' }]
  },
  {
    id: 'docker-buildx',
    name: 'docker/setup-buildx-action',
    uses: 'docker/setup-buildx-action@v3',
    category: 'docker',
    descZh: '初始化 Docker Buildx 多平台构建器',
    descEn: 'Create and boot a Docker Buildx builder',
    defaultStepName: 'Set up Docker Buildx',
    defaultWith: []
  },
  {
    id: 'docker-login',
    name: 'docker/login-action',
    uses: 'docker/login-action@v3',
    category: 'docker',
    descZh: '登录 Docker Hub / GHCR 镜像仓库',
    descEn: 'Log in to Docker Hub or GHCR container registry',
    defaultStepName: 'Log in to Container Registry',
    defaultWith: [
      { key: 'registry', value: 'ghcr.io' },
      { key: 'username', value: '${{ github.actor }}' },
      { key: 'password', value: '${{ secrets.GITHUB_TOKEN }}' }
    ]
  },
  {
    id: 'docker-metadata',
    name: 'docker/metadata-action',
    uses: 'docker/metadata-action@v5',
    category: 'docker',
    descZh: '自动提取 Git 分支/Tag 生成镜像标签与 OCI 元数据',
    descEn: 'Extract Docker image tags and labels from Git refs',
    defaultStepName: 'Extract Docker metadata',
    defaultWith: [
      { key: 'images', value: 'ghcr.io/${{ github.repository }}' },
      { key: 'tags', value: 'type=ref,event=branch\ntype=semver,pattern={{version}}\ntype=sha' }
    ]
  },
  {
    id: 'docker-build-push',
    name: 'docker/build-push-action',
    uses: 'docker/build-push-action@v6',
    category: 'docker',
    descZh: '构建并推送 Docker 镜像（支持 GHA 层缓存）',
    descEn: 'Build and push Docker images with Buildx & GHA cache',
    defaultStepName: 'Build and push Docker image',
    defaultWith: [
      { key: 'context', value: '.' },
      { key: 'push', value: "${{ github.event_name != 'pull_request' }}" },
      { key: 'tags', value: '${{ steps.meta.outputs.tags }}' },
      { key: 'cache-from', value: 'type=gha' },
      { key: 'cache-to', value: 'type=gha,mode=max' }
    ]
  },
  {
    id: 'gh-release',
    name: 'softprops/action-gh-release',
    uses: 'softprops/action-gh-release@v2',
    category: 'release',
    descZh: '创建 GitHub Release 并自动上传安装包附件',
    descEn: 'Create GitHub Releases and attach release assets',
    defaultStepName: 'Create GitHub Release',
    defaultWith: [
      { key: 'files', value: 'dist/*' },
      { key: 'generate_release_notes', value: 'true' }
    ]
  },
  {
    id: 'configure-pages',
    name: 'actions/configure-pages',
    uses: 'actions/configure-pages@v5',
    category: 'release',
    descZh: '配置 GitHub Pages 构建环境信息',
    descEn: 'Configure GitHub Pages site metadata',
    defaultStepName: 'Setup Pages',
    defaultWith: []
  },
  {
    id: 'upload-pages',
    name: 'actions/upload-pages-artifact',
    uses: 'actions/upload-pages-artifact@v3',
    category: 'release',
    descZh: '打包并上传静态站点目录到 GitHub Pages',
    descEn: 'Package and upload static site artifact for GitHub Pages',
    defaultStepName: 'Upload Pages artifact',
    defaultWith: [{ key: 'path', value: './dist' }]
  },
  {
    id: 'deploy-pages',
    name: 'actions/deploy-pages',
    uses: 'actions/deploy-pages@v4',
    category: 'release',
    descZh: '将构建产物部署发布到 GitHub Pages',
    descEn: 'Deploy artifact to GitHub Pages',
    defaultStepName: 'Deploy to GitHub Pages',
    defaultWith: []
  },
  {
    id: 'tauri-action',
    name: 'tauri-apps/tauri-action',
    uses: 'tauri-apps/tauri-action@v0',
    category: 'release',
    descZh: '官方 Tauri 跨平台桌面端构建并发布 Release',
    descEn: 'Build Tauri desktop app and publish GitHub Release',
    defaultStepName: 'Build and release Tauri app',
    defaultWith: [
      { key: 'tagName', value: 'v__VERSION__' },
      { key: 'releaseName', value: 'App v__VERSION__' },
      { key: 'releaseDraft', value: 'true' }
    ]
  },
  {
    id: 'github-script',
    name: 'actions/github-script',
    uses: 'actions/github-script@v7',
    category: 'security',
    descZh: '使用内置 Octokit 运行轻量 GitHub API 脚本',
    descEn: 'Run GitHub API automation scripts with pre-authenticated Octokit',
    defaultStepName: 'Run GitHub Script',
    defaultWith: [{ key: 'script', value: 'console.log(context.repo);' }]
  }
];

export function createStepFromCatalog(item: ActionCatalogItem): WorkflowStep {
  return {
    uid: nextWorkflowUid('step'),
    id: item.id === 'docker-metadata' ? 'meta' : item.id === 'deploy-pages' ? 'deployment' : '',
    name: item.defaultStepName,
    kind: 'uses',
    uses: item.uses,
    withParams: item.defaultWith.map(p => ({ ...p })),
    run: '',
    shell: '',
    workingDirectory: '',
    env: [],
    ifExpr: '',
    continueOnError: false,
    disabled: false
  };
}

// ============================================================================
// 8 套常见 CI/CD 场景预设
// ============================================================================

export const WORKFLOW_PRESETS: WorkflowPreset[] = [
  {
    id: 'node-ci',
    nameKey: 'tools.githubActions.presets.nodeCi',
    descKey: 'tools.githubActions.presets.nodeCiDesc',
    build: () => ({
      filename: 'ci.yml',
      name: 'Node.js CI',
      runName: '',
      triggers: createBaseTriggers(),
      permissionsPreset: 'custom',
      permissions: createDefaultPermissions(),
      concurrency: {
        enabled: true,
        group: '${{ github.workflow }}-${{ github.ref }}',
        cancelInProgress: true
      },
      env: [],
      defaultsShell: '',
      defaultsWorkingDirectory: '',
      jobs: [
        {
          uid: nextWorkflowUid('job'),
          id: 'test',
          name: 'Lint, Typecheck & Test',
          runsOn: 'ubuntu-latest',
          needs: [],
          ifExpr: '',
          timeoutMinutes: 20,
          continueOnError: false,
          environment: '',
          strategy: {
            enabled: true,
            failFast: true,
            maxParallel: null,
            matrix: [{ key: 'node-version', values: '20, 22' }]
          },
          env: [],
          steps: [
            { ...createEmptyStep('uses'), name: 'Checkout repository', uses: 'actions/checkout@v4' },
            {
              ...createEmptyStep('uses'),
              name: 'Install pnpm',
              uses: 'pnpm/action-setup@v4',
              withParams: [{ key: 'version', value: '10' }]
            },
            {
              ...createEmptyStep('uses'),
              name: 'Setup Node.js ${{ matrix.node-version }}',
              uses: 'actions/setup-node@v4',
              withParams: [
                { key: 'node-version', value: '${{ matrix.node-version }}' },
                { key: 'cache', value: 'pnpm' }
              ]
            },
            { ...createEmptyStep('run'), name: 'Install dependencies', run: 'pnpm install --frozen-lockfile' },
            { ...createEmptyStep('run'), name: 'Run lint & typecheck', run: 'pnpm run build' },
            { ...createEmptyStep('run'), name: 'Run unit tests', run: 'pnpm test -- --run' }
          ]
        }
      ]
    })
  },
  {
    id: 'rust-ci',
    nameKey: 'tools.githubActions.presets.rustCi',
    descKey: 'tools.githubActions.presets.rustCiDesc',
    build: () => ({
      filename: 'rust.yml',
      name: 'Rust CI',
      runName: '',
      triggers: createBaseTriggers(),
      permissionsPreset: 'custom',
      permissions: createDefaultPermissions(),
      concurrency: {
        enabled: true,
        group: '${{ github.workflow }}-${{ github.ref }}',
        cancelInProgress: true
      },
      env: [{ key: 'CARGO_TERM_COLOR', value: 'always' }],
      defaultsShell: '',
      defaultsWorkingDirectory: '',
      jobs: [
        {
          uid: nextWorkflowUid('job'),
          id: 'check',
          name: 'Format, Clippy & Test',
          runsOn: 'ubuntu-latest',
          needs: [],
          ifExpr: '',
          timeoutMinutes: 30,
          continueOnError: false,
          environment: '',
          strategy: { enabled: false, failFast: true, maxParallel: null, matrix: [] },
          env: [],
          steps: [
            { ...createEmptyStep('uses'), name: 'Checkout code', uses: 'actions/checkout@v4' },
            {
              ...createEmptyStep('uses'),
              name: 'Install Rust toolchain',
              uses: 'dtolnay/rust-toolchain@stable',
              withParams: [{ key: 'components', value: 'rustfmt, clippy' }]
            },
            { ...createEmptyStep('uses'), name: 'Cache Cargo dependencies', uses: 'Swatinem/rust-cache@v2' },
            { ...createEmptyStep('run'), name: 'Check formatting', run: 'cargo fmt --all -- --check' },
            { ...createEmptyStep('run'), name: 'Run Clippy', run: 'cargo clippy --all-targets -- -D warnings' },
            { ...createEmptyStep('run'), name: 'Run Cargo tests', run: 'cargo test --verbose' }
          ]
        }
      ]
    })
  },
  {
    id: 'python-ci',
    nameKey: 'tools.githubActions.presets.pythonCi',
    descKey: 'tools.githubActions.presets.pythonCiDesc',
    build: () => ({
      filename: 'python.yml',
      name: 'Python CI',
      runName: '',
      triggers: createBaseTriggers(),
      permissionsPreset: 'custom',
      permissions: createDefaultPermissions(),
      concurrency: {
        enabled: true,
        group: '${{ github.workflow }}-${{ github.ref }}',
        cancelInProgress: true
      },
      env: [],
      defaultsShell: '',
      defaultsWorkingDirectory: '',
      jobs: [
        {
          uid: nextWorkflowUid('job'),
          id: 'test',
          name: 'Lint & Pytest',
          runsOn: 'ubuntu-latest',
          needs: [],
          ifExpr: '',
          timeoutMinutes: 20,
          continueOnError: false,
          environment: '',
          strategy: {
            enabled: true,
            failFast: true,
            maxParallel: null,
            matrix: [{ key: 'python-version', values: '3.11, 3.12, 3.13' }]
          },
          env: [],
          steps: [
            { ...createEmptyStep('uses'), name: 'Checkout code', uses: 'actions/checkout@v4' },
            {
              ...createEmptyStep('uses'),
              name: 'Setup Python ${{ matrix.python-version }}',
              uses: 'actions/setup-python@v5',
              withParams: [
                { key: 'python-version', value: '${{ matrix.python-version }}' },
                { key: 'cache', value: 'pip' }
              ]
            },
            {
              ...createEmptyStep('run'),
              name: 'Install dependencies',
              run: 'python -m pip install --upgrade pip\npip install -r requirements.txt\npip install pytest ruff'
            },
            { ...createEmptyStep('run'), name: 'Lint with Ruff', run: 'ruff check .' },
            { ...createEmptyStep('run'), name: 'Run pytest', run: 'pytest -v' }
          ]
        }
      ]
    })
  },
  {
    id: 'go-ci',
    nameKey: 'tools.githubActions.presets.goCi',
    descKey: 'tools.githubActions.presets.goCiDesc',
    build: () => ({
      filename: 'go.yml',
      name: 'Go CI',
      runName: '',
      triggers: createBaseTriggers(),
      permissionsPreset: 'custom',
      permissions: createDefaultPermissions(),
      concurrency: {
        enabled: true,
        group: '${{ github.workflow }}-${{ github.ref }}',
        cancelInProgress: true
      },
      env: [],
      defaultsShell: '',
      defaultsWorkingDirectory: '',
      jobs: [
        {
          uid: nextWorkflowUid('job'),
          id: 'test',
          name: 'Vet, Test & Build',
          runsOn: 'ubuntu-latest',
          needs: [],
          ifExpr: '',
          timeoutMinutes: 15,
          continueOnError: false,
          environment: '',
          strategy: { enabled: false, failFast: true, maxParallel: null, matrix: [] },
          env: [],
          steps: [
            { ...createEmptyStep('uses'), name: 'Checkout code', uses: 'actions/checkout@v4' },
            {
              ...createEmptyStep('uses'),
              name: 'Setup Go',
              uses: 'actions/setup-go@v5',
              withParams: [
                { key: 'go-version', value: '1.23' },
                { key: 'cache', value: 'true' }
              ]
            },
            { ...createEmptyStep('run'), name: 'Run go vet', run: 'go vet ./...' },
            { ...createEmptyStep('run'), name: 'Run tests with race detector', run: 'go test -race -v ./...' },
            { ...createEmptyStep('run'), name: 'Build binary', run: 'go build -v ./...' }
          ]
        }
      ]
    })
  },
  {
    id: 'docker-ghcr',
    nameKey: 'tools.githubActions.presets.dockerGhcr',
    descKey: 'tools.githubActions.presets.dockerGhcrDesc',
    build: () => {
      const triggers = createBaseTriggers();
      triggers.push.tags = 'v*';
      const perms = createDefaultPermissions();
      perms.contents = 'read';
      perms.packages = 'write';

      return {
        filename: 'docker.yml',
        name: 'Docker Build & Push',
        runName: '',
        triggers,
        permissionsPreset: 'custom',
        permissions: perms,
        concurrency: {
          enabled: true,
          group: '${{ github.workflow }}-${{ github.ref }}',
          cancelInProgress: true
        },
        env: [{ key: 'REGISTRY', value: 'ghcr.io' }],
        defaultsShell: '',
        defaultsWorkingDirectory: '',
        jobs: [
          {
            uid: nextWorkflowUid('job'),
            id: 'docker',
            name: 'Build and Push Image',
            runsOn: 'ubuntu-latest',
            needs: [],
            ifExpr: '',
            timeoutMinutes: 30,
            continueOnError: false,
            environment: '',
            strategy: { enabled: false, failFast: true, maxParallel: null, matrix: [] },
            env: [],
            steps: [
              { ...createEmptyStep('uses'), name: 'Checkout code', uses: 'actions/checkout@v4' },
              { ...createEmptyStep('uses'), name: 'Set up Docker Buildx', uses: 'docker/setup-buildx-action@v3' },
              {
                ...createEmptyStep('uses'),
                name: 'Log in to GHCR',
                uses: 'docker/login-action@v3',
                ifExpr: "github.event_name != 'pull_request'",
                withParams: [
                  { key: 'registry', value: '${{ env.REGISTRY }}' },
                  { key: 'username', value: '${{ github.actor }}' },
                  { key: 'password', value: '${{ secrets.GITHUB_TOKEN }}' }
                ]
              },
              {
                ...createEmptyStep('uses'),
                id: 'meta',
                name: 'Extract Docker metadata',
                uses: 'docker/metadata-action@v5',
                withParams: [
                  { key: 'images', value: '${{ env.REGISTRY }}/${{ github.repository }}' },
                  { key: 'tags', value: 'type=ref,event=branch\ntype=semver,pattern={{version}}\ntype=sha' }
                ]
              },
              {
                ...createEmptyStep('uses'),
                name: 'Build and push image',
                uses: 'docker/build-push-action@v6',
                withParams: [
                  { key: 'context', value: '.' },
                  { key: 'push', value: "${{ github.event_name != 'pull_request' }}" },
                  { key: 'tags', value: '${{ steps.meta.outputs.tags }}' },
                  { key: 'labels', value: '${{ steps.meta.outputs.labels }}' },
                  { key: 'cache-from', value: 'type=gha' },
                  { key: 'cache-to', value: 'type=gha,mode=max' }
                ]
              }
            ]
          }
        ]
      };
    }
  },
  {
    id: 'gh-pages',
    nameKey: 'tools.githubActions.presets.ghPages',
    descKey: 'tools.githubActions.presets.ghPagesDesc',
    build: () => {
      const triggers = createBaseTriggers();
      triggers.pullRequest.enabled = false;
      const perms = createDefaultPermissions();
      perms.contents = 'read';
      perms.pages = 'write';
      perms['id-token'] = 'write';

      return {
        filename: 'pages.yml',
        name: 'Deploy to GitHub Pages',
        runName: '',
        triggers,
        permissionsPreset: 'custom',
        permissions: perms,
        concurrency: {
          enabled: true,
          group: 'pages',
          cancelInProgress: false
        },
        env: [],
        defaultsShell: '',
        defaultsWorkingDirectory: '',
        jobs: [
          {
            uid: nextWorkflowUid('job'),
            id: 'build',
            name: 'Build Static Site',
            runsOn: 'ubuntu-latest',
            needs: [],
            ifExpr: '',
            timeoutMinutes: 15,
            continueOnError: false,
            environment: '',
            strategy: { enabled: false, failFast: true, maxParallel: null, matrix: [] },
            env: [],
            steps: [
              { ...createEmptyStep('uses'), name: 'Checkout code', uses: 'actions/checkout@v4' },
              {
                ...createEmptyStep('uses'),
                name: 'Setup Node.js',
                uses: 'actions/setup-node@v4',
                withParams: [
                  { key: 'node-version', value: '22' },
                  { key: 'cache', value: 'npm' }
                ]
              },
              { ...createEmptyStep('run'), name: 'Install & build', run: 'npm ci\nnpm run build' },
              { ...createEmptyStep('uses'), name: 'Setup Pages', uses: 'actions/configure-pages@v5' },
              {
                ...createEmptyStep('uses'),
                name: 'Upload Pages artifact',
                uses: 'actions/upload-pages-artifact@v3',
                withParams: [{ key: 'path', value: './dist' }]
              }
            ]
          },
          {
            uid: nextWorkflowUid('job'),
            id: 'deploy',
            name: 'Deploy to Pages',
            runsOn: 'ubuntu-latest',
            needs: ['build'],
            ifExpr: '',
            timeoutMinutes: 10,
            continueOnError: false,
            environment: 'github-pages',
            strategy: { enabled: false, failFast: true, maxParallel: null, matrix: [] },
            env: [],
            steps: [
              {
                ...createEmptyStep('uses'),
                id: 'deployment',
                name: 'Deploy to GitHub Pages',
                uses: 'actions/deploy-pages@v4'
              }
            ]
          }
        ]
      };
    }
  },
  {
    id: 'tauri-release',
    nameKey: 'tools.githubActions.presets.tauriRelease',
    descKey: 'tools.githubActions.presets.tauriReleaseDesc',
    build: () => {
      const triggers = createBaseTriggers();
      triggers.push.branches = '';
      triggers.push.tags = 'v*';
      triggers.pullRequest.enabled = false;
      const perms = createDefaultPermissions();
      perms.contents = 'write';

      return {
        filename: 'release.yml',
        name: 'Tauri Cross-Platform Release',
        runName: '',
        triggers,
        permissionsPreset: 'custom',
        permissions: perms,
        concurrency: {
          enabled: true,
          group: '${{ github.workflow }}-${{ github.ref }}',
          cancelInProgress: true
        },
        env: [],
        defaultsShell: '',
        defaultsWorkingDirectory: '',
        jobs: [
          {
            uid: nextWorkflowUid('job'),
            id: 'publish-tauri',
            name: 'Build (${{ matrix.platform }})',
            runsOn: '${{ matrix.platform }}',
            needs: [],
            ifExpr: '',
            timeoutMinutes: 45,
            continueOnError: false,
            environment: '',
            strategy: {
              enabled: true,
              failFast: false,
              maxParallel: null,
              matrix: [{ key: 'platform', values: 'macos-latest, ubuntu-22.04, windows-latest' }]
            },
            env: [],
            steps: [
              { ...createEmptyStep('uses'), name: 'Checkout code', uses: 'actions/checkout@v4' },
              {
                ...createEmptyStep('uses'),
                name: 'Setup Node.js',
                uses: 'actions/setup-node@v4',
                withParams: [
                  { key: 'node-version', value: '22' },
                  { key: 'cache', value: 'npm' }
                ]
              },
              { ...createEmptyStep('uses'), name: 'Setup Rust toolchain', uses: 'dtolnay/rust-toolchain@stable' },
              {
                ...createEmptyStep('run'),
                name: 'Install Linux system dependencies',
                ifExpr: "matrix.platform == 'ubuntu-22.04'",
                run: 'sudo apt-get update\nsudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf'
              },
              { ...createEmptyStep('run'), name: 'Install frontend dependencies', run: 'npm ci' },
              {
                ...createEmptyStep('uses'),
                name: 'Build and publish Tauri release',
                uses: 'tauri-apps/tauri-action@v0',
                env: [{ key: 'GITHUB_TOKEN', value: '${{ secrets.GITHUB_TOKEN }}' }],
                withParams: [
                  { key: 'tagName', value: 'v__VERSION__' },
                  { key: 'releaseName', value: 'App v__VERSION__' },
                  { key: 'releaseDraft', value: 'true' }
                ]
              }
            ]
          }
        ]
      };
    }
  },
  {
    id: 'scheduled-ops',
    nameKey: 'tools.githubActions.presets.scheduledOps',
    descKey: 'tools.githubActions.presets.scheduledOpsDesc',
    build: () => {
      const triggers = createBaseTriggers();
      triggers.push.enabled = false;
      triggers.pullRequest.enabled = false;
      triggers.schedule.enabled = true;
      triggers.schedule.crons = ['0 2 * * *'];
      triggers.workflowDispatch.inputs = [
        {
          name: 'environment',
          description: 'Target environment',
          required: true,
          defaultValue: 'staging',
          type: 'choice',
          options: 'staging, production'
        },
        {
          name: 'dry_run',
          description: 'Run without side effects',
          required: false,
          defaultValue: 'true',
          type: 'boolean',
          options: ''
        }
      ];

      return {
        filename: 'scheduled-sync.yml',
        name: 'Scheduled & Manual Sync',
        runName: 'Sync (${{ inputs.environment || \'scheduled\' }}) by @${{ github.actor }}',
        triggers,
        permissionsPreset: 'custom',
        permissions: createDefaultPermissions(),
        concurrency: { enabled: false, group: '', cancelInProgress: true },
        env: [],
        defaultsShell: 'bash',
        defaultsWorkingDirectory: '',
        jobs: [
          {
            uid: nextWorkflowUid('job'),
            id: 'sync',
            name: 'Execute Scheduled Task',
            runsOn: 'ubuntu-latest',
            needs: [],
            ifExpr: '',
            timeoutMinutes: 15,
            continueOnError: false,
            environment: '',
            strategy: { enabled: false, failFast: true, maxParallel: null, matrix: [] },
            env: [],
            steps: [
              { ...createEmptyStep('uses'), name: 'Checkout repository', uses: 'actions/checkout@v4' },
              {
                ...createEmptyStep('run'),
                name: 'Run maintenance script',
                run: 'echo "Env: ${{ inputs.environment || \'default\' }}"\necho "Dry run: ${{ inputs.dry_run || \'false\' }}"'
              }
            ]
          }
        ]
      };
    }
  }
];

// ============================================================================
// YAML 序列化工具
// ============================================================================

function splitCsv(raw: string): string[] {
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function formatGhaYamlString(val: string, forceQuote = false): string {
  if (val === '') return "''";
  if (
    forceQuote ||
    /^(true|false|null|yes|no|on|off|~)$/i.test(val) ||
    /^-?\d+(\.\d+)?$/.test(val) ||
    /^\s|\s$/.test(val) ||
    /^[-?:,\[\]{}#&*!|>'"%@`]/.test(val) ||
    val.includes(': ') ||
    val.includes(' #') ||
    val.endsWith(':')
  ) {
    // 若含单引号或控制字符使用双引号，否则优先用单引号保持 ${{ }} 可读性
    if (!val.includes("'") && !/[\n\r\t]/.test(val)) {
      return `'${val}'`;
    }
    return JSON.stringify(val);
  }
  return val;
}

function formatGhaScalarAuto(val: string): string {
  const trimmed = val.trim();
  if (trimmed === 'true' || trimmed === 'false') return trimmed;
  if (/^-?(0|[1-9][0-9]*)$/.test(trimmed)) return trimmed;
  return formatGhaYamlString(val);
}

function formatInlineStringArray(items: string[]): string {
  return `[${items.map(item => formatGhaYamlString(item)).join(', ')}]`;
}

export function generateWorkflowYaml(
  config: WorkflowConfig,
  formatOpts: WorkflowFormatOptions
): string {
  const unit = ' '.repeat(formatOpts.indentSize);
  const pad = (lvl: number) => unit.repeat(lvl);
  const lines: string[] = [];

  if (formatOpts.includeHeaderComment) {
    lines.push('# Generated by DevCrate GitHub Actions Generator');
    lines.push(`# Target path: .github/workflows/${config.filename || 'ci.yml'}`);
    lines.push('');
  }

  lines.push(`name: ${formatGhaYamlString(config.name || 'CI')}`);
  if (config.runName.trim()) {
    lines.push(`run-name: ${formatGhaYamlString(config.runName.trim())}`);
  }
  lines.push('');

  // on: triggers
  const activeTriggers: string[] = [];
  const t = config.triggers;

  const pushTriggerLines: string[] = [];
  if (t.push.enabled) {
    const sub: string[] = [];
    const branches = splitCsv(t.push.branches);
    const branchesIgnore = splitCsv(t.push.branchesIgnore);
    const tags = splitCsv(t.push.tags);
    const paths = splitCsv(t.push.paths);
    if (branches.length) sub.push(`${pad(2)}branches: ${formatInlineStringArray(branches)}`);
    if (branchesIgnore.length) sub.push(`${pad(2)}branches-ignore: ${formatInlineStringArray(branchesIgnore)}`);
    if (tags.length) sub.push(`${pad(2)}tags: ${formatInlineStringArray(tags)}`);
    if (paths.length) sub.push(`${pad(2)}paths: ${formatInlineStringArray(paths)}`);
    if (sub.length > 0) {
      pushTriggerLines.push(`${pad(1)}push:`);
      pushTriggerLines.push(...sub);
    } else {
      pushTriggerLines.push(`${pad(1)}push:`);
    }
    activeTriggers.push('push');
  }

  const prTriggerLines: string[] = [];
  if (t.pullRequest.enabled) {
    const sub: string[] = [];
    const branches = splitCsv(t.pullRequest.branches);
    const types = splitCsv(t.pullRequest.types);
    const paths = splitCsv(t.pullRequest.paths);
    if (branches.length) sub.push(`${pad(2)}branches: ${formatInlineStringArray(branches)}`);
    if (types.length) sub.push(`${pad(2)}types: ${formatInlineStringArray(types)}`);
    if (paths.length) sub.push(`${pad(2)}paths: ${formatInlineStringArray(paths)}`);
    prTriggerLines.push(`${pad(1)}pull_request:`);
    prTriggerLines.push(...sub);
    activeTriggers.push('pull_request');
  }

  const dispatchLines: string[] = [];
  if (t.workflowDispatch.enabled) {
    const validInputs = t.workflowDispatch.inputs.filter(i => i.name.trim());
    if (validInputs.length === 0) {
      dispatchLines.push(`${pad(1)}workflow_dispatch:`);
    } else {
      dispatchLines.push(`${pad(1)}workflow_dispatch:`);
      dispatchLines.push(`${pad(2)}inputs:`);
      for (const inp of validInputs) {
        dispatchLines.push(`${pad(3)}${inp.name.trim()}:`);
        if (inp.description.trim()) {
          dispatchLines.push(`${pad(4)}description: ${formatGhaYamlString(inp.description.trim())}`);
        }
        dispatchLines.push(`${pad(4)}required: ${inp.required}`);
        if (inp.defaultValue !== '') {
          dispatchLines.push(
            `${pad(4)}default: ${inp.type === 'boolean' && (inp.defaultValue === 'true' || inp.defaultValue === 'false') ? inp.defaultValue : formatGhaYamlString(inp.defaultValue)}`
          );
        }
        dispatchLines.push(`${pad(4)}type: ${inp.type}`);
        if (inp.type === 'choice') {
          const opts = splitCsv(inp.options);
          if (opts.length > 0) {
            dispatchLines.push(`${pad(4)}options:`);
            for (const o of opts) {
              dispatchLines.push(`${pad(5)}- ${formatGhaYamlString(o)}`);
            }
          }
        }
      }
    }
    activeTriggers.push('workflow_dispatch');
  }

  const scheduleLines: string[] = [];
  if (t.schedule.enabled) {
    const crons = t.schedule.crons.map(c => c.trim()).filter(Boolean);
    if (crons.length > 0) {
      scheduleLines.push(`${pad(1)}schedule:`);
      for (const c of crons) {
        scheduleLines.push(`${pad(2)}- cron: '${c}'`);
      }
      activeTriggers.push('schedule');
    }
  }

  const releaseLines: string[] = [];
  if (t.release.enabled) {
    const types = splitCsv(t.release.types);
    releaseLines.push(`${pad(1)}release:`);
    if (types.length > 0) {
      releaseLines.push(`${pad(2)}types: ${formatInlineStringArray(types)}`);
    }
    activeTriggers.push('release');
  }

  const callLines: string[] = [];
  if (t.workflowCall.enabled) {
    callLines.push(`${pad(1)}workflow_call:`);
    activeTriggers.push('workflow_call');
  }

  if (activeTriggers.length === 0) {
    lines.push('on: workflow_dispatch');
  } else {
    lines.push('on:');
    lines.push(...pushTriggerLines, ...prTriggerLines, ...dispatchLines, ...scheduleLines, ...releaseLines, ...callLines);
  }
  lines.push('');

  // permissions
  if (config.permissionsPreset === 'read-all') {
    lines.push('permissions: read-all');
    lines.push('');
  } else if (config.permissionsPreset === 'write-all') {
    lines.push('permissions: write-all');
    lines.push('');
  } else if (config.permissionsPreset === 'custom') {
    const entries = PERMISSION_SCOPES.filter(s => config.permissions[s] && config.permissions[s] !== 'default');
    if (entries.length > 0) {
      lines.push('permissions:');
      for (const scope of entries) {
        lines.push(`${pad(1)}${scope}: ${config.permissions[scope]}`);
      }
      lines.push('');
    }
  }

  // concurrency
  if (config.concurrency.enabled && config.concurrency.group.trim()) {
    lines.push('concurrency:');
    lines.push(`${pad(1)}group: ${formatGhaYamlString(config.concurrency.group.trim())}`);
    lines.push(`${pad(1)}cancel-in-progress: ${config.concurrency.cancelInProgress}`);
    lines.push('');
  }

  // global env
  const validGlobalEnv = config.env.filter(e => e.key.trim());
  if (validGlobalEnv.length > 0) {
    lines.push('env:');
    for (const item of validGlobalEnv) {
      lines.push(`${pad(1)}${item.key.trim()}: ${formatGhaYamlString(item.value)}`);
    }
    lines.push('');
  }

  // defaults
  if (config.defaultsShell.trim() || config.defaultsWorkingDirectory.trim()) {
    lines.push('defaults:');
    lines.push(`${pad(1)}run:`);
    if (config.defaultsShell.trim()) {
      lines.push(`${pad(2)}shell: ${config.defaultsShell.trim()}`);
    }
    if (config.defaultsWorkingDirectory.trim()) {
      lines.push(`${pad(2)}working-directory: ${formatGhaYamlString(config.defaultsWorkingDirectory.trim())}`);
    }
    lines.push('');
  }

  // jobs
  lines.push('jobs:');
  if (config.jobs.length === 0) {
    lines.push(`${pad(1)}# Add at least one job`);
    return lines.join('\n');
  }

  config.jobs.forEach((job, jobIndex) => {
    if (jobIndex > 0) lines.push('');
    const jobId = job.id.trim() || `job_${jobIndex + 1}`;
    lines.push(`${pad(1)}${jobId}:`);
    if (job.name.trim()) {
      lines.push(`${pad(2)}name: ${formatGhaYamlString(job.name.trim())}`);
    }
    if (job.needs.length > 0) {
      lines.push(
        `${pad(2)}needs: ${job.needs.length === 1 ? job.needs[0] : formatInlineStringArray(job.needs)}`
      );
    }
    if (job.ifExpr.trim()) {
      lines.push(`${pad(2)}if: ${formatGhaYamlString(job.ifExpr.trim())}`);
    }
    lines.push(`${pad(2)}runs-on: ${formatGhaYamlString(job.runsOn.trim() || 'ubuntu-latest')}`);

    if (job.environment.trim()) {
      lines.push(`${pad(2)}environment: ${formatGhaYamlString(job.environment.trim())}`);
    }
    if (job.timeoutMinutes !== null && job.timeoutMinutes > 0) {
      lines.push(`${pad(2)}timeout-minutes: ${job.timeoutMinutes}`);
    }
    if (job.continueOnError) {
      lines.push(`${pad(2)}continue-on-error: true`);
    }

    if (job.strategy.enabled) {
      const validAxes = job.strategy.matrix.filter(m => m.key.trim() && splitCsv(m.values).length > 0);
      if (validAxes.length > 0) {
        lines.push(`${pad(2)}strategy:`);
        lines.push(`${pad(3)}fail-fast: ${job.strategy.failFast}`);
        if (job.strategy.maxParallel !== null && job.strategy.maxParallel > 0) {
          lines.push(`${pad(3)}max-parallel: ${job.strategy.maxParallel}`);
        }
        lines.push(`${pad(3)}matrix:`);
        for (const axis of validAxes) {
          const vals = splitCsv(axis.values);
          lines.push(`${pad(4)}${axis.key.trim()}: ${formatInlineStringArray(vals)}`);
        }
      }
    }

    const validJobEnv = job.env.filter(e => e.key.trim());
    if (validJobEnv.length > 0) {
      lines.push(`${pad(2)}env:`);
      for (const item of validJobEnv) {
        lines.push(`${pad(3)}${item.key.trim()}: ${formatGhaYamlString(item.value)}`);
      }
    }

    lines.push(`${pad(2)}steps:`);
    const activeSteps = job.steps.filter(s => !s.disabled);
    if (activeSteps.length === 0) {
      lines.push(`${pad(3)}- run: echo "No active steps"`);
    } else {
      activeSteps.forEach((step, sIdx) => {
        if (sIdx > 0) lines.push('');
        const stepLines: string[] = [];
        if (step.name.trim()) {
          stepLines.push(`name: ${formatGhaYamlString(step.name.trim())}`);
        }
        if (step.id.trim()) {
          stepLines.push(`id: ${formatGhaYamlString(step.id.trim())}`);
        }
        if (step.ifExpr.trim()) {
          stepLines.push(`if: ${formatGhaYamlString(step.ifExpr.trim())}`);
        }
        if (step.continueOnError) {
          stepLines.push(`continue-on-error: true`);
        }

        if (step.kind === 'uses') {
          stepLines.push(`uses: ${step.uses.trim() || 'actions/checkout@v4'}`);
          const validWith = step.withParams.filter(p => p.key.trim());
          if (validWith.length > 0) {
            stepLines.push('with:');
            for (const p of validWith) {
              if (p.value.includes('\n')) {
                stepLines.push(`${pad(1)}${p.key.trim()}: |`);
                for (const subLine of p.value.split('\n')) {
                  stepLines.push(`${pad(2)}${subLine}`);
                }
              } else {
                stepLines.push(`${pad(1)}${p.key.trim()}: ${formatGhaScalarAuto(p.value)}`);
              }
            }
          }
        } else {
          if (step.shell.trim()) {
            stepLines.push(`shell: ${step.shell.trim()}`);
          }
          if (step.workingDirectory.trim()) {
            stepLines.push(`working-directory: ${formatGhaYamlString(step.workingDirectory.trim())}`);
          }
          const runText = step.run || '';
          if (runText.includes('\n')) {
            stepLines.push('run: |');
            for (const rLine of runText.split('\n')) {
              stepLines.push(rLine === '' ? '' : `${pad(1)}${rLine}`);
            }
          } else {
            stepLines.push(`run: ${formatGhaYamlString(runText)}`);
          }
        }

        const validStepEnv = step.env.filter(e => e.key.trim());
        if (validStepEnv.length > 0) {
          stepLines.push('env:');
          for (const e of validStepEnv) {
            stepLines.push(`${pad(1)}${e.key.trim()}: ${formatGhaYamlString(e.value)}`);
          }
        }

        stepLines.forEach((sl, idx) => {
          if (idx === 0) {
            lines.push(`${pad(3)}- ${sl}`);
          } else if (sl === '') {
            lines.push('');
          } else {
            lines.push(`${pad(3)}  ${sl}`);
          }
        });
      });
    }
  });

  return lines.join('\n');
}

// ============================================================================
// 工作流静态校验 / Linter
// ============================================================================

export function lintWorkflow(config: WorkflowConfig): WorkflowLintIssue[] {
  const issues: WorkflowLintIssue[] = [];
  const t = config.triggers;

  const hasTrigger =
    t.push.enabled ||
    t.pullRequest.enabled ||
    t.workflowDispatch.enabled ||
    (t.schedule.enabled && t.schedule.crons.some(c => c.trim())) ||
    t.release.enabled ||
    t.workflowCall.enabled;

  if (!hasTrigger) {
    issues.push({ level: 'warning', code: 'noTrigger' });
  }

  if (t.schedule.enabled) {
    for (const cron of t.schedule.crons) {
      const parts = cron.trim().split(/\s+/);
      if (cron.trim() && parts.length !== 5) {
        issues.push({ level: 'error', code: 'invalidCron', detail: cron.trim() });
      }
    }
  }

  if (config.jobs.length === 0) {
    issues.push({ level: 'error', code: 'noJobs' });
    return issues;
  }

  const jobIds = new Set<string>();
  const validIdSet = new Set<string>();

  for (const job of config.jobs) {
    const id = job.id.trim();
    if (!id) {
      issues.push({ level: 'error', code: 'emptyJobId', detail: job.name });
      continue;
    }
    if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(id)) {
      issues.push({ level: 'error', code: 'invalidJobId', detail: id });
    }
    if (jobIds.has(id)) {
      issues.push({ level: 'error', code: 'duplicateJobId', detail: id });
    }
    jobIds.add(id);
    validIdSet.add(id);
  }

  // 检查 needs 引用及环路
  for (const job of config.jobs) {
    for (const dep of job.needs) {
      if (!validIdSet.has(dep)) {
        issues.push({ level: 'error', code: 'missingNeedsJob', detail: `${job.id} -> ${dep}` });
      }
    }
  }

  if (hasJobCycle(config.jobs)) {
    issues.push({ level: 'error', code: 'cyclicNeeds' });
  }

  let usesPagesDeploy = false;
  let usesReleaseAction = false;
  let usesDockerPush = false;

  for (const job of config.jobs) {
    const activeSteps = job.steps.filter(s => !s.disabled);
    if (activeSteps.length === 0) {
      issues.push({ level: 'warning', code: 'emptyJobSteps', detail: job.id });
    }

    const hasCheckout = activeSteps.some(s => s.kind === 'uses' && s.uses.startsWith('actions/checkout'));
    const hasRunStep = activeSteps.some(s => s.kind === 'run');
    const usesDeployOnly = activeSteps.some(s => s.kind === 'uses' && s.uses.includes('deploy-pages'));
    if (!hasCheckout && hasRunStep && !usesDeployOnly && job.needs.length === 0) {
      issues.push({ level: 'warning', code: 'missingCheckout', detail: job.id });
    }

    for (const step of activeSteps) {
      if (step.kind === 'uses') {
        if (step.uses.includes('actions/deploy-pages')) usesPagesDeploy = true;
        if (step.uses.includes('action-gh-release') || step.uses.includes('tauri-action')) usesReleaseAction = true;
        if (step.uses.includes('docker/build-push-action')) usesDockerPush = true;

        if (/^actions\/(checkout|setup-node|setup-python|setup-go|upload-artifact|download-artifact)@v[123]$/.test(step.uses.trim())) {
          issues.push({ level: 'warning', code: 'outdatedAction', detail: step.uses.trim() });
        }
      }
    }
  }

  if (usesPagesDeploy && config.permissionsPreset === 'custom') {
    if (config.permissions.pages !== 'write' || config.permissions['id-token'] !== 'write') {
      issues.push({ level: 'warning', code: 'pagesPermissions' });
    }
  }

  if (usesReleaseAction && config.permissionsPreset === 'custom' && config.permissions.contents !== 'write') {
    issues.push({ level: 'warning', code: 'releasePermissions' });
  }

  if (usesDockerPush && config.permissionsPreset === 'custom' && config.permissions.packages !== 'write') {
    issues.push({ level: 'warning', code: 'packagesPermissions' });
  }

  return issues;
}

function hasJobCycle(jobs: WorkflowJob[]): boolean {
  const adj = new Map<string, string[]>();
  for (const j of jobs) {
    adj.set(j.id, j.needs);
  }
  const state = new Map<string, 0 | 1 | 2>(); // 0 unvisited, 1 visiting, 2 visited

  function dfs(id: string): boolean {
    const s = state.get(id) ?? 0;
    if (s === 1) return true;
    if (s === 2) return false;
    state.set(id, 1);
    for (const dep of adj.get(id) ?? []) {
      if (adj.has(dep) && dfs(dep)) return true;
    }
    state.set(id, 2);
    return false;
  }

  for (const j of jobs) {
    if (dfs(j.id)) return true;
  }
  return false;
}

// ============================================================================
// 导入解析现有 GitHub Actions YAML
// ============================================================================

function toCsvString(val: unknown): string {
  if (Array.isArray(val)) return val.map(String).join(', ');
  if (typeof val === 'string') return val;
  return '';
}

function toKvPairs(obj: unknown): KeyValuePair[] {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.entries(obj as Record<string, unknown>).map(([key, value]) => ({
    key,
    value: value === null || value === undefined ? '' : String(value)
  }));
}

export function parseWorkflowYaml(yamlText: string, filename = 'ci.yml'): { config: WorkflowConfig | null; error: string | null } {
  try {
    const doc = parseConfig(yamlText, 'yaml', DEFAULT_CONVERT_OPTIONS);
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
      return { config: null, error: 'Root YAML node must be a mapping object' };
    }
    const raw = doc as Record<string, unknown>;
    const triggers = createBaseTriggers();
    triggers.push.enabled = false;
    triggers.pullRequest.enabled = false;
    triggers.workflowDispatch.enabled = false;

    const rawOn = raw.on;
    if (typeof rawOn === 'string') {
      if (rawOn === 'push') triggers.push.enabled = true;
      else if (rawOn === 'pull_request') triggers.pullRequest.enabled = true;
      else if (rawOn === 'workflow_dispatch') triggers.workflowDispatch.enabled = true;
      else if (rawOn === 'release') triggers.release.enabled = true;
      else if (rawOn === 'workflow_call') triggers.workflowCall.enabled = true;
    } else if (Array.isArray(rawOn)) {
      for (const item of rawOn) {
        const name = String(item);
        if (name === 'push') triggers.push.enabled = true;
        else if (name === 'pull_request') triggers.pullRequest.enabled = true;
        else if (name === 'workflow_dispatch') triggers.workflowDispatch.enabled = true;
        else if (name === 'release') triggers.release.enabled = true;
        else if (name === 'workflow_call') triggers.workflowCall.enabled = true;
      }
    } else if (rawOn && typeof rawOn === 'object') {
      const onObj = rawOn as Record<string, unknown>;
      if ('push' in onObj) {
        triggers.push.enabled = true;
        const p = (onObj.push ?? {}) as Record<string, unknown>;
        triggers.push.branches = toCsvString(p.branches);
        triggers.push.branchesIgnore = toCsvString(p['branches-ignore']);
        triggers.push.tags = toCsvString(p.tags);
        triggers.push.paths = toCsvString(p.paths);
      }
      if ('pull_request' in onObj) {
        triggers.pullRequest.enabled = true;
        const pr = (onObj.pull_request ?? {}) as Record<string, unknown>;
        triggers.pullRequest.branches = toCsvString(pr.branches);
        triggers.pullRequest.types = toCsvString(pr.types);
        triggers.pullRequest.paths = toCsvString(pr.paths);
      }
      if ('workflow_dispatch' in onObj) {
        triggers.workflowDispatch.enabled = true;
        const wd = (onObj.workflow_dispatch ?? {}) as Record<string, unknown>;
        if (wd.inputs && typeof wd.inputs === 'object' && !Array.isArray(wd.inputs)) {
          triggers.workflowDispatch.inputs = Object.entries(wd.inputs as Record<string, unknown>).map(([k, v]) => {
            const inp = (v ?? {}) as Record<string, unknown>;
            const t = String(inp.type ?? 'string');
            const validType = (['string', 'boolean', 'choice', 'environment'].includes(t) ? t : 'string') as DispatchInput['type'];
            return {
              name: k,
              description: String(inp.description ?? ''),
              required: Boolean(inp.required ?? false),
              defaultValue: inp.default !== undefined && inp.default !== null ? String(inp.default) : '',
              type: validType,
              options: toCsvString(inp.options)
            };
          });
        }
      }
      if ('schedule' in onObj && Array.isArray(onObj.schedule)) {
        triggers.schedule.enabled = true;
        triggers.schedule.crons = onObj.schedule
          .map(s => (s && typeof s === 'object' ? String((s as Record<string, unknown>).cron ?? '') : ''))
          .filter(Boolean);
        if (triggers.schedule.crons.length === 0) triggers.schedule.crons = ['0 2 * * *'];
      }
      if ('release' in onObj) {
        triggers.release.enabled = true;
        const rel = (onObj.release ?? {}) as Record<string, unknown>;
        triggers.release.types = toCsvString(rel.types) || 'published';
      }
      if ('workflow_call' in onObj) {
        triggers.workflowCall.enabled = true;
      }
    }

    // permissions
    let permissionsPreset: PermissionsPreset = 'default';
    const permissions = createDefaultPermissions();
    if (raw.permissions === 'read-all') {
      permissionsPreset = 'read-all';
    } else if (raw.permissions === 'write-all') {
      permissionsPreset = 'write-all';
    } else if (raw.permissions && typeof raw.permissions === 'object' && !Array.isArray(raw.permissions)) {
      permissionsPreset = 'custom';
      for (const scope of PERMISSION_SCOPES) {
        permissions[scope] = 'default';
      }
      for (const [k, v] of Object.entries(raw.permissions as Record<string, unknown>)) {
        if (PERMISSION_SCOPES.includes(k as PermissionScope)) {
          const val = String(v);
          if (val === 'read' || val === 'write' || val === 'none') {
            permissions[k as PermissionScope] = val;
          }
        }
      }
    }

    // concurrency
    const concurrency = { enabled: false, group: '', cancelInProgress: true };
    if (typeof raw.concurrency === 'string') {
      concurrency.enabled = true;
      concurrency.group = raw.concurrency;
    } else if (raw.concurrency && typeof raw.concurrency === 'object' && !Array.isArray(raw.concurrency)) {
      const c = raw.concurrency as Record<string, unknown>;
      concurrency.enabled = true;
      concurrency.group = String(c.group ?? '');
      concurrency.cancelInProgress = c['cancel-in-progress'] !== undefined ? Boolean(c['cancel-in-progress']) : true;
    }

    // defaults
    let defaultsShell = '';
    let defaultsWorkingDirectory = '';
    if (raw.defaults && typeof raw.defaults === 'object' && !Array.isArray(raw.defaults)) {
      const d = (raw.defaults as Record<string, unknown>).run;
      if (d && typeof d === 'object' && !Array.isArray(d)) {
        const dr = d as Record<string, unknown>;
        defaultsShell = dr.shell ? String(dr.shell) : '';
        defaultsWorkingDirectory = dr['working-directory'] ? String(dr['working-directory']) : '';
      }
    }

    // jobs
    const jobs: WorkflowJob[] = [];
    if (raw.jobs && typeof raw.jobs === 'object' && !Array.isArray(raw.jobs)) {
      for (const [jobId, jobVal] of Object.entries(raw.jobs as Record<string, unknown>)) {
        if (!jobVal || typeof jobVal !== 'object' || Array.isArray(jobVal)) continue;
        const j = jobVal as Record<string, unknown>;

        const needs = Array.isArray(j.needs)
          ? j.needs.map(String)
          : typeof j.needs === 'string'
            ? [j.needs]
            : [];

        let environment = '';
        if (typeof j.environment === 'string') environment = j.environment;
        else if (j.environment && typeof j.environment === 'object') {
          environment = String((j.environment as Record<string, unknown>).name ?? '');
        }

        const strategy: WorkflowJob['strategy'] = {
          enabled: false,
          failFast: true,
          maxParallel: null,
          matrix: []
        };
        if (j.strategy && typeof j.strategy === 'object' && !Array.isArray(j.strategy)) {
          const st = j.strategy as Record<string, unknown>;
          strategy.failFast = st['fail-fast'] !== undefined ? Boolean(st['fail-fast']) : true;
          strategy.maxParallel = typeof st['max-parallel'] === 'number' ? st['max-parallel'] : null;
          if (st.matrix && typeof st.matrix === 'object' && !Array.isArray(st.matrix)) {
            strategy.enabled = true;
            for (const [mk, mv] of Object.entries(st.matrix as Record<string, unknown>)) {
              if (mk === 'include' || mk === 'exclude') continue;
              strategy.matrix.push({
                key: mk,
                values: Array.isArray(mv) ? mv.map(String).join(', ') : String(mv ?? '')
              });
            }
          }
        }

        const steps: WorkflowStep[] = [];
        if (Array.isArray(j.steps)) {
          for (const stVal of j.steps) {
            if (!stVal || typeof stVal !== 'object' || Array.isArray(stVal)) continue;
            const s = stVal as Record<string, unknown>;
            const kind: 'uses' | 'run' = typeof s.uses === 'string' ? 'uses' : 'run';
            steps.push({
              uid: nextWorkflowUid('step'),
              id: s.id ? String(s.id) : '',
              name: s.name ? String(s.name) : '',
              kind,
              uses: s.uses ? String(s.uses) : '',
              withParams: toKvPairs(s.with),
              run: s.run !== undefined && s.run !== null ? String(s.run).replace(/\n$/, '') : '',
              shell: s.shell ? String(s.shell) : '',
              workingDirectory: s['working-directory'] ? String(s['working-directory']) : '',
              env: toKvPairs(s.env),
              ifExpr: s.if ? String(s.if) : '',
              continueOnError: Boolean(s['continue-on-error'] ?? false),
              disabled: false
            });
          }
        }

        jobs.push({
          uid: nextWorkflowUid('job'),
          id: jobId,
          name: j.name ? String(j.name) : '',
          runsOn: Array.isArray(j['runs-on']) ? j['runs-on'].map(String).join(', ') : String(j['runs-on'] ?? 'ubuntu-latest'),
          needs,
          ifExpr: j.if ? String(j.if) : '',
          timeoutMinutes: typeof j['timeout-minutes'] === 'number' ? j['timeout-minutes'] : null,
          continueOnError: Boolean(j['continue-on-error'] ?? false),
          environment,
          strategy,
          env: toKvPairs(j.env),
          steps
        });
      }
    }

    return {
      config: {
        filename,
        name: raw.name ? String(raw.name) : 'CI',
        runName: raw['run-name'] ? String(raw['run-name']) : '',
        triggers,
        permissionsPreset,
        permissions,
        concurrency,
        env: toKvPairs(raw.env),
        defaultsShell,
        defaultsWorkingDirectory,
        jobs: jobs.length > 0 ? jobs : [createEmptyJob()]
      },
      error: null
    };
  } catch (err: unknown) {
    return {
      config: null,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
