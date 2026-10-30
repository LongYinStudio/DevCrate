export interface PortServiceInfo {
  service: string;
  category: 'web' | 'db' | 'dev' | 'infra' | 'other';
  descZh: string;
  descEn: string;
}

export const KNOWN_PORTS: Record<number, PortServiceInfo> = {
  20: { service: 'FTP Data', category: 'infra', descZh: 'FTP 文件传输协议数据端口', descEn: 'FTP File Transfer Protocol (Data)' },
  21: { service: 'FTP', category: 'infra', descZh: 'FTP 文件传输协议控制端口', descEn: 'FTP File Transfer Protocol (Control)' },
  22: { service: 'SSH', category: 'infra', descZh: 'SSH 安全远程登录 / SFTP', descEn: 'SSH Secure Shell / SFTP' },
  23: { service: 'Telnet', category: 'infra', descZh: 'Telnet 明文远程终端', descEn: 'Telnet Remote Terminal Protocol' },
  25: { service: 'SMTP', category: 'infra', descZh: '简单邮件传输协议 (邮件发送)', descEn: 'Simple Mail Transfer Protocol' },
  53: { service: 'DNS', category: 'infra', descZh: '域名系统服务', descEn: 'Domain Name System' },
  67: { service: 'DHCP', category: 'infra', descZh: '动态主机配置协议服务', descEn: 'DHCP Server' },
  80: { service: 'HTTP', category: 'web', descZh: '超文本传输协议 (标准 Web 服务)', descEn: 'HyperText Transfer Protocol (Web)' },
  110: { service: 'POP3', category: 'infra', descZh: '邮局协议第 3 版 (邮件接收)', descEn: 'Post Office Protocol v3' },
  123: { service: 'NTP', category: 'infra', descZh: '网络时间同步协议', descEn: 'Network Time Protocol' },
  143: { service: 'IMAP', category: 'infra', descZh: '互联网邮件访问协议', descEn: 'Internet Message Access Protocol' },
  443: { service: 'HTTPS', category: 'web', descZh: '安全超文本传输协议 (SSL/TLS 加密 Web)', descEn: 'HTTPS (HTTP over TLS/SSL)' },
  465: { service: 'SMTPS', category: 'infra', descZh: '加密邮件传输协议 (SSL/TLS)', descEn: 'SMTP over SSL' },
  587: { service: 'SMTP Sub', category: 'infra', descZh: '邮件客户端提交端口', descEn: 'SMTP Message Submission' },
  993: { service: 'IMAPS', category: 'infra', descZh: '加密邮件访问协议 (SSL/TLS)', descEn: 'IMAP over SSL' },
  995: { service: 'POP3S', category: 'infra', descZh: '加密邮局协议 (SSL/TLS)', descEn: 'POP3 over SSL' },
  1080: { service: 'SOCKS Proxy', category: 'infra', descZh: 'SOCKS 网络代理服务', descEn: 'SOCKS Proxy Protocol' },
  1433: { service: 'MSSQL', category: 'db', descZh: 'Microsoft SQL Server 数据库', descEn: 'Microsoft SQL Server Database' },
  1521: { service: 'Oracle', category: 'db', descZh: 'Oracle 数据库监听器', descEn: 'Oracle Database Listener' },
  1883: { service: 'MQTT', category: 'infra', descZh: '物联网轻量级消息队列', descEn: 'MQTT Message Broker' },
  2181: { service: 'ZooKeeper', category: 'infra', descZh: 'Apache ZooKeeper 分布式协调服务', descEn: 'Apache ZooKeeper Client Port' },
  2375: { service: 'Docker Engine', category: 'dev', descZh: 'Docker 守护进程非加密 REST API', descEn: 'Docker REST API (Plain HTTP)' },
  2376: { service: 'Docker TLS', category: 'dev', descZh: 'Docker 守护进程 TLS 加密端口', descEn: 'Docker REST API (TLS Encrypted)' },
  3000: { service: 'Dev Server', category: 'dev', descZh: 'Node.js / React / Next.js / Grafana 开发服务', descEn: 'React / Next.js / Node.js Dev Server / Grafana' },
  3001: { service: 'Dev Alt', category: 'dev', descZh: '备用前端开发服务器', descEn: 'Secondary Frontend Dev Server' },
  3306: { service: 'MySQL', category: 'db', descZh: 'MySQL / MariaDB 关系型数据库', descEn: 'MySQL / MariaDB Database' },
  4000: { service: 'Hexo / GraphQL', category: 'dev', descZh: 'Hexo 博客 / Apollo GraphQL 服务', descEn: 'Hexo Blog Server / Apollo GraphQL Server' },
  4200: { service: 'Angular CLI', category: 'dev', descZh: 'Angular 框架开发服务器', descEn: 'Angular Framework Dev Server' },
  5000: { service: 'Flask / ASP.NET', category: 'dev', descZh: 'Flask / ASP.NET Core / Docker Registry', descEn: 'Python Flask / ASP.NET Core / Docker Registry' },
  5173: { service: 'Vite', category: 'dev', descZh: 'Vite 高速现代前端开发服务器', descEn: 'Vite Frontend Development Server' },
  5174: { service: 'Vite Alt', category: 'dev', descZh: 'Vite 次级开发端口', descEn: 'Secondary Vite Dev Port' },
  5432: { service: 'PostgreSQL', category: 'db', descZh: 'PostgreSQL 关系型数据库', descEn: 'PostgreSQL Relational Database' },
  5672: { service: 'RabbitMQ', category: 'infra', descZh: 'RabbitMQ 消息中间件 (AMQP)', descEn: 'RabbitMQ AMQP Broker' },
  5900: { service: 'VNC', category: 'infra', descZh: 'VNC 远程桌面控制', descEn: 'Virtual Network Computing (VNC)' },
  6379: { service: 'Redis', category: 'db', descZh: 'Redis 内存高速缓存与数据库', descEn: 'Redis In-Memory Key-Value Cache' },
  7001: { service: 'WebLogic', category: 'dev', descZh: 'Oracle WebLogic / Spring Cloud Config', descEn: 'Oracle WebLogic Server' },
  8000: { service: 'Django / HTTP', category: 'dev', descZh: 'Django / Spring Boot / HTTP 常见备用端口', descEn: 'Django / Spring Boot / HTTP Alternate' },
  8080: { service: 'HTTP Alt / Spring', category: 'web', descZh: 'Tomcat / Spring Boot / Jenkins / Web 备用', descEn: 'Tomcat / Spring Boot / Jenkins / HTTP Alternate' },
  8081: { service: 'HTTP Proxy', category: 'web', descZh: 'Web 备用端口 / Nexus 仓库服务', descEn: 'Secondary Web Port / Nexus Repository' },
  8443: { service: 'HTTPS Alt', category: 'web', descZh: 'Tomcat SSL / HTTPS 常用备用端口', descEn: 'HTTPS Alternate / Tomcat SSL' },
  8888: { service: 'Jupyter / Charles', category: 'dev', descZh: 'Jupyter Notebook / Charles 抓包代理', descEn: 'Jupyter Notebook / Charles Web Proxy' },
  9000: { service: 'SonarQube / PHP', category: 'dev', descZh: 'SonarQube / PHP-FPM / MinIO 存储', descEn: 'SonarQube / PHP-FPM FastCGI / MinIO S3' },
  9090: { service: 'Prometheus', category: 'infra', descZh: 'Prometheus 监控系统 Web UI', descEn: 'Prometheus Metrics Server Web UI' },
  9092: { service: 'Kafka', category: 'infra', descZh: 'Apache Kafka 消息队列集群客户端端口', descEn: 'Apache Kafka Distributed Event Streaming' },
  9200: { service: 'Elasticsearch', category: 'db', descZh: 'Elasticsearch RESTful 搜索与分析引擎', descEn: 'Elasticsearch REST API' },
  9300: { service: 'ES Cluster', category: 'db', descZh: 'Elasticsearch 集群内部通信节点', descEn: 'Elasticsearch Internal Cluster Node' },
  11211: { service: 'Memcached', category: 'db', descZh: 'Memcached 分布式内存对象缓存', descEn: 'Memcached Memory Cache System' },
  15672: { service: 'RabbitMQ UI', category: 'infra', descZh: 'RabbitMQ Web 管理控制台', descEn: 'RabbitMQ Management Web UI' },
  27017: { service: 'MongoDB', category: 'db', descZh: 'MongoDB 文档型数据库引擎', descEn: 'MongoDB Document Database' },
  28017: { service: 'MongoDB Web', category: 'db', descZh: 'MongoDB 网页管理后台', descEn: 'MongoDB Legacy Web Admin' }
};

