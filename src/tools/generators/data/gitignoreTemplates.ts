export type GitignoreCategory = 'languages' | 'frameworks' | 'ides' | 'os' | 'tools';

export interface GitignoreTemplate {
  id: string;
  name: string;
  category: GitignoreCategory;
  popular?: boolean;
  keywords: string[];
  descriptionZh: string;
  descriptionEn: string;
  content: string;
}

export interface PresetStack {
  id: string;
  nameKey: string;
  templateIds: string[];
  iconName?: string;
}

export const gitignoreTemplates: GitignoreTemplate[] = [
  // ==================== 操作系统 (OS) ====================
  {
    id: 'macos',
    name: 'macOS',
    category: 'os',
    popular: true,
    keywords: ['apple', 'mac', 'osx', 'darwin', 'ds_store', '苹果'],
    descriptionZh: '忽略 .DS_Store、Spotlight 索引及 Apple 临时文件',
    descriptionEn: 'Ignore .DS_Store, Spotlight index, and Apple temp files',
    content: `# General
.DS_Store
.AppleDouble
.LSOverride

# Icon must end with two \\r
Icon

# Thumbnails
._*

# Files that might appear in the root of a volume
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent

# Directories potentially created on remote AFP share
.AppleDB
.AppleDesktop
Network Trash Folder
Temporary Items
.apdisk`
  },
  {
    id: 'windows',
    name: 'Windows',
    category: 'os',
    popular: true,
    keywords: ['microsoft', 'win', 'thumbs', 'desktop.ini', '微软'],
    descriptionZh: '忽略 Thumbs.db、desktop.ini 及回收站目录',
    descriptionEn: 'Ignore Thumbs.db, desktop.ini, and Recycle Bin folders',
    content: `# Windows thumbnail cache files
Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db

# Dump file
*.stackdump

# Folder config file
[Dd]esktop.ini

# Recycle Bin used on shared drives
$RECYCLE.BIN/

# Windows shortcuts
*.lnk`
  },
  {
    id: 'linux',
    name: 'Linux',
    category: 'os',
    popular: true,
    keywords: ['ubuntu', 'debian', 'fedora', 'arch', 'centos', 'nfs'],
    descriptionZh: '忽略 Linux 备份文件、.directory 与 Trash 目录',
    descriptionEn: 'Ignore Linux backup files, .directory, and Trash dirs',
    content: `*~

# temporary files which can be created if a process still has a handle open of a deleted file
.fuse_hidden*

# KDE directory preferences
.directory

# Linux trash folder which might appear on any partition or disk
.Trash-*

# .nfs files
.nfs*`
  },

  // ==================== 开发环境与 IDE ====================
  {
    id: 'vscode',
    name: 'Visual Studio Code',
    category: 'ides',
    popular: true,
    keywords: ['vs code', 'vscode', 'microsoft', 'editor', '微软编辑器'],
    descriptionZh: '忽略 .vscode 局部配置与历史记录，保留必要 tasks/settings',
    descriptionEn: 'Ignore .vscode local configs and history, keeping essential settings',
    content: `.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
!.vscode/*.code-snippets

# Local History for Visual Studio Code
.history/

# Built Visual Studio Code Extensions
*.vsix`
  },
  {
    id: 'jetbrains',
    name: 'JetBrains (IDEA / WebStorm / PyCharm / CLion)',
    category: 'ides',
    popular: true,
    keywords: ['idea', 'intellij', 'webstorm', 'pycharm', 'clion', 'goland', 'phpstorm'],
    descriptionZh: '忽略 .idea 目录、*.iml 工程描述文件与 out 目录',
    descriptionEn: 'Ignore .idea directory, *.iml project files, and out folder',
    content: `# User-specific stuff
.idea/**/workspace.xml
.idea/**/tasks.xml
.idea/**/usage.statistics.xml
.idea/**/dictionaries
.idea/**/shelf

# Generated files
.idea/**/contentModel.xml

# Sensitive or high-churn files
.idea/**/dataSources/
.idea/**/dataSources.ids
.idea/**/dataSources.local.xml
.idea/**/sqlDataSources.xml
.idea/**/dynamic.xml
.idea/**/uiDesigner.xml
.idea/**/dbnavigator.xml

# Gradle / Maven / Android Studio
.idea/**/gradle.xml
.idea/**/libraries

# File-based project format
*.iws
*.iml

# IntelliJ IDEA Project files
out/`
  },
  {
    id: 'sublimetext',
    name: 'Sublime Text',
    category: 'ides',
    keywords: ['sublime', 'text', 'editor'],
    descriptionZh: '忽略 Sublime 缓存与工作区 *.sublime-workspace 文件',
    descriptionEn: 'Ignore Sublime cache and workspace *.sublime-workspace files',
    content: `# Cache files
*.tmlanguage.cache
*.tmPreferences.cache
*.stTheme.cache

# Workspace files
*.sublime-workspace

# Package control
Package Storage/
Package Control.cache/`
  },
  {
    id: 'vim',
    name: 'Vim / Neovim',
    category: 'ides',
    keywords: ['vim', 'nvim', 'vi', 'swp'],
    descriptionZh: '忽略 Vim 交换文件 (*.swp, *.swo)、会话与 undo 历史',
    descriptionEn: 'Ignore Vim swap files (*.swp, *.swo), sessions, and undo history',
    content: `# Swap
[._]*.s[a-v][a-z]
!*.svg  # safeguard svg files
[._]*.sw[a-p]
[._]s[a-rt-v][a-z]
[._]ss[a-gi-z]
[._]sw[a-p]

# Session
Session.vim
Sessionx.vim

# Temporary
.netrwhist
*~
# Auto-generated tag files
tags
# Persistent undo
[._]*.un~`
  },
  {
    id: 'xcode',
    name: 'Xcode',
    category: 'ides',
    keywords: ['apple', 'ios', 'mac', 'swift', 'objc', 'deriveddata'],
    descriptionZh: '忽略 Xcode 编译产物、DerivedData 与用户偏好数据',
    descriptionEn: 'Ignore Xcode build outputs, DerivedData, and user state',
    content: `build/
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
*.perspectivev3
!default.perspectivev3
xcuserdata/
*.xccheckout
*.moved-aside
DerivedData/
*.hmap
*.ipa
*.xcuserstate
project.xcworkspace/
!project.xcworkspace/contents.xcworkspacedata`
  },
  {
    id: 'androidstudio',
    name: 'Android Studio',
    category: 'ides',
    keywords: ['android', 'google', 'studio', 'gradle', 'apk'],
    descriptionZh: '忽略 Android Studio 缓存、local.properties 与构建文件',
    descriptionEn: 'Ignore Android Studio caches, local.properties, and build files',
    content: `.idea/navEditor.xml
.idea/caches
.idea/libraries
.idea/modules.xml
.idea/workspace.xml
.idea/assetWizardSettings.xml

# Built application files
*.apk
*.aab
*.ap_

# Local configuration file (sdk path, etc)
local.properties
.externalNativeBuild
.cxx`
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    category: 'ides',
    keywords: ['java', 'ide', 'metadata'],
    descriptionZh: '忽略 Eclipse 的 .metadata、.settings 与 bin 目录',
    descriptionEn: 'Ignore Eclipse .metadata, .settings, and bin directory',
    content: `.metadata
bin/
tmp/
*.tmp
*.bak
*.emmx
*.userLibraries
.loadpath
.project
.classpath
.settings/`
  },

  // ==================== 编程语言 (Languages) ====================
  {
    id: 'node',
    name: 'Node.js / JavaScript / TypeScript',
    category: 'languages',
    popular: true,
    keywords: ['node', 'npm', 'yarn', 'pnpm', 'js', 'ts', 'javascript', 'typescript', 'node_modules', '前端'],
    descriptionZh: '忽略 node_modules、调试日志、.env 及打包缓存',
    descriptionEn: 'Ignore node_modules, debug logs, .env, and bundler caches',
    content: `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Diagnostic reports
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json

# Dependency directories
node_modules/
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional stylelint cache
.stylelintcache

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# parcel-bundler / cache
.cache/
.parcel-cache/`
  },
  {
    id: 'python',
    name: 'Python',
    category: 'languages',
    popular: true,
    keywords: ['py', 'pycache', 'venv', 'pip', 'conda', 'django', 'flask', 'ai'],
    descriptionZh: '忽略 __pycache__、.pyc、虚拟环境 (venv) 与打包产物',
    descriptionEn: 'Ignore __pycache__, .pyc, virtual environments, and dist packages',
    content: `# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py,cover
.hypothesis/
.pytest_cache/
cover/

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# mypy
.mypy_cache/
.dmypy.json
dmypy.json`
  },
  {
    id: 'java',
    name: 'Java',
    category: 'languages',
    popular: true,
    keywords: ['class', 'jar', 'war', 'jvm', 'maven', 'gradle', '后端'],
    descriptionZh: '忽略 *.class 字节码、*.jar/war 打包物及 JVM 崩溃日志',
    descriptionEn: 'Ignore *.class bytecode, *.jar/war archives, and JVM crash dumps',
    content: `# Compiled class file
*.class

# Log file
*.log

# BlueJ files
*.ctxt

# Mobile Tools for Java (J2ME)
.mtj.tmp/

# Package Files
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar

# virtual machine crash logs
hs_err_pid*
replay_pid*`
  },
  {
    id: 'go',
    name: 'Go (Golang)',
    category: 'languages',
    popular: true,
    keywords: ['golang', 'google', 'bin', 'test', 'cloud'],
    descriptionZh: '忽略编译二进制文件、*.test、覆盖率产物与 go.work',
    descriptionEn: 'Ignore compiled binaries, *.test, coverage files, and go.work',
    content: `# Binaries for programs and plugins
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary, built with \`go test -c\`
*.test

# Output of the go coverage tool
*.out

# Go workspace file
go.work
go.work.sum

# env file
.env`
  },
  {
    id: 'rust',
    name: 'Rust',
    category: 'languages',
    popular: true,
    keywords: ['cargo', 'target', 'rustc', 'crate', 'wasm'],
    descriptionZh: '忽略 Cargo 编译目录 /target、格式化备份与 pdb 符号',
    descriptionEn: 'Ignore Cargo compilation dir /target, format backups, and pdb symbols',
    content: `# Generated by Cargo
# will have compiled files and executables
debug/
target/

# These are backup files generated by rustfmt
**/*.rs.bk

# MSVC Windows builds of cargo-access
*.pdb`
  },
  {
    id: 'cpp',
    name: 'C / C++',
    category: 'languages',
    popular: true,
    keywords: ['c', 'c++', 'clang', 'gcc', 'cmake', 'make', 'obj', 'dll'],
    descriptionZh: '忽略 *.o、*.obj 目标文件、动态库与 CMake 构建目录',
    descriptionEn: 'Ignore *.o, *.obj objects, dynamic libraries, and CMake build artifacts',
    content: `# Compiled Object files
*.slo
*.lo
*.o
*.obj

# Precompiled Headers
*.gch
*.pch

# Compiled Dynamic libraries
*.so
*.dylib
*.dll

# Compiled Static libraries
*.lai
*.la
*.a
*.lib

# Executables
*.exe
*.out
*.app

# CMake build directories
CMakeCache.txt
CMakeFiles
CMakeScripts
Testing
Makefile
cmake_install.cmake
install_manifest.txt
compile_commands.json
CTestTestfile.cmake
_deps
build/`
  },
  {
    id: 'csharp',
    name: 'C# / .NET',
    category: 'languages',
    popular: true,
    keywords: ['dotnet', 'c#', 'visual studio', 'nuget', 'bin', 'obj'],
    descriptionZh: '忽略 bin/、obj/、.vs 缓存与 NuGet 包目录',
    descriptionEn: 'Ignore bin/, obj/, .vs cache, and NuGet packages',
    content: `[Dd]ebug/
[Dd]ebugPublic/
[Rr]elease/
[Rr]eleases/
x64/
x86/
[Bb]in/
[Oo]bj/
[Ll]og/
[Ll]ogs/

# Visual Studio files
.vs/
*.user
*.userosscache
*.sln.docstates
*.suo

# NuGet Packages
*.nupkg
*.snupkg
**/packages/*
!**/packages/build/
*.nuget.props
*.nuget.targets
project.lock.json
project.assets.json

# Test results
[Tt]est[Rr]esult*/
[Bb]uild[Ll]og.*`
  },
  {
    id: 'php',
    name: 'PHP',
    category: 'languages',
    keywords: ['composer', 'laravel', 'symfony', 'vendor'],
    descriptionZh: '忽略 /vendor 依赖目录、composer.phar 与测试缓存',
    descriptionEn: 'Ignore /vendor dependencies, composer.phar, and test cache',
    content: `/vendor/
composer.phar
.phpunit.result.cache
.phpunit.cache/`
  },
  {
    id: 'ruby',
    name: 'Ruby',
    category: 'languages',
    keywords: ['rails', 'gem', 'bundler', 'rvm'],
    descriptionZh: '忽略 *.gem、.bundle/、vendor/bundle 与测试临时文件',
    descriptionEn: 'Ignore *.gem, .bundle/, vendor/bundle, and temporary test files',
    content: `*.gem
*.rbc
/.config
/coverage/
/InstalledFiles
/pkg/
/spec/reports/
/spec/examples.txt
/test/tmp/
/test/version_tmp/
/tmp/

# Bundler
/.bundle/
/vendor/bundle
/lib/bundler/man/`
  },
  {
    id: 'swift',
    name: 'Swift',
    category: 'languages',
    keywords: ['apple', 'ios', 'spm', 'swiftpm', 'package'],
    descriptionZh: '忽略 Swift Package Manager .build/ 与 Xcode 构建缓存',
    descriptionEn: 'Ignore Swift Package Manager .build/ and Xcode cache',
    content: `.build/
Packages/
Package.pins
Package.resolved

# Xcode
build/
DerivedData/
*.xcodeproj/*
!*.xcodeproj/project.pbxproj
!*.xcodeproj/xcshareddata/
*.xcworkspace/*
!*.xcworkspace/contents.xcworkspacedata`
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    category: 'languages',
    keywords: ['android', 'jvm', 'gradle', 'jetpack'],
    descriptionZh: '忽略 Kotlin 编译 class 字节码与 jar 打包文件',
    descriptionEn: 'Ignore Kotlin compiled class bytecode and jar packages',
    content: `*.class
*.log
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar
hs_err_pid*
replay_pid*`
  },
  {
    id: 'dart',
    name: 'Dart / Flutter',
    category: 'languages',
    popular: true,
    keywords: ['flutter', 'mobile', 'android', 'ios', 'pub'],
    descriptionZh: '忽略 .dart_tool/、.packages、build/ 及 Flutter 插件缓存',
    descriptionEn: 'Ignore .dart_tool/, .packages, build/, and Flutter plugin caches',
    content: `.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/
.pub/
/build/
ephemeral/`
  },
  {
    id: 'elixir',
    name: 'Elixir',
    category: 'languages',
    keywords: ['phoenix', 'mix', 'erlang', 'beam'],
    descriptionZh: '忽略 Mix 构建目录 /_build、/deps 与 crash dump',
    descriptionEn: 'Ignore Mix /_build, /deps, and crash dump',
    content: `/_build
/cover
/deps
/doc
/.fetch
erl_crash.dump
*.ez
*.beam`
  },
  {
    id: 'zig',
    name: 'Zig',
    category: 'languages',
    keywords: ['zig-cache', 'systems', 'c'],
    descriptionZh: '忽略 zig-cache/ 缓存目录与 zig-out/ 构建产物',
    descriptionEn: 'Ignore zig-cache/ directory and zig-out/ outputs',
    content: `zig-cache/
zig-out/`
  },

  // ==================== 框架与生态 (Frameworks) ====================
  {
    id: 'vue',
    name: 'Vue.js',
    category: 'frameworks',
    popular: true,
    keywords: ['vue', 'vite', 'nuxt', 'vue3', 'vue2', 'pinia'],
    descriptionZh: '忽略 Vue/Vite 产物 dist/、dist-ssr/ 与本地环境配置',
    descriptionEn: 'Ignore Vue/Vite dist/, dist-ssr/, and local envs',
    content: `dist/
dist-ssr/
*.local
node_modules/

# Editor files
.vscode/*
!.vscode/extensions.json`
  },
  {
    id: 'react',
    name: 'React',
    category: 'frameworks',
    popular: true,
    keywords: ['react', 'nextjs', 'cra', 'jsx', 'tsx'],
    descriptionZh: '忽略 /build、/dist、node_modules 与 .env.*.local',
    descriptionEn: 'Ignore /build, /dist, node_modules, and .env.*.local',
    content: `/build
/dist
/node_modules
/.pnp
.pnp.js
/coverage

# Environment
.env.local
.env.development.local
.env.test.local
.env.production.local`
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'frameworks',
    popular: true,
    keywords: ['react', 'vercel', 'ssr', 'next', 'fullstack'],
    descriptionZh: '忽略 Next.js 产物 .next/、静态导出 out/ 与本地环境配置',
    descriptionEn: 'Ignore Next.js .next/, static export out/, and local envs',
    content: `.next/
out/
build/
dist/
node_modules/
.cache/
.env*.local`
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    category: 'frameworks',
    keywords: ['vue', 'ssr', 'nitro', 'fullstack'],
    descriptionZh: '忽略 Nuxt 产物 .output/、.nuxt/、.nitro/ 与 dist/',
    descriptionEn: 'Ignore Nuxt .output/, .nuxt/, .nitro/, and dist/',
    content: `.output/
.nuxt/
.nitro/
dist/
node_modules/`
  },
  {
    id: 'vite',
    name: 'Vite',
    category: 'frameworks',
    popular: true,
    keywords: ['vite', 'frontend', 'bundler', 'hMR'],
    descriptionZh: '忽略 Vite 构建产物 dist/、.vite 缓存与 *.local 环境变量',
    descriptionEn: 'Ignore Vite dist/, .vite cache, and *.local environment files',
    content: `dist/
dist-ssr/
*.local
.vite/`
  },
  {
    id: 'angular',
    name: 'Angular',
    category: 'frameworks',
    keywords: ['ng', 'google', 'typescript', 'spa'],
    descriptionZh: '忽略 Angular 构建产物 /dist、.angular/cache 与 /tmp',
    descriptionEn: 'Ignore Angular build /dist, .angular/cache, and /tmp',
    content: `/.angular/cache
/dist
/tmp
/out-tsc
/bazel-out
/node_modules`
  },
  {
    id: 'svelte',
    name: 'Svelte / SvelteKit',
    category: 'frameworks',
    keywords: ['svelte', 'sveltekit', 'vite'],
    descriptionZh: '忽略 .svelte-kit/ 内部缓存与 build/ 输出目录',
    descriptionEn: 'Ignore .svelte-kit/ cache and build/ directory',
    content: `.svelte-kit/
build/
dist/
node_modules/
.env
.env.*
!.env.example`
  },
  {
    id: 'django',
    name: 'Django',
    category: 'frameworks',
    keywords: ['python', 'web', 'orm', 'sqlite'],
    descriptionZh: '忽略 db.sqlite3、本地 local_settings.py 与 media 目录',
    descriptionEn: 'Ignore db.sqlite3, local_settings.py, and media folder',
    content: `*.log
*.pot
*.pyc
__pycache__/
local_settings.py
db.sqlite3
db.sqlite3-journal
media/`
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    category: 'frameworks',
    popular: true,
    keywords: ['python', 'api', 'uvicorn', 'pydantic', 'async'],
    descriptionZh: '忽略 __pycache__、.env 环境配置与 pytest 缓存',
    descriptionEn: 'Ignore __pycache__, .env, and pytest cache',
    content: `__pycache__/
*.py[cod]
.env
.pytest_cache/
.coverage
htmlcov/`
  },
  {
    id: 'flask',
    name: 'Flask',
    category: 'frameworks',
    keywords: ['python', 'microframework', 'jinja', 'wsgi'],
    descriptionZh: '忽略 instance/ 目录、__pycache__ 与 .env 敏感配置',
    descriptionEn: 'Ignore instance/ folder, __pycache__, and .env files',
    content: `instance/
.webassets-cache
__pycache__/
*.pyc
.env`
  },
  {
    id: 'springboot',
    name: 'Spring Boot',
    category: 'frameworks',
    popular: true,
    keywords: ['java', 'spring', 'maven', 'gradle', 'microservice'],
    descriptionZh: '忽略 target/ 编译目录、IDE 项目缓存并保留 maven wrapper',
    descriptionEn: 'Ignore target/ dir, IDE cache, while keeping maven wrapper',
    content: `target/
!.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/**
!**/src/test/**/target/**

### STS / Eclipse ###
.apt_generated
.classpath
.factorypath
.project
.settings
.springBeans
.sts4-cache

### NetBeans ###
/nbproject/private/
/nbbuild/
/dist/
build/
!**/src/main/**/build/**
!**/src/test/**/build/**`
  },
  {
    id: 'laravel',
    name: 'Laravel',
    category: 'frameworks',
    keywords: ['php', 'artisan', 'eloquent', 'blade'],
    descriptionZh: '忽略 /vendor、.env、.phpunit 缓存与前端依赖',
    descriptionEn: 'Ignore /vendor, .env, .phpunit cache, and node_modules',
    content: `/vendor/
node_modules/
npm-debug.log
yarn-error.log

.env
.env.backup
.env.production
.phpunit.result.cache
Homestead.json
Homestead.yaml
auth.json`
  },
  {
    id: 'rails',
    name: 'Ruby on Rails',
    category: 'frameworks',
    keywords: ['ruby', 'mvc', 'activerecord'],
    descriptionZh: '忽略 /log、/tmp、/storage 与 master.key 敏感密钥',
    descriptionEn: 'Ignore /log, /tmp, /storage, and master.key secrets',
    content: `/log/*
/tmp/*
!/log/.keep
!/tmp/.keep

/storage/*
!/storage/.keep

/public/assets
/public/packs
/public/packs-test
node_modules/
yarn-error.log

.byebug_history
config/master.key`
  },
  {
    id: 'nestjs',
    name: 'NestJS',
    category: 'frameworks',
    keywords: ['node', 'typescript', 'backend', 'express', 'fastify'],
    descriptionZh: '忽略 dist/ 编译产物、node_modules 与 tsbuildinfo',
    descriptionEn: 'Ignore dist/ output, node_modules, and tsbuildinfo',
    content: `dist/
node_modules/
*.tsbuildinfo`
  },
  {
    id: 'astro',
    name: 'Astro',
    category: 'frameworks',
    keywords: ['ssg', 'islands', 'markdown', 'content'],
    descriptionZh: '忽略 dist/ 产物、.astro/ 自动生成类型与依赖',
    descriptionEn: 'Ignore dist/ output, .astro/ generated types, and deps',
    content: `dist/
.astro/
node_modules/`
  },
  {
    id: 'tauri',
    name: 'Tauri',
    category: 'frameworks',
    popular: true,
    keywords: ['rust', 'desktop', 'cross-platform', 'gui'],
    descriptionZh: '忽略 Tauri 底层 Rust 编译产物 src-tauri/target/',
    descriptionEn: 'Ignore Tauri underlying Rust build outputs src-tauri/target/',
    content: `# Tauri build artifacts
src-tauri/target/`
  },
  {
    id: 'electron',
    name: 'Electron',
    category: 'frameworks',
    keywords: ['desktop', 'node', 'chromium'],
    descriptionZh: '忽略 Electron 打包产物 dist/ 与 out/',
    descriptionEn: 'Ignore Electron build outputs dist/ and out/',
    content: `dist/
out/
node_modules/`
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    category: 'frameworks',
    keywords: ['cms', 'php', 'blog'],
    descriptionZh: '忽略 wp-config.php、上传目录 wp-content/uploads/ 与备份文件',
    descriptionEn: 'Ignore wp-config.php, wp-content/uploads/, and backups',
    content: `*.log
.htaccess
wp-config.php
wp-content/advanced-cache.php
wp-content/backup-db/
wp-content/backups/
wp-content/blogs.dir/
wp-content/cache/
wp-content/upgrade/
wp-content/uploads/
wp-content/wp-cache-config.php
wp-content/plugins/hello.php`
  },

  // ==================== 工具、DevOps 与环境 (Tools) ====================
  {
    id: 'env-secrets',
    name: 'Environment & Secrets (.env / 密钥)',
    category: 'tools',
    popular: true,
    keywords: ['env', 'secret', 'key', 'token', 'certificate', 'rsa', 'pem', '敏感文件', '密码'],
    descriptionZh: '忽略 .env 配置文件、私钥 (*.pem, *.key) 与 API 凭据',
    descriptionEn: 'Ignore .env config files, private keys (*.pem, *.key), and API credentials',
    content: `# Environment variables and secrets
.env
.env.*
!.env.example
!.env.template
*.pem
*.key
*.cer
*.crt
*.pfx
*.p12
id_rsa
id_rsa.pub
id_ed25519
id_ed25519.pub
credentials.json
client_secret*.json`
  },
  {
    id: 'logs-dbs',
    name: 'Logs & Local Databases (日志与本地库)',
    category: 'tools',
    popular: true,
    keywords: ['log', 'sqlite', 'db', 'dump', '日志', '数据库'],
    descriptionZh: '忽略各类 *.log 运行日志与本地 SQLite / dump.rdb 数据文件',
    descriptionEn: 'Ignore *.log runtime logs and local SQLite / dump.rdb files',
    content: `# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local databases
*.sqlite
*.sqlite3
*.db
*.sqlite3-journal
dump.rdb`
  },
  {
    id: 'temp-backups',
    name: 'Temporary & Backups (临时与备份文件)',
    category: 'tools',
    keywords: ['tmp', 'temp', 'bak', 'swp', 'cache', '缓存', '临时'],
    descriptionZh: '忽略 *.tmp、*.bak、*.swp 与通用 .cache 缓存目录',
    descriptionEn: 'Ignore *.tmp, *.bak, *.swp, and general .cache folders',
    content: `# Temporary & Backup files
*.tmp
*.temp
*.bak
*.swp
*.swo
*~
.directory
.cache/`
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'tools',
    popular: true,
    keywords: ['container', 'compose', 'k8s', 'dockerfile', '容器'],
    descriptionZh: '忽略 docker-compose 本地覆盖文件与容器构建临时文件',
    descriptionEn: 'Ignore docker-compose override files and build temp files',
    content: `# Docker
.dockerignore
docker-compose.override.yml
*.env`
  },
  {
    id: 'terraform',
    name: 'Terraform',
    category: 'tools',
    keywords: ['iac', 'cloud', 'aws', 'hcl', 'infra'],
    descriptionZh: '忽略 .terraform/ 本地插件、状态文件 *.tfstate 与 *.tfvars',
    descriptionEn: 'Ignore .terraform/ local plugins, *.tfstate, and *.tfvars',
    content: `# Local .terraform directories
**/.terraform/*

# .tfstate files
*.tfstate
*.tfstate.*

# Crash log files
crash.log
crash.*.log

# Exclude all .tfvars files
*.tfvars
*.tfvars.json

# Override files
override.tf
override.tf.json
*_override.tf
*_override.tf.json

# CLI configuration files
.terraformrc
terraform.rc`
  },
  {
    id: 'maven',
    name: 'Maven',
    category: 'tools',
    keywords: ['java', 'pom', 'build', 'mvn'],
    descriptionZh: '忽略 Maven 构建目录 target/ 与发布临时属性文件',
    descriptionEn: 'Ignore Maven build target/ and release temp properties',
    content: `target/
pom.xml.tag
pom.xml.releaseBackup
pom.xml.versionsBackup
pom.xml.next
release.properties
dependency-reduced-pom.xml
buildNumber.properties
.mvn/timing.properties
.mvn/wrapper/maven-wrapper.jar`
  },
  {
    id: 'gradle',
    name: 'Gradle',
    category: 'tools',
    keywords: ['android', 'java', 'kotlin', 'groovy'],
    descriptionZh: '忽略 Gradle 缓存 .gradle/ 与 build/ 目录，保留 wrapper',
    descriptionEn: 'Ignore Gradle cache .gradle/ and build/ directory, keeping wrapper',
    content: `.gradle
/build/
!gradle/wrapper/gradle-wrapper.jar
!**/src/main/**/build/**
!**/src/test/**/build/**`
  },
  {
    id: 'composer',
    name: 'Composer',
    category: 'tools',
    keywords: ['php', 'packagist', 'vendor'],
    descriptionZh: '忽略 Composer /vendor 依赖目录与 composer.phar 执行体',
    descriptionEn: 'Ignore Composer /vendor directory and composer.phar executable',
    content: `/vendor/
composer.phar`
  }
];

