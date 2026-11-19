import {
  createEmptyService,
  type ComposeConfig,
  type ComposeService,
} from './dockerComposeUtils';

export interface ComposePreset {
  id: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  build: () => ComposeConfig;
}

export interface ServiceCatalogItem {
  id: string;
  category: 'database' | 'cache' | 'proxy' | 'queue' | 'search' | 'runtime' | 'observability';
  name: string;
  image: string;
  descZh: string;
  descEn: string;
  build: () => ComposeService;
}

export const SAMPLE_DOCKER_RUN = `docker run -d \\
  --name my-postgres \\
  --restart unless-stopped \\
  -p 5432:5432 \\
  -e POSTGRES_USER=app \\
  -e POSTGRES_PASSWORD=secret \\
  -e POSTGRES_DB=app_db \\
  -v pg_data:/var/lib/postgresql/data \\
  --network backend \\
  --health-cmd "pg_isready -U app" \\
  --health-interval 10s \\
  --health-retries 5 \\
  postgres:16-alpine`;

export const COMPOSE_PRESETS: ComposePreset[] = [
  {
    id: 'fullstack-pg-redis',
    nameZh: 'Web 全栈 (Nginx + API + PG + Redis)',
    nameEn: 'Fullstack (Nginx + API + PG + Redis)',
    descZh: '包含反向代理、后端服务构建、PostgreSQL 健康检查依赖与 Redis 缓存',
    descEn: 'Nginx reverse proxy, app build, PostgreSQL with healthcheck & Redis cache',
    build: () => ({
      projectName: 'webapp-stack',
      legacyVersion: '',
      services: [
        createEmptyService({
          name: 'nginx',
          image: 'nginx:1.27-alpine',
          restart: 'unless-stopped',
          ports: [{ hostIp: '', host: '80', container: '80', protocol: 'tcp' }],
          volumes: [{ source: './nginx/default.conf', target: '/etc/nginx/conf.d/default.conf', mode: 'ro' }],
          networks: ['frontend', 'backend'],
          dependsOn: [{ service: 'api', condition: 'service_started' }],
        }),
        createEmptyService({
          name: 'api',
          image: '',
          buildEnabled: true,
          buildContext: '.',
          buildDockerfile: 'Dockerfile',
          restart: 'unless-stopped',
          ports: [{ hostIp: '127.0.0.1', host: '3000', container: '3000', protocol: 'tcp' }],
          environment: [
            { key: 'NODE_ENV', value: 'production' },
            { key: 'DATABASE_URL', value: 'postgresql://postgres:${POSTGRES_PASSWORD:-secret}@postgres:5432/app' },
            { key: 'REDIS_URL', value: 'redis://redis:6379' },
          ],
          networks: ['backend'],
          dependsOn: [
            { service: 'postgres', condition: 'service_healthy' },
            { service: 'redis', condition: 'service_healthy' },
          ],
        }),
        createEmptyService({
          name: 'postgres',
          image: 'postgres:16-alpine',
          restart: 'unless-stopped',
          ports: [{ hostIp: '127.0.0.1', host: '5432', container: '5432', protocol: 'tcp' }],
          environment: [
            { key: 'POSTGRES_USER', value: 'postgres' },
            { key: 'POSTGRES_PASSWORD', value: '${POSTGRES_PASSWORD:-secret}' },
            { key: 'POSTGRES_DB', value: 'app' },
          ],
          volumes: [{ source: 'pg_data', target: '/var/lib/postgresql/data', mode: '' }],
          networks: ['backend'],
          healthcheck: {
            enabled: true,
            test: 'pg_isready -U postgres',
            interval: '10s',
            timeout: '5s',
            retries: 5,
            startPeriod: '10s',
          },
        }),
        createEmptyService({
          name: 'redis',
          image: 'redis:7-alpine',
          restart: 'unless-stopped',
          command: 'redis-server --appendonly yes',
          ports: [{ hostIp: '127.0.0.1', host: '6379', container: '6379', protocol: 'tcp' }],
          volumes: [{ source: 'redis_data', target: '/data', mode: '' }],
          networks: ['backend'],
          healthcheck: {
            enabled: true,
            test: 'redis-cli ping',
            interval: '10s',
            timeout: '3s',
            retries: 5,
            startPeriod: '',
          },
        }),
      ],
      networks: [
        { name: 'frontend', driver: 'bridge', external: false, subnet: '' },
        { name: 'backend', driver: 'bridge', external: false, subnet: '' },
      ],
      volumes: [
        { name: 'pg_data', driver: '', external: false },
        { name: 'redis_data', driver: '', external: false },
      ],
    }),
  },
  {
    id: 'mysql-adminer',
    nameZh: 'MySQL 8 + Redis + Adminer',
    nameEn: 'MySQL 8 + Redis + Adminer',
    descZh: '本地 MySQL 开发环境，附带 Redis 与轻量数据库 Web 管理端',
    descEn: 'Local MySQL 8 development stack with Redis and Adminer web UI',
    build: () => ({
      projectName: 'mysql-dev',
      legacyVersion: '',
      services: [
        createEmptyService({
          name: 'mysql',
          image: 'mysql:8.4',
          restart: 'unless-stopped',
          ports: [{ hostIp: '127.0.0.1', host: '3306', container: '3306', protocol: 'tcp' }],
          environment: [
            { key: 'MYSQL_ROOT_PASSWORD', value: '${MYSQL_ROOT_PASSWORD:-root1234}' },
            { key: 'MYSQL_DATABASE', value: 'app_dev' },
            { key: 'TZ', value: 'Asia/Shanghai' },
          ],
          volumes: [{ source: 'mysql_data', target: '/var/lib/mysql', mode: '' }],
          networks: ['db_net'],
          healthcheck: {
            enabled: true,
            test: 'mysqladmin ping -h localhost -uroot -p$$MYSQL_ROOT_PASSWORD',
            interval: '10s',
            timeout: '5s',
            retries: 5,
            startPeriod: '20s',
          },
        }),
        createEmptyService({
          name: 'redis',
          image: 'redis:7-alpine',
          restart: 'unless-stopped',
          ports: [{ hostIp: '127.0.0.1', host: '6379', container: '6379', protocol: 'tcp' }],
          volumes: [{ source: 'redis_data', target: '/data', mode: '' }],
          networks: ['db_net'],
        }),
        createEmptyService({
          name: 'adminer',
          image: 'adminer:4',
          restart: 'unless-stopped',
          ports: [{ hostIp: '127.0.0.1', host: '8080', container: '8080', protocol: 'tcp' }],
          networks: ['db_net'],
          dependsOn: [{ service: 'mysql', condition: 'service_healthy' }],
        }),
      ],
      networks: [{ name: 'db_net', driver: 'bridge', external: false, subnet: '' }],
      volumes: [
        { name: 'mysql_data', driver: '', external: false },
        { name: 'redis_data', driver: '', external: false },
      ],
    }),
  },
  {
    id: 'mongo-express',
    nameZh: 'MongoDB + Mongo Express',
    nameEn: 'MongoDB + Mongo Express',
    descZh: 'MongoDB 7 文档数据库与可视化管理面板组合',
    descEn: 'MongoDB 7 database with Mongo Express admin UI',
    build: () => ({
      projectName: 'mongo-stack',
      legacyVersion: '',
      services: [
        createEmptyService({
          name: 'mongo',
          image: 'mongo:7',
          restart: 'unless-stopped',
          ports: [{ hostIp: '127.0.0.1', host: '27017', container: '27017', protocol: 'tcp' }],
          environment: [
            { key: 'MONGO_INITDB_ROOT_USERNAME', value: 'admin' },
            { key: 'MONGO_INITDB_ROOT_PASSWORD', value: '${MONGO_PASSWORD:-secret}' },
          ],
          volumes: [{ source: 'mongo_data', target: '/data/db', mode: '' }],
        }),
        createEmptyService({
          name: 'mongo-express',
          image: 'mongo-express:1',
          restart: 'unless-stopped',
          ports: [{ hostIp: '127.0.0.1', host: '8081', container: '8081', protocol: 'tcp' }],
          environment: [
            { key: 'ME_CONFIG_MONGODB_ADMINUSERNAME', value: 'admin' },
            { key: 'ME_CONFIG_MONGODB_ADMINPASSWORD', value: '${MONGO_PASSWORD:-secret}' },
            { key: 'ME_CONFIG_MONGODB_URL', value: 'mongodb://admin:${MONGO_PASSWORD:-secret}@mongo:27017/' },
          ],
          dependsOn: [{ service: 'mongo', condition: 'service_started' }],
        }),
      ],
      networks: [],
      volumes: [{ name: 'mongo_data', driver: '', external: false }],
    }),
  },
  {
    id: 'minio-s3',
    nameZh: 'MinIO S3 对象存储',
    nameEn: 'MinIO S3 Storage',
    descZh: '本地兼容 AWS S3 API 的对象存储与 Console 控制台',
    descEn: 'Local S3-compatible object storage with Web Console',
    build: () => ({
      projectName: 'minio-storage',
      legacyVersion: '',
      services: [
        createEmptyService({
          name: 'minio',
          image: 'minio/minio:latest',
          restart: 'unless-stopped',
          command: 'server /data --console-address ":9001"',
          ports: [
            { hostIp: '', host: '9000', container: '9000', protocol: 'tcp' },
            { hostIp: '', host: '9001', container: '9001', protocol: 'tcp' },
          ],
          environment: [
            { key: 'MINIO_ROOT_USER', value: 'minioadmin' },
            { key: 'MINIO_ROOT_PASSWORD', value: '${MINIO_ROOT_PASSWORD:-minioadmin}' },
          ],
          volumes: [{ source: 'minio_data', target: '/data', mode: '' }],
          healthcheck: {
            enabled: true,
            test: 'mc ready local',
            interval: '15s',
            timeout: '5s',
            retries: 3,
            startPeriod: '10s',
          },
        }),
      ],
      networks: [],
      volumes: [{ name: 'minio_data', driver: '', external: false }],
    }),
  },
  {
    id: 'prometheus-grafana',
    nameZh: 'Prometheus + Grafana 监控',
    nameEn: 'Prometheus + Grafana',
    descZh: '指标采集与 Grafana 可视化仪表盘监控栈',
    descEn: 'Metrics scraping with Prometheus and Grafana visualization',
    build: () => ({
      projectName: 'monitoring',
      legacyVersion: '',
      services: [
        createEmptyService({
          name: 'prometheus',
          image: 'prom/prometheus:v2.54.1',
          restart: 'unless-stopped',
          ports: [{ hostIp: '127.0.0.1', host: '9090', container: '9090', protocol: 'tcp' }],
          volumes: [
            { source: './prometheus.yml', target: '/etc/prometheus/prometheus.yml', mode: 'ro' },
            { source: 'prom_data', target: '/prometheus', mode: '' },
          ],
          networks: ['monitoring'],
        }),
        createEmptyService({
          name: 'grafana',
          image: 'grafana/grafana:11.2.0',
          restart: 'unless-stopped',
          ports: [{ hostIp: '127.0.0.1', host: '3000', container: '3000', protocol: 'tcp' }],
          environment: [
            { key: 'GF_SECURITY_ADMIN_USER', value: 'admin' },
            { key: 'GF_SECURITY_ADMIN_PASSWORD', value: '${GRAFANA_PASSWORD:-admin}' },
          ],
          volumes: [{ source: 'grafana_data', target: '/var/lib/grafana', mode: '' }],
          networks: ['monitoring'],
          dependsOn: [{ service: 'prometheus', condition: 'service_started' }],
        }),
      ],
      networks: [{ name: 'monitoring', driver: 'bridge', external: false, subnet: '' }],
      volumes: [
        { name: 'prom_data', driver: '', external: false },
        { name: 'grafana_data', driver: '', external: false },
      ],
    }),
  },
  {
    id: 'blank',
    nameZh: '空白单服务骨架',
    nameEn: 'Blank Service',
    descZh: '从单服务极简模板自由搭建',
    descEn: 'Start clean with a minimal single-service skeleton',
    build: () => ({
      projectName: '',
      legacyVersion: '',
      services: [
        createEmptyService({
          name: 'app',
          image: 'alpine:3.20',
          command: 'sleep infinity',
          restart: 'unless-stopped',
        }),
      ],
      networks: [],
      volumes: [],
    }),
  },
];

