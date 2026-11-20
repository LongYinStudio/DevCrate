import { createEmptyHost, type SshConfigDocument } from './sshConfigUtils';

export interface SshPreset {
  id: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  build: () => SshConfigDocument;
}

export const SSH_PRESETS: SshPreset[] = [
  {
    id: 'bastion-prod',
    nameZh: '跳板机 + 内网集群 + 数据库隧道',
    nameEn: 'Bastion + Internal Hosts + DB Tunnel',
    descZh: '包含公网跳板机、通过 ProxyJump 直连内网机器、PostgreSQL 本地端口转发与全局保活/连接复用',
    descEn: 'Public bastion jump host, internal VPC host via ProxyJump, local Postgres tunnel & global multiplexing',
    build: () => ({
      topIncludes: ['~/.ssh/conf.d/*.conf'],
      hosts: [
        createEmptyHost({
          alias: 'bastion',
          comment: 'Public jump host (Bastion)',
          hostName: '203.0.113.10',
          user: 'ops',
          port: '2222',
          identityFiles: ['~/.ssh/id_ed25519_prod'],
          identitiesOnly: true,
        }),
        createEmptyHost({
          alias: 'prod-api',
          comment: 'Internal API server behind bastion',
          hostName: '10.0.12.24',
          user: 'ubuntu',
          proxyJump: 'bastion',
          identityFiles: ['~/.ssh/id_ed25519_prod'],
          identitiesOnly: true,
        }),
        createEmptyHost({
          alias: 'prod-db-tunnel',
          comment: 'Local tunnel to private PostgreSQL & Redis',
          hostName: '10.0.12.24',
          user: 'ubuntu',
          proxyJump: 'bastion',
          identityFiles: ['~/.ssh/id_ed25519_prod'],
          localForwards: [
            {
              bindAddress: '127.0.0.1',
              bindPort: '15432',
              targetHost: '10.0.20.5',
              targetPort: '5432',
            },
            {
              bindAddress: '127.0.0.1',
              bindPort: '16379',
              targetHost: '10.0.20.8',
              targetPort: '6379',
            },
          ],
          requestTty: 'no',
        }),
        createEmptyHost({
          alias: '*',
          comment: 'Global defaults (always keep at the bottom)',
          addKeysToAgent: 'yes',
          serverAliveInterval: '60',
          serverAliveCountMax: '3',
          compression: 'yes',
          controlMaster: 'auto',
          controlPath: '~/.ssh/cm-%r@%h:%p',
          controlPersist: '10m',
        }),
      ],
    }),
  },
  {
    id: 'multi-git',
    nameZh: '多账号 Git 密钥分流 (GitHub / GitLab)',
    nameEn: 'Multi-Account Git Keys (GitHub / GitLab)',
    descZh: '针对个人与工作 Git 仓库自动切换不同的 SSH 私钥，配合 IdentitiesOnly 避免密钥尝试次数超限',
    descEn: 'Separate SSH keys for personal GitHub, work GitHub, and GitLab with IdentitiesOnly yes',
    build: () => ({
      topIncludes: [],
      hosts: [
        createEmptyHost({
          alias: 'github.com',
          comment: 'Personal GitHub account',
          hostName: 'github.com',
          user: 'git',
          identityFiles: ['~/.ssh/id_ed25519_personal'],
          identitiesOnly: true,
        }),
        createEmptyHost({
          alias: 'github-work',
          comment: 'Work GitHub (clone via git@github-work:org/repo.git)',
          hostName: 'github.com',
          user: 'git',
          identityFiles: ['~/.ssh/id_ed25519_work'],
          identitiesOnly: true,
        }),
        createEmptyHost({
          alias: 'gitlab.company.com',
          comment: 'Self-hosted GitLab (custom SSH port 2222)',
          hostName: 'gitlab.company.com',
          user: 'git',
          port: '2222',
          identityFiles: ['~/.ssh/id_ed25519_work'],
          identitiesOnly: true,
        }),
        createEmptyHost({
          alias: '*',
          addKeysToAgent: 'yes',
          serverAliveInterval: '60',
        }),
      ],
    }),
  },
  {
    id: 'port-forwarding',
    nameZh: '端口转发与 SOCKS5 代理套件 (-L / -R / -D)',
    nameEn: 'Port Forwarding & SOCKS5 Suite (-L / -R / -D)',
    descZh: '覆盖本地转发访问内网服务 (-L)、远程转发暴露本地开发服务 (-R) 与动态 SOCKS5 代理 (-D)',
    descEn: 'Local forward (-L), reverse/remote webhook tunnel (-R), and SOCKS5 dynamic proxy (-D)',
    build: () => ({
      topIncludes: [],
      hosts: [
        createEmptyHost({
          alias: 'tunnel-local',
          comment: 'LocalForward (-L): Map remote internal DB/Admin UI to localhost',
          hostName: '198.51.100.20',
          user: 'dev',
          identityFiles: ['~/.ssh/id_ed25519'],
          localForwards: [
            {
              bindAddress: '127.0.0.1',
              bindPort: '8080',
              targetHost: '127.0.0.1',
              targetPort: '80',
            },
            {
              bindAddress: '127.0.0.1',
              bindPort: '3307',
              targetHost: '10.10.0.15',
              targetPort: '3306',
            },
          ],
        }),
        createEmptyHost({
          alias: 'tunnel-reverse',
          comment: 'RemoteForward (-R): Expose local localhost:3000 to remote port 9000',
          hostName: '198.51.100.20',
          user: 'dev',
          identityFiles: ['~/.ssh/id_ed25519'],
          remoteForwards: [
            {
              bindAddress: '127.0.0.1',
              bindPort: '9000',
              targetHost: '127.0.0.1',
              targetPort: '3000',
            },
          ],
          gatewayPorts: 'clientspecified',
        }),
        createEmptyHost({
          alias: 'socks-proxy',
          comment: 'DynamicForward (-D): Local SOCKS5 proxy on 127.0.0.1:1080',
          hostName: '198.51.100.20',
          user: 'dev',
          identityFiles: ['~/.ssh/id_ed25519'],
          dynamicForwards: [{ bindAddress: '127.0.0.1', port: '1080' }],
          compression: 'yes',
        }),
      ],
    }),
  },
  {
    id: 'legacy-embedded',
    nameZh: '老旧主机 / 嵌入式设备兼容配置',
    nameEn: 'Legacy Server / Embedded Device',
    descZh: '适配旧版 OpenSSH / 路由器 / 工控设备（启用 ssh-rsa 算法兼容与临时 KnownHosts 忽略）',
    descEn: 'Compatibility profile for older OpenSSH servers, routers, and embedded boards',
    build: () => ({
      topIncludes: [],
      hosts: [
        createEmptyHost({
          alias: 'legacy-box',
          comment: 'Legacy OpenSSH server / embedded Linux device',
          hostName: '192.168.10.50',
          user: 'root',
          port: '22',
          identityFiles: ['~/.ssh/id_rsa'],
          identitiesOnly: true,
          strictHostKeyChecking: 'accept-new',
          extraDirectives: [
            { key: 'HostKeyAlgorithms', value: '+ssh-rsa' },
            { key: 'PubkeyAcceptedAlgorithms', value: '+ssh-rsa' },
          ],
        }),
      ],
    }),
  },
  {
    id: 'blank',
    nameZh: '空白单主机骨架',
    nameEn: 'Blank Host Skeleton',
    descZh: '极简单主机模板，从零自由配置',
    descEn: 'Minimal single-host configuration skeleton',
    build: () => ({
      topIncludes: [],
      hosts: [
        createEmptyHost({
          alias: 'dev-server',
          hostName: '192.168.1.100',
          user: 'ubuntu',
          port: '22',
          identityFiles: ['~/.ssh/id_ed25519'],
          serverAliveInterval: '60',
          serverAliveCountMax: '3',
        }),
      ],
    }),
  },
];