// ==================== 快捷预设技术栈 (Preset Stacks) ====================
export const presetStacks: PresetStack[] = [
  {
    id: 'vue-vite',
    nameKey: 'tools.gitignoreGenerator.presets.vueVite',
    templateIds: ['vue', 'vite', 'node', 'vscode', 'macos', 'windows']
  },
  {
    id: 'react-next',
    nameKey: 'tools.gitignoreGenerator.presets.reactNext',
    templateIds: ['react', 'nextjs', 'node', 'vscode', 'macos', 'windows']
  },
  {
    id: 'node-ts',
    nameKey: 'tools.gitignoreGenerator.presets.nodeTs',
    templateIds: ['node', 'vscode', 'env-secrets', 'logs-dbs', 'macos', 'windows']
  },
  {
    id: 'python-fastapi',
    nameKey: 'tools.gitignoreGenerator.presets.pythonFastApi',
    templateIds: ['python', 'fastapi', 'vscode', 'jetbrains', 'env-secrets', 'macos', 'windows']
  },
  {
    id: 'rust-tauri',
    nameKey: 'tools.gitignoreGenerator.presets.rustTauri',
    templateIds: ['rust', 'tauri', 'node', 'vscode', 'macos', 'windows']
  },
  {
    id: 'go-cloud',
    nameKey: 'tools.gitignoreGenerator.presets.goCloud',
    templateIds: ['go', 'docker', 'vscode', 'env-secrets', 'macos', 'linux']
  },
  {
    id: 'spring-boot',
    nameKey: 'tools.gitignoreGenerator.presets.springBoot',
    templateIds: ['java', 'springboot', 'maven', 'jetbrains', 'macos', 'windows']
  },
  {
    id: 'flutter-mobile',
    nameKey: 'tools.gitignoreGenerator.presets.flutterMobile',
    templateIds: ['dart', 'androidstudio', 'xcode', 'vscode', 'macos']
  }
];