export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  {
    id: 'postgres',
    category: 'database',
    name: 'PostgreSQL 16',
    image: 'postgres:16-alpine',
    descZh: '关系型数据库，含持久化卷与 pg_isready 健康检查',
    descEn: 'Relational database with persistent volume & pg_isready healthcheck',
    build: () =>
      createEmptyService({
        name: 'postgres',
        image: 'postgres:16-alpine',
        ports: [{ hostIp: '127.0.0.1', host: '5432', container: '5432', protocol: 'tcp' }],
        environment: [
          { key: 'POSTGRES_USER', value: 'postgres' },
          { key: 'POSTGRES_PASSWORD', value: 'secret' },
          { key: 'POSTGRES_DB', value: 'app' },
        ],
        volumes: [{ source: 'pg_data', target: '/var/lib/postgresql/data', mode: '' }],
        healthcheck: {
          enabled: true,
          test: 'pg_isready -U postgres',
          interval: '10s',
          timeout: '5s',
          retries: 5,
          startPeriod: '',
        },
      }),
  },
  {
    id: 'mysql',
    category: 'database',
    name: 'MySQL 8.4',
    image: 'mysql:8.4',
    descZh: 'MySQL LTS 长期支持版，含持久化卷与 UTF8MB4 默认配置',
    descEn: 'MySQL 8.4 LTS with persistent data volume',
    build: () =>
      createEmptyService({
        name: 'mysql',
        image: 'mysql:8.4',
        ports: [{ hostIp: '127.0.0.1', host: '3306', container: '3306', protocol: 'tcp' }],
        environment: [
          { key: 'MYSQL_ROOT_PASSWORD', value: 'root1234' },
          { key: 'MYSQL_DATABASE', value: 'app' },
        ],
        volumes: [{ source: 'mysql_data', target: '/var/lib/mysql', mode: '' }],
      }),
  },
  {
    id: 'mariadb',
    category: 'database',
    name: 'MariaDB 11',
    image: 'mariadb:11',
    descZh: '轻量高性能 MySQL 兼容开源分支',
    descEn: 'Open-source relational database compatible with MySQL',
    build: () =>
      createEmptyService({
        name: 'mariadb',
        image: 'mariadb:11',
        ports: [{ hostIp: '127.0.0.1', host: '3306', container: '3306', protocol: 'tcp' }],
        environment: [
          { key: 'MARIADB_ROOT_PASSWORD', value: 'root1234' },
          { key: 'MARIADB_DATABASE', value: 'app' },
        ],
        volumes: [{ source: 'mariadb_data', target: '/var/lib/mysql', mode: '' }],
      }),
  },
  {
    id: 'mongodb',
    category: 'database',
    name: 'MongoDB 7',
    image: 'mongo:7',
    descZh: 'NoSQL 文档数据库，支持初始化管理员账密',
    descEn: 'Document database with root credentials & data volume',
    build: () =>
      createEmptyService({
        name: 'mongo',
        image: 'mongo:7',
        ports: [{ hostIp: '127.0.0.1', host: '27017', container: '27017', protocol: 'tcp' }],
        environment: [
          { key: 'MONGO_INITDB_ROOT_USERNAME', value: 'admin' },
          { key: 'MONGO_INITDB_ROOT_PASSWORD', value: 'secret' },
        ],
        volumes: [{ source: 'mongo_data', target: '/data/db', mode: '' }],
      }),
  },
  {
    id: 'redis',
    category: 'cache',
    name: 'Redis 7',
    image: 'redis:7-alpine',
    descZh: '内存键值缓存，默认开启 AOF 持久化与 ping 探活',
    descEn: 'In-memory key-value store with AOF persistence & ping healthcheck',
    build: () =>
      createEmptyService({
        name: 'redis',
        image: 'redis:7-alpine',
        command: 'redis-server --appendonly yes',
        ports: [{ hostIp: '127.0.0.1', host: '6379', container: '6379', protocol: 'tcp' }],
        volumes: [{ source: 'redis_data', target: '/data', mode: '' }],
        healthcheck: {
          enabled: true,
          test: 'redis-cli ping',
          interval: '10s',
          timeout: '3s',
          retries: 5,
          startPeriod: '',
        },
      }),
  },
  {
    id: 'valkey',
    category: 'cache',
    name: 'Valkey 8',
    image: 'valkey/valkey:8-alpine',
    descZh: 'Linux 基金会维护的 Redis 开源兼容替代方案',
    descEn: 'Open-source Redis-compatible in-memory data store',
    build: () =>
      createEmptyService({
        name: 'valkey',
        image: 'valkey/valkey:8-alpine',
        ports: [{ hostIp: '127.0.0.1', host: '6379', container: '6379', protocol: 'tcp' }],
        volumes: [{ source: 'valkey_data', target: '/data', mode: '' }],
      }),
  },
  {
    id: 'nginx',
    category: 'proxy',
    name: 'Nginx',
    image: 'nginx:1.27-alpine',
    descZh: '轻量级 HTTP 与反向代理服务器',
    descEn: 'Lightweight HTTP server and reverse proxy',
    build: () =>
      createEmptyService({
        name: 'nginx',
        image: 'nginx:1.27-alpine',
        ports: [
          { hostIp: '', host: '80', container: '80', protocol: 'tcp' },
          { hostIp: '', host: '443', container: '443', protocol: 'tcp' },
        ],
        volumes: [{ source: './nginx.conf', target: '/etc/nginx/conf.d/default.conf', mode: 'ro' }],
      }),
  },
  {
    id: 'caddy',
    category: 'proxy',
    name: 'Caddy 2',
    image: 'caddy:2-alpine',
    descZh: '自动签发 HTTPS 证书的现代反向代理与静态服务器',
    descEn: 'Modern web server with automatic HTTPS certificates',
    build: () =>
      createEmptyService({
        name: 'caddy',
        image: 'caddy:2-alpine',
        ports: [
          { hostIp: '', host: '80', container: '80', protocol: 'tcp' },
          { hostIp: '', host: '443', container: '443', protocol: 'tcp' },
        ],
        volumes: [
          { source: './Caddyfile', target: '/etc/caddy/Caddyfile', mode: 'ro' },
          { source: 'caddy_data', target: '/data', mode: '' },
        ],
      }),
  },
  {
    id: 'rabbitmq',
    category: 'queue',
    name: 'RabbitMQ 3',
    image: 'rabbitmq:3-management-alpine',
    descZh: 'AMQP 消息队列，带 15672 Web 管理控制台',
    descEn: 'AMQP message broker with Web Management UI on 15672',
    build: () =>
      createEmptyService({
        name: 'rabbitmq',
        image: 'rabbitmq:3-management-alpine',
        ports: [
          { hostIp: '127.0.0.1', host: '5672', container: '5672', protocol: 'tcp' },
          { hostIp: '127.0.0.1', host: '15672', container: '15672', protocol: 'tcp' },
        ],
        environment: [
          { key: 'RABBITMQ_DEFAULT_USER', value: 'admin' },
          { key: 'RABBITMQ_DEFAULT_PASS', value: 'secret' },
        ],
        volumes: [{ source: 'rabbitmq_data', target: '/var/lib/rabbitmq', mode: '' }],
      }),
  },
  {
    id: 'meilisearch',
    category: 'search',
    name: 'Meilisearch',
    image: 'getmeili/meilisearch:v1.10',
    descZh: '开箱即用的轻量级全文搜索引擎',
    descEn: 'Fast, lightweight full-text search engine',
    build: () =>
      createEmptyService({
        name: 'meilisearch',
        image: 'getmeili/meilisearch:v1.10',
        ports: [{ hostIp: '127.0.0.1', host: '7700', container: '7700', protocol: 'tcp' }],
        environment: [{ key: 'MEILI_MASTER_KEY', value: 'devMasterKey123' }],
        volumes: [{ source: 'meili_data', target: '/meili_data', mode: '' }],
      }),
  },
  {
    id: 'minio',
    category: 'runtime',
    name: 'MinIO S3',
    image: 'minio/minio:latest',
    descZh: '兼容 S3 协议的本地对象存储服务',
    descEn: 'S3-compatible object storage service',
    build: () =>
      createEmptyService({
        name: 'minio',
        image: 'minio/minio:latest',
        command: 'server /data --console-address ":9001"',
        ports: [
          { hostIp: '', host: '9000', container: '9000', protocol: 'tcp' },
          { hostIp: '', host: '9001', container: '9001', protocol: 'tcp' },
        ],
        environment: [
          { key: 'MINIO_ROOT_USER', value: 'minioadmin' },
          { key: 'MINIO_ROOT_PASSWORD', value: 'minioadmin' },
        ],
        volumes: [{ source: 'minio_data', target: '/data', mode: '' }],
      }),
  },
  {
    id: 'grafana',
    category: 'observability',
    name: 'Grafana',
    image: 'grafana/grafana:11.2.0',
    descZh: '时序指标与日志监控可视化面板',
    descEn: 'Observability dashboards & metrics visualization',
    build: () =>
      createEmptyService({
        name: 'grafana',
        image: 'grafana/grafana:11.2.0',
        ports: [{ hostIp: '127.0.0.1', host: '3000', container: '3000', protocol: 'tcp' }],
        volumes: [{ source: 'grafana_data', target: '/var/lib/grafana', mode: '' }],
      }),
  },
];
