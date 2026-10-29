export interface HarHeader {
  name: string;
  value: string;
}

export interface HarCookie {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
}

export interface HarQueryParam {
  name: string;
  value: string;
}

export interface HarPostData {
  mimeType: string;
  text?: string;
  params?: Array<{
    name: string;
    value?: string;
    fileName?: string;
    contentType?: string;
  }>;
}

export interface HarContent {
  size: number;
  compression?: number;
  mimeType: string;
  text?: string;
  encoding?: string;
}

export interface HarRequest {
  method: string;
  url: string;
  httpVersion: string;
  cookies: HarCookie[];
  headers: HarHeader[];
  queryString: HarQueryParam[];
  postData?: HarPostData;
  headersSize: number;
  bodySize: number;
}

export interface HarResponse {
  status: number;
  statusText: string;
  httpVersion: string;
  cookies: HarCookie[];
  headers: HarHeader[];
  content: HarContent;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
}

export interface HarTimings {
  blocked?: number;
  dns?: number;
  connect?: number;
  ssl?: number;
  send?: number;
  wait?: number;
  receive?: number;
}

export interface HarPage {
  startedDateTime: string;
  id: string;
  title: string;
  pageTimings?: {
    onContentLoad?: number;
    onLoad?: number;
  };
}

export interface HarEntry {
  id: string;
  startedDateTime: string;
  time: number;
  request: HarRequest;
  response: HarResponse;
  cache?: Record<string, any>;
  timings: HarTimings;
  serverIPAddress?: string;
  connection?: string;
  pageref?: string;
  // Computed helpers
  _parsedUrl: {
    hostname: string;
    pathname: string;
    search: string;
    filename: string;
  };
  _resourceType: 'xhr' | 'js' | 'css' | 'img' | 'media' | 'font' | 'doc' | 'other';
  _startTimeMs: number;
}

export interface HarLog {
  version: string;
  creator: {
    name: string;
    version: string;
    comment?: string;
  };
  browser?: {
    name: string;
    version: string;
  };
  pages?: HarPage[];
  entries: HarEntry[];
}

export interface HarArchive {
  log: HarLog;
}