/**
 * 根据选中的模板及自定义规则合成最终 .gitignore 文件内容
 */
export function buildGitignoreContent(options: {
  selectedTemplateIds: string[];
  customRules?: string;
  includeHeaders?: boolean;
  deduplicate?: boolean;
}): string {
  const {
    selectedTemplateIds,
    customRules = '',
    includeHeaders = true,
    deduplicate = true
  } = options;

  const sections: { name: string; lines: string[] }[] = [];

  for (const id of selectedTemplateIds) {
    const tmpl = gitignoreTemplates.find(t => t.id === id);
    if (!tmpl) continue;

    const rawLines = tmpl.content
      .split('\n')
      .map(l => l.trimEnd());

    sections.push({
      name: tmpl.name,
      lines: rawLines
    });
  }

  // 追加自定义规则块
  const trimmedCustom = customRules.trim();
  if (trimmedCustom) {
    sections.push({
      name: 'Custom Rules',
      lines: trimmedCustom.split('\n').map(l => l.trimEnd())
    });
  }

  if (sections.length === 0) {
    return '';
  }

  const seenRules = new Set<string>();
  const outputLines: string[] = [];

  // 顶部生成说明
  outputLines.push('# Created by DevCrate Gitignore Generator');
  if (selectedTemplateIds.length > 0) {
    const names = selectedTemplateIds
      .map(id => gitignoreTemplates.find(t => t.id === id)?.name || id)
      .join(', ');
    outputLines.push(`# Presets: ${names}`);
  }
  outputLines.push('');

  for (const section of sections) {
    const sectionBody: string[] = [];

    for (const line of section.lines) {
      const trimmed = line.trim();

      // 保留空行或纯注释
      if (!trimmed || trimmed.startsWith('#')) {
        sectionBody.push(line);
        continue;
      }

      // 如果开启去重，且该规则已经出现过，则跳过
      if (deduplicate) {
        if (seenRules.has(trimmed)) {
          continue;
        }
        seenRules.add(trimmed);
      }

      sectionBody.push(line);
    }

    // 过滤掉只有注释而没有有效规则或者纯空的段落
    const hasRules = sectionBody.some(l => {
      const t = l.trim();
      return t && !t.startsWith('#');
    });

    if (hasRules || section.name === 'Custom Rules') {
      if (includeHeaders) {
        outputLines.push(`### ${section.name} ###`);
      }
      outputLines.push(...sectionBody);
      outputLines.push('');
    }
  }

  // 清理多余尾部空行并规范单尾部换行
  let result = outputLines.join('\n');
  result = result.replace(/\n{3,}/g, '\n\n').trim() + '\n';
  return result;
}
