export type HttpStatusCategory = '1xx' | '2xx' | '3xx' | '4xx' | '5xx';
export type HttpStatusFilter = 'all' | 'common' | HttpStatusCategory | 'unofficial';
export type RetryableKind = 'no' | 'yes' | 'conditional';

export interface HttpStatusItem {
  code: number;
  phrase: string;
  category: HttpStatusCategory;
  isCommon?: boolean;
  isUnofficial?: boolean;
  spec: string;
  cacheable: boolean;
  retryable: RetryableKind;
  relatedHeaders: string[];
  summaryZh: string;
  summaryEn: string;
  detailZh: string;
  detailEn: string;
  causesZh: string[];
  causesEn: string[];
  solutionsZh: string[];
  solutionsEn: string[];
  keywords: string[];
}

export interface StatusAdvisorScenario {
  id: string;
  questionZh: string;
  questionEn: string;
  recommendedCodes: number[];
  noteZh: string;
  noteEn: string;
}

export const HTTP_STATUS_ADVISOR: StatusAdvisorScenario[] = [
  {
    id: 'create',
    questionZh: 'REST API 创建资源成功',
    questionEn: 'REST API created a new resource',
    recommendedCodes: [201, 202],
    noteZh: '同步创建完成返回 201 Created 并附带 Location；异步队列受理则返回 202 Accepted。',
    noteEn: 'Return 201 Created with Location for synchronous creation, or 202 Accepted for async background jobs.'
  },
  {
    id: 'delete-empty',
    questionZh: '更新或删除成功但无需返回体',
    questionEn: 'Update or delete succeeded with no body',
    recommendedCodes: [204, 200],
    noteZh: '无响应体推荐 204 No Content；若返回更新后的实体对象则使用 200 OK。',
    noteEn: 'Use 204 No Content when omitting the response body, or 200 OK if returning the updated representation.'
  },
  {
    id: 'auth',
    questionZh: '未登录 (401) vs 无权限 (403)',
    questionEn: 'Unauthenticated (401) vs Forbidden (403)',
    recommendedCodes: [401, 403],
    noteZh: '未携带凭据、Token 失效或签名错误用 401；已识别身份但角色权限不足用 403。',
    noteEn: 'Use 401 when credentials are missing/expired/invalid; use 403 when authenticated but lacking permission.'
  },
  {
    id: 'validation',
    questionZh: '请求语法错误 (400) vs 业务字段校验失败 (422)',
    questionEn: 'Malformed syntax (400) vs semantic validation (422)',
    recommendedCodes: [400, 422],
    noteZh: 'JSON 解析失败或缺少协议级字段用 400；格式合法但业务校验不通过（如邮箱格式/余额不足）推荐 422。',
    noteEn: 'Use 400 for malformed JSON/syntax; use 422 Unprocessable Content for domain/field validation errors.'
  },
  {
    id: 'redirect',
    questionZh: '重定向时是否保留 POST 方法与请求体',
    questionEn: 'Redirect while preserving POST method & body',
    recommendedCodes: [307, 308, 301, 302],
    noteZh: '301/302 历史原因可能将 POST 转为 GET；需要严格保留原 HTTP 方法与请求体请用 307（临时）或 308（永久）。',
    noteEn: '301/302 may rewrite POST to GET; use 307 (Temporary) or 308 (Permanent) to strictly preserve method and body.'
  },
  {
    id: 'rate-limit',
    questionZh: '触发限流、并发冲突或服务过载',
    questionEn: 'Rate limiting, conflict, or overload',
    recommendedCodes: [429, 409, 503],
    noteZh: '客户端频率超限用 429 + Retry-After；幂等键/版本乐观锁冲突用 409；下游维护或过载降级用 503。',
    noteEn: 'Use 429 (+ Retry-After) for rate limits, 409 for optimistic lock/state conflicts, and 503 for overload/maintenance.'
  }
];

export const QUICK_JUMP_CODES = [200, 201, 204, 301, 304, 307, 400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504];