export interface PortPreset {
  id: string;
  nameZh: string;
  nameEn: string;
  ports: number[];
}

export const PORT_PRESETS: PortPreset[] = [
  {
    id: 'dev',
    nameZh: '前端/后端开发',
    nameEn: 'Dev Servers',
    ports: [3000, 3001, 4000, 4200, 5000, 5173, 5174, 8000, 8080, 8081, 8888, 9000]
  },
  {
    id: 'db',
    nameZh: '常用数据库',
    nameEn: 'Databases',
    ports: [1433, 1521, 3306, 5432, 6379, 9200, 11211, 27017]
  },
  {
    id: 'web',
    nameZh: 'Web 服务',
    nameEn: 'Web Services',
    ports: [80, 443, 8000, 8080, 8081, 8443, 8888]
  },
  {
    id: 'infra',
    nameZh: '网络与中间件',
    nameEn: 'Infra & Messaging',
    ports: [21, 22, 25, 53, 110, 143, 1883, 2181, 5672, 9090, 9092, 15672]
  },
  {
    id: 'common',
    nameZh: '常见高频端口 (Top 25)',
    nameEn: 'Top 25 Common',
    ports: [
      21, 22, 53, 80, 443, 1433, 2375, 3000, 3306, 5000, 5173, 5432, 5672, 6379,
      8000, 8080, 8443, 8888, 9000, 9090, 9092, 9200, 11211, 15672, 27017
    ]
  }
];

export function getKnownService(port: number): PortServiceInfo | undefined {
  return KNOWN_PORTS[port];
}