export const HTTP_STATUS_CODES: HttpStatusItem[] = [
  // ==================== 1xx Informational ====================
  {
    code: 100,
    phrase: 'Continue',
    category: '1xx',
    spec: 'RFC 9110 §15.2.1',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: ['Expect'],
    summaryZh: '继续发送请求主体',
    summaryEn: 'Client should continue sending the request body',
    detailZh: '客户端发送了带有 Expect: 100-continue 的请求头，服务端确认接收请求头后返回 100，通知客户端继续上传较大的请求体。',
    detailEn: 'Indicates the initial part of a request has been received and the client should proceed with sending the remainder (typically after Expect: 100-continue).',
    causesZh: ['大文件上传或 cURL POST 默认携带 Expect: 100-continue 握手头'],
    causesEn: ['Large file uploads or clients like cURL sending Expect: 100-continue'],
    solutionsZh: ['确保反向代理（如 Nginx）正确透传或响应 100 Continue，避免多余等待延迟'],
    solutionsEn: ['Ensure proxies support 100-continue handshake or strip Expect header if unnecessary'],
    keywords: ['expect', 'continue', 'upload', '大文件']
  },
  {
    code: 101,
    phrase: 'Switching Protocols',
    category: '1xx',
    isCommon: true,
    spec: 'RFC 9110 §15.2.2',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['Upgrade', 'Connection', 'Sec-WebSocket-Accept'],
    summaryZh: '同意切换传输协议（如升级为 WebSocket）',
    summaryEn: 'Server agrees to switch protocols (e.g. WebSocket upgrade)',
    detailZh: '服务端接受客户端通过 Upgrade 请求头发起的协议切换请求，常见于 HTTP/1.1 握手升级为 WebSocket 全双工连接。',
    detailEn: 'The server understands and is willing to comply with the client’s Upgrade request, most commonly upgrading HTTP/1.1 to WebSocket.',
    causesZh: ['客户端发起 ws:// / wss:// 握手或 HTTP/2 明文升级'],
    causesEn: ['Client initiated a WebSocket handshake or h2c upgrade'],
    solutionsZh: ['若反代返回 200/400 而非 101，检查 Nginx 是否配置 proxy_set_header Upgrade $http_upgrade 与 Connection "upgrade"'],
    solutionsEn: ['If proxies fail to upgrade, verify Upgrade and Connection headers are forwarded'],
    keywords: ['websocket', 'ws', 'wss', 'upgrade', '握手', '协议切换']
  },
  {
    code: 102,
    phrase: 'Processing',
    category: '1xx',
    spec: 'RFC 2518 (WebDAV, Obsolete)',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: [],
    summaryZh: '请求已接收并正在耗时处理中（WebDAV）',
    summaryEn: 'Server has received and is processing the request (WebDAV)',
    detailZh: '用于 WebDAV 等包含大量子请求的耗时操作，提前告知客户端不要因超时而中断连接。在现代 HTTP 中已较少使用。',
    detailEn: 'Used in WebDAV when a request contains many sub-requests taking a long time, preventing client timeout.',
    causesZh: ['WebDAV 批量文件操作耗时较长'],
    causesEn: ['Long-running WebDAV batch operations'],
    solutionsZh: ['现代 API 推荐使用 202 Accepted 配合轮询或 Webhook/SSE 替代'],
    solutionsEn: ['Prefer 202 Accepted with polling, SSE, or webhooks in modern APIs'],
    keywords: ['webdav', 'processing']
  },
  {
    code: 103,
    phrase: 'Early Hints',
    category: '1xx',
    spec: 'RFC 8297',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: ['Link'],
    summaryZh: '提前返回预加载资源提示（Link Preload）',
    summaryEn: 'Preload hints sent before the final HTTP response',
    detailZh: '允许服务器在生成最终 HTML 响应之前先行发送 Link: <...>; rel=preload 响应头，让浏览器提前并行拉取关键 CSS/JS/字体资源，显著优化 LCP。',
    detailEn: 'Allows the server to send Link preload/preconnect headers while still preparing the final response, improving page load performance.',
    causesZh: ['CDN（如 Cloudflare）或支持 Early Hints 的边缘网关开启了资源预加载'],
    causesEn: ['Edge/CDN or origin server enabled HTTP 103 Early Hints'],
    solutionsZh: ['仅对关键首屏静态资源下发 preload 提示，并确保最终响应中携带完整头信息'],
    solutionsEn: ['Include critical render-blocking assets in Link headers and repeat them if needed in the final response'],
    keywords: ['preload', 'early hints', 'lcp', '性能优化', '预加载']
  },

  // ==================== 2xx Success ====================
  {
    code: 200,
    phrase: 'OK',
    category: '2xx',
    isCommon: true,
    spec: 'RFC 9110 §15.3.1',
    cacheable: true,
    retryable: 'yes',
    relatedHeaders: ['Content-Type', 'Cache-Control', 'ETag'],
    summaryZh: '请求成功，返回响应数据',
    summaryEn: 'Request succeeded with response payload',
    detailZh: '最标准的成功状态码。GET 返回目标资源，HEAD 仅返回响应头，POST/PUT/PATCH 返回处理结果实体。',
    detailEn: 'Standard response for successful HTTP requests. The actual payload depends on the request method (GET, HEAD, POST, etc.).',
    causesZh: ['接口或静态资源正常响应完成'],
    causesEn: ['Normal successful request execution'],
    solutionsZh: ['GET 响应可配合 Cache-Control 与 ETag 启用强缓存/协商缓存提升性能'],
    solutionsEn: ['Pair GET 200 responses with Cache-Control and ETag for efficient caching'],
    keywords: ['ok', 'success', '成功', '正常']
  },
  {
    code: 201,
    phrase: 'Created',
    category: '2xx',
    isCommon: true,
    spec: 'RFC 9110 §15.3.2',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['Location', 'ETag'],
    summaryZh: '请求成功并创建了新资源',
    summaryEn: 'Request succeeded and a new resource was created',
    detailZh: '通常用于 POST（或创建型 PUT）接口，表示服务器端已成功落库或生成新资源。最佳实践是在响应头中附带指向新资源 URI 的 Location 头。',
    detailEn: 'Indicates the request succeeded and led to the creation of one or more new resources. Best returned with a Location header pointing to the new resource.',
    causesZh: ['POST 创建用户、订单、文章或上传新对象成功'],
    causesEn: ['Successful POST creation or PUT upsert of a new resource'],
    solutionsZh: ['建议在响应头返回 Location: /api/items/{id}，并在响应体返回创建后的完整对象'],
    solutionsEn: ['Include a Location header pointing to the newly created resource URI'],
    keywords: ['created', 'post', '新建', '创建成功']
  },
  {
    code: 202,
    phrase: 'Accepted',
    category: '2xx',
    isCommon: true,
    spec: 'RFC 9110 §15.3.3',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['Location', 'Retry-After'],
    summaryZh: '请求已受理，但仍在异步后台处理中',
    summaryEn: 'Request accepted for asynchronous processing, not yet completed',
    detailZh: '表示请求参数合法且已进入后台队列或异步工作流，但最终执行结果尚未出炉（可能成功也可能失败）。',
    detailEn: 'The request has been accepted for processing, but processing has not been completed. Useful for async queues and batch jobs.',
    causesZh: ['视频转码、报表导出、AI 批量生成、异步支付回调等长耗时任务'],
    causesEn: ['Async background jobs, batch exports, webhooks, or queued pipelines'],
    solutionsZh: ['返回任务 ID（如 job_id）及状态查询链接（Location），便于前端轮询结果'],
    solutionsEn: ['Return a task/job ID and status polling endpoint in the body or Location header'],
    keywords: ['accepted', 'async', 'queue', '异步', '队列', '受理']
  },
  {
    code: 203,
    phrase: 'Non-Authoritative Information',
    category: '2xx',
    spec: 'RFC 9110 §15.3.4',
    cacheable: true,
    retryable: 'yes',
    relatedHeaders: ['Content-Type'],
    summaryZh: '请求成功，但响应内容经过了代理转换或修改',
    summaryEn: 'Success, but payload was modified by a transforming proxy',
    detailZh: '返回的状态码和元信息并非直接来自原始源站，而是由中间转换代理（如内容压缩、协议镜像或本地 Mock 网关）修改或缓存后提供。',
    detailEn: 'Indicates the request succeeded, but the enclosed payload has been modified from the origin server’s 200 OK response by a transforming proxy.',
    causesZh: ['中间代理改写了响应头或压缩/转码了内容'],
    causesEn: ['Transforming proxy altered payload or headers'],
    solutionsZh: ['调试真实源站数据时可检查是否经过了中间网关或 CDN 转换'],
    solutionsEn: ['Inspect proxy/CDN transformation rules if unexpected payload modifications occur'],
    keywords: ['proxy', 'mirror', '非权威']
  },
  {
    code: 204,
    phrase: 'No Content',
    category: '2xx',
    isCommon: true,
    spec: 'RFC 9110 §15.3.5',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: ['Access-Control-Allow-Methods', 'ETag'],
    summaryZh: '处理成功，且无任何响应体返回',
    summaryEn: 'Request succeeded with no content in response body',
    detailZh: '服务器成功处理请求且不需要返回任何实体内容。常用于 DELETE 删除成功、PUT 保存更新、CORS 预检请求（OPTIONS）及心跳上报。',
    detailEn: 'The server successfully processed the request and is not returning any content. Common for DELETE, CORS preflight OPTIONS, and telemetry beacons.',
    causesZh: ['DELETE 删除资源、OPTIONS 跨域预检成功、表单静默保存'],
    causesEn: ['DELETE endpoints, CORS preflight OPTIONS responses, save without body'],
    solutionsZh: ['注意前端 fetch() 收到 204 时不要直接调用 response.json()，否则会抛出解析空体错误'],
    solutionsEn: ['Do not return a message body with 204; on the client, avoid calling response.json() on 204 responses'],
    keywords: ['no content', 'delete', 'options', 'cors', '无内容', '删除']
  },
  {
    code: 205,
    phrase: 'Reset Content',
    category: '2xx',
    spec: 'RFC 9110 §15.3.6',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: [],
    summaryZh: '处理成功，要求客户端重置当前表单或文档视图',
    summaryEn: 'Success; client should reset the document view / form',
    detailZh: '与 204 类似均不返回消息体，但额外指示客户端清空/重置发起请求的表单或输入界面以便进行下一轮录入。',
    detailEn: 'Like 204, returns no body, and additionally instructs the user agent to reset the document view or form that sent the request.',
    causesZh: ['连续数据录入场景提交表单后重置输入状态'],
    causesEn: ['Multi-entry form submission requiring UI reset'],
    solutionsZh: ['确保不返回响应体，并在前端逻辑中配合清空表单状态'],
    solutionsEn: ['Must not include a message body; handle form reset in client logic'],
    keywords: ['reset', 'form', '重置表单']
  },
  {
    code: 206,
    phrase: 'Partial Content',
    category: '2xx',
    isCommon: true,
    spec: 'RFC 9110 §15.3.7',
    cacheable: true,
    retryable: 'yes',
    relatedHeaders: ['Content-Range', 'Accept-Ranges', 'Range'],
    summaryZh: '成功返回分片/断点续传的部分内容',
    summaryEn: 'Server is delivering part of the resource due to a Range header',
    detailZh: '客户端通过 Range: bytes=0-1023 请求特定字节区间时返回的部分数据响应，广泛应用于音视频拖拽播放（Seek）与大文件多线程/断点续传下载。',
    detailEn: 'Returned in response to a Range header request, delivering only the requested byte slice. Essential for video streaming seeking and resumable downloads.',
    causesZh: ['浏览器播放 <video>/<audio> 分段拉取或下载工具分块下载'],
    causesEn: ['Media streaming seek requests or multi-part / resumable file downloads'],
    solutionsZh: ['服务端需正确返回 Content-Range: bytes start-end/total 与 Accept-Ranges: bytes'],
    solutionsEn: ['Include accurate Content-Range and Accept-Ranges headers'],
    keywords: ['range', 'video', 'stream', '断点续传', '分片', '视频播放']
  },
  {
    code: 207,
    phrase: 'Multi-Status',
    category: '2xx',
    spec: 'RFC 4918 (WebDAV)',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['Content-Type'],
    summaryZh: '多状态响应，汇总批量子操作的各自状态（WebDAV）',
    summaryEn: 'Conveys status for multiple independent sub-operations (WebDAV)',
    detailZh: '在单次批量请求包含多个子资源操作（部分成功、部分失败）时，使用 XML/JSON 消息体分别汇报每个子项的状态码。',
    detailEn: 'Provides status information for multiple independent operations where some sub-operations may succeed and others fail.',
    causesZh: ['WebDAV PROPFIND 或批量 API 部分成功响应'],
    causesEn: ['WebDAV requests or bulk API endpoints returning per-item statuses'],
    solutionsZh: ['在响应体中清晰列出每个子项的 ID、状态码与错误信息'],
    solutionsEn: ['Include structured per-item status codes and error details in the response body'],
    keywords: ['webdav', 'batch', 'multi-status', '批量']
  },
  {
    code: 208,
    phrase: 'Already Reported',
    category: '2xx',
    spec: 'RFC 5842 (WebDAV)',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: [],
    summaryZh: '同一集合绑定成员已在响应中报告过（WebDAV）',
    summaryEn: 'Collection members already enumerated earlier in Multi-Status',
    detailZh: '用于 WebDAV DAV:propstat 响应内部，避免在存在循环符号链接或多重绑定时重复输出同一资源的属性集合。',
    detailEn: 'Used inside a 207 Multi-Status response to avoid repeatedly enumerating internal members of multiple bindings to the same collection.',
    causesZh: ['WebDAV 集合存在多重绑定或循环引用'],
    causesEn: ['WebDAV collection with multiple bindings'],
    solutionsZh: ['仅在实现 WebDAV Binding 协议时使用'],
    solutionsEn: ['Applicable only to WebDAV binding implementations'],
    keywords: ['webdav', 'binding']
  },
  {
    code: 226,
    phrase: 'IM Used',
    category: '2xx',
    spec: 'RFC 3229',
    cacheable: true,
    retryable: 'yes',
    relatedHeaders: ['IM', 'A-IM'],
    summaryZh: '已对资源应用增量编码（Delta Encoding）返回结果',
    summaryEn: 'Response represents the result of one or more instance-manipulations',
    detailZh: '服务器已完成对资源的 GET 请求，并且响应是通过客户端 A-IM 头请求的增量/差异算法处理后的结果。',
    detailEn: 'The server has fulfilled a GET request and the response represents the result of one or more instance-manipulations applied to the current instance.',
    causesZh: ['HTTP Delta Encoding 增量同步场景'],
    causesEn: ['HTTP Delta Encoding responses'],
    solutionsZh: ['现代应用通常采用 ETag + Patch 或 GraphQL/增量 API 替代'],
    solutionsEn: ['Modern apps typically use ETag or explicit delta sync APIs'],
    keywords: ['delta', 'im used']
  },

  // ==================== 3xx Redirection ====================
  {
    code: 300,
    phrase: 'Multiple Choices',
    category: '3xx',
    spec: 'RFC 9110 §15.4.1',
    cacheable: true,
    retryable: 'yes',
    relatedHeaders: ['Location'],
    summaryZh: '目标资源存在多种可选表现形式（如多语言/多格式）',
    summaryEn: 'Request has more than one possible response representation',
    detailZh: '资源有多种匹配版本（例如不同语言、编码或分辨率），无法自动唯一决定，由客户端或用户自行选择其中一个。',
    detailEn: 'The target resource has more than one representation, each with its own specific location, and agent-driven negotiation is needed.',
    causesZh: ['内容协商存在多个候选版本且无默认偏好'],
    causesEn: ['Multiple candidate representations during content negotiation'],
    solutionsZh: ['一般建议服务端根据 Accept / Accept-Language 自动选择其一或提供明确 Location'],
    solutionsEn: ['Prefer server-driven negotiation or return a canonical redirect'],
    keywords: ['multiple', 'negotiation', '多选']
  },
  {
    code: 301,
    phrase: 'Moved Permanently',
    category: '3xx',
    isCommon: true,
    spec: 'RFC 9110 §15.4.2',
    cacheable: true,
    retryable: 'yes',
    relatedHeaders: ['Location', 'Cache-Control'],
    summaryZh: '永久重定向（搜索引擎会更新索引权重至新 URL）',
    summaryEn: 'Resource permanently moved to a new URI (SEO-friendly)',
    detailZh: '请求的资源已永久迁移至 Location 指定的新地址。浏览器会长期缓存该跳转，搜索引擎也会将原 URL 权重转移给新 URL。注意部分旧客户端会将 POST 转为 GET。',
    detailEn: 'The target resource has been assigned a new permanent URI. Browsers cache 301 aggressively and search engines transfer SEO rank. Note: POST may be converted to GET.',
    causesZh: ['HTTP 强制跳转 HTTPS、域名更换（www 跳转）、网站改版永久 URL 迁移'],
    causesEn: ['HTTP→HTTPS redirect, domain migration, permanent URL restructuring'],
    solutionsZh: ['若为非 GET 请求且需保持 POST 方法与请求体不变，请改用 308 Permanent Redirect；调试阶段慎用 301 以防浏览器强缓存跳转'],
    solutionsEn: ['Use 308 if HTTP method and body must be preserved; avoid 301 during temporary testing due to aggressive browser caching'],
    keywords: ['redirect', 'permanent', 'seo', 'https', '永久重定向', '跳转']
  },
  {
    code: 302,
    phrase: 'Found',
    category: '3xx',
    isCommon: true,
    spec: 'RFC 9110 §15.4.3',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: ['Location'],
    summaryZh: '临时重定向（原 URL 保留，常用于登录鉴权跳转）',
    summaryEn: 'Resource temporarily resides under a different URI',
    detailZh: '目标资源临时位于 Location 指定的新地址。不会转移 SEO 权重且默认不永久缓存。历史上浏览器常将 302 后的 POST 改为 GET。',
    detailEn: 'The target resource resides temporarily under a different URI. Commonly used for OAuth / SSO login redirects. Clients often rewrite POST to GET.',
    causesZh: ['OAuth2 / SSO 登录跳转、临时维护页、短链统计跳转'],
    causesEn: ['OAuth2 / SSO login redirects, temporary maintenance pages'],
    solutionsZh: ['在现代 REST/表单提交中，若明确希望 POST→GET 请用 303，若希望保持 POST 方法请用 307'],
    solutionsEn: ['Prefer 303 for explicit POST-to-GET or 307 to preserve the original method'],
    keywords: ['redirect', 'temporary', 'oauth', 'login', '临时重定向', '跳转']
  },
  {
    code: 303,
    phrase: 'See Other',
    category: '3xx',
    spec: 'RFC 9110 §15.4.4',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: ['Location'],
    summaryZh: '重定向并强制使用 GET 获取目标资源（PRG 模式）',
    summaryEn: 'Redirect client to retrieve another URI using GET',
    detailZh: '通常在 POST/PUT/DELETE 提交完成后返回，指示浏览器务必使用 GET 请求跳转到结果展示页（Post/Redirect/Get 模式），防止用户刷新页面导致重复提交。',
    detailEn: 'Directs the client to redirect to the Location URI using GET, implementing the Post/Redirect/Get (PRG) pattern to prevent duplicate form submissions.',
    causesZh: ['表单提交或异步任务提交后跳转至结果详情页'],
    causesEn: ['After POST form submission to redirect to a confirmation page via GET'],
    solutionsZh: ['需要避免 F5 刷新重复提交表单时，303 是最标准的语义状态码'],
    solutionsEn: ['Ideal for Post/Redirect/Get workflows'],
    keywords: ['prg', 'post', 'get', 'see other', '防重复提交']
  },
  {
    code: 304,
    phrase: 'Not Modified',
    category: '3xx',
    isCommon: true,
    spec: 'RFC 9110 §15.4.5',
    cacheable: true,
    retryable: 'yes',
    relatedHeaders: ['ETag', 'Last-Modified', 'If-None-Match', 'If-Modified-Since', 'Cache-Control'],
    summaryZh: '协商缓存命中：资源未修改，直接复用本地缓存',
    summaryEn: 'Cached resource has not changed; client can reuse local copy',
    detailZh: '客户端发送了带 If-None-Match (ETag) 或 If-Modified-Since 的条件请求，服务端校验资源未发生变化，返回无消息体的 304 通知客户端复用本地缓存，节省带宽。',
    detailEn: 'Indicates the cached version held by the client is still valid based on conditional headers (If-None-Match / If-Modified-Since), saving bandwidth by omitting the body.',
    causesZh: ['浏览器刷新页面或静默请求静态 JS/CSS/API 数据时命中 ETag / Last-Modified'],
    causesEn: ['Conditional GET request matched server ETag or Last-Modified timestamp'],
    solutionsZh: ['304 属于正常优化状态而非错误；若发现旧数据未刷新，检查服务端 ETag 生成逻辑或 Cache-Control 策略'],
    solutionsEn: ['304 is a healthy cache hit; if stale data persists, verify server ETag/Last-Modified invalidation'],
    keywords: ['cache', 'etag', 'not modified', '协商缓存', '缓存']
  },
  {
    code: 307,
    phrase: 'Temporary Redirect',
    category: '3xx',
    isCommon: true,
    spec: 'RFC 9110 §15.4.8',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: ['Location'],
    summaryZh: '临时重定向，且严格保持原 HTTP 方法与请求体不变',
    summaryEn: 'Temporary redirect preserving original HTTP method and body',
    detailZh: '与 302 语义类似（临时跳转），但 RFC 严格规定客户端在跟随 Location 重定向时不得修改原始 HTTP 方法和请求体（POST 仍为 POST）。',
    detailEn: 'Similar to 302, but strictly requires the client not to change the HTTP method or body when following the redirect (POST stays POST).',
    causesZh: ['API 网关临时路由切换、HSTS 内部预重定向或 POST 接口临时迁移'],
    causesEn: ['Temporary API endpoint redirect or browser HSTS internal redirect'],
    solutionsZh: ['注意浏览器出现 "307 Internal Redirect" 通常是 HSTS 强制将 http:// 转为 https://'],
    solutionsEn: ['In Chrome DevTools, "307 Internal Redirect" indicates local HSTS upgrading HTTP to HTTPS'],
    keywords: ['temporary', 'hsts', 'preserve method', '临时重定向']
  },
  {
    code: 308,
    phrase: 'Permanent Redirect',
    category: '3xx',
    isCommon: true,
    spec: 'RFC 9110 §15.4.9',
    cacheable: true,
    retryable: 'yes',
    relatedHeaders: ['Location'],
    summaryZh: '永久重定向，且严格保持原 HTTP 方法与请求体不变',
    summaryEn: 'Permanent redirect preserving original HTTP method and body',
    detailZh: '301 的现代严格版本：表示资源已永久迁移至新 URI，同时保证客户端不会将 POST/PUT/DELETE 改写为 GET。',
    detailEn: 'The strict counterpart to 301: resource is permanently moved, and clients must keep the original HTTP method and body.',
    causesZh: ['API 版本永久升级迁移、Webhook 回调域名永久变更'],
    causesEn: ['Permanent API endpoint migration where POST/PUT payloads must be preserved'],
    solutionsZh: ['对外提供 API 或 Webhook 迁移时优先使用 308 替代 301'],
    solutionsEn: ['Prefer 308 over 301 for permanent API or webhook redirects'],
    keywords: ['permanent', 'preserve method', 'api', '永久重定向']
  },

  // ==================== 4xx Client Error ====================
  {
    code: 400,
    phrase: 'Bad Request',
    category: '4xx',
    isCommon: true,
    spec: 'RFC 9110 §15.5.1',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['Content-Type'],
    summaryZh: '请求语法错误、参数格式非法或报文无法解析',
    summaryEn: 'Server cannot process the request due to client syntax/format error',
    detailZh: '表示客户端发送了畸形请求，例如 JSON 语法损坏、缺失必要查询参数、Header 超大或编码非法，服务端在进入业务逻辑前即拒绝。',
    detailEn: 'The server cannot or will not process the request due to malformed syntax, invalid JSON, oversized headers, or deceptive request routing.',
    causesZh: [
      'JSON 请求体缺少引号/逗号或 Content-Type 未设置为 application/json',
      '请求头 / Cookie 体积超过 Nginx client_header_buffer_size 限制',
      'HTTP 请求被错误地发送到了 HTTPS 端口（如 Nginx 400 The plain HTTP request was sent to HTTPS port）'
    ],
    causesEn: [
      'Malformed JSON payload or missing Content-Type: application/json header',
      'Oversized cookies or request headers exceeding server buffer limits',
      'Plain HTTP traffic sent to an HTTPS TLS port'
    ],
    solutionsZh: [
      '校验请求体 JSON 格式与 Content-Type；',
      '排查是否携带了过大的 Cookie 或无效 URL 编码字符'
    ],
    solutionsEn: [
      'Validate JSON syntax, URL encoding, and Content-Type header',
      'Check for oversized Cookie headers or HTTP-on-HTTPS mismatch'
    ],
    keywords: ['bad request', 'json', 'syntax', 'cookie', '参数错误', '请求错误']
  },
  {
    code: 401,
    phrase: 'Unauthorized',
    category: '4xx',
    isCommon: true,
    spec: 'RFC 9110 §15.5.2',
    cacheable: false,
    retryable: 'conditional',
    relatedHeaders: ['WWW-Authenticate', 'Authorization'],
    summaryZh: '未认证 / 登录凭据缺失或已过期（需要身份验证）',
    summaryEn: 'Authentication is required or provided credentials are invalid/expired',
    detailZh: '虽命名为 Unauthorized，但语义上实际是“未认证（Unauthenticated）”——请求未携带有效身份凭据（如 Bearer JWT、Session Cookie、Basic Auth），或者 Token 已过期。',
    detailEn: 'Despite the name "Unauthorized", semantically it means "Unauthenticated": valid authentication credentials are missing, expired, or invalid.',
    causesZh: [
      '未传递 Authorization: Bearer <token> 请求头',
      'JWT Access Token 已过期或签名密钥不匹配',
      '跨域请求未设置 credentials: "include" 导致 Cookie 丢失'
    ],
    causesEn: [
      'Missing Authorization header or session cookie',
      'Expired JWT token or invalid signature',
      'CORS request missing credentials: include'
    ],
    solutionsZh: [
      '前端拦截 401 自动触发 Refresh Token 续期或跳转登录页；',
      '服务端按规范在响应头返回 WWW-Authenticate 标明认证方案'
    ],
    solutionsEn: [
      'Refresh expired tokens or redirect user to login flow',
      'Include a WWW-Authenticate header indicating the expected auth scheme'
    ],
    keywords: ['unauthorized', 'auth', 'jwt', 'token', 'login', '401', '未登录', '过期', '鉴权']
  },
  {
    code: 402,
    phrase: 'Payment Required',
    category: '4xx',
    spec: 'RFC 9110 §15.5.3',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: [],
    summaryZh: '保留状态码，常用于余额不足、配额耗尽或付费墙提示',
    summaryEn: 'Reserved for future use; commonly used for billing/quota limits',
    detailZh: 'RFC 早期保留状态码。如今被 Stripe、OpenAI、SaaS API 广泛用于表示“账户余额不足 / 订阅已到期 / API 额度耗尽”。',
    detailEn: 'Originally reserved for digital payment systems; widely adopted by modern SaaS and AI APIs to indicate exhausted credits, unpaid invoices, or billing limits.',
    causesZh: ['API 账户欠费、月度 Token/调用配额已用完或未订阅付费套餐'],
    causesEn: ['Insufficient account balance, expired subscription, or exceeded billing quota'],
    solutionsZh: ['检查账单余额、配额套餐或升级付费计划'],
    solutionsEn: ['Check billing status, top up credits, or upgrade subscription plan'],
    keywords: ['payment', 'billing', 'quota', '余额不足', '欠费', '付费']
  },
  {
    code: 403,
    phrase: 'Forbidden',
    category: '4xx',
    isCommon: true,
    spec: 'RFC 9110 §15.5.4',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: [],
    summaryZh: '已识别身份或无需登录，但服务器明确拒绝访问（无权限）',
    summaryEn: 'Server understood the request but refuses to authorize it',
    detailZh: '与 401 不同，重新登录通常也无法解决 403：服务器知道你是谁（或策略明确禁止），但你的角色权限不足、IP 被 WAF 拦截、CSRF 校验失败或目录禁止列出。',
    detailEn: 'Unlike 401, re-authenticating makes no difference: the client lacks sufficient permissions, or access is blocked by WAF, IP allowlist, CORS, or file permissions.',
    causesZh: [
      '当前登录用户缺少 RBAC 角色权限或试图越权访问他人数据',
      'Nginx / Apache 目录缺少 index.html 且关闭了 autoindex，或文件权限不足',
      '触发 Cloudflare / WAF 防火墙规则、User-Agent 拦截或 CSRF Token 校验失败'
    ],
    causesEn: [
      'Insufficient user/role permissions (RBAC) or missing CSRF token',
      'Web server directory permissions or missing index file',
      'Blocked by WAF, IP allowlist, or anti-bot rules'
    ],
    solutionsZh: [
      '核对角色权限配置与资源归属校验；',
      '若是静态站点 403，检查 Nginx root 目录权限（chmod/chown）及 index 配置'
    ],
    solutionsEn: [
      'Verify user permissions/scopes and CSRF token headers',
      'For static servers, verify filesystem permissions and index directive'
    ],
    keywords: ['forbidden', 'permission', 'waf', 'csrf', 'rbac', '无权限', '禁止访问']
  },
  {
    code: 404,
    phrase: 'Not Found',
    category: '4xx',
    isCommon: true,
    spec: 'RFC 9110 §15.5.5',
    cacheable: true,
    retryable: 'no',
    relatedHeaders: [],
    summaryZh: '请求的资源或路由不存在',
    summaryEn: 'Requested resource could not be found on the server',
    detailZh: '服务器无法找到与请求 URI 匹配的路由或资源文件。有时为了防止暴露敏感资源的存在性（防枚举），服务端也会故意对无权限资源返回 404 替代 403。',
    detailEn: 'The origin server did not find a current representation for the target resource. Sometimes returned intentionally instead of 403 to hide resource existence.',
    causesZh: [
      'URL 路径拼写错误、接口版本前缀缺失或记录已被删除',
      'Vue/React SPA 单页应用刷新子路由时 Nginx 未配置 try_files $uri $uri/ /index.html',
      '反向代理 proxy_pass 末尾斜杠配置不当导致路径拼接错位'
    ],
    causesEn: [
      'Typo in URL path, deleted entity, or wrong API version prefix',
      'SPA history-mode routing missing try_files fallback to index.html',
      'Misconfigured reverse proxy path stripping/trailing slash'
    ],
    solutionsZh: [
      '核对请求路径与路由前缀；',
      'SPA 部署添加 try_files $uri $uri/ /index.html; 回退规则'
    ],
    solutionsEn: [
      'Check route path and proxy_pass URI mapping',
      'Configure try_files fallback to index.html for SPA apps'
    ],
    keywords: ['not found', '404', 'spa', 'try_files', '找不到', '不存在']
  },
  {
    code: 405,
    phrase: 'Method Not Allowed',
    category: '4xx',
    isCommon: true,
    spec: 'RFC 9110 §15.5.6',
    cacheable: true,
    retryable: 'no',
    relatedHeaders: ['Allow'],
    summaryZh: '请求的 HTTP 方法（GET/POST/PUT 等）不被该路由允许',
    summaryEn: 'Target resource does not support the HTTP request method',
    detailZh: '路由本身存在，但不支持当前使用的 HTTP 请求动词（例如向只支持 POST 的登录接口发送了 GET，或向静态文件服务器发送了 POST）。',
    detailEn: 'The route exists, but the HTTP method used (e.g. GET instead of POST) is not supported. The server must include an Allow header listing supported methods.',
    causesZh: [
      '前端请求方法写错（如 PUT 写成 POST）',
      '接口路径末尾多/少斜杠被网关路由到静态资源处理',
      'CORS 预检 OPTIONS 请求未被后端或网关正确放行'
    ],
    causesEn: [
      'Wrong HTTP verb used by the client',
      'CORS OPTIONS preflight hitting a strict route without OPTIONS handler'
    ],
    solutionsZh: [
      '查看响应头中的 Allow 字段确认支持的方法列表；',
      '确保网关/后端正确处理 OPTIONS 预检请求'
    ],
    solutionsEn: ['Inspect the Allow response header and verify the HTTP method matches API spec'],
    keywords: ['method', 'allow', 'post', 'get', 'options', '方法不允许']
  },
  {
    code: 406,
    phrase: 'Not Acceptable',
    category: '4xx',
    spec: 'RFC 9110 §15.5.7',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['Accept', 'Accept-Language', 'Accept-Encoding'],
    summaryZh: '服务端无法提供满足客户端 Accept 协商头要求的响应格式',
    summaryEn: 'Server cannot produce a response matching client Accept headers',
    detailZh: '客户端通过 Accept / Accept-Language 等请求头指定了期望的数据格式（例如 Accept: application/xml），但服务端仅能返回 application/json 且不接受妥协。',
    detailEn: 'The target resource does not have a representation acceptable according to the proactive negotiation headers (Accept, Accept-Language) sent by the client.',
    causesZh: ['客户端 Accept 头过于严格（如缺少 */* 兜底）或后端序列化器缺失对应格式支持'],
    causesEn: ['Overly strict Accept header or unsupported media type requested'],
    solutionsZh: ['检查请求头 Accept 是否与后端接口支持的 Content-Type 一致'],
    solutionsEn: ['Align client Accept header with supported server media types'],
    keywords: ['accept', 'negotiation', '内容协商']
  },
  {
    code: 407,
    phrase: 'Proxy Authentication Required',
    category: '4xx',
    spec: 'RFC 9110 §15.5.8',
    cacheable: false,
    retryable: 'conditional',
    relatedHeaders: ['Proxy-Authenticate', 'Proxy-Authorization'],
    summaryZh: '需要先通过 HTTP 代理服务器的身份认证',
    summaryEn: 'Client must first authenticate itself with the proxy',
    detailZh: '与 401 类似，但认证对象是客户端与目标服务器之间的正向网络代理（如企业内网代理或付费 IP 代理池），而非源站本身。',
    detailEn: 'Similar to 401, except authentication must be performed with an intermediary HTTP proxy rather than the origin server.',
    causesZh: ['使用了需要账密认证的企业 HTTP/HTTPS 代理但未配置 Proxy-Authorization'],
    causesEn: ['Missing or invalid Proxy-Authorization credentials for corporate/upstream proxy'],
    solutionsZh: ['在代理 URL 中携带用户名密码或检查环境代理配置（HTTP_PROXY/HTTPS_PROXY）'],
    solutionsEn: ['Provide valid proxy credentials or verify HTTP_PROXY / HTTPS_PROXY environment variables'],
    keywords: ['proxy', 'auth', '代理认证']
  },
  {
    code: 408,
    phrase: 'Request Timeout',
    category: '4xx',
    isCommon: true,
    spec: 'RFC 9110 §15.5.9',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: ['Connection'],
    summaryZh: '客户端发送完整请求耗时过长，服务器主动关闭等待',
    summaryEn: 'Server timed out waiting for the complete request from client',
    detailZh: '服务器在空闲等待超时时间内未收到客户端发送的完整请求报文（与 504 区分：408 是客户端发请求太慢或连接空闲超时，504 是后端上游响应太慢）。',
    detailEn: 'The server did not receive a complete request message within the time it was prepared to wait (unlike 504, which is upstream response timeout).',
    causesZh: ['弱网环境下大文件上传中断、TCP 复用了已半开的 Keep-Alive 连接'],
    causesEn: ['Slow client upload on unstable network or stale Keep-Alive connection reuse'],
    solutionsZh: ['可安全重连重试；上传大文件建议改用分片上传（Multipart / Tus）'],
    solutionsEn: ['Safe to retry on a fresh connection; use chunked uploads for large files'],
    keywords: ['timeout', 'keep-alive', '请求超时']
  },
  {
    code: 409,
    phrase: 'Conflict',
    category: '4xx',
    isCommon: true,
    spec: 'RFC 9110 §15.5.10',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['ETag'],
    summaryZh: '请求与目标资源的当前状态存在冲突',
    summaryEn: 'Request conflicts with the current state of the target resource',
    detailZh: '常见于唯一索引重复创建（如邮箱/用户名已注册）、乐观锁版本号/ETag 冲突（多人同时编辑同一文档），或业务状态机不允许当前流转。',
    detailEn: 'Occurs when an operation cannot proceed due to conflicting state—such as duplicate unique keys, optimistic locking/ETag mismatch, or invalid state transitions.',
    causesZh: [
      '注册用户名/邮箱已存在或重复提交相同业务单号',
      '并发更新数据时版本号（version / If-Match ETag）已过期',
      'Git 合并冲突或已取消订单再次支付'
    ],
    causesEn: [
      'Unique constraint violation (email/username already exists)',
      'Optimistic lock / version conflict during concurrent updates',
      'Invalid workflow state transition'
    ],
    solutionsZh: ['拉取最新资源状态合并变更后重试，或向用户明确提示具体冲突字段'],
    solutionsEn: ['Fetch the latest resource state, resolve conflicts, or prompt user with specific field error'],
    keywords: ['conflict', 'duplicate', 'optimistic lock', '唯一约束', '冲突', '重复']
  },
  {
    code: 410,
    phrase: 'Gone',
    category: '4xx',
    spec: 'RFC 9110 §15.5.11',
    cacheable: true,
    retryable: 'no',
    relatedHeaders: [],
    summaryZh: '目标资源已被永久删除且不再可用',
    summaryEn: 'Resource is permanently deleted and will not be available again',
    detailZh: '比 404 更明确的语义：资源不仅当前不存在，而且是“有意且永久地移除了”，建议客户端和搜索引擎清除本地引用与索引。',
    detailEn: 'Indicates the target resource is no longer available at the origin server and that this condition is likely to be permanent.',
    causesZh: ['已下线的旧版 API、限时促销活动页永久关闭、分享链接已销毁'],
    causesEn: ['Retired API versions, permanently deleted content, or expired one-time links'],
    solutionsZh: ['若希望未来可能恢复或不确定原因请用 404；确认永久下线且不重定向时用 410'],
    solutionsEn: ['Use 410 when intentionally decommissioned with no forwarding address'],
    keywords: ['gone', 'deleted', 'seo', '永久删除', '已下线']
  },
  {
    code: 411,
    phrase: 'Length Required',
    category: '4xx',
    spec: 'RFC 9110 §15.5.12',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['Content-Length', 'Transfer-Encoding'],
    summaryZh: '服务端要求请求必须携带有效的 Content-Length 头',
    summaryEn: 'Server refuses request without a defined Content-Length header',
    detailZh: '部分服务器或网关在接收 POST/PUT 请求时禁止分块传输或未知长度请求体，要求显式声明 Content-Length。',
    detailEn: 'The server refuses to accept the request without a defined Content-Length header.',
    causesZh: ['手动构造 HTTP 请求未计算 Content-Length，或上游不支持 chunked 传输'],
    causesEn: ['Missing Content-Length header on POST/PUT or proxy rejecting chunked encoding'],
    solutionsZh: ['在客户端显式计算并设置 Content-Length，或改用标准 HTTP 客户端库'],
    solutionsEn: ['Explicitly set Content-Length or buffer the request body before sending'],
    keywords: ['content-length', 'chunked', '长度']
  },
  {
    code: 412,
    phrase: 'Precondition Failed',
    category: '4xx',
    spec: 'RFC 9110 §15.5.13',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['If-Match', 'If-Unmodified-Since', 'ETag'],
    summaryZh: '客户端请求头中的条件前提（如 If-Match）未满足',
    summaryEn: 'One or more precondition headers evaluated to false on the server',
    detailZh: '用于并发控制与乐观锁：客户端在 PUT/PATCH 时携带 If-Match: "etag-v1"，若服务端当前版本已变为 "etag-v2"，则返回 412 阻止覆盖他人修改。',
    detailEn: 'Returned when a conditional request header such as If-Match or If-Unmodified-Since fails, preventing lost updates in optimistic concurrency control.',
    causesZh: ['并发更新资源时携带的 ETag 与服务端最新版本不一致'],
    causesEn: ['ETag in If-Match header no longer matches current server resource version'],
    solutionsZh: ['重新 GET 最新资源及其 ETag，提示用户合并冲突后再提交'],
    solutionsEn: ['Re-fetch the latest resource and ETag before retrying the update'],
    keywords: ['precondition', 'if-match', 'etag', '乐观锁', '并发覆盖']
  },
  {
    code: 413,
    phrase: 'Content Too Large',
    category: '4xx',
    isCommon: true,
    spec: 'RFC 9110 §15.5.14',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['Content-Length', 'Retry-After'],
    summaryZh: '请求体过大，超出服务器或网关允许上限（原 Payload Too Large）',
    summaryEn: 'Request payload is larger than the server is willing or able to process',
    detailZh: '上传的文件、图片 Base64 或批量 JSON 数据体积超过了网关（如 Nginx 默认 1MB）或后端框架配置的请求体限制。',
    detailEn: 'The request entity exceeds limits defined by the web server, reverse proxy (e.g. Nginx default 1m), or application framework.',
    causesZh: [
      'Nginx 未调整 client_max_body_size（默认仅 1MB）',
      'Express / Spring / FastAPI 上传体限制过小'
    ],
    causesEn: [
      'Nginx client_max_body_size exceeded (defaults to 1MB)',
      'Application framework max body size limit exceeded'
    ],
    solutionsZh: [
      '在 Nginx 中调大 client_max_body_size 50m; 并同步调大后端框架限制；',
      '大文件建议直传对象存储（OSS/S3 预签名 URL）或分片上传'
    ],
    solutionsEn: [
      'Increase client_max_body_size in Nginx and framework body-parser limits',
      'Use presigned S3/OSS URLs or chunked uploads for large files'
    ],
    keywords: ['413', 'payload', 'upload', 'nginx', 'client_max_body_size', '请求体过大', '上传限制']
  },
  {
    code: 414,
    phrase: 'URI Too Long',
    category: '4xx',
    spec: 'RFC 9110 §15.5.15',
    cacheable: true,
    retryable: 'no',
    relatedHeaders: [],
    summaryZh: '请求的 URL 地址过长，超过服务端解析限制',
    summaryEn: 'Request URI is longer than the server is willing to interpret',
    detailZh: '通常因为将大量过滤条件、长数组 ID 列表或 Base64 数据直接拼接在 GET Query 参数中，导致 URL 长度超过网关限制（通常为 4KB~8KB）。',
    detailEn: 'Occurs when a GET request encodes too much data (e.g. huge ID lists, tokens, or base64 blobs) into query parameters.',
    causesZh: ['GET 请求携带超长查询参数，或重定向上下文出现循环追加参数'],
    causesEn: ['Excessive GET query string length or redirect loop appending query parameters'],
    solutionsZh: ['将超长查询接口改为 POST 请求并在 Body 中传递参数'],
    solutionsEn: ['Switch from GET query parameters to POST with a JSON request body'],
    keywords: ['uri too long', 'url', 'query', 'get', 'url过长']
  },
  {
    code: 415,
    phrase: 'Unsupported Media Type',
    category: '4xx',
    isCommon: true,
    spec: 'RFC 9110 §15.5.16',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['Content-Type', 'Accept-Post'],
    summaryZh: '请求体格式或 Content-Type 不被服务端支持',
    summaryEn: 'Payload media format (Content-Type) is not supported by the server',
    detailZh: '客户端实际发送或声明的 Content-Type（例如 text/plain 或 application/xml）与服务端接口期望的格式（例如 application/json 或 multipart/form-data）不匹配。',
    detailEn: 'The server refuses the request because the payload format or Content-Type header (e.g. text/plain instead of application/json) is unsupported.',
    causesZh: [
      '使用 fetch() 发送 JSON 字符串时忘记设置 headers: { "Content-Type": "application/json" }',
      '文件上传手动写了 Content-Type: multipart/form-data 却丢失了 boundary 分界符'
    ],
    causesEn: [
      'Forgot Content-Type: application/json header when sending JSON via fetch',
      'Manually overriding Content-Type on FormData (stripping multipart boundary)'
    ],
    solutionsZh: [
      '发送 JSON 时显式指定 Content-Type: application/json；',
      '使用 FormData 上传文件时不要手动设置 Content-Type，交给浏览器自动生成带 boundary 的请求头'
    ],
    solutionsEn: [
      'Explicitly set Content-Type: application/json for JSON payloads',
      'Let the browser/client auto-generate Content-Type when sending FormData'
    ],
    keywords: ['content-type', 'media type', 'formdata', 'json', '媒体类型不支持']
  },
  {
    code: 416,
    phrase: 'Range Not Satisfiable',
    category: '4xx',
    spec: 'RFC 9110 §15.5.17',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['Content-Range', 'Range'],
    summaryZh: '请求的字节区间 Range 超出文件实际大小',
    summaryEn: 'Requested byte Range cannot be fulfilled (out of bounds)',
    detailZh: '客户端发起断点续传或视频分片请求时指定的 bytes 区间超出了资源总长度（例如文件只有 1000 字节却请求 bytes=2000-3000）。',
    detailEn: 'The range specified in the Range request header falls outside the size of the target resource.',
    causesZh: ['本地断点续传缓存的文件版本已在服务端被替换/缩短，导致偏移量越界'],
    causesEn: ['Stale resume offset against a modified or smaller server file'],
    solutionsZh: ['清除本地分片进度并重新从头拉取，或检查 Content-Range: bytes */total 响应头'],
    solutionsEn: ['Discard stale resume offset and restart download from byte 0'],
    keywords: ['range', 'download', 'seek', '区间无效']
  },
  {
    code: 417,
    phrase: 'Expectation Failed',
    category: '4xx',
    spec: 'RFC 9110 §15.5.18',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['Expect'],
    summaryZh: '服务器无法满足 Expect 请求头的期望要求',
    summaryEn: 'Server cannot meet the requirements of the Expect request header',
    detailZh: '当客户端携带 Expect: 100-continue 等期望头而服务器或代理明确不支持或拒绝该期望时返回。',
    detailEn: 'The expectation given in the request’s Expect header field could not be met by at least one of the inbound servers.',
    causesZh: ['cURL 或旧版 HTTP 客户端自动附加了 Expect: 100-continue'],
    causesEn: ['Client sent Expect: 100-continue to a server/proxy that rejects it'],
    solutionsZh: ['在客户端请求中禁用或清空 Expect 头（如 curl -H "Expect:"）'],
    solutionsEn: ['Omit or clear the Expect header in client requests'],
    keywords: ['expect', 'curl']
  },
  {
    code: 418,
    phrase: "I'm a teapot",
    category: '4xx',
    spec: 'RFC 2324 / RFC 9110',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: [],
    summaryZh: '“我是茶壶”（源于 1998 年愚人节 RFC 2324 彩蛋，禁止泡咖啡）',
    summaryEn: 'Refuses to brew coffee because it is, permanently, a teapot (April Fools RFC)',
    detailZh: '1998 年 IETF 超文本咖啡壶控制协议（HTCPCP）愚人节玩笑定义的状态码，现已成为互联网文化经典彩蛋；部分安全 WAF 或彩蛋接口也用它来拦截异常爬虫。',
    detailEn: 'Defined in 1998 as an April Fools joke in RFC 2324 (Hyper Text Coffee Pot Control Protocol). Retained in RFC 9110 as a reserved easter egg; sometimes used by WAFs.',
    causesZh: ['彩蛋接口、测试 Mock 或部分防爬策略故意返回 418'],
    causesEn: ['Easter egg endpoint or quirky anti-bot WAF response'],
    solutionsZh: ['如果是生产接口意外返回 418，检查是否触发了安全网关或测试桩拦截'],
    solutionsEn: ['Check WAF rules or mock routes if encountered unexpectedly in production'],
    keywords: ['teapot', 'coffee', 'rfc2324', 'easter egg', '茶壶', '彩蛋']
  },
  {
    code: 421,
    phrase: 'Misdirected Request',
    category: '4xx',
    spec: 'RFC 9110 §15.5.20',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: ['Host'],
    summaryZh: '请求被路由到了无法处理该主机域名的服务器（常见于 HTTP/2 连接复用）',
    summaryEn: 'Request was directed at a server unable to produce a response for the Host',
    detailZh: '常见于多个域名共用通配符 TLS 证书并开启 HTTP/2 连接合并（Connection Coalescing）时，浏览器复用了连接但该后端节点无权响应第二个域名。',
    detailEn: 'Common with HTTP/2 connection coalescing across multiple domains sharing an IP/TLS certificate when the selected server is not authoritative for the Host.',
    causesZh: ['HTTP/2 多域名共享证书连接复用冲突、CDN 回源 SNI 与 Host 不一致'],
    causesEn: ['HTTP/2 connection coalescing mismatch or SNI/Host mismatch on origin'],
    solutionsZh: ['关闭跨域名证书合并或在 CDN/Nginx 中确保每个 server block 匹配正确的域名与 SNI'],
    solutionsEn: ['Align TLS SNI and Host headers or disable HTTP/2 connection coalescing across disparate backends'],
    keywords: ['http2', 'sni', 'coalescing', 'tls', '误定向']
  },
  {
    code: 422,
    phrase: 'Unprocessable Content',
    category: '4xx',
    isCommon: true,
    spec: 'RFC 9110 §15.5.21',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['Content-Type'],
    summaryZh: '请求语法正确，但语义/业务字段校验未通过（原 Unprocessable Entity）',
    summaryEn: 'Request syntax is valid, but semantic or validation rules failed',
    detailZh: 'JSON 结构完整且 Content-Type 正确，但字段内容不满足业务校验规则（例如邮箱格式错误、密码长度不足、起止日期倒挂）。在 FastAPI / Laravel / Rails 中非常常见。',
    detailEn: 'The server understands the Content-Type and syntax of the request, but was unable to process the contained instructions due to semantic or field validation errors.',
    causesZh: ['表单或 API 字段校验失败（类型不匹配、缺少必填字段、数值越界）'],
    causesEn: ['Schema or business validation failed (e.g. Pydantic/FastAPI, Zod, Rails errors)'],
    solutionsZh: ['在响应体中返回结构化的字段级错误列表（field + message），方便前端精准标红提示'],
    solutionsEn: ['Return structured field-level validation errors in the JSON body'],
    keywords: ['validation', 'schema', 'fastapi', 'pydantic', '表单校验', '字段验证']
  },
  {
    code: 423,
    phrase: 'Locked',
    category: '4xx',
    spec: 'RFC 4918 (WebDAV)',
    cacheable: false,
    retryable: 'conditional',
    relatedHeaders: ['Lock-Token'],
    summaryZh: '目标资源当前处于锁定状态，无法修改',
    summaryEn: 'The resource being accessed is currently locked',
    detailZh: '最初来自 WebDAV 协议，在现代系统中也用于表示账号被冻结、账单期锁定或分布式锁占用期间拒绝写入。',
    detailEn: 'Originally from WebDAV; also used in modern APIs when an account, record, or billing period is locked against modifications.',
    causesZh: ['WebDAV 文件锁被其他客户端持有，或业务记录被管理员锁定'],
    causesEn: ['Resource locked by another process or administrative freeze'],
    solutionsZh: ['等待锁释放或联系持有者/管理员解锁'],
    solutionsEn: ['Wait for lock release or unlock the resource before retrying'],
    keywords: ['locked', 'webdav', '锁定']
  },
  {
    code: 424,
    phrase: 'Failed Dependency',
    category: '4xx',
    spec: 'RFC 4918 (WebDAV)',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: [],
    summaryZh: '因前置依赖步骤失败，导致当前请求无法继续执行',
    summaryEn: 'Request failed due to failure of a previous dependent request',
    detailZh: '批量事务或第三方网关串联调用时，由于某个上游依赖请求失败（如第三方支付验签或前置工作流失败），当前操作随之失败。',
    detailEn: 'The method could not be performed on the resource because the requested action depended on another action that failed.',
    causesZh: ['批量操作或依赖外部微服务的前置步骤报错'],
    causesEn: ['Prerequisite operation in a dependency chain failed'],
    solutionsZh: ['排查依赖链中首个失败的步骤日志'],
    solutionsEn: ['Inspect and fix the failing upstream dependency step'],
    keywords: ['dependency', 'webdav', '依赖失败']
  },
  {
    code: 425,
    phrase: 'Too Early',
    category: '4xx',
    spec: 'RFC 8470',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: ['Early-Data'],
    summaryZh: '服务器拒绝处理存在重放攻击风险的 TLS 0-RTT 早期数据',
    summaryEn: 'Server refuses to process a TLS 0-RTT request that might be replayed',
    detailZh: '在使用 TLS 1.3 Early Data (0-RTT) 加速握手时，若请求包含非幂等操作（如 POST 转账），服务器可通过 425 要求客户端完成完整 TLS 握手后再重发。',
    detailEn: 'Indicates the server is unwilling to risk processing a TLS 1.3 0-RTT request that might be replayed (e.g. non-idempotent POST).',
    causesZh: ['TLS 1.3 开启 0-RTT 后发送了非幂等请求'],
    causesEn: ['Non-idempotent request sent over TLS 1.3 0-RTT Early Data'],
    solutionsZh: ['对非 GET/HEAD 请求禁用 0-RTT，或客户端收到 425 后在完整握手完成时自动重试'],
    solutionsEn: ['Disable 0-RTT for non-idempotent routes or retry after TLS handshake completes'],
    keywords: ['0-rtt', 'tls1.3', 'early data', 'replay']
  },
  {
    code: 426,
    phrase: 'Upgrade Required',
    category: '4xx',
    spec: 'RFC 9110 §15.5.22',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['Upgrade', 'Connection'],
    summaryZh: '要求客户端升级到指定的更高版本协议',
    summaryEn: 'Client should switch to a different protocol listed in Upgrade header',
    detailZh: '服务器拒绝使用当前协议继续处理请求，但会在 Upgrade 响应头中指明需要切换的协议（例如要求客户端从明文 HTTP 升级至 TLS/1.2 或 WebSocket）。',
    detailEn: 'The server refuses to perform the request using the current protocol but might be willing to do so after the client upgrades to a different protocol.',
    causesZh: ['未使用 WebSocket 握手访问 WS 端点，或使用过时的 TLS 版本'],
    causesEn: ['Plain HTTP request sent to a WebSocket-only endpoint or deprecated TLS version'],
    solutionsZh: ['检查服务端响应头 Upgrade 字段并切换对应协议连接'],
    solutionsEn: ['Check the Upgrade response header and connect using the required protocol'],
    keywords: ['upgrade', 'tls', 'websocket', '协议升级']
  },
  {
    code: 428,
    phrase: 'Precondition Required',
    category: '4xx',
    spec: 'RFC 6585 §3',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['If-Match', 'If-Unmodified-Since'],
    summaryZh: '服务端强制要求请求必须携带条件并发控制头（如 If-Match）',
    summaryEn: 'Origin server requires the request to be conditional',
    detailZh: '为防止多个客户端并发更新同一资源造成“丢失更新（Lost Update）”问题，服务端强制要求修改请求必须附带 If-Match 等条件头。',
    detailEn: 'Requires conditional headers (like If-Match) to prevent the "lost update" problem when multiple clients read and modify the same resource.',
    causesZh: ['PUT/PATCH 更新请求未携带 If-Match ETag 头'],
    causesEn: ['PUT/PATCH request omitted required If-Match / If-Unmodified-Since header'],
    solutionsZh: ['先 GET 资源获取 ETag，在更新请求头中带上 If-Match: "<etag>"'],
    solutionsEn: ['Include the latest ETag in an If-Match request header'],
    keywords: ['precondition', 'if-match', 'lost update', '并发控制']
  },
  {
    code: 429,
    phrase: 'Too Many Requests',
    category: '4xx',
    isCommon: true,
    spec: 'RFC 6585 §4',
    cacheable: false,
    retryable: 'conditional',
    relatedHeaders: ['Retry-After', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'RateLimit'],
    summaryZh: '请求频率超出限流阈值（Rate Limit Exceeded）',
    summaryEn: 'User has sent too many requests in a given amount of time (rate limiting)',
    detailZh: '客户端在给定时间窗口内触发了网关、CDN 或 API 服务的速率限制（Rate Limiting）。标准做法是同时返回 Retry-After 告知客户端需等待的秒数。',
    detailEn: 'The user has exceeded the allowed request rate within a time window. Should include a Retry-After header indicating when to retry.',
    causesZh: [
      '短时间内高频轮询或并发请求过多触发令牌桶/滑动窗口限流',
      '前端 useEffect 死循环重复请求接口',
      '爬虫或 CI 脚本共享出口 IP 耗尽了 GitHub/第三方 API 配额'
    ],
    causesEn: [
      'Burst traffic or polling exceeded rate-limit quota',
      'Client bug causing infinite retry/request loop',
      'Shared NAT/CI IP hitting third-party API quota'
    ],
    solutionsZh: [
      '读取响应头 Retry-After 实施指数退避（Exponential Backoff + Jitter）重试；',
      '合并批量请求或增加本地缓存以降低调用频次'
    ],
    solutionsEn: [
      'Respect Retry-After header and apply exponential backoff with jitter',
      'Batch API calls or cache responses client-side'
    ],
    keywords: ['rate limit', 'throttle', 'retry-after', '429', '限流', '频控', '配额']
  },
  {
    code: 431,
    phrase: 'Request Header Fields Too Large',
    category: '4xx',
    spec: 'RFC 6585 §5',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['Cookie', 'Authorization'],
    summaryZh: '请求头字段总大小或单个请求头体积超限',
    summaryEn: 'Server refuses request because HTTP header fields are too large',
    detailZh: '常见于本地开发或生产环境中浏览器累积了过多 Cookie、超大的 JWT Token（内含海量权限声明），导致请求头超过了 Node.js（默认 16KB）或网关限制。',
    detailEn: 'Occurs when individual headers or total header size exceed server limits (e.g. Node.js 16KB default), often due to bloated Cookies or oversized JWTs.',
    causesZh: [
      '浏览器同域下积累了太多历史 Cookie 或超大 Session 数据',
      'JWT Payload 中塞入了过多的角色/菜单列表'
    ],
    causesEn: [
      'Too many/large Cookies on localhost or production domain',
      'Oversized JWT token in Authorization header'
    ],
    solutionsZh: [
      '清理无效 Cookie 或缩短 JWT 载荷（仅保留用户 ID 等必要声明）；',
      '服务端必要时可适当调大 max-http-header-size'
    ],
    solutionsEn: [
      'Clear stale cookies and keep JWT claims minimal',
      'Increase server max-http-header-size if legitimately needed'
    ],
    keywords: ['header too large', 'cookie', 'jwt', 'node', '请求头过大']
  },
  {
    code: 451,
    phrase: 'Unavailable For Legal Reasons',
    category: '4xx',
    spec: 'RFC 7725',
    cacheable: true,
    retryable: 'no',
    relatedHeaders: ['Link'],
    summaryZh: '因法律合规、版权或监管要求无法提供该资源',
    summaryEn: 'Access to resource is denied due to legal demands or censorship',
    detailZh: '状态码数字致敬科幻小说《华氏 451 度》。用于声明某项内容因法院禁令、DMCA 版权投诉或地区合规审查而被禁止访问。',
    detailEn: 'Named as a homage to the novel Fahrenheit 451. Indicates content is blocked due to legal mandates, DMCA takedowns, or regional regulations.',
    causesZh: ['地区合规限制、DMCA 版权下架或监管屏蔽'],
    causesEn: ['Geo-blocking legal restriction or DMCA takedown'],
    solutionsZh: ['可通过 Link: <...>; rel="blocked-by" 标明拦截说明页'],
    solutionsEn: ['Optionally provide a Link header with rel="blocked-by"'],
    keywords: ['legal', 'dmca', 'blocked', '法律', '合规']
  },

  // ==================== 5xx Server Error ====================
  {
    code: 500,
    phrase: 'Internal Server Error',
    category: '5xx',
    isCommon: true,
    spec: 'RFC 9110 §15.6.1',
    cacheable: false,
    retryable: 'conditional',
    relatedHeaders: ['X-Request-Id'],
    summaryZh: '服务器内部未捕获异常或代码错误',
    summaryEn: 'Unexpected server condition prevented fulfilling the request',
    detailZh: '通用的服务端兜底错误状态码，表示后端代码抛出了未捕获异常（空指针、数据库连接崩溃、模板渲染报错、内存溢出等）。',
    detailEn: 'Generic catch-all server error indicating an unhandled exception, crash, database failure, or misconfiguration on the origin server.',
    causesZh: [
      '后端代码未捕获异常（NullPointerException / TypeError / panic）',
      '数据库 SQL 报错、连接池耗尽或环境变量缺失',
      'Nginx 重写规则死循环（rewrite or internal redirection cycle）'
    ],
    causesEn: [
      'Unhandled application exception or panic',
      'Database query failure, pool exhaustion, or missing env config',
      'Web server rewrite redirect loop'
    ],
    solutionsZh: [
      '查看服务端完整堆栈日志及请求关联的 X-Request-Id / TraceId；',
      '切勿在生产环境 500 响应体中直接暴露内部堆栈或数据库信息'
    ],
    solutionsEn: [
      'Inspect backend error logs and trace IDs',
      'Never leak stack traces or DB secrets in production 500 responses'
    ],
    keywords: ['500', 'internal error', 'exception', 'crash', '服务器错误', '内部错误']
  },
  {
    code: 501,
    phrase: 'Not Implemented',
    category: '5xx',
    spec: 'RFC 9110 §15.6.2',
    cacheable: true,
    retryable: 'no',
    relatedHeaders: ['Retry-After'],
    summaryZh: '服务器不支持该请求所需的功能或 HTTP 方法',
    summaryEn: 'Server does not support the functionality required to fulfill the request',
    detailZh: '服务端或代理无法识别请求的 HTTP 方法（如自定义非标动词），或尚未实现该功能。',
    detailEn: 'The server either does not recognize the request method or lacks the ability to fulfill the request (e.g. unimplemented feature).',
    causesZh: ['使用了非标准 HTTP 方法，或占位接口尚未实现'],
    causesEn: ['Unrecognized HTTP method or stubbed unimplemented endpoint'],
    solutionsZh: ['检查 HTTP 请求方法拼写是否正确，或确认功能版本是否上线'],
    solutionsEn: ['Verify HTTP method name and endpoint availability'],
    keywords: ['not implemented', '未实现']
  },
  {
    code: 502,
    phrase: 'Bad Gateway',
    category: '5xx',
    isCommon: true,
    spec: 'RFC 9110 §15.6.3',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: [],
    summaryZh: '网关/反向代理从上游后端收到无效响应或连接被拒绝',
    summaryEn: 'Gateway/proxy received an invalid response or failed to reach upstream',
    detailZh: '反向代理（Nginx、ALB、Cloudflare、API Gateway）本身工作正常，但在转发请求给上游应用服务器时，上游进程未启动、崩溃断连或返回了不合规的 HTTP 报文。',
    detailEn: 'The proxy or gateway could not get a valid response from the upstream server—commonly because the backend process crashed, refused the connection, or sent malformed HTTP.',
    causesZh: [
      '上游应用服务（Node/Python/Go/Java/PHP-FPM）未启动、正在重启或 OOM 被杀',
      'Nginx upstream 端口/Unix Socket 路径配置错误（Connection refused）',
      '上游响应头过大超出 Nginx proxy_buffer_size 缓冲区'
    ],
    causesEn: [
      'Upstream app crashed, restarting, OOM-killed, or not listening on expected port',
      'Misconfigured Nginx upstream address or socket path',
      'Upstream response headers exceeded proxy_buffer_size'
    ],
    solutionsZh: [
      '检查上游服务运行状态与系统日志（journalctl / docker logs / dmesg）；',
      '查看 Nginx error.log 确认具体是 Connection refused 还是 upstream prematurely closed connection'
    ],
    solutionsEn: [
      'Verify upstream service health, listening port, and container/OOM logs',
      'Check Nginx error.log for connection refused vs buffer overflow details'
    ],
    keywords: ['502', 'bad gateway', 'nginx', 'upstream', 'proxy', '网关错误', '上游崩溃']
  },
  {
    code: 503,
    phrase: 'Service Unavailable',
    category: '5xx',
    isCommon: true,
    spec: 'RFC 9110 §15.6.4',
    cacheable: false,
    retryable: 'conditional',
    relatedHeaders: ['Retry-After'],
    summaryZh: '服务暂时不可用（过载限流、熔断或停机维护）',
    summaryEn: 'Server is currently unable to handle the request due to overload or maintenance',
    detailZh: '属于临时性不可用状态，服务器预计在一段时间后恢复。常用于主动维护窗口、Kubernetes Pod 就绪探针全未通过、连接池耗尽或熔断器开启。',
    detailEn: 'Temporary unavailability caused by maintenance, overload, circuit breaking, or zero healthy upstream backends in load balancer.',
    causesZh: [
      '负载均衡后端所有健康检查均失败（No healthy upstream）',
      '系统高并发过载触发熔断降级或线程池满',
      '正在执行计划停机维护'
    ],
    causesEn: [
      'All backend targets failed load-balancer health checks',
      'Thread/connection pool exhaustion or circuit breaker open',
      'Planned maintenance window'
    ],
    solutionsZh: [
      '配合 Retry-After 响应头告知客户端稍后退避重试；',
      '检查服务健康检查接口（/healthz）与实例扩缩容状态'
    ],
    solutionsEn: [
      'Return Retry-After header and implement exponential backoff retries',
      'Check health check endpoints and autoscaling/pod readiness'
    ],
    keywords: ['503', 'unavailable', 'maintenance', 'overload', 'circuit breaker', '服务不可用', '维护']
  },
  {
    code: 504,
    phrase: 'Gateway Timeout',
    category: '5xx',
    isCommon: true,
    spec: 'RFC 9110 §15.6.5',
    cacheable: false,
    retryable: 'conditional',
    relatedHeaders: [],
    summaryZh: '网关等待上游服务器响应超时',
    summaryEn: 'Gateway/proxy did not receive a timely response from upstream server',
    detailZh: '反向代理已成功与上游建立连接并发送了请求，但上游处理时间过长（例如慢 SQL、大型 AI 推理、外部接口卡死），超过了代理的读超时时间（如 Nginx 默认 proxy_read_timeout 60s 或 Cloudflare 100s）。',
    detailEn: 'The proxy connected to the upstream server, but the upstream took too long to send a response, exceeding proxy read timeout (e.g. Nginx 60s, AWS ALB 60s, Cloudflare 100s).',
    causesZh: [
      '慢查询 SQL、死锁或同步调用外部第三方 API 卡死',
      '长耗时导出/大模型流式前等待超时',
      'Nginx proxy_read_timeout 或云负载均衡 Idle Timeout 设置过短'
    ],
    causesEn: [
      'Slow database queries, lock contention, or hanging external API calls',
      'Long-running exports or LLM generation exceeding proxy_read_timeout',
      'Proxy/CDN timeout threshold lower than operation duration'
    ],
    solutionsZh: [
      '长耗时任务改为 202 Accepted 异步处理或使用 SSE 流式输出保持连接活跃；',
      '排查慢 SQL 并视业务需要调高 proxy_read_timeout'
    ],
    solutionsEn: [
      'Move long tasks to async 202 jobs or stream partial chunks via SSE',
      'Optimize slow queries/upstream bottlenecks and tune proxy_read_timeout'
    ],
    keywords: ['504', 'gateway timeout', 'nginx', 'proxy_read_timeout', '网关超时', '慢查询']
  },
  {
    code: 505,
    phrase: 'HTTP Version Not Supported',
    category: '5xx',
    spec: 'RFC 9110 §15.6.6',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: [],
    summaryZh: '服务器不支持请求中使用的 HTTP 协议版本',
    summaryEn: 'Server does not support the HTTP protocol version used in the request',
    detailZh: '客户端发送的 HTTP 请求行协议版本（如过时的 HTTP/0.9 或非法版本号）不被服务器支持。',
    detailEn: 'The server does not support, or refuses to support, the major version of HTTP that was used in the request message.',
    causesZh: ['手工拼接原始 HTTP 报文时版本号写错，或老旧设备使用 HTTP/1.0'],
    causesEn: ['Malformed HTTP version in raw socket request or obsolete client'],
    solutionsZh: ['使用标准的 HTTP/1.1 或 HTTP/2 客户端库发起请求'],
    solutionsEn: ['Use standard HTTP/1.1 or HTTP/2 compliant client libraries'],
    keywords: ['http version', 'protocol', '版本不支持']
  },
  {
    code: 507,
    phrase: 'Insufficient Storage',
    category: '5xx',
    spec: 'RFC 4918 (WebDAV)',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: [],
    summaryZh: '服务器磁盘或配额空间不足，无法存储完成请求所需数据',
    summaryEn: 'Server cannot store the representation needed to complete the request',
    detailZh: '最初为 WebDAV 状态码，现也广泛用于对象存储、云盘或文件服务器提示磁盘写满或用户空间配额已耗尽。',
    detailEn: 'Indicates the server is unable to store the representation needed to complete the request due to insufficient disk space or quota.',
    causesZh: ['服务器磁盘已满（No space left on device）或用户存储配额用尽'],
    causesEn: ['Server disk full or user storage quota exceeded'],
    solutionsZh: ['检查服务器磁盘 df -h 使用率与临时目录空间，或清理过期日志与文件'],
    solutionsEn: ['Check server disk space (df -h) or user storage quota limits'],
    keywords: ['storage', 'disk full', 'quota', '磁盘空间不足']
  },
  {
    code: 508,
    phrase: 'Loop Detected',
    category: '5xx',
    spec: 'RFC 5842 (WebDAV)',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: [],
    summaryZh: '服务器处理请求时检测到无限递归循环',
    summaryEn: 'Server detected an infinite loop while processing the request',
    detailZh: '服务器在处理请求或代理转发时遇到自引用循环（如反向代理互相转发或 WebDAV Depth: infinity 循环绑定）。',
    detailEn: 'The server terminated an operation because it encountered an infinite loop while processing a request.',
    causesZh: ['Nginx / CDN 回源配置指向自身造成回源死循环'],
    causesEn: ['Reverse proxy or CDN origin misconfigured to point back to itself'],
    solutionsZh: ['检查代理转发规则与域名解析，避免请求无限环回'],
    solutionsEn: ['Verify proxy_pass upstream targets and DNS records to break the loop'],
    keywords: ['loop', 'infinite', '死循环']
  },
  {
    code: 511,
    phrase: 'Network Authentication Required',
    category: '5xx',
    spec: 'RFC 6585 §6',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: [],
    summaryZh: '需要先完成网络层认证（常见于公共 Wi-Fi Captive Portal 登录页）',
    summaryEn: 'Client needs to authenticate to gain network access (Captive Portal)',
    detailZh: '机场、酒店或校园网等公共 Wi-Fi 在未登录认证前拦截网络请求，通过 511 提示客户端打开强制门户页面完成联网认证。',
    detailEn: 'Used by intercepting proxies (such as hotel/airport Wi-Fi captive portals) to require user authentication before granting internet access.',
    causesZh: ['处于尚未完成认证的公共 Wi-Fi 或校园网环境下'],
    causesEn: ['Connected to a public Wi-Fi network behind a captive portal'],
    solutionsZh: ['在浏览器中打开任意 HTTP 页面完成 Wi-Fi 门户登录后再试'],
    solutionsEn: ['Complete captive portal sign-in via browser'],
    keywords: ['wifi', 'captive portal', 'network auth', '校园网', '认证']
  },

  // ==================== Unofficial / Ecosystem Extensions ====================
  {
    code: 444,
    phrase: 'No Response (Nginx)',
    category: '4xx',
    isUnofficial: true,
    spec: 'Nginx Extension',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: [],
    summaryZh: 'Nginx 专有状态码：不返回任何响应直接强制断开 TCP 连接',
    summaryEn: 'Nginx-specific: server returns no info and closes the connection immediately',
    detailZh: 'Nginx 配置中常使用 return 444; 来静默丢弃恶意扫描器、非法 Host 请求或 DDoS 垃圾流量，不发送任何 HTTP 响应头或正文直接切断连接。',
    detailEn: 'An internal Nginx status code used with `return 444;` to drop malicious scanners or invalid Host connections abruptly without sending any bytes back.',
    causesZh: ['Nginx 主动拦截非法 Host、爬虫扫描或敏感路径探测'],
    causesEn: ['Nginx rule explicitly configured with `return 444;` to drop traffic'],
    solutionsZh: ['若正常请求收到连接重置，检查 Nginx server_name 与安全拦截配置'],
    solutionsEn: ['Inspect Nginx server_name matching and security `return 444` rules'],
    keywords: ['nginx', '444', 'drop', 'close', '断连']
  },
  {
    code: 499,
    phrase: 'Client Closed Request (Nginx)',
    category: '4xx',
    isUnofficial: true,
    isCommon: true,
    spec: 'Nginx Extension',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: [],
    summaryZh: 'Nginx 日志专用：服务器尚在处理中，客户端已主动断开连接',
    summaryEn: 'Nginx log status: client closed the connection before server responded',
    detailZh: '并非返回给客户端的状态码，而是记录在 Nginx access.log 中的常见状态码：客户端等不及响应（如前端设置 5 秒超时取消请求、用户关闭页面或 Axios CancelToken）提前断开了 TCP 连接。',
    detailEn: 'Logged in Nginx access logs when the client aborts/times out the connection before the upstream server finishes sending the response.',
    causesZh: [
      '前端 Axios/Fetch 设置的 timeout 短于后端接口实际响应耗时',
      '用户快速切换页面或关闭浏览器标签取消了未完成的请求',
      '上游网关超时时间短于下游 Nginx'
    ],
    causesEn: [
      'Client-side HTTP timeout is shorter than server processing time',
      'User navigated away or aborted request via AbortController',
      'Upstream load balancer timed out and closed connection early'
    ],
    solutionsZh: [
      '优化慢接口性能，缩短响应耗时；',
      '检查客户端与前一层网关的 timeout 是否比上游服务超时设置过短'
    ],
    solutionsEn: [
      'Optimize slow backend endpoints and align client/LB timeout thresholds'
    ],
    keywords: ['499', 'nginx', 'abort', 'client closed', '取消请求', '客户端断开']
  },
  {
    code: 520,
    phrase: 'Web Server Returned an Unknown Error',
    category: '5xx',
    isUnofficial: true,
    spec: 'Cloudflare Extension',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: ['CF-RAY'],
    summaryZh: 'Cloudflare 专有：源站返回了空响应或无法解析的异常报文',
    summaryEn: 'Cloudflare: origin server returned an empty, unknown, or unexpected response',
    detailZh: 'Cloudflare 边缘节点连接源站时，源站意外重置 TCP 连接、返回格式损坏的响应头（如重复 Content-Length）或超过 16KB 的响应头。',
    detailEn: 'Cloudflare could not parse the origin response due to a sudden TCP reset, invalid headers, or header size exceeding Cloudflare limits.',
    causesZh: ['源站进程崩溃、响应头格式非法或源站防火墙误拦截 Cloudflare IP'],
    causesEn: ['Origin crash, malformed response headers, or firewall blocking Cloudflare IPs'],
    solutionsZh: ['检查源站日志并把 Cloudflare 回源 IP 段加入防火墙白名单'],
    solutionsEn: ['Inspect origin logs and allowlist Cloudflare IP ranges on origin firewall'],
    keywords: ['cloudflare', '520', 'cf']
  },
  {
    code: 521,
    phrase: 'Web Server Is Down',
    category: '5xx',
    isUnofficial: true,
    spec: 'Cloudflare Extension',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: ['CF-RAY'],
    summaryZh: 'Cloudflare 专有：源站拒绝连接（Web 服务未运行或端口被防火墙阻断）',
    summaryEn: 'Cloudflare: origin web server refused connection from Cloudflare',
    detailZh: 'Cloudflare 尝试连接源站 80/443 端口时收到 TCP RST / Connection Refused。',
    detailEn: 'Origin server actively refused the TCP connection from Cloudflare on port 80 or 443.',
    causesZh: ['源站 Nginx/Apache 进程挂掉，或安全组拒绝了 Cloudflare IP 访问 443 端口'],
    causesEn: ['Origin web service stopped or firewall/security group blocking Cloudflare'],
    solutionsZh: ['确认源站 Web 服务正在监听 80/443 并放行 Cloudflare 回源 IP'],
    solutionsEn: ['Ensure origin service is listening and firewall permits Cloudflare IPs'],
    keywords: ['cloudflare', '521', 'down']
  },
  {
    code: 522,
    phrase: 'Connection Timed Out',
    category: '5xx',
    isUnofficial: true,
    spec: 'Cloudflare Extension',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: ['CF-RAY'],
    summaryZh: 'Cloudflare 专有：与源站建立 TCP 握手连接超时',
    summaryEn: 'Cloudflare: TCP handshake with origin server timed out',
    detailZh: 'Cloudflare 在约 15 秒内无法与源站完成 TCP 三次握手（常见于源站丢包、防火墙 DROP 策略或源站高负载 SYN 队列满）。',
    detailEn: 'Cloudflare timed out attempting to establish a TCP connection with the origin server.',
    causesZh: ['源站防火墙使用 DROP 静默丢包、DNS 回源 IP 填错或源站网络故障'],
    causesEn: ['Origin firewall dropping packets, wrong origin IP in DNS, or network outage'],
    solutionsZh: ['核对 Cloudflare DNS A/AAAA 记录与源站防火墙白名单'],
    solutionsEn: ['Verify DNS origin IP and firewall rules'],
    keywords: ['cloudflare', '522', 'timeout']
  },
  {
    code: 524,
    phrase: 'A Timeout Occurred',
    category: '5xx',
    isUnofficial: true,
    spec: 'Cloudflare Extension',
    cacheable: false,
    retryable: 'conditional',
    relatedHeaders: ['CF-RAY'],
    summaryZh: 'Cloudflare 专有：已连上源站，但源站超过 100 秒未返回任何响应数据',
    summaryEn: 'Cloudflare: connected to origin, but no HTTP response within 100s timeout',
    detailZh: 'Cloudflare 免费与标准套餐对源站单个请求的等待上限为 100 秒，若源站在此期间未发送首字节或持续流式输出，将触发 524 超时。',
    detailEn: 'Cloudflare successfully connected to the origin server, but the origin did not send an HTTP response before the 100-second timeout.',
    causesZh: ['源站同步执行了耗时超过 100 秒的导出、备份或 AI 推理任务'],
    causesEn: ['Long-running synchronous origin task taking over 100 seconds'],
    solutionsZh: ['改用异步任务（202 + 轮询）、WebSocket 或尽早输出 SSE 心跳流'],
    solutionsEn: ['Use async background jobs (202), WebSockets, or streaming responses'],
    keywords: ['cloudflare', '524', '100s', 'timeout']
  },
  {
    code: 525,
    phrase: 'SSL Handshake Failed',
    category: '5xx',
    isUnofficial: true,
    spec: 'Cloudflare Extension',
    cacheable: false,
    retryable: 'yes',
    relatedHeaders: ['CF-RAY'],
    summaryZh: 'Cloudflare 专有：Cloudflare 与源站之间的 TLS/SSL 握手失败',
    summaryEn: 'Cloudflare: SSL/TLS handshake between Cloudflare and origin failed',
    detailZh: '当 SSL/TLS 模式设为 Full 或 Full (Strict) 时，源站未在 443 端口配置有效证书或 TLS 协议/加密套件不兼容。',
    detailEn: 'Cloudflare could not negotiate an SSL/TLS handshake with the origin server when SSL mode is Full or Full (Strict).',
    causesZh: ['源站 443 端口未开启 HTTPS、SNI 配置缺失或 TLS 协议版本过旧'],
    causesEn: ['Origin missing HTTPS on port 443, SNI mismatch, or incompatible cipher suites'],
    solutionsZh: ['在源站配置有效的证书（或 Cloudflare Origin CA 证书）并启用 TLS 1.2/1.3'],
    solutionsEn: ['Configure valid SSL/Origin CA certificate and TLS 1.2/1.3 on origin'],
    keywords: ['cloudflare', '525', 'ssl', 'tls']
  },
  {
    code: 526,
    phrase: 'Invalid SSL Certificate',
    category: '5xx',
    isUnofficial: true,
    spec: 'Cloudflare Extension',
    cacheable: false,
    retryable: 'no',
    relatedHeaders: ['CF-RAY'],
    summaryZh: 'Cloudflare 专有：Full (Strict) 模式下源站 SSL 证书无效或已过期',
    summaryEn: 'Cloudflare: origin SSL certificate failed validation in Full (Strict) mode',
    detailZh: '源站使用自签名证书、证书已过期或证书域名 SAN 与当前访问域名不匹配，且 Cloudflare 开启了严格校验证书模式。',
    detailEn: 'Origin certificate is expired, self-signed, or hostname-mismatched while Cloudflare SSL/TLS is set to Full (Strict).',
    causesZh: ['源站 Let’s Encrypt 证书过期未续签或使用自签名证书'],
    causesEn: ['Expired Let’s Encrypt cert or self-signed cert on origin'],
    solutionsZh: ['续签源站证书或签发 Cloudflare Origin CA 证书并安装到源站'],
    solutionsEn: ['Renew origin SSL certificate or install a Cloudflare Origin CA certificate'],
    keywords: ['cloudflare', '526', 'ssl', 'certificate', '证书过期']
  }
];
