export type NginxScope = 'core' | 'http' | 'stream' | 'mail';

export interface NginxDirectiveDoc {
  name: string;
  module: string;
  scope: NginxScope;
  docPath: string;
  syntax: string;
  default: string;
  contexts: string[];
  summary: string;
  isBlock: boolean;
}

export const NGINX_DOCS_BASE_URL = 'https://nginx.org/en/docs/';

export const NGINX_MODULES: readonly string[] = [
  "ngx_core_module",
  "ngx_google_perftools_module",
  "ngx_http_access_module",
  "ngx_http_acme_module",
  "ngx_http_addition_module",
  "ngx_http_api_module",
  "ngx_http_auth_basic_module",
  "ngx_http_auth_jwt_module",
  "ngx_http_auth_request_module",
  "ngx_http_auth_require_module",
  "ngx_http_autoindex_module",
  "ngx_http_browser_module",
  "ngx_http_charset_module",
  "ngx_http_core_module",
  "ngx_http_dav_module",
  "ngx_http_db_module",
  "ngx_http_empty_gif_module",
  "ngx_http_f4f_module",
  "ngx_http_fastcgi_module",
  "ngx_http_flv_module",
  "ngx_http_geo_module",
  "ngx_http_geoip_module",
  "ngx_http_grpc_module",
  "ngx_http_gunzip_module",
  "ngx_http_gzip_module",
  "ngx_http_gzip_static_module",
  "ngx_http_headers_module",
  "ngx_http_hls_module",
  "ngx_http_image_filter_module",
  "ngx_http_index_module",
  "ngx_http_internal_redirect_module",
  "ngx_http_js_module",
  "ngx_http_json_module",
  "ngx_http_keyval_module",
  "ngx_http_limit_conn_module",
  "ngx_http_limit_req_module",
  "ngx_http_log_module",
  "ngx_http_map_module",
  "ngx_http_memcached_module",
  "ngx_http_mirror_module",
  "ngx_http_mp4_module",
  "ngx_http_num_map_module",
  "ngx_http_oidc_module",
  "ngx_http_perl_module",
  "ngx_http_proxy_module",
  "ngx_http_random_index_module",
  "ngx_http_realip_module",
  "ngx_http_referer_module",
  "ngx_http_rewrite_module",
  "ngx_http_scgi_module",
  "ngx_http_secure_link_module",
  "ngx_http_session_log_module",
  "ngx_http_slice_module",
  "ngx_http_split_clients_module",
  "ngx_http_ssi_module",
  "ngx_http_ssl_module",
  "ngx_http_status_module",
  "ngx_http_stub_status_module",
  "ngx_http_sub_module",
  "ngx_http_tunnel_module",
  "ngx_http_upstream_conf_module",
  "ngx_http_upstream_hc_module",
  "ngx_http_upstream_module",
  "ngx_http_userid_module",
  "ngx_http_uwsgi_module",
  "ngx_http_v2_module",
  "ngx_http_v3_module",
  "ngx_http_xslt_module",
  "ngx_mail_auth_http_module",
  "ngx_mail_core_module",
  "ngx_mail_imap_module",
  "ngx_mail_pop3_module",
  "ngx_mail_proxy_module",
  "ngx_mail_realip_module",
  "ngx_mail_smtp_module",
  "ngx_mail_ssl_module",
  "ngx_mgmt_module",
  "ngx_otel_module",
  "ngx_stream_access_module",
  "ngx_stream_core_module",
  "ngx_stream_geo_module",
  "ngx_stream_geoip_module",
  "ngx_stream_js_module",
  "ngx_stream_keyval_module",
  "ngx_stream_limit_conn_module",
  "ngx_stream_log_module",
  "ngx_stream_map_module",
  "ngx_stream_mqtt_filter_module",
  "ngx_stream_mqtt_preread_module",
  "ngx_stream_num_map_module",
  "ngx_stream_pass_module",
  "ngx_stream_proxy_module",
  "ngx_stream_realip_module",
  "ngx_stream_return_module",
  "ngx_stream_set_module",
  "ngx_stream_split_clients_module",
  "ngx_stream_ssl_module",
  "ngx_stream_ssl_preread_module",
  "ngx_stream_upstream_hc_module",
  "ngx_stream_upstream_module",
  "ngx_stream_zone_sync_module"
];

export const NGINX_DIRECTIVES: readonly NginxDirectiveDoc[] = [
  {
    "name": "absolute_redirect",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#absolute_redirect",
    "syntax": "absolute_redirect on | off;",
    "default": "absolute_redirect on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If disabled, redirects issued by nginx will be relative.",
    "isBlock": false
  },
  {
    "name": "accept_mutex",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#accept_mutex",
    "syntax": "accept_mutex on | off;",
    "default": "accept_mutex off;",
    "contexts": [
      "events"
    ],
    "summary": "If accept_mutex is enabled, worker processes will accept new connections by turn. Otherwise, all worker processes will be notified about new connections, and if volume of new connections is low, some of the worker pro...",
    "isBlock": false
  },
  {
    "name": "accept_mutex_delay",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#accept_mutex_delay",
    "syntax": "accept_mutex_delay time;",
    "default": "accept_mutex_delay 500ms;",
    "contexts": [
      "events"
    ],
    "summary": "If accept_mutex is enabled, specifies the maximum time during which a worker process will try to restart accepting new connections if another worker process is currently accepting new connections.",
    "isBlock": false
  },
  {
    "name": "accept_terms_of_service",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#accept_terms_of_service",
    "syntax": "accept_terms_of_service;",
    "default": "—",
    "contexts": [
      "acme_issuer"
    ],
    "summary": "Agrees to the terms of service under which the ACME server will be used. Some servers require accepting the terms of service before account registration. The terms are usually available on the ACME server's website, a...",
    "isBlock": false
  },
  {
    "name": "access_log",
    "module": "ngx_http_log_module",
    "scope": "http",
    "docPath": "http/ngx_http_log_module.html#access_log",
    "syntax": "access_log path [format [buffer=size] [gzip[=level]] [flush=time] [if=condition]];  |  access_log off;",
    "default": "access_log logs/access.log combined;",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location",
      "limit_except"
    ],
    "summary": "Sets the path, format, and configuration for a buffered log write. Several logs can be specified on the same configuration level. Logging to syslog can be configured by specifying the “syslog:” prefix in the first par...",
    "isBlock": false
  },
  {
    "name": "access_log",
    "module": "ngx_stream_log_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_log_module.html#access_log",
    "syntax": "access_log path format [buffer=size] [gzip[=level]] [flush=time] [if=condition];  |  access_log off;",
    "default": "access_log off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the path, format, and configuration for a buffered log write. Several logs can be specified on the same configuration level. Logging to syslog can be configured by specifying the “syslog:” prefix in the first par...",
    "isBlock": false
  },
  {
    "name": "account_key",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#account_key",
    "syntax": "account_key alg[:size] | file;",
    "default": "—",
    "contexts": [
      "acme_issuer"
    ],
    "summary": "The account's private key used for request authentication.",
    "isBlock": false
  },
  {
    "name": "acme_certificate",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#acme_certificate",
    "syntax": "acme_certificate issuer [identifier ...] [key=alg[:size]];",
    "default": "—",
    "contexts": [
      "server"
    ],
    "summary": "Defines a certificate with the list of identifiers requested from issuer issuer.",
    "isBlock": false
  },
  {
    "name": "acme_issuer",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#acme_issuer",
    "syntax": "acme_issuer name { ... }",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Defines an ACME certificate issuer object.",
    "isBlock": true
  },
  {
    "name": "acme_shared_zone",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#acme_shared_zone",
    "syntax": "acme_shared_zone zone=name:size;",
    "default": "acme_shared_zone zone=ngx_acme_shared:256k;",
    "contexts": [
      "http"
    ],
    "summary": "Allows increasing the size of in-memory storage of the module. The shared memory zone will be used to store the issued certificates, keys and challenge data for all the configured certificate issuers.",
    "isBlock": false
  },
  {
    "name": "add_after_body",
    "module": "ngx_http_addition_module",
    "scope": "http",
    "docPath": "http/ngx_http_addition_module.html#add_after_body",
    "syntax": "add_after_body uri;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Adds the text returned as a result of processing a given subrequest after the response body. An empty string (\"\") as a parameter cancels addition inherited from the previous configuration level.",
    "isBlock": false
  },
  {
    "name": "add_before_body",
    "module": "ngx_http_addition_module",
    "scope": "http",
    "docPath": "http/ngx_http_addition_module.html#add_before_body",
    "syntax": "add_before_body uri;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Adds the text returned as a result of processing a given subrequest before the response body. An empty string (\"\") as a parameter cancels addition inherited from the previous configuration level.",
    "isBlock": false
  },
  {
    "name": "add_header",
    "module": "ngx_http_headers_module",
    "scope": "http",
    "docPath": "http/ngx_http_headers_module.html#add_header",
    "syntax": "add_header name value [always];",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Adds the specified field to a response header provided that the response code equals 200, 201 (1.3.10), 204, 206, 301, 302, 303, 304, 307 (1.1.16, 1.0.13), or 308 (1.13.0). Parameter value can contain variables.",
    "isBlock": false
  },
  {
    "name": "add_header_inherit",
    "module": "ngx_http_headers_module",
    "scope": "http",
    "docPath": "http/ngx_http_headers_module.html#add_header_inherit",
    "syntax": "add_header_inherit on | off | merge;",
    "default": "add_header_inherit on;",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Allows altering inheritance rules for the values specified in the add_header directives. By default, the standard inheritance model is used.",
    "isBlock": false
  },
  {
    "name": "add_trailer",
    "module": "ngx_http_headers_module",
    "scope": "http",
    "docPath": "http/ngx_http_headers_module.html#add_trailer",
    "syntax": "add_trailer name value [always];",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Adds the specified field to the end of a response provided that the response code equals 200, 201, 206, 301, 302, 303, 307, or 308. Parameter value can contain variables.",
    "isBlock": false
  },
  {
    "name": "add_trailer_inherit",
    "module": "ngx_http_headers_module",
    "scope": "http",
    "docPath": "http/ngx_http_headers_module.html#add_trailer_inherit",
    "syntax": "add_trailer_inherit on | off | merge;",
    "default": "add_trailer_inherit on;",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Allows altering inheritance rules for the values specified in the add_trailer directives. By default, the standard inheritance model is used.",
    "isBlock": false
  },
  {
    "name": "addition_types",
    "module": "ngx_http_addition_module",
    "scope": "http",
    "docPath": "http/ngx_http_addition_module.html#addition_types",
    "syntax": "addition_types mime-type ...;",
    "default": "addition_types text/html;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows adding text in responses with the specified MIME types, in addition to “text/html”. The special value “*” matches any MIME type (0.8.29).",
    "isBlock": false
  },
  {
    "name": "aio",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#aio",
    "syntax": "aio on | off | threads[=pool];",
    "default": "aio off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables the use of asynchronous file I/O (AIO) on FreeBSD and Linux:",
    "isBlock": false
  },
  {
    "name": "aio_write",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#aio_write",
    "syntax": "aio_write on | off;",
    "default": "aio_write off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If aio is enabled, specifies whether it is used for writing files. Currently, this only works when using aio threads and is limited to writing temporary files with data received from proxied servers.",
    "isBlock": false
  },
  {
    "name": "alias",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#alias",
    "syntax": "alias path;",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Defines a replacement for the specified location. For example, with the following configuration",
    "isBlock": false
  },
  {
    "name": "allow",
    "module": "ngx_http_access_module",
    "scope": "http",
    "docPath": "http/ngx_http_access_module.html#allow",
    "syntax": "allow address | CIDR | unix: | all;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location",
      "limit_except"
    ],
    "summary": "Allows access for the specified network or address. If the special value unix: is specified (1.5.1), allows access for all UNIX-domain sockets.",
    "isBlock": false
  },
  {
    "name": "allow",
    "module": "ngx_stream_access_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_access_module.html#allow",
    "syntax": "allow address | CIDR | unix: | all;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Allows access for the specified network or address. If the special value unix: is specified, allows access for all UNIX-domain sockets.",
    "isBlock": false
  },
  {
    "name": "ancient_browser",
    "module": "ngx_http_browser_module",
    "scope": "http",
    "docPath": "http/ngx_http_browser_module.html#ancient_browser",
    "syntax": "ancient_browser string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If any of the specified substrings is found in the “User-Agent” request header field, the browser will be considered ancient. The special string “netscape4” corresponds to the regular expression “^Mozilla/[1-4]”.",
    "isBlock": false
  },
  {
    "name": "ancient_browser_value",
    "module": "ngx_http_browser_module",
    "scope": "http",
    "docPath": "http/ngx_http_browser_module.html#ancient_browser_value",
    "syntax": "ancient_browser_value string;",
    "default": "ancient_browser_value 1;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a value for the $ancient_browser variables.",
    "isBlock": false
  },
  {
    "name": "api",
    "module": "ngx_http_api_module",
    "scope": "http",
    "docPath": "http/ngx_http_api_module.html#api",
    "syntax": "api [write=on|off];",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Turns on the REST API interface in the surrounding location. Access to this location should be limited.",
    "isBlock": false
  },
  {
    "name": "auth_basic",
    "module": "ngx_http_auth_basic_module",
    "scope": "http",
    "docPath": "http/ngx_http_auth_basic_module.html#auth_basic",
    "syntax": "auth_basic string | off;",
    "default": "auth_basic off;",
    "contexts": [
      "http",
      "server",
      "location",
      "limit_except"
    ],
    "summary": "Enables validation of user name and password using the “HTTP Basic Authentication” protocol. The specified parameter is used as a realm. Parameter value can contain variables (1.3.10, 1.2.7). The special value off can...",
    "isBlock": false
  },
  {
    "name": "auth_basic_user_file",
    "module": "ngx_http_auth_basic_module",
    "scope": "http",
    "docPath": "http/ngx_http_auth_basic_module.html#auth_basic_user_file",
    "syntax": "auth_basic_user_file file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location",
      "limit_except"
    ],
    "summary": "Specifies a file that keeps user names and passwords, in the following format:",
    "isBlock": false
  },
  {
    "name": "auth_delay",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#auth_delay",
    "syntax": "auth_delay time;",
    "default": "auth_delay 0s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Delays processing of unauthorized requests with 401 response code to prevent timing attacks when access is limited by password, by the result of subrequest, or by JWT.",
    "isBlock": false
  },
  {
    "name": "auth_http",
    "module": "ngx_mail_auth_http_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_auth_http_module.html#auth_http",
    "syntax": "auth_http URL;",
    "default": "—",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets the URL of the HTTP authentication server. The protocol is described below.",
    "isBlock": false
  },
  {
    "name": "auth_http_header",
    "module": "ngx_mail_auth_http_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_auth_http_module.html#auth_http_header",
    "syntax": "auth_http_header header value;",
    "default": "—",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Appends the specified header to requests sent to the authentication server. This header can be used as the shared secret to verify that the request comes from nginx. For example:",
    "isBlock": false
  },
  {
    "name": "auth_http_pass_client_cert",
    "module": "ngx_mail_auth_http_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_auth_http_module.html#auth_http_pass_client_cert",
    "syntax": "auth_http_pass_client_cert on | off;",
    "default": "auth_http_pass_client_cert off;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Appends the “Auth-SSL-Cert” header with the client certificate in the PEM format (urlencoded) to requests sent to the authentication server.",
    "isBlock": false
  },
  {
    "name": "auth_http_timeout",
    "module": "ngx_mail_auth_http_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_auth_http_module.html#auth_http_timeout",
    "syntax": "auth_http_timeout time;",
    "default": "auth_http_timeout 60s;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets the timeout for communication with the authentication server.",
    "isBlock": false
  },
  {
    "name": "auth_jwt",
    "module": "ngx_http_auth_jwt_module",
    "scope": "http",
    "docPath": "http/ngx_http_auth_jwt_module.html#auth_jwt",
    "syntax": "auth_jwt string [token=$variable] | off;",
    "default": "auth_jwt off;",
    "contexts": [
      "http",
      "server",
      "location",
      "limit_except"
    ],
    "summary": "Enables validation of JSON Web Token. The specified string is used as a realm. Parameter value can contain variables.",
    "isBlock": false
  },
  {
    "name": "auth_jwt_claim_set",
    "module": "ngx_http_auth_jwt_module",
    "scope": "http",
    "docPath": "http/ngx_http_auth_jwt_module.html#auth_jwt_claim_set",
    "syntax": "auth_jwt_claim_set $variable name ...;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets the variable to a JWT claim parameter identified by key names. Name matching starts from the top level of the JSON tree. For arrays, the variable keeps a list of array elements separated by commas.",
    "isBlock": false
  },
  {
    "name": "auth_jwt_header_set",
    "module": "ngx_http_auth_jwt_module",
    "scope": "http",
    "docPath": "http/ngx_http_auth_jwt_module.html#auth_jwt_header_set",
    "syntax": "auth_jwt_header_set $variable name ...;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets the variable to a JOSE header parameter identified by key names. Name matching starts from the top level of the JSON tree. For arrays, the variable keeps a list of array elements separated by commas.",
    "isBlock": false
  },
  {
    "name": "auth_jwt_key_cache",
    "module": "ngx_http_auth_jwt_module",
    "scope": "http",
    "docPath": "http/ngx_http_auth_jwt_module.html#auth_jwt_key_cache",
    "syntax": "auth_jwt_key_cache time;",
    "default": "auth_jwt_key_cache 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables caching of keys obtained from a file or from a subrequest, and sets caching time for them. Caching of keys obtained from variables is not supported. By default, caching of keys is disabled.",
    "isBlock": false
  },
  {
    "name": "auth_jwt_key_file",
    "module": "ngx_http_auth_jwt_module",
    "scope": "http",
    "docPath": "http/ngx_http_auth_jwt_module.html#auth_jwt_key_file",
    "syntax": "auth_jwt_key_file file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location",
      "limit_except"
    ],
    "summary": "Specifies a file in JSON Web Key Set format for validating JWT signature. Parameter value can contain variables.",
    "isBlock": false
  },
  {
    "name": "auth_jwt_key_request",
    "module": "ngx_http_auth_jwt_module",
    "scope": "http",
    "docPath": "http/ngx_http_auth_jwt_module.html#auth_jwt_key_request",
    "syntax": "auth_jwt_key_request uri;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location",
      "limit_except"
    ],
    "summary": "Allows retrieving a JSON Web Key Set file from a subrequest for validating JWT signature and sets the URI where the subrequest will be sent to. Parameter value can contain variables. To avoid validation overhead, it i...",
    "isBlock": false
  },
  {
    "name": "auth_jwt_leeway",
    "module": "ngx_http_auth_jwt_module",
    "scope": "http",
    "docPath": "http/ngx_http_auth_jwt_module.html#auth_jwt_leeway",
    "syntax": "auth_jwt_leeway time;",
    "default": "auth_jwt_leeway 0s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the maximum allowable leeway to compensate clock skew when verifying the exp and nbf JWT claims.",
    "isBlock": false
  },
  {
    "name": "auth_jwt_require",
    "module": "ngx_http_auth_jwt_module",
    "scope": "http",
    "docPath": "http/ngx_http_auth_jwt_module.html#auth_jwt_require",
    "syntax": "auth_jwt_require $value ... [error=401 | 403] ;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location",
      "limit_except"
    ],
    "summary": "Specifies additional checks for JWT validation. The value can contain text, variables, and their combination, and must start with a variable (1.21.7). The authentication will succeed only if all the values are not emp...",
    "isBlock": false
  },
  {
    "name": "auth_jwt_type",
    "module": "ngx_http_auth_jwt_module",
    "scope": "http",
    "docPath": "http/ngx_http_auth_jwt_module.html#auth_jwt_type",
    "syntax": "auth_jwt_type signed | encrypted | nested;",
    "default": "auth_jwt_type signed;",
    "contexts": [
      "http",
      "server",
      "location",
      "limit_except"
    ],
    "summary": "Specifies which type of JSON Web Token to expect: JWS (signed), JWE (encrypted), or signed and then encrypted Nested JWT (nested) (1.21.0).",
    "isBlock": false
  },
  {
    "name": "auth_oidc",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#auth_oidc",
    "syntax": "auth_oidc name | off;",
    "default": "auth_oidc off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables end user authentication with the specified OpenID Provider.",
    "isBlock": false
  },
  {
    "name": "auth_request",
    "module": "ngx_http_auth_request_module",
    "scope": "http",
    "docPath": "http/ngx_http_auth_request_module.html#auth_request",
    "syntax": "auth_request uri | off;",
    "default": "auth_request off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables authorization based on the result of a subrequest and sets the URI to which the subrequest will be sent.",
    "isBlock": false
  },
  {
    "name": "auth_request_set",
    "module": "ngx_http_auth_request_module",
    "scope": "http",
    "docPath": "http/ngx_http_auth_request_module.html#auth_request_set",
    "syntax": "auth_request_set $variable value;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the request variable to the given value after the authorization request completes. The value may contain variables from the authorization request, such as $upstream_http_*.",
    "isBlock": false
  },
  {
    "name": "auth_require",
    "module": "ngx_http_auth_require_module",
    "scope": "http",
    "docPath": "http/ngx_http_auth_require_module.html#auth_require",
    "syntax": "auth_require $value ... [error=4xx | 5xx] ;",
    "default": "auth_require off;",
    "contexts": [
      "http",
      "server",
      "location",
      "limit_except"
    ],
    "summary": "Enables authorization based on the specified variables. The access is allowed only if all the variables are not empty and are not equal to “0”. Otherwise, the module returns 403 code, which can be overridden by the er...",
    "isBlock": false
  },
  {
    "name": "autoindex",
    "module": "ngx_http_autoindex_module",
    "scope": "http",
    "docPath": "http/ngx_http_autoindex_module.html#autoindex",
    "syntax": "autoindex on | off;",
    "default": "autoindex off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables the directory listing output.",
    "isBlock": false
  },
  {
    "name": "autoindex_exact_size",
    "module": "ngx_http_autoindex_module",
    "scope": "http",
    "docPath": "http/ngx_http_autoindex_module.html#autoindex_exact_size",
    "syntax": "autoindex_exact_size on | off;",
    "default": "autoindex_exact_size on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "For the HTML format, specifies whether exact file sizes should be output in the directory listing, or rather rounded to kilobytes, megabytes, and gigabytes.",
    "isBlock": false
  },
  {
    "name": "autoindex_format",
    "module": "ngx_http_autoindex_module",
    "scope": "http",
    "docPath": "http/ngx_http_autoindex_module.html#autoindex_format",
    "syntax": "autoindex_format html | xml | json | jsonp;",
    "default": "autoindex_format html;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the format of a directory listing.",
    "isBlock": false
  },
  {
    "name": "autoindex_localtime",
    "module": "ngx_http_autoindex_module",
    "scope": "http",
    "docPath": "http/ngx_http_autoindex_module.html#autoindex_localtime",
    "syntax": "autoindex_localtime on | off;",
    "default": "autoindex_localtime off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "For the HTML format, specifies whether times in the directory listing should be output in the local time zone or UTC.",
    "isBlock": false
  },
  {
    "name": "break",
    "module": "ngx_http_rewrite_module",
    "scope": "http",
    "docPath": "http/ngx_http_rewrite_module.html#break",
    "syntax": "break;",
    "default": "—",
    "contexts": [
      "server",
      "location",
      "if"
    ],
    "summary": "Stops processing the current set of ngx_http_rewrite_module directives.",
    "isBlock": false
  },
  {
    "name": "challenge",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#challenge",
    "syntax": "challenge type;",
    "default": "challenge http-01;",
    "contexts": [
      "acme_issuer"
    ],
    "summary": "Specifies the ACME challenge type to be used for the issuer.",
    "isBlock": false
  },
  {
    "name": "charset",
    "module": "ngx_http_charset_module",
    "scope": "http",
    "docPath": "http/ngx_http_charset_module.html#charset",
    "syntax": "charset charset | off;",
    "default": "charset off;",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Adds the specified charset to the “Content-Type” response header field. If this charset is different from the charset specified in the source_charset directive, a conversion is performed.",
    "isBlock": false
  },
  {
    "name": "charset_map",
    "module": "ngx_http_charset_module",
    "scope": "http",
    "docPath": "http/ngx_http_charset_module.html#charset_map",
    "syntax": "charset_map charset1 charset2 { ... }",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Describes the conversion table from one charset to another. A reverse conversion table is built using the same data. Character codes are given in hexadecimal. Missing characters in the range 80-FF are replaced with “?...",
    "isBlock": true
  },
  {
    "name": "charset_types",
    "module": "ngx_http_charset_module",
    "scope": "http",
    "docPath": "http/ngx_http_charset_module.html#charset_types",
    "syntax": "charset_types mime-type ...;",
    "default": "charset_types text/html text/xml text/plain text/vnd.wap.wml application/javascript application/rss+xml;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables module processing in responses with the specified MIME types in addition to “text/html”. The special value “*” matches any MIME type (0.8.29).",
    "isBlock": false
  },
  {
    "name": "chunked_transfer_encoding",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#chunked_transfer_encoding",
    "syntax": "chunked_transfer_encoding on | off;",
    "default": "chunked_transfer_encoding on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows disabling chunked transfer encoding in HTTP/1.1. It may come in handy when using a software failing to support chunked encoding despite the standard’s requirement.",
    "isBlock": false
  },
  {
    "name": "client_body_buffer_size",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#client_body_buffer_size",
    "syntax": "client_body_buffer_size size;",
    "default": "client_body_buffer_size 8k|16k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets buffer size for reading client request body. In case the request body is larger than the buffer, the whole body or only its part is written to a temporary file. By default, buffer size is equal to two memory page...",
    "isBlock": false
  },
  {
    "name": "client_body_early_read",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#client_body_early_read",
    "syntax": "client_body_early_read string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables reading of the client request body immediately after the request headers are received, using the request body read settings from the server block. If at least one value of the string parameters is not empty an...",
    "isBlock": false
  },
  {
    "name": "client_body_in_file_only",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#client_body_in_file_only",
    "syntax": "client_body_in_file_only on | clean | off;",
    "default": "client_body_in_file_only off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether nginx should save the entire client request body into a file. This directive can be used during debugging, or when using the $request_body_file variable, or the $r->request_body_file method of the m...",
    "isBlock": false
  },
  {
    "name": "client_body_in_single_buffer",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#client_body_in_single_buffer",
    "syntax": "client_body_in_single_buffer on | off;",
    "default": "client_body_in_single_buffer off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether nginx should save the entire client request body in a single buffer. The directive is recommended when using the $request_body variable, to save the number of copy operations involved.",
    "isBlock": false
  },
  {
    "name": "client_body_temp_path",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#client_body_temp_path",
    "syntax": "client_body_temp_path path [level1 [level2 [level3]]];",
    "default": "client_body_temp_path client_body_temp;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a directory for storing temporary files holding client request bodies. Up to three-level subdirectory hierarchy can be used under the specified directory. For example, in the following configuration",
    "isBlock": false
  },
  {
    "name": "client_body_timeout",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#client_body_timeout",
    "syntax": "client_body_timeout time;",
    "default": "client_body_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for reading client request body. The timeout is set only for a period between two successive read operations, not for the transmission of the whole request body. If a client does not transmit anythin...",
    "isBlock": false
  },
  {
    "name": "client_header_buffer_size",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#client_header_buffer_size",
    "syntax": "client_header_buffer_size size;",
    "default": "client_header_buffer_size 1k;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets buffer size for reading client request header. For most requests, a buffer of 1K bytes is enough. However, if a request includes long cookies, or comes from a WAP client, it may not fit into 1K. If a request line...",
    "isBlock": false
  },
  {
    "name": "client_header_timeout",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#client_header_timeout",
    "syntax": "client_header_timeout time;",
    "default": "client_header_timeout 60s;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Defines a timeout for reading client request header. If a client does not transmit the entire header within this time, the request is terminated with the 408 (Request Time-out) error.",
    "isBlock": false
  },
  {
    "name": "client_id",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#client_id",
    "syntax": "client_id string;",
    "default": "—",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Specifies the client ID of the Relying Party; required directive.",
    "isBlock": false
  },
  {
    "name": "client_max_body_size",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#client_max_body_size",
    "syntax": "client_max_body_size size;",
    "default": "client_max_body_size 1m;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the maximum allowed size of the client request body. If the size in a request exceeds the configured value, the 413 (Request Entity Too Large) error is returned to the client. Please be aware that browsers cannot...",
    "isBlock": false
  },
  {
    "name": "client_secret",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#client_secret",
    "syntax": "client_secret string;",
    "default": "—",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Specifies a secret value used to authenticate the Relying Party with the OpenID Provider. The supported authentication methods are client_secret_basic and client_secret_post (1.29.3). The method is selected based on t...",
    "isBlock": false
  },
  {
    "name": "common_name_in_csr",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#common_name_in_csr",
    "syntax": "common_name_in_csr on | off;",
    "default": "common_name_in_csr off;",
    "contexts": [
      "acme_issuer"
    ],
    "summary": "If enabled, sets the Subject Common Name in the certificate request to the first DNS name or the first IP address provided.",
    "isBlock": false
  },
  {
    "name": "config_url",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#config_url",
    "syntax": "config_url URL;",
    "default": "config_url <issuer>/.well-known/openid-configuration;",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Sets a custom URL to retrieve the OpenID Provider metadata.",
    "isBlock": false
  },
  {
    "name": "connection_pool_size",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#connection_pool_size",
    "syntax": "connection_pool_size size;",
    "default": "connection_pool_size 256|512;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Allows accurate tuning of per-connection memory allocations. This directive has minimal impact on performance and should not generally be used. By default, the size is equal to 256 bytes on 32-bit platforms and 512 by...",
    "isBlock": false
  },
  {
    "name": "contact",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#contact",
    "syntax": "contact URL;",
    "default": "—",
    "contexts": [
      "acme_issuer"
    ],
    "summary": "Sets an array of URLs that the ACME server can use to contact the client regarding account issues. The mailto: scheme will be used unless specified explicitly.",
    "isBlock": false
  },
  {
    "name": "cookie_name",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#cookie_name",
    "syntax": "cookie_name name;",
    "default": "cookie_name NGX_OIDC_SESSION;",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Sets the name of a session cookie.",
    "isBlock": false
  },
  {
    "name": "create_full_put_path",
    "module": "ngx_http_dav_module",
    "scope": "http",
    "docPath": "http/ngx_http_dav_module.html#create_full_put_path",
    "syntax": "create_full_put_path on | off;",
    "default": "create_full_put_path off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "The WebDAV specification only allows creating files in already existing directories. This directive allows creating all needed intermediate directories.",
    "isBlock": false
  },
  {
    "name": "daemon",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#daemon",
    "syntax": "daemon on | off;",
    "default": "daemon on;",
    "contexts": [
      "main"
    ],
    "summary": "Determines whether nginx should become a daemon. Mainly used during development.",
    "isBlock": false
  },
  {
    "name": "dav_access",
    "module": "ngx_http_dav_module",
    "scope": "http",
    "docPath": "http/ngx_http_dav_module.html#dav_access",
    "syntax": "dav_access users:permissions ...;",
    "default": "dav_access user:rw;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets access permissions for newly created files and directories, e.g.:",
    "isBlock": false
  },
  {
    "name": "dav_methods",
    "module": "ngx_http_dav_module",
    "scope": "http",
    "docPath": "http/ngx_http_dav_module.html#dav_methods",
    "syntax": "dav_methods off | method ...;",
    "default": "dav_methods off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows the specified HTTP and WebDAV methods. The parameter off denies all methods processed by this module. The following methods are supported: PUT, DELETE, MKCOL, COPY, and MOVE.",
    "isBlock": false
  },
  {
    "name": "db_auth",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_auth",
    "syntax": "db_auth string;",
    "default": "—",
    "contexts": [
      "location",
      "if in location"
    ],
    "summary": "Specifies the password string used to authenticate connections to a database server. An empty value disables authentication. Authentication with a separate username and password arguments is not supported.",
    "isBlock": false
  },
  {
    "name": "db_bind",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_bind",
    "syntax": "db_bind address [transparent] | off;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Makes outgoing connections to a database server originate from the specified local IP address with an optional port. Parameter value can contain variables. The special value off cancels the effect of the db_bind direc...",
    "isBlock": false
  },
  {
    "name": "db_buffer_size",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_buffer_size",
    "syntax": "db_buffer_size size;",
    "default": "db_buffer_size 4k|8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the size of the buffer used for reading the database response. By default, the buffer size is equal to one memory page. This is either 4K or 8K, depending on a platform. It can be made smaller, however.",
    "isBlock": false
  },
  {
    "name": "db_cache",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_cache",
    "syntax": "db_cache zone [timeout=time] [max_size=size] [not_found=on|off|time] ;",
    "default": "—",
    "contexts": [
      "location",
      "if in location"
    ],
    "summary": "Enables caching of database lookup results in a shared memory zone defined by the keyval_zone directive. The cache key is the value of the db_get directive, evaluated for the current request. If a cached result is fou...",
    "isBlock": false
  },
  {
    "name": "db_connect_timeout",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_connect_timeout",
    "syntax": "db_connect_timeout time;",
    "default": "db_connect_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for establishing a connection with a database server. It should be noted that this timeout cannot usually exceed 75 seconds.",
    "isBlock": false
  },
  {
    "name": "db_get",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_get",
    "syntax": "db_get key;",
    "default": "—",
    "contexts": [
      "location",
      "if in location"
    ],
    "summary": "Specifies the key to retrieve from the database. The key can contain text, variables, and their combination. An empty key is not allowed.",
    "isBlock": false
  },
  {
    "name": "db_name",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_name",
    "syntax": "db_name string;",
    "default": "—",
    "contexts": [
      "location",
      "if in location"
    ],
    "summary": "Sets the database to use for lookup requests.",
    "isBlock": false
  },
  {
    "name": "db_next_upstream",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_next_upstream",
    "syntax": "db_next_upstream error | timeout | invalid_response | not_found off ...;  |  db_next_upstream off;",
    "default": "db_next_upstream error timeout;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies the conditions under which a request can be passed to the next database server:",
    "isBlock": false
  },
  {
    "name": "db_next_upstream_timeout",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_next_upstream_timeout",
    "syntax": "db_next_upstream_timeout time;",
    "default": "db_next_upstream_timeout 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the time during which a request can be passed to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "db_next_upstream_tries",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_next_upstream_tries",
    "syntax": "db_next_upstream_tries number;",
    "default": "db_next_upstream_tries 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the number of possible tries for passing a request to the next server. The limit includes the initial attempt. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "db_pass",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_pass",
    "syntax": "db_pass name;",
    "default": "—",
    "contexts": [
      "location",
      "if in location"
    ],
    "summary": "Specifies the upstream group used for database lookups:",
    "isBlock": false
  },
  {
    "name": "db_read_timeout",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_read_timeout",
    "syntax": "db_read_timeout time;",
    "default": "db_read_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for reading data from a database server. The timeout is set only between two successive read operations, not for the transmission of the whole response. If the database server does not transmit anyth...",
    "isBlock": false
  },
  {
    "name": "db_send_timeout",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_send_timeout",
    "syntax": "db_send_timeout time;",
    "default": "db_send_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for sending data to a database server.",
    "isBlock": false
  },
  {
    "name": "db_socket_keepalive",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_socket_keepalive",
    "syntax": "db_socket_keepalive on | off;",
    "default": "db_socket_keepalive off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Configures the “TCP keepalive” behavior for outgoing connections to a database server. If enabled, the SO_KEEPALIVE socket option is turned on.",
    "isBlock": false
  },
  {
    "name": "db_ssl",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl",
    "syntax": "db_ssl on | off;",
    "default": "db_ssl off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables TLS for connections to database servers.",
    "isBlock": false
  },
  {
    "name": "db_ssl_certificate",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_certificate",
    "syntax": "db_ssl_certificate file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with the certificate in the PEM format used for authentication to a database server. The corresponding db_ssl_certificate_key must also be configured.",
    "isBlock": false
  },
  {
    "name": "db_ssl_certificate_cache",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_certificate_cache",
    "syntax": "db_ssl_certificate_cache off;  |  db_ssl_certificate_cache max=number [inactive=time] [valid=time] ;",
    "default": "db_ssl_certificate_cache off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a cache that stores SSL certificates and secret keys specified with variables.",
    "isBlock": false
  },
  {
    "name": "db_ssl_certificate_key",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_certificate_key",
    "syntax": "db_ssl_certificate_key file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with the secret key in the PEM format for the certificate configured by the db_ssl_certificate directive.",
    "isBlock": false
  },
  {
    "name": "db_ssl_ciphers",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_ciphers",
    "syntax": "db_ssl_ciphers ciphers;",
    "default": "db_ssl_ciphers DEFAULT;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies the enabled ciphers for connections to database servers. The ciphers are specified in the format understood by the OpenSSL library.",
    "isBlock": false
  },
  {
    "name": "db_ssl_conf_command",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_conf_command",
    "syntax": "db_ssl_conf_command name value;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets arbitrary OpenSSL configuration commands when establishing a connection with the database server.",
    "isBlock": false
  },
  {
    "name": "db_ssl_crl",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_crl",
    "syntax": "db_ssl_crl file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with revoked certificates (CRL) in the PEM format used to verify the certificate of the database server. When using intermediate certificates, their CRLs should be specified in the same file.",
    "isBlock": false
  },
  {
    "name": "db_ssl_key_log",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_key_log",
    "syntax": "db_ssl_key_log file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables logging of database server connection SSL keys and specifies the path to the key log file. Keys are logged in the SSLKEYLOGFILE format compatible with Wireshark.",
    "isBlock": false
  },
  {
    "name": "db_ssl_name",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_name",
    "syntax": "db_ssl_name name;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows overriding the server name used to verify the database server certificate and to be passed through SNI when establishing a connection with the database server.",
    "isBlock": false
  },
  {
    "name": "db_ssl_password_file",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_password_file",
    "syntax": "db_ssl_password_file file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with passphrases for secret keys where each passphrase is specified on a separate line. Passphrases are tried in turn when loading the key.",
    "isBlock": false
  },
  {
    "name": "db_ssl_protocols",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_protocols",
    "syntax": "db_ssl_protocols [SSLv2] [SSLv3] [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];",
    "default": "db_ssl_protocols TLSv1.2 TLSv1.3;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables the specified protocols for connections to database servers.",
    "isBlock": false
  },
  {
    "name": "db_ssl_server_name",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_server_name",
    "syntax": "db_ssl_server_name on | off;",
    "default": "db_ssl_server_name off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables passing of the server name through TLS Server Name Indication extension (SNI, RFC 6066) when establishing a connection with the database server.",
    "isBlock": false
  },
  {
    "name": "db_ssl_session_reuse",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_session_reuse",
    "syntax": "db_ssl_session_reuse on | off;",
    "default": "db_ssl_session_reuse on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether SSL sessions can be reused when working with the database server. If the errors “digest check failed” appear in the logs, try disabling session reuse.",
    "isBlock": false
  },
  {
    "name": "db_ssl_trusted_certificate",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_trusted_certificate",
    "syntax": "db_ssl_trusted_certificate file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify the certificate of the database server.",
    "isBlock": false
  },
  {
    "name": "db_ssl_verify",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_verify",
    "syntax": "db_ssl_verify on | off;",
    "default": "db_ssl_verify off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables verification of the database server certificate. The db_ssl_trusted_certificate directive must also be configured. The directive is required when db_ssl_verify is enabled.",
    "isBlock": false
  },
  {
    "name": "db_ssl_verify_depth",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_ssl_verify_depth",
    "syntax": "db_ssl_verify_depth number;",
    "default": "db_ssl_verify_depth 1;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the verification depth in the database server certificate chain. The directive is required when db_ssl_verify is enabled.",
    "isBlock": false
  },
  {
    "name": "db_type",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_type",
    "syntax": "db_type type;",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Sets the database protocol used by the upstream group. Currently, only redis is supported:",
    "isBlock": false
  },
  {
    "name": "db_var",
    "module": "ngx_http_db_module",
    "scope": "http",
    "docPath": "http/ngx_http_db_module.html#db_var",
    "syntax": "db_var $variable location=URI query=string [default=string];",
    "default": "—",
    "contexts": [
      "server",
      "location",
      "if in location"
    ],
    "summary": "Creates a variable whose value is obtained from the response body of a subrequest. The location parameter sets the subrequest URI. The query parameter sets its query string. An empty query string can be specified expl...",
    "isBlock": false
  },
  {
    "name": "debug_connection",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#debug_connection",
    "syntax": "debug_connection address | CIDR | unix:;",
    "default": "—",
    "contexts": [
      "events"
    ],
    "summary": "Enables debugging log for selected client connections. Other connections will use logging level set by the error_log directive. Debugged connections are specified by IPv4 or IPv6 (1.3.0, 1.2.1) address or network. A c...",
    "isBlock": false
  },
  {
    "name": "debug_points",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#debug_points",
    "syntax": "debug_points abort | stop;",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "This directive is used for debugging.",
    "isBlock": false
  },
  {
    "name": "default_type",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#default_type",
    "syntax": "default_type mime-type;",
    "default": "default_type text/plain;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines the default MIME type of a response. Mapping of file name extensions to MIME types can be set with the types directive.",
    "isBlock": false
  },
  {
    "name": "deny",
    "module": "ngx_http_access_module",
    "scope": "http",
    "docPath": "http/ngx_http_access_module.html#deny",
    "syntax": "deny address | CIDR | unix: | all;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location",
      "limit_except"
    ],
    "summary": "Denies access for the specified network or address. If the special value unix: is specified (1.5.1), denies access for all UNIX-domain sockets.",
    "isBlock": false
  },
  {
    "name": "deny",
    "module": "ngx_stream_access_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_access_module.html#deny",
    "syntax": "deny address | CIDR | unix: | all;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Denies access for the specified network or address. If the special value unix: is specified, denies access for all UNIX-domain sockets.",
    "isBlock": false
  },
  {
    "name": "directio",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#directio",
    "syntax": "directio size | off;",
    "default": "directio off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables the use of the O_DIRECT flag (FreeBSD, Linux), the F_NOCACHE flag (macOS), or the directio() function (Solaris), when reading files that are larger than or equal to the specified size. The directive automatica...",
    "isBlock": false
  },
  {
    "name": "directio_alignment",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#directio_alignment",
    "syntax": "directio_alignment size;",
    "default": "directio_alignment 512;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the alignment for directio. In most cases, a 512-byte alignment is enough. However, when using XFS under Linux, it needs to be increased to 4K.",
    "isBlock": false
  },
  {
    "name": "disable_symlinks",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#disable_symlinks",
    "syntax": "disable_symlinks off;  |  disable_symlinks on | if_not_owner [from=part];",
    "default": "disable_symlinks off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines how symbolic links should be treated when opening files:",
    "isBlock": false
  },
  {
    "name": "early_hints",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#early_hints",
    "syntax": "early_hints string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which the 103 (Early Hints) response will be passed to a client. If at least one value of the string parameters is not empty and is not equal to “0” then the response will be passed:",
    "isBlock": false
  },
  {
    "name": "empty_gif",
    "module": "ngx_http_empty_gif_module",
    "scope": "http",
    "docPath": "http/ngx_http_empty_gif_module.html#empty_gif",
    "syntax": "empty_gif;",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Turns on module processing in a surrounding location.",
    "isBlock": false
  },
  {
    "name": "enforce_initial_report",
    "module": "ngx_mgmt_module",
    "scope": "core",
    "docPath": "ngx_mgmt_module.html#enforce_initial_report",
    "syntax": "enforce_initial_report on | off;",
    "default": "enforce_initial_report on;",
    "contexts": [
      "mgmt"
    ],
    "summary": "Enables or disables the 180-day grace period for sending the initial usage report.",
    "isBlock": false
  },
  {
    "name": "env",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#env",
    "syntax": "env variable[=value];",
    "default": "env TZ;",
    "contexts": [
      "main"
    ],
    "summary": "By default, nginx removes all environment variables inherited from its parent process except the TZ variable. This directive allows preserving some of the inherited variables, changing their values, or creating new en...",
    "isBlock": false
  },
  {
    "name": "error_log",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#error_log",
    "syntax": "error_log file [level] [json];",
    "default": "error_log logs/error.log error;",
    "contexts": [
      "main",
      "http",
      "mail",
      "stream",
      "server",
      "location"
    ],
    "summary": "Configures logging. Several logs can be specified on the same configuration level (1.5.2). If on the main configuration level writing a log to a file is not explicitly defined, the default file will be used.",
    "isBlock": false
  },
  {
    "name": "error_log_tag",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#error_log_tag",
    "syntax": "error_log_tag name value;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines an additional context tag for HTTP error log messages in text or JSON format, in addition to default tags. The value can contain text, variables, and their combination:",
    "isBlock": false
  },
  {
    "name": "error_page",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#error_page",
    "syntax": "error_page code ... [=[response]] uri;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Defines the URI that will be shown for the specified errors. A uri value can contain variables.",
    "isBlock": false
  },
  {
    "name": "etag",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#etag",
    "syntax": "etag on | off;",
    "default": "etag on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables automatic generation of the “ETag” response header field for static resources.",
    "isBlock": false
  },
  {
    "name": "events",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#events",
    "syntax": "events { ... }",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Provides the configuration file context in which the directives that affect connection processing are specified.",
    "isBlock": true
  },
  {
    "name": "expires",
    "module": "ngx_http_headers_module",
    "scope": "http",
    "docPath": "http/ngx_http_headers_module.html#expires",
    "syntax": "expires [modified] time;  |  expires epoch | max | off;",
    "default": "expires off;",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Enables or disables adding or modifying the “Expires” and “Cache-Control” response header fields provided that the response code equals 200, 201 (1.3.10), 204, 206, 301, 302, 303, 304, 307 (1.1.16, 1.0.13), or 308 (1....",
    "isBlock": false
  },
  {
    "name": "external_account_key",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#external_account_key",
    "syntax": "external_account_key kid file;",
    "default": "—",
    "contexts": [
      "acme_issuer"
    ],
    "summary": "Specifies a key identifier kid and a file with the MAC key for external account authorization.",
    "isBlock": false
  },
  {
    "name": "extra_auth_args",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#extra_auth_args",
    "syntax": "extra_auth_args string;",
    "default": "—",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Sets additional query arguments for the authentication request URL.",
    "isBlock": false
  },
  {
    "name": "f4f",
    "module": "ngx_http_f4f_module",
    "scope": "http",
    "docPath": "http/ngx_http_f4f_module.html#f4f",
    "syntax": "f4f;",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Turns on module processing in the surrounding location.",
    "isBlock": false
  },
  {
    "name": "f4f_buffer_size",
    "module": "ngx_http_f4f_module",
    "scope": "http",
    "docPath": "http/ngx_http_f4f_module.html#f4f_buffer_size",
    "syntax": "f4f_buffer_size size;",
    "default": "f4f_buffer_size 512k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the size of the buffer used for reading the .f4x index file.",
    "isBlock": false
  },
  {
    "name": "fastcgi_allow_upstream",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_allow_upstream",
    "syntax": "fastcgi_allow_upstream string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which access to a FastCGI server is allowed or denied. If all string parameters are not empty and not equal to “0” then the access is allowed. The conditions are evaluated each time before a c...",
    "isBlock": false
  },
  {
    "name": "fastcgi_bind",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_bind",
    "syntax": "fastcgi_bind address [transparent] | off;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Makes outgoing connections to a FastCGI server originate from the specified local IP address with an optional port (1.11.2). Parameter value can contain variables (1.3.12). The special value off (1.3.12) cancels the e...",
    "isBlock": false
  },
  {
    "name": "fastcgi_bind_dynamic",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_bind_dynamic",
    "syntax": "fastcgi_bind_dynamic on | off;",
    "default": "fastcgi_bind_dynamic off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When enabled, makes the bind operation at each connection attempt.",
    "isBlock": false
  },
  {
    "name": "fastcgi_buffer_size",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_buffer_size",
    "syntax": "fastcgi_buffer_size size;",
    "default": "fastcgi_buffer_size 4k|8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the size of the buffer used for reading the first part of the response received from the FastCGI server. This part usually contains a small response header; if it exceeds the buffer size, the response is consider...",
    "isBlock": false
  },
  {
    "name": "fastcgi_buffering",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_buffering",
    "syntax": "fastcgi_buffering on | off;",
    "default": "fastcgi_buffering on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables buffering of responses from the FastCGI server.",
    "isBlock": false
  },
  {
    "name": "fastcgi_buffers",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_buffers",
    "syntax": "fastcgi_buffers number size;",
    "default": "fastcgi_buffers 8 4k|8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the number and size of the buffers used for reading a response from the FastCGI server, for a single connection. By default, the buffer size is equal to one memory page. This is either 4K or 8K, depending on a pl...",
    "isBlock": false
  },
  {
    "name": "fastcgi_busy_buffers_size",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_busy_buffers_size",
    "syntax": "fastcgi_busy_buffers_size size;",
    "default": "fastcgi_busy_buffers_size 8k|16k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When buffering of responses from the FastCGI server is enabled, limits the total size of buffers that can be busy sending a response to the client while the response is not yet fully read. In the meantime, the rest of...",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache",
    "syntax": "fastcgi_cache zone | off;",
    "default": "fastcgi_cache off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a shared memory zone used for caching. The same zone can be used in several places. Parameter value can contain variables (1.7.9). The off parameter disables caching inherited from the previous configuration l...",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache_background_update",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache_background_update",
    "syntax": "fastcgi_cache_background_update on | off;",
    "default": "fastcgi_cache_background_update off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows starting a background subrequest to update an expired cache item, while a stale cached response is returned to the client. Note that it is necessary to allow the usage of a stale cached response when it is bein...",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache_bypass",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache_bypass",
    "syntax": "fastcgi_cache_bypass string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which the response will not be taken from a cache. If at least one value of the string parameters is not empty and is not equal to “0” then the response will not be taken from the cache:",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache_key",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache_key",
    "syntax": "fastcgi_cache_key string;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a key for caching, for example",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache_lock",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache_lock",
    "syntax": "fastcgi_cache_lock on | off;",
    "default": "fastcgi_cache_lock off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When enabled, only one request at a time will be allowed to populate a new cache element identified according to the fastcgi_cache_key directive by passing a request to a FastCGI server. Other requests of the same cac...",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache_lock_age",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache_lock_age",
    "syntax": "fastcgi_cache_lock_age time;",
    "default": "fastcgi_cache_lock_age 5s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If the last request passed to the FastCGI server for populating a new cache element has not completed for the specified time, one more request may be passed to the FastCGI server.",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache_lock_timeout",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache_lock_timeout",
    "syntax": "fastcgi_cache_lock_timeout time;",
    "default": "fastcgi_cache_lock_timeout 5s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout for fastcgi_cache_lock. When the time expires, the request will be passed to the FastCGI server, however, the response will not be cached.",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache_max_range_offset",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache_max_range_offset",
    "syntax": "fastcgi_cache_max_range_offset number;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets an offset in bytes for byte-range requests. If the range is beyond the offset, the range request will be passed to the FastCGI server and the response will not be cached.",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache_methods",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache_methods",
    "syntax": "fastcgi_cache_methods GET | HEAD | POST ...;",
    "default": "fastcgi_cache_methods GET HEAD;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If the client request method is listed in this directive then the response will be cached. “GET” and “HEAD” methods are always added to the list, though it is recommended to specify them explicitly. See also the fastc...",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache_min_uses",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache_min_uses",
    "syntax": "fastcgi_cache_min_uses number;",
    "default": "fastcgi_cache_min_uses 1;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the number of requests after which the response will be cached.",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache_path",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache_path",
    "syntax": "fastcgi_cache_path path [levels=levels] [use_temp_path=on|off] keys_zone=name:size [inactive=time] [max_size=size] [min_free=size] [manager_files=number] [manager_sleep=time] [manager_threshold=time] [loader_files=number] [loader_sleep=time] [loader_threshold=time] [purger=on|off] [purger_files=number] [purger_sleep=time] [purger_threshold=time];",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets the path and other parameters of a cache. Cache data are stored in files. Both the key and file name in a cache are a result of applying the MD5 function to the proxied URL. The levels parameter defines hierarchy...",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache_purge",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache_purge",
    "syntax": "fastcgi_cache_purge string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which the request will be considered a cache purge request. If at least one value of the string parameters is not empty and is not equal to “0” then the cache entry with a corresponding cache...",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache_revalidate",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache_revalidate",
    "syntax": "fastcgi_cache_revalidate on | off;",
    "default": "fastcgi_cache_revalidate off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables revalidation of expired cache items using conditional requests with the “If-Modified-Since” and “If-None-Match” header fields.",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache_use_stale",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache_use_stale",
    "syntax": "fastcgi_cache_use_stale error | timeout | invalid_header | updating | http_500 | http_503 | http_403 | http_404 | http_429 | off ...;",
    "default": "fastcgi_cache_use_stale off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines in which cases a stale cached response can be used when an error occurs during communication with the FastCGI server. The directive’s parameters match the parameters of the fastcgi_next_upstream directive.",
    "isBlock": false
  },
  {
    "name": "fastcgi_cache_valid",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_cache_valid",
    "syntax": "fastcgi_cache_valid [code ...] time;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets caching time for different response codes. For example, the following directives",
    "isBlock": false
  },
  {
    "name": "fastcgi_catch_stderr",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_catch_stderr",
    "syntax": "fastcgi_catch_stderr string;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a string to search for in the error stream of a response received from a FastCGI server. If the string is found then it is considered that the FastCGI server has returned an invalid response. This allows handling...",
    "isBlock": false
  },
  {
    "name": "fastcgi_connect_timeout",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_connect_timeout",
    "syntax": "fastcgi_connect_timeout time;",
    "default": "fastcgi_connect_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for establishing a connection with a FastCGI server. It should be noted that this timeout cannot usually exceed 75 seconds.",
    "isBlock": false
  },
  {
    "name": "fastcgi_force_ranges",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_force_ranges",
    "syntax": "fastcgi_force_ranges on | off;",
    "default": "fastcgi_force_ranges off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables byte-range support for both cached and uncached responses from the FastCGI server regardless of the “Accept-Ranges” field in these responses.",
    "isBlock": false
  },
  {
    "name": "fastcgi_hide_header",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_hide_header",
    "syntax": "fastcgi_hide_header field;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "By default, nginx does not pass the header fields “Status” and “X-Accel-...” from the response of a FastCGI server to a client. The fastcgi_hide_header directive sets additional fields that will not be passed. If, on...",
    "isBlock": false
  },
  {
    "name": "fastcgi_ignore_client_abort",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_ignore_client_abort",
    "syntax": "fastcgi_ignore_client_abort on | off;",
    "default": "fastcgi_ignore_client_abort off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether the connection with a FastCGI server should be closed when a client closes the connection without waiting for a response.",
    "isBlock": false
  },
  {
    "name": "fastcgi_ignore_headers",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_ignore_headers",
    "syntax": "fastcgi_ignore_headers field ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Disables processing of certain response header fields from the FastCGI server. The following fields can be ignored: “X-Accel-Redirect”, “X-Accel-Expires”, “X-Accel-Limit-Rate” (1.1.6), “X-Accel-Buffering” (1.1.6), “X-...",
    "isBlock": false
  },
  {
    "name": "fastcgi_index",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_index",
    "syntax": "fastcgi_index name;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a file name that will be appended after a URI that ends with a slash, in the value of the $fastcgi_script_name variable. For example, with these settings",
    "isBlock": false
  },
  {
    "name": "fastcgi_intercept_errors",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_intercept_errors",
    "syntax": "fastcgi_intercept_errors on | off;",
    "default": "fastcgi_intercept_errors off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether FastCGI server responses with codes greater than or equal to 300 should be passed to a client or be intercepted and redirected to nginx for processing with the error_page directive.",
    "isBlock": false
  },
  {
    "name": "fastcgi_keep_conn",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_keep_conn",
    "syntax": "fastcgi_keep_conn on | off;",
    "default": "fastcgi_keep_conn off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "By default, a FastCGI server will close a connection right after sending the response. However, when this directive is set to the value on, nginx will instruct a FastCGI server to keep connections open. This is necess...",
    "isBlock": false
  },
  {
    "name": "fastcgi_limit_rate",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_limit_rate",
    "syntax": "fastcgi_limit_rate rate;",
    "default": "fastcgi_limit_rate 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the speed of reading the response from the FastCGI server. The rate is specified in bytes per second. The zero value disables rate limiting. The limit is set per a request, and so if nginx simultaneously opens...",
    "isBlock": false
  },
  {
    "name": "fastcgi_max_temp_file_size",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_max_temp_file_size",
    "syntax": "fastcgi_max_temp_file_size size;",
    "default": "fastcgi_max_temp_file_size 1024m;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When buffering of responses from the FastCGI server is enabled, and the whole response does not fit into the buffers set by the fastcgi_buffer_size and fastcgi_buffers directives, a part of the response can be saved t...",
    "isBlock": false
  },
  {
    "name": "fastcgi_next_upstream",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_next_upstream",
    "syntax": "fastcgi_next_upstream error | timeout | denied | invalid_header | http_500 | http_503 | http_403 | http_404 | http_429 | non_idempotent | off ...;",
    "default": "fastcgi_next_upstream error timeout;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies in which cases a request should be passed to the next server:",
    "isBlock": false
  },
  {
    "name": "fastcgi_next_upstream_timeout",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_next_upstream_timeout",
    "syntax": "fastcgi_next_upstream_timeout time;",
    "default": "fastcgi_next_upstream_timeout 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the time during which a request can be passed to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "fastcgi_next_upstream_tries",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_next_upstream_tries",
    "syntax": "fastcgi_next_upstream_tries number;",
    "default": "fastcgi_next_upstream_tries 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the number of possible tries for passing a request to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "fastcgi_no_cache",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_no_cache",
    "syntax": "fastcgi_no_cache string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which the response will not be saved to a cache. If at least one value of the string parameters is not empty and is not equal to “0” then the response will not be saved:",
    "isBlock": false
  },
  {
    "name": "fastcgi_param",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_param",
    "syntax": "fastcgi_param parameter value [if_not_empty];",
    "default": "fastcgi_param HTTP_HOST $host$is_request_port$request_port;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a parameter that should be passed to the FastCGI server. The value can contain text, variables, and their combination. These directives are inherited from the previous configuration level if and only if there are...",
    "isBlock": false
  },
  {
    "name": "fastcgi_pass",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_pass",
    "syntax": "fastcgi_pass address;",
    "default": "—",
    "contexts": [
      "location",
      "if in location"
    ],
    "summary": "Sets the address of a FastCGI server. The address can be specified as a domain name or IP address, and a port:",
    "isBlock": false
  },
  {
    "name": "fastcgi_pass_header",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_pass_header",
    "syntax": "fastcgi_pass_header field;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Permits passing otherwise disabled header fields from a FastCGI server to a client.",
    "isBlock": false
  },
  {
    "name": "fastcgi_pass_request_body",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_pass_request_body",
    "syntax": "fastcgi_pass_request_body on | off;",
    "default": "fastcgi_pass_request_body on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Indicates whether the original request body is passed to the FastCGI server. See also the fastcgi_pass_request_headers directive.",
    "isBlock": false
  },
  {
    "name": "fastcgi_pass_request_headers",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_pass_request_headers",
    "syntax": "fastcgi_pass_request_headers on | off;",
    "default": "fastcgi_pass_request_headers on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Indicates whether the header fields of the original request are passed to the FastCGI server. See also the fastcgi_pass_request_body directive.",
    "isBlock": false
  },
  {
    "name": "fastcgi_read_timeout",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_read_timeout",
    "syntax": "fastcgi_read_timeout time;",
    "default": "fastcgi_read_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for reading a response from the FastCGI server. The timeout is set only between two successive read operations, not for the transmission of the whole response. If the FastCGI server does not transmit...",
    "isBlock": false
  },
  {
    "name": "fastcgi_request_buffering",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_request_buffering",
    "syntax": "fastcgi_request_buffering on | off;",
    "default": "fastcgi_request_buffering on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables buffering of a client request body.",
    "isBlock": false
  },
  {
    "name": "fastcgi_request_dynamic",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_request_dynamic",
    "syntax": "fastcgi_request_dynamic on | off;",
    "default": "fastcgi_request_dynamic off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables creation of a separate request instance for each FastCGI server. By default, a single request is used for all FastCGI servers. If enabled, a separate request instance is created, allowing per-serve...",
    "isBlock": false
  },
  {
    "name": "fastcgi_send_lowat",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_send_lowat",
    "syntax": "fastcgi_send_lowat size;",
    "default": "fastcgi_send_lowat 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If the directive is set to a non-zero value, nginx will try to minimize the number of send operations on outgoing connections to a FastCGI server by using either NOTE_LOWAT flag of the kqueue method, or the SO_SNDLOWA...",
    "isBlock": false
  },
  {
    "name": "fastcgi_send_timeout",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_send_timeout",
    "syntax": "fastcgi_send_timeout time;",
    "default": "fastcgi_send_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout for transmitting a request to the FastCGI server. The timeout is set only between two successive write operations, not for the transmission of the whole request. If the FastCGI server does not receive a...",
    "isBlock": false
  },
  {
    "name": "fastcgi_socket_keepalive",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_socket_keepalive",
    "syntax": "fastcgi_socket_keepalive on | off;",
    "default": "fastcgi_socket_keepalive off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Configures the “TCP keepalive” behavior for outgoing connections to a FastCGI server. By default, the operating system’s settings are in effect for the socket. If the directive is set to the value “on”, the SO_KEEPALI...",
    "isBlock": false
  },
  {
    "name": "fastcgi_socket_rcvbuf",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_socket_rcvbuf",
    "syntax": "fastcgi_socket_rcvbuf size;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the receive buffer size (the SO_RCVBUF option) for outgoing connections to a FastCGI server. The special value 0 cancels the effect of the fastcgi_socket_rcvbuf directive inherited from the previous configuration...",
    "isBlock": false
  },
  {
    "name": "fastcgi_socket_sndbuf",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_socket_sndbuf",
    "syntax": "fastcgi_socket_sndbuf size;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the send buffer size (the SO_SNDBUF option) for outgoing connections to a FastCGI server. The special value 0 cancels the effect of the fastcgi_socket_sndbuf directive inherited from the previous configuration le...",
    "isBlock": false
  },
  {
    "name": "fastcgi_split_path_info",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_split_path_info",
    "syntax": "fastcgi_split_path_info regex;",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Defines a regular expression that captures a value for the $fastcgi_path_info variable. The regular expression should have two captures: the first becomes a value of the $fastcgi_script_name variable, the second becom...",
    "isBlock": false
  },
  {
    "name": "fastcgi_store",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_store",
    "syntax": "fastcgi_store on | off | string;",
    "default": "fastcgi_store off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables saving of files to a disk. The on parameter saves files with paths corresponding to the directives alias or root. The off parameter disables saving of files. In addition, the file name can be set explicitly us...",
    "isBlock": false
  },
  {
    "name": "fastcgi_store_access",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_store_access",
    "syntax": "fastcgi_store_access users:permissions ...;",
    "default": "fastcgi_store_access user:rw;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets access permissions for newly created files and directories, e.g.:",
    "isBlock": false
  },
  {
    "name": "fastcgi_temp_file_write_size",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_temp_file_write_size",
    "syntax": "fastcgi_temp_file_write_size size;",
    "default": "fastcgi_temp_file_write_size 8k|16k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the size of data written to a temporary file at a time, when buffering of responses from the FastCGI server to temporary files is enabled. By default, size is limited by two buffers set by the fastcgi_buffer_si...",
    "isBlock": false
  },
  {
    "name": "fastcgi_temp_path",
    "module": "ngx_http_fastcgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_fastcgi_module.html#fastcgi_temp_path",
    "syntax": "fastcgi_temp_path path [level1 [level2 [level3]]];",
    "default": "fastcgi_temp_path fastcgi_temp;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a directory for storing temporary files with data received from FastCGI servers. Up to three-level subdirectory hierarchy can be used underneath the specified directory. For example, in the following configura...",
    "isBlock": false
  },
  {
    "name": "flv",
    "module": "ngx_http_flv_module",
    "scope": "http",
    "docPath": "http/ngx_http_flv_module.html#flv",
    "syntax": "flv;",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Turns on module processing in a surrounding location.",
    "isBlock": false
  },
  {
    "name": "frontchannel_logout_uri",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#frontchannel_logout_uri",
    "syntax": "frontchannel_logout_uri uri;",
    "default": "—",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Defines the URI path for triggering front-channel logout. For the logout request to be associated with a user session, it must either include the module session cookie or provide both the “iss” and “sid” arguments. It...",
    "isBlock": false
  },
  {
    "name": "geo",
    "module": "ngx_http_geo_module",
    "scope": "http",
    "docPath": "http/ngx_http_geo_module.html#geo",
    "syntax": "geo [$address] $variable { ... }",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Describes the dependency of values of the specified variable on the client IP address. By default, the address is taken from the $remote_addr variable, but it can also be taken from another variable (0.7.27), for exam...",
    "isBlock": true
  },
  {
    "name": "geo",
    "module": "ngx_stream_geo_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_geo_module.html#geo",
    "syntax": "geo [$address] $variable { ... }",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Describes the dependency of values of the specified variable on the client IP address. By default, the address is taken from the $remote_addr variable, but it can also be taken from another variable, for example:",
    "isBlock": true
  },
  {
    "name": "geoip_city",
    "module": "ngx_http_geoip_module",
    "scope": "http",
    "docPath": "http/ngx_http_geoip_module.html#geoip_city",
    "syntax": "geoip_city file;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Specifies a database used to determine the country, region, and city depending on the client IP address. The following variables are available when using this database:",
    "isBlock": false
  },
  {
    "name": "geoip_city",
    "module": "ngx_stream_geoip_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_geoip_module.html#geoip_city",
    "syntax": "geoip_city file;",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Specifies a database used to determine the country, region, and city depending on the client IP address. The following variables are available when using this database:",
    "isBlock": false
  },
  {
    "name": "geoip_country",
    "module": "ngx_http_geoip_module",
    "scope": "http",
    "docPath": "http/ngx_http_geoip_module.html#geoip_country",
    "syntax": "geoip_country file;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Specifies a database used to determine the country depending on the client IP address. The following variables are available when using this database:",
    "isBlock": false
  },
  {
    "name": "geoip_country",
    "module": "ngx_stream_geoip_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_geoip_module.html#geoip_country",
    "syntax": "geoip_country file;",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Specifies a database used to determine the country depending on the client IP address. The following variables are available when using this database:",
    "isBlock": false
  },
  {
    "name": "geoip_org",
    "module": "ngx_http_geoip_module",
    "scope": "http",
    "docPath": "http/ngx_http_geoip_module.html#geoip_org",
    "syntax": "geoip_org file;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Specifies a database used to determine the organization depending on the client IP address. The following variable is available when using this database:",
    "isBlock": false
  },
  {
    "name": "geoip_org",
    "module": "ngx_stream_geoip_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_geoip_module.html#geoip_org",
    "syntax": "geoip_org file;",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Specifies a database used to determine the organization depending on the client IP address. The following variable is available when using this database:",
    "isBlock": false
  },
  {
    "name": "geoip_proxy",
    "module": "ngx_http_geoip_module",
    "scope": "http",
    "docPath": "http/ngx_http_geoip_module.html#geoip_proxy",
    "syntax": "geoip_proxy address | CIDR;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Defines trusted addresses. When a request comes from a trusted address, an address from the “X-Forwarded-For” request header field will be used instead.",
    "isBlock": false
  },
  {
    "name": "geoip_proxy_recursive",
    "module": "ngx_http_geoip_module",
    "scope": "http",
    "docPath": "http/ngx_http_geoip_module.html#geoip_proxy_recursive",
    "syntax": "geoip_proxy_recursive on | off;",
    "default": "geoip_proxy_recursive off;",
    "contexts": [
      "http"
    ],
    "summary": "If recursive search is disabled then instead of the original client address that matches one of the trusted addresses, the last address sent in “X-Forwarded-For” will be used. If recursive search is enabled then inste...",
    "isBlock": false
  },
  {
    "name": "google_perftools_profiles",
    "module": "ngx_google_perftools_module",
    "scope": "core",
    "docPath": "ngx_google_perftools_module.html#google_perftools_profiles",
    "syntax": "google_perftools_profiles file;",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Sets a file name that keeps profiling information of nginx worker process. The ID of the worker process is always a part of the file name and is appended to the end of the file name, after a dot.",
    "isBlock": false
  },
  {
    "name": "grpc_allow_upstream",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_allow_upstream",
    "syntax": "grpc_allow_upstream address;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which access to a gRPC server is allowed or denied. If all string parameters are not empty and not equal to “0” then the access is allowed. The conditions are evaluated each time before a conn...",
    "isBlock": false
  },
  {
    "name": "grpc_bind",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_bind",
    "syntax": "grpc_bind address [transparent ] | off;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Makes outgoing connections to a gRPC server originate from the specified local IP address with an optional port. Parameter value can contain variables. The special value off cancels the effect of the grpc_bind directi...",
    "isBlock": false
  },
  {
    "name": "grpc_bind_dynamic",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_bind_dynamic",
    "syntax": "grpc_bind_dynamic on | off;",
    "default": "grpc_bind_dynamic off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When enabled, makes the bind operation at each connection attempt.",
    "isBlock": false
  },
  {
    "name": "grpc_buffer_size",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_buffer_size",
    "syntax": "grpc_buffer_size size;",
    "default": "grpc_buffer_size 4k|8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the size of the buffer used for reading the response received from the gRPC server. The first part of the response usually contains a small header; if it exceeds the buffer size, the response is considered invali...",
    "isBlock": false
  },
  {
    "name": "grpc_connect_timeout",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_connect_timeout",
    "syntax": "grpc_connect_timeout time;",
    "default": "grpc_connect_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for establishing a connection with a gRPC server. It should be noted that this timeout cannot usually exceed 75 seconds.",
    "isBlock": false
  },
  {
    "name": "grpc_hide_header",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_hide_header",
    "syntax": "grpc_hide_header field;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "By default, nginx does not pass the header fields “Date”, “Server”, and “X-Accel-...” from the response of a gRPC server to a client. The grpc_hide_header directive sets additional fields that will not be passed. If,...",
    "isBlock": false
  },
  {
    "name": "grpc_ignore_headers",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ignore_headers",
    "syntax": "grpc_ignore_headers field ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Disables processing of certain response header fields from the gRPC server. The following fields can be ignored: “X-Accel-Redirect” and “X-Accel-Charset”.",
    "isBlock": false
  },
  {
    "name": "grpc_intercept_errors",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_intercept_errors",
    "syntax": "grpc_intercept_errors on | off;",
    "default": "grpc_intercept_errors off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether gRPC server responses with codes greater than or equal to 300 should be passed to a client or be intercepted and redirected to nginx for processing with the error_page directive.",
    "isBlock": false
  },
  {
    "name": "grpc_next_upstream",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_next_upstream",
    "syntax": "grpc_next_upstream error | timeout | denied | invalid_header | http_500 | http_502 | http_503 | http_504 | http_403 | http_404 | http_429 | non_idempotent | off ...;",
    "default": "grpc_next_upstream error timeout;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies in which cases a request should be passed to the next server:",
    "isBlock": false
  },
  {
    "name": "grpc_next_upstream_timeout",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_next_upstream_timeout",
    "syntax": "grpc_next_upstream_timeout time;",
    "default": "grpc_next_upstream_timeout 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the time during which a request can be passed to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "grpc_next_upstream_tries",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_next_upstream_tries",
    "syntax": "grpc_next_upstream_tries number;",
    "default": "grpc_next_upstream_tries 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the number of possible tries for passing a request to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "grpc_pass",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_pass",
    "syntax": "grpc_pass address;",
    "default": "—",
    "contexts": [
      "location",
      "if in location"
    ],
    "summary": "Sets the gRPC server address. The address can be specified as a domain name or IP address, and a port:",
    "isBlock": false
  },
  {
    "name": "grpc_pass_header",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_pass_header",
    "syntax": "grpc_pass_header field;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Permits passing otherwise disabled header fields from a gRPC server to a client.",
    "isBlock": false
  },
  {
    "name": "grpc_read_timeout",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_read_timeout",
    "syntax": "grpc_read_timeout time;",
    "default": "grpc_read_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for reading a response from the gRPC server. The timeout is set only between two successive read operations, not for the transmission of the whole response. If the gRPC server does not transmit anyth...",
    "isBlock": false
  },
  {
    "name": "grpc_request_dynamic",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_request_dynamic",
    "syntax": "grpc_request_dynamic on | off;",
    "default": "grpc_request_dynamic off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables creation of a separate request instance for each gRPC server. By default, a single request is used for all gRPC servers. If enabled, a separate request instance is created, allowing per-server requ...",
    "isBlock": false
  },
  {
    "name": "grpc_send_timeout",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_send_timeout",
    "syntax": "grpc_send_timeout time;",
    "default": "grpc_send_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout for transmitting a request to the gRPC server. The timeout is set only between two successive write operations, not for the transmission of the whole request. If the gRPC server does not receive anythin...",
    "isBlock": false
  },
  {
    "name": "grpc_set_header",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_set_header",
    "syntax": "grpc_set_header field value;",
    "default": "grpc_set_header Content-Length $content_length;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows redefining or appending fields to the request header passed to the gRPC server. The value can contain text, variables, and their combinations. These directives are inherited from the previous configuration leve...",
    "isBlock": false
  },
  {
    "name": "grpc_socket_keepalive",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_socket_keepalive",
    "syntax": "grpc_socket_keepalive on | off;",
    "default": "grpc_socket_keepalive off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Configures the “TCP keepalive” behavior for outgoing connections to a gRPC server. By default, the operating system’s settings are in effect for the socket. If the directive is set to the value “on”, the SO_KEEPALIVE...",
    "isBlock": false
  },
  {
    "name": "grpc_socket_rcvbuf",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_socket_rcvbuf",
    "syntax": "grpc_socket_rcvbuf size;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the receive buffer size (the SO_RCVBUF option) for outgoing connections to a gRPC server. The special value 0 cancels the effect of the grpc_socket_rcvbuf directive inherited from the previous configuration level...",
    "isBlock": false
  },
  {
    "name": "grpc_socket_sndbuf",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_socket_sndbuf",
    "syntax": "grpc_socket_sndbuf size;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the send buffer size (the SO_SNDBUF option) for outgoing connections to a gRPC server. The special value 0 cancels the effect of the grpc_socket_sndbuf directive inherited from the previous configuration level, w...",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_certificate",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_certificate",
    "syntax": "grpc_ssl_certificate file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with the certificate in the PEM format used for authentication to a gRPC SSL server.",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_certificate_cache",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_certificate_cache",
    "syntax": "grpc_ssl_certificate_cache off;  |  grpc_ssl_certificate_cache max=N [inactive=time] [valid=time];",
    "default": "grpc_ssl_certificate_cache off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a cache that stores SSL certificates and secret keys specified with variables.",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_certificate_key",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_certificate_key",
    "syntax": "grpc_ssl_certificate_key file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with the secret key in the PEM format used for authentication to a gRPC SSL server.",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_ciphers",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_ciphers",
    "syntax": "grpc_ssl_ciphers ciphers;",
    "default": "grpc_ssl_ciphers DEFAULT;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies the enabled ciphers for requests to a gRPC SSL server. The ciphers are specified in the format understood by the OpenSSL library.",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_conf_command",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_conf_command",
    "syntax": "grpc_ssl_conf_command name value;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets arbitrary OpenSSL configuration commands when establishing a connection with the gRPC SSL server.",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_crl",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_crl",
    "syntax": "grpc_ssl_crl file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with revoked certificates (CRL) in the PEM format used to verify the certificate of the gRPC SSL server. When using intermediate certificates, their CRLs should be specified in the same file.",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_key_log",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_key_log",
    "syntax": "grpc_ssl_key_log path;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables logging of gRPC SSL server connection SSL keys and specifies the path to the key log file. Keys are logged in the SSLKEYLOGFILE format compatible with Wireshark.",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_name",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_name",
    "syntax": "grpc_ssl_name name;",
    "default": "grpc_ssl_name host from grpc_pass;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows overriding the server name used to verify the certificate of the gRPC SSL server and to be passed through SNI when establishing a connection with the gRPC SSL server.",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_password_file",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_password_file",
    "syntax": "grpc_ssl_password_file file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with passphrases for secret keys where each passphrase is specified on a separate line. Passphrases are tried in turn when loading the key.",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_protocols",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_protocols",
    "syntax": "grpc_ssl_protocols [SSLv2] [SSLv3] [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];",
    "default": "grpc_ssl_protocols TLSv1.2 TLSv1.3;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables the specified protocols for requests to a gRPC SSL server.",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_server_name",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_server_name",
    "syntax": "grpc_ssl_server_name on | off;",
    "default": "grpc_ssl_server_name off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables passing of the server name through TLS Server Name Indication extension (SNI, RFC 6066) when establishing a connection with the gRPC SSL server.",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_session_reuse",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_session_reuse",
    "syntax": "grpc_ssl_session_reuse on | off;",
    "default": "grpc_ssl_session_reuse on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether SSL sessions can be reused when working with the gRPC server. If the errors “digest check failed” appear in the logs, try disabling session reuse.",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_trusted_certificate",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_trusted_certificate",
    "syntax": "grpc_ssl_trusted_certificate file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify the certificate of the gRPC SSL server.",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_verify",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_verify",
    "syntax": "grpc_ssl_verify on | off;",
    "default": "grpc_ssl_verify off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables verification of the gRPC SSL server certificate.",
    "isBlock": false
  },
  {
    "name": "grpc_ssl_verify_depth",
    "module": "ngx_http_grpc_module",
    "scope": "http",
    "docPath": "http/ngx_http_grpc_module.html#grpc_ssl_verify_depth",
    "syntax": "grpc_ssl_verify_depth number;",
    "default": "grpc_ssl_verify_depth 1;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the verification depth in the gRPC SSL server certificates chain.",
    "isBlock": false
  },
  {
    "name": "gunzip",
    "module": "ngx_http_gunzip_module",
    "scope": "http",
    "docPath": "http/ngx_http_gunzip_module.html#gunzip",
    "syntax": "gunzip on | off;",
    "default": "gunzip off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables decompression of gzipped responses for clients that lack gzip support. If enabled, the following directives are also taken into account when determining if clients support gzip: gzip_http_version,...",
    "isBlock": false
  },
  {
    "name": "gunzip_buffers",
    "module": "ngx_http_gunzip_module",
    "scope": "http",
    "docPath": "http/ngx_http_gunzip_module.html#gunzip_buffers",
    "syntax": "gunzip_buffers number size;",
    "default": "gunzip_buffers 32 4k|16 8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the number and size of buffers used to decompress a response. By default, the buffer size is equal to one memory page. This is either 4K or 8K, depending on a platform.",
    "isBlock": false
  },
  {
    "name": "gzip",
    "module": "ngx_http_gzip_module",
    "scope": "http",
    "docPath": "http/ngx_http_gzip_module.html#gzip",
    "syntax": "gzip on | off;",
    "default": "gzip off;",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Enables or disables gzipping of responses.",
    "isBlock": false
  },
  {
    "name": "gzip_buffers",
    "module": "ngx_http_gzip_module",
    "scope": "http",
    "docPath": "http/ngx_http_gzip_module.html#gzip_buffers",
    "syntax": "gzip_buffers number size;",
    "default": "gzip_buffers 32 4k|16 8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the number and size of buffers used to compress a response. By default, the buffer size is equal to one memory page. This is either 4K or 8K, depending on a platform.",
    "isBlock": false
  },
  {
    "name": "gzip_comp_level",
    "module": "ngx_http_gzip_module",
    "scope": "http",
    "docPath": "http/ngx_http_gzip_module.html#gzip_comp_level",
    "syntax": "gzip_comp_level level;",
    "default": "gzip_comp_level 1;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a gzip compression level of a response. Acceptable values are in the range from 1 to 9.",
    "isBlock": false
  },
  {
    "name": "gzip_disable",
    "module": "ngx_http_gzip_module",
    "scope": "http",
    "docPath": "http/ngx_http_gzip_module.html#gzip_disable",
    "syntax": "gzip_disable regex ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Disables gzipping of responses for requests with “User-Agent” header fields matching any of the specified regular expressions.",
    "isBlock": false
  },
  {
    "name": "gzip_http_version",
    "module": "ngx_http_gzip_module",
    "scope": "http",
    "docPath": "http/ngx_http_gzip_module.html#gzip_http_version",
    "syntax": "gzip_http_version 1.0 | 1.1;",
    "default": "gzip_http_version 1.1;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the minimum HTTP version of a request required to compress a response.",
    "isBlock": false
  },
  {
    "name": "gzip_min_length",
    "module": "ngx_http_gzip_module",
    "scope": "http",
    "docPath": "http/ngx_http_gzip_module.html#gzip_min_length",
    "syntax": "gzip_min_length length;",
    "default": "gzip_min_length 20;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the minimum length of a response that will be gzipped. The length is determined only from the “Content-Length” response header field.",
    "isBlock": false
  },
  {
    "name": "gzip_proxied",
    "module": "ngx_http_gzip_module",
    "scope": "http",
    "docPath": "http/ngx_http_gzip_module.html#gzip_proxied",
    "syntax": "gzip_proxied off | expired | no-cache | no-store | private | no_last_modified | no_etag | auth | any ...;",
    "default": "gzip_proxied off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables gzipping of responses for proxied requests depending on the request and response. The fact that the request is proxied is determined by the presence of the “Via” request header field. The directive...",
    "isBlock": false
  },
  {
    "name": "gzip_static",
    "module": "ngx_http_gzip_static_module",
    "scope": "http",
    "docPath": "http/ngx_http_gzip_static_module.html#gzip_static",
    "syntax": "gzip_static on | off | always;",
    "default": "gzip_static off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables (“on”) or disables (“off”) checking the existence of precompressed files. The following directives are also taken into account: gzip_http_version, gzip_proxied, gzip_disable, and gzip_vary.",
    "isBlock": false
  },
  {
    "name": "gzip_types",
    "module": "ngx_http_gzip_module",
    "scope": "http",
    "docPath": "http/ngx_http_gzip_module.html#gzip_types",
    "syntax": "gzip_types mime-type ...;",
    "default": "gzip_types text/html;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables gzipping of responses for the specified MIME types in addition to “text/html”. The special value “*” matches any MIME type (0.8.29). Responses with the “text/html” type are always compressed.",
    "isBlock": false
  },
  {
    "name": "gzip_vary",
    "module": "ngx_http_gzip_module",
    "scope": "http",
    "docPath": "http/ngx_http_gzip_module.html#gzip_vary",
    "syntax": "gzip_vary on | off;",
    "default": "gzip_vary off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables inserting the “Vary: Accept-Encoding” response header field if the directives gzip, gzip_static, or gunzip are active.",
    "isBlock": false
  },
  {
    "name": "hash",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#hash",
    "syntax": "hash key [consistent];",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Specifies a load balancing method for a server group where the client-server mapping is based on the hashed key value. The key can contain text, variables, and their combinations. Note that adding or removing a server...",
    "isBlock": false
  },
  {
    "name": "hash",
    "module": "ngx_stream_upstream_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_upstream_module.html#hash",
    "syntax": "hash key [consistent];",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Specifies a load balancing method for a server group where the client-server mapping is based on the hashed key value. The key can contain text, variables, and their combinations (1.11.2). Usage example:",
    "isBlock": false
  },
  {
    "name": "health_check",
    "module": "ngx_http_upstream_hc_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_hc_module.html#health_check",
    "syntax": "health_check [parameters];",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Enables periodic health checks of the servers in a group referenced in the surrounding location.",
    "isBlock": false
  },
  {
    "name": "health_check",
    "module": "ngx_stream_upstream_hc_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_upstream_hc_module.html#health_check",
    "syntax": "health_check [parameters];",
    "default": "—",
    "contexts": [
      "server"
    ],
    "summary": "Enables periodic health checks of the servers in a group.",
    "isBlock": false
  },
  {
    "name": "health_check_timeout",
    "module": "ngx_stream_upstream_hc_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_upstream_hc_module.html#health_check_timeout",
    "syntax": "health_check_timeout timeout;",
    "default": "health_check_timeout 5s;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Overrides the proxy_timeout value for health checks.",
    "isBlock": false
  },
  {
    "name": "hls",
    "module": "ngx_http_hls_module",
    "scope": "http",
    "docPath": "http/ngx_http_hls_module.html#hls",
    "syntax": "hls;",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Turns on HLS streaming in the surrounding location.",
    "isBlock": false
  },
  {
    "name": "hls_buffers",
    "module": "ngx_http_hls_module",
    "scope": "http",
    "docPath": "http/ngx_http_hls_module.html#hls_buffers",
    "syntax": "hls_buffers number size;",
    "default": "hls_buffers 8 2m;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the maximum number and size of buffers that are used for reading and writing data frames.",
    "isBlock": false
  },
  {
    "name": "hls_forward_args",
    "module": "ngx_http_hls_module",
    "scope": "http",
    "docPath": "http/ngx_http_hls_module.html#hls_forward_args",
    "syntax": "hls_forward_args on | off;",
    "default": "hls_forward_args off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Adds arguments from a playlist request to URIs of fragments. This may be useful for performing client authorization at the moment of requesting a fragment, or when protecting an HLS stream with the ngx_http_secure_lin...",
    "isBlock": false
  },
  {
    "name": "hls_fragment",
    "module": "ngx_http_hls_module",
    "scope": "http",
    "docPath": "http/ngx_http_hls_module.html#hls_fragment",
    "syntax": "hls_fragment time;",
    "default": "hls_fragment 5s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines the default fragment length for playlist URIs requested without the “len” argument.",
    "isBlock": false
  },
  {
    "name": "hls_mp4_buffer_size",
    "module": "ngx_http_hls_module",
    "scope": "http",
    "docPath": "http/ngx_http_hls_module.html#hls_mp4_buffer_size",
    "syntax": "hls_mp4_buffer_size size;",
    "default": "hls_mp4_buffer_size 512k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the initial size of the buffer used for processing MP4 and MOV files.",
    "isBlock": false
  },
  {
    "name": "hls_mp4_max_buffer_size",
    "module": "ngx_http_hls_module",
    "scope": "http",
    "docPath": "http/ngx_http_hls_module.html#hls_mp4_max_buffer_size",
    "syntax": "hls_mp4_max_buffer_size size;",
    "default": "hls_mp4_max_buffer_size 10m;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "During metadata processing, a larger buffer may become necessary. Its size cannot exceed the specified size, or else nginx will return the server error 500 (Internal Server Error), and log the following message:",
    "isBlock": false
  },
  {
    "name": "http",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#http",
    "syntax": "http { ... }",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Provides the configuration file context in which the HTTP server directives are specified.",
    "isBlock": true
  },
  {
    "name": "http2",
    "module": "ngx_http_v2_module",
    "scope": "http",
    "docPath": "http/ngx_http_v2_module.html#http2",
    "syntax": "http2 on | off;",
    "default": "http2 off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables the HTTP/2 protocol.",
    "isBlock": false
  },
  {
    "name": "http2_body_preread_size",
    "module": "ngx_http_v2_module",
    "scope": "http",
    "docPath": "http/ngx_http_v2_module.html#http2_body_preread_size",
    "syntax": "http2_body_preread_size size;",
    "default": "http2_body_preread_size 64k;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets the size of the buffer per each request in which the request body may be saved before it is started to be processed.",
    "isBlock": false
  },
  {
    "name": "http2_chunk_size",
    "module": "ngx_http_v2_module",
    "scope": "http",
    "docPath": "http/ngx_http_v2_module.html#http2_chunk_size",
    "syntax": "http2_chunk_size size;",
    "default": "http2_chunk_size 8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the maximum size of chunks into which the response body is sliced. A too low value results in higher overhead. A too high value impairs prioritization due to HOL blocking.",
    "isBlock": false
  },
  {
    "name": "http2_idle_timeout",
    "module": "ngx_http_v2_module",
    "scope": "http",
    "docPath": "http/ngx_http_v2_module.html#http2_idle_timeout",
    "syntax": "http2_idle_timeout time;",
    "default": "http2_idle_timeout 3m;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "",
    "isBlock": false
  },
  {
    "name": "http2_max_concurrent_pushes",
    "module": "ngx_http_v2_module",
    "scope": "http",
    "docPath": "http/ngx_http_v2_module.html#http2_max_concurrent_pushes",
    "syntax": "http2_max_concurrent_pushes number;",
    "default": "http2_max_concurrent_pushes 10;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "",
    "isBlock": false
  },
  {
    "name": "http2_max_concurrent_streams",
    "module": "ngx_http_v2_module",
    "scope": "http",
    "docPath": "http/ngx_http_v2_module.html#http2_max_concurrent_streams",
    "syntax": "http2_max_concurrent_streams number;",
    "default": "http2_max_concurrent_streams 128;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets the maximum number of concurrent HTTP/2 streams in a connection.",
    "isBlock": false
  },
  {
    "name": "http2_max_field_size",
    "module": "ngx_http_v2_module",
    "scope": "http",
    "docPath": "http/ngx_http_v2_module.html#http2_max_field_size",
    "syntax": "http2_max_field_size size;",
    "default": "http2_max_field_size 4k;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "",
    "isBlock": false
  },
  {
    "name": "http2_max_header_size",
    "module": "ngx_http_v2_module",
    "scope": "http",
    "docPath": "http/ngx_http_v2_module.html#http2_max_header_size",
    "syntax": "http2_max_header_size size;",
    "default": "http2_max_header_size 16k;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "",
    "isBlock": false
  },
  {
    "name": "http2_max_requests",
    "module": "ngx_http_v2_module",
    "scope": "http",
    "docPath": "http/ngx_http_v2_module.html#http2_max_requests",
    "syntax": "http2_max_requests number;",
    "default": "http2_max_requests 1000;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "",
    "isBlock": false
  },
  {
    "name": "http2_push",
    "module": "ngx_http_v2_module",
    "scope": "http",
    "docPath": "http/ngx_http_v2_module.html#http2_push",
    "syntax": "http2_push uri | off;",
    "default": "http2_push off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "",
    "isBlock": false
  },
  {
    "name": "http2_push_preload",
    "module": "ngx_http_v2_module",
    "scope": "http",
    "docPath": "http/ngx_http_v2_module.html#http2_push_preload",
    "syntax": "http2_push_preload on | off;",
    "default": "http2_push_preload off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "",
    "isBlock": false
  },
  {
    "name": "http2_recv_buffer_size",
    "module": "ngx_http_v2_module",
    "scope": "http",
    "docPath": "http/ngx_http_v2_module.html#http2_recv_buffer_size",
    "syntax": "http2_recv_buffer_size size;",
    "default": "http2_recv_buffer_size 256k;",
    "contexts": [
      "http"
    ],
    "summary": "Sets the size of the per worker input buffer.",
    "isBlock": false
  },
  {
    "name": "http2_recv_timeout",
    "module": "ngx_http_v2_module",
    "scope": "http",
    "docPath": "http/ngx_http_v2_module.html#http2_recv_timeout",
    "syntax": "http2_recv_timeout time;",
    "default": "http2_recv_timeout 30s;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "",
    "isBlock": false
  },
  {
    "name": "http3",
    "module": "ngx_http_v3_module",
    "scope": "http",
    "docPath": "http/ngx_http_v3_module.html#http3",
    "syntax": "http3 on | off;",
    "default": "http3 on;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables HTTP/3 protocol negotiation.",
    "isBlock": false
  },
  {
    "name": "http3_hq",
    "module": "ngx_http_v3_module",
    "scope": "http",
    "docPath": "http/ngx_http_v3_module.html#http3_hq",
    "syntax": "http3_hq on | off;",
    "default": "http3_hq off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables HTTP/0.9 protocol negotiation used in QUIC interoperability tests.",
    "isBlock": false
  },
  {
    "name": "http3_max_concurrent_streams",
    "module": "ngx_http_v3_module",
    "scope": "http",
    "docPath": "http/ngx_http_v3_module.html#http3_max_concurrent_streams",
    "syntax": "http3_max_concurrent_streams number;",
    "default": "http3_max_concurrent_streams 128;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets the maximum number of concurrent HTTP/3 request streams in a connection.",
    "isBlock": false
  },
  {
    "name": "http3_stream_buffer_size",
    "module": "ngx_http_v3_module",
    "scope": "http",
    "docPath": "http/ngx_http_v3_module.html#http3_stream_buffer_size",
    "syntax": "http3_stream_buffer_size size;",
    "default": "http3_stream_buffer_size 64k;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets the size of the buffer used for reading and writing of the QUIC streams.",
    "isBlock": false
  },
  {
    "name": "if",
    "module": "ngx_http_rewrite_module",
    "scope": "http",
    "docPath": "http/ngx_http_rewrite_module.html#if",
    "syntax": "if (condition) { ... }",
    "default": "—",
    "contexts": [
      "server",
      "location"
    ],
    "summary": "The specified condition is evaluated. If true, this module directives specified inside the braces are executed, and the request is assigned the configuration inside the if directive. Configurations inside the if direc...",
    "isBlock": true
  },
  {
    "name": "if_modified_since",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#if_modified_since",
    "syntax": "if_modified_since off | exact | before;",
    "default": "if_modified_since exact;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies how to compare modification time of a response with the time in the “If-Modified-Since” request header field:",
    "isBlock": false
  },
  {
    "name": "ignore_invalid_headers",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#ignore_invalid_headers",
    "syntax": "ignore_invalid_headers on | off;",
    "default": "ignore_invalid_headers on;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Controls whether header fields with invalid names should be ignored. Valid names are composed of English letters, digits, hyphens, and possibly underscores (as controlled by the underscores_in_headers directive).",
    "isBlock": false
  },
  {
    "name": "image_filter",
    "module": "ngx_http_image_filter_module",
    "scope": "http",
    "docPath": "http/ngx_http_image_filter_module.html#image_filter",
    "syntax": "image_filter off;  |  image_filter test;  |  image_filter size;  |  image_filter rotate 90 | 180 | 270;  |  image_filter resize width height;  |  image_filter crop width height;",
    "default": "image_filter off;",
    "contexts": [
      "location"
    ],
    "summary": "Sets the type of transformation to perform on images:",
    "isBlock": false
  },
  {
    "name": "image_filter_buffer",
    "module": "ngx_http_image_filter_module",
    "scope": "http",
    "docPath": "http/ngx_http_image_filter_module.html#image_filter_buffer",
    "syntax": "image_filter_buffer size;",
    "default": "image_filter_buffer 1M;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the maximum size of the buffer used for reading images. When the size is exceeded the server returns error 415 (Unsupported Media Type).",
    "isBlock": false
  },
  {
    "name": "image_filter_interlace",
    "module": "ngx_http_image_filter_module",
    "scope": "http",
    "docPath": "http/ngx_http_image_filter_module.html#image_filter_interlace",
    "syntax": "image_filter_interlace on | off;",
    "default": "image_filter_interlace off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If enabled, final images will be interlaced. For JPEG, final images will be in “progressive JPEG” format.",
    "isBlock": false
  },
  {
    "name": "image_filter_jpeg_quality",
    "module": "ngx_http_image_filter_module",
    "scope": "http",
    "docPath": "http/ngx_http_image_filter_module.html#image_filter_jpeg_quality",
    "syntax": "image_filter_jpeg_quality quality;",
    "default": "image_filter_jpeg_quality 75;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the desired quality of the transformed JPEG images. Acceptable values are in the range from 1 to 100. Lesser values usually imply both lower image quality and less data to transfer. The maximum recommended value...",
    "isBlock": false
  },
  {
    "name": "image_filter_sharpen",
    "module": "ngx_http_image_filter_module",
    "scope": "http",
    "docPath": "http/ngx_http_image_filter_module.html#image_filter_sharpen",
    "syntax": "image_filter_sharpen percent;",
    "default": "image_filter_sharpen 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Increases sharpness of the final image. The sharpness percentage can exceed 100. The zero value disables sharpening. Parameter value can contain variables.",
    "isBlock": false
  },
  {
    "name": "image_filter_transparency",
    "module": "ngx_http_image_filter_module",
    "scope": "http",
    "docPath": "http/ngx_http_image_filter_module.html#image_filter_transparency",
    "syntax": "image_filter_transparency on|off;",
    "default": "image_filter_transparency on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines whether transparency should be preserved when transforming GIF images or PNG images with colors specified by a palette. The loss of transparency results in images of a better quality. The alpha channel transpa...",
    "isBlock": false
  },
  {
    "name": "image_filter_webp_quality",
    "module": "ngx_http_image_filter_module",
    "scope": "http",
    "docPath": "http/ngx_http_image_filter_module.html#image_filter_webp_quality",
    "syntax": "image_filter_webp_quality quality;",
    "default": "image_filter_webp_quality 80;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the desired quality of the transformed WebP images. Acceptable values are in the range from 1 to 100. Lesser values usually imply both lower image quality and less data to transfer. Parameter value can contain va...",
    "isBlock": false
  },
  {
    "name": "imap_auth",
    "module": "ngx_mail_imap_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_imap_module.html#imap_auth",
    "syntax": "imap_auth method ...;",
    "default": "imap_auth plain;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets permitted methods of authentication for IMAP clients. Supported methods are:",
    "isBlock": false
  },
  {
    "name": "imap_capabilities",
    "module": "ngx_mail_imap_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_imap_module.html#imap_capabilities",
    "syntax": "imap_capabilities extension ...;",
    "default": "imap_capabilities IMAP4 IMAP4rev1 UIDPLUS;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets the IMAP protocol extensions list that is passed to the client in response to the CAPABILITY command. The authentication methods specified in the imap_auth directive and STARTTLS are automatically added to this l...",
    "isBlock": false
  },
  {
    "name": "imap_client_buffer",
    "module": "ngx_mail_imap_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_imap_module.html#imap_client_buffer",
    "syntax": "imap_client_buffer size;",
    "default": "imap_client_buffer 4k|8k;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets the size of the buffer used for reading IMAP commands. By default, the buffer size is equal to one memory page. This is either 4K or 8K, depending on a platform.",
    "isBlock": false
  },
  {
    "name": "include",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#include",
    "syntax": "include file | mask;",
    "default": "—",
    "contexts": [
      "any"
    ],
    "summary": "Includes another file, or files matching the specified mask, into configuration. Included files should consist of syntactically correct directives and blocks.",
    "isBlock": false
  },
  {
    "name": "index",
    "module": "ngx_http_index_module",
    "scope": "http",
    "docPath": "http/ngx_http_index_module.html#index",
    "syntax": "index file ...;",
    "default": "index index.html;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines files that will be used as an index. The file name can contain variables. Files are checked in the specified order. The last element of the list can be a file with an absolute path. Example:",
    "isBlock": false
  },
  {
    "name": "internal",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#internal",
    "syntax": "internal;",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Specifies that a given location can only be used for internal requests. For external requests, the client error 404 (Not Found) is returned. Internal requests are the following:",
    "isBlock": false
  },
  {
    "name": "internal_redirect",
    "module": "ngx_http_internal_redirect_module",
    "scope": "http",
    "docPath": "http/ngx_http_internal_redirect_module.html#internal_redirect",
    "syntax": "internal_redirect uri;",
    "default": "—",
    "contexts": [
      "server",
      "location"
    ],
    "summary": "Sets the URI for internal redirection of the request. It is also possible to use a named location instead of the URI. The uri value can contain variables. If the uri value is empty, then the redirect will not be made.",
    "isBlock": false
  },
  {
    "name": "ip_hash",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#ip_hash",
    "syntax": "ip_hash;",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Specifies that a group should use a load balancing method where requests are distributed between servers based on client IP addresses. The first three octets of the client IPv4 address, or the entire IPv6 address, are...",
    "isBlock": false
  },
  {
    "name": "issuer",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#issuer",
    "syntax": "issuer URL;",
    "default": "—",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Sets the Issuer Identifier URL of the OpenID Provider; required directive. The URL must exactly match the value of “issuer” in the OpenID Provider metadata and requires the “https” scheme.",
    "isBlock": false
  },
  {
    "name": "js_access",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_access",
    "syntax": "js_access module.function;",
    "default": "—",
    "contexts": [
      "location",
      "if in location",
      "limit_except"
    ],
    "summary": "Sets an njs function as a handler in the access phase. Asynchronous operations such as r.subrequest(), ngx.fetch(), and setTimeout() are supported.",
    "isBlock": false
  },
  {
    "name": "js_access",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_access",
    "syntax": "js_access module.function;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets an njs function which will be called at the access phase. Since 0.4.0, a module function can be referenced.",
    "isBlock": false
  },
  {
    "name": "js_body_filter",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_body_filter",
    "syntax": "js_body_filter module.function [buffer_type=string | buffer];",
    "default": "—",
    "contexts": [
      "location",
      "if in location",
      "limit_except"
    ],
    "summary": "Sets an njs function as a response body filter. The filter function is called for each data chunk of a response body with the following arguments:",
    "isBlock": false
  },
  {
    "name": "js_content",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_content",
    "syntax": "js_content module.function;",
    "default": "—",
    "contexts": [
      "location",
      "if in location",
      "limit_except"
    ],
    "summary": "Sets an njs function as a location content handler. Since 0.4.0, a module function can be referenced.",
    "isBlock": false
  },
  {
    "name": "js_context_reuse",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_context_reuse",
    "syntax": "js_context_reuse number;",
    "default": "js_context_reuse 128;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a maximum number of JS context to be reused for QuickJS engine. Each context is used for a single request. The finished context is put into a pool of reusable contexts. If the pool is full, the context is destroyed.",
    "isBlock": false
  },
  {
    "name": "js_context_reuse",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_context_reuse",
    "syntax": "js_context_reuse number;",
    "default": "js_context_reuse 128;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets a maximum number of JS context to be reused for QuickJS engine. Each context is used for a single stream session. The finished context is put into a pool of reusable contexts. If the pool is full, the context is...",
    "isBlock": false
  },
  {
    "name": "js_engine",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_engine",
    "syntax": "js_engine njs | qjs;",
    "default": "js_engine njs;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a JavaScript engine to be used for njs scripts. The njs parameter sets the njs engine, also used by default. The qjs parameter sets the QuickJS engine.",
    "isBlock": false
  },
  {
    "name": "js_engine",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_engine",
    "syntax": "js_engine njs | qjs;",
    "default": "js_engine njs;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets a JavaScript engine to be used for njs scripts. The njs parameter sets the njs engine, also used by default. The qjs parameter sets the QuickJS engine.",
    "isBlock": false
  },
  {
    "name": "js_fetch_buffer_size",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_fetch_buffer_size",
    "syntax": "js_fetch_buffer_size size;",
    "default": "js_fetch_buffer_size 16k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the size of the buffer used for reading and writing with Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_buffer_size",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_fetch_buffer_size",
    "syntax": "js_fetch_buffer_size size;",
    "default": "js_fetch_buffer_size 16k;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the size of the buffer used for reading and writing with Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_ciphers",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_fetch_ciphers",
    "syntax": "js_fetch_ciphers ciphers;",
    "default": "js_fetch_ciphers HIGH:!aNULL:!MD5;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies the enabled ciphers for HTTPS requests with Fetch API. The ciphers are specified in the format understood by the OpenSSL library.",
    "isBlock": false
  },
  {
    "name": "js_fetch_ciphers",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_fetch_ciphers",
    "syntax": "js_fetch_ciphers ciphers;",
    "default": "js_fetch_ciphers HIGH:!aNULL:!MD5;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies the enabled ciphers for HTTPS connections with Fetch API. The ciphers are specified in the format understood by the OpenSSL library.",
    "isBlock": false
  },
  {
    "name": "js_fetch_keepalive",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_fetch_keepalive",
    "syntax": "js_fetch_keepalive connections;",
    "default": "js_fetch_keepalive 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Activates the cache for connections to destination servers. When the value is greater than 0, enables keepalive connections for Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_keepalive",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_fetch_keepalive",
    "syntax": "js_fetch_keepalive connections;",
    "default": "js_fetch_keepalive 0;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Activates the cache for connections to destination servers. When the value is greater than 0, enables keepalive connections for Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_keepalive_requests",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_fetch_keepalive_requests",
    "syntax": "js_fetch_keepalive_requests number;",
    "default": "js_fetch_keepalive_requests 1000;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the maximum number of requests that can be served through one keepalive connection with Fetch API. After the maximum number of requests is made, the connection is closed.",
    "isBlock": false
  },
  {
    "name": "js_fetch_keepalive_requests",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_fetch_keepalive_requests",
    "syntax": "js_fetch_keepalive_requests number;",
    "default": "js_fetch_keepalive_requests 1000;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the maximum number of requests that can be served through one keepalive connection with Fetch API. After the maximum number of requests is made, the connection is closed.",
    "isBlock": false
  },
  {
    "name": "js_fetch_keepalive_time",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_fetch_keepalive_time",
    "syntax": "js_fetch_keepalive_time time;",
    "default": "js_fetch_keepalive_time 1h;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the maximum time during which requests can be processed through one keepalive connection with Fetch API. After this time is reached, the connection is closed following the subsequent request processing.",
    "isBlock": false
  },
  {
    "name": "js_fetch_keepalive_time",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_fetch_keepalive_time",
    "syntax": "js_fetch_keepalive_time time;",
    "default": "js_fetch_keepalive_time 1h;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Limits the maximum time during which requests can be processed through one keepalive connection with Fetch API. After this time is reached, the connection is closed following the subsequent request processing.",
    "isBlock": false
  },
  {
    "name": "js_fetch_keepalive_timeout",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_fetch_keepalive_timeout",
    "syntax": "js_fetch_keepalive_timeout time;",
    "default": "js_fetch_keepalive_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout during which an idle keepalive connection to a destination server will stay open with Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_keepalive_timeout",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_fetch_keepalive_timeout",
    "syntax": "js_fetch_keepalive_timeout time;",
    "default": "js_fetch_keepalive_timeout 60s;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets a timeout during which an idle keepalive connection to a destination server will stay open with Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_max_response_buffer_size",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_fetch_max_response_buffer_size",
    "syntax": "js_fetch_max_response_buffer_size size;",
    "default": "js_fetch_max_response_buffer_size 1m;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the maximum size of the response received with Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_max_response_buffer_size",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_fetch_max_response_buffer_size",
    "syntax": "js_fetch_max_response_buffer_size size;",
    "default": "js_fetch_max_response_buffer_size 1m;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the maximum size of the response received with Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_protocols",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_fetch_protocols",
    "syntax": "js_fetch_protocols [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];",
    "default": "js_fetch_protocols TLSv1 TLSv1.1 TLSv1.2;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables the specified protocols for HTTPS requests with Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_protocols",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_fetch_protocols",
    "syntax": "js_fetch_protocols [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];",
    "default": "js_fetch_protocols TLSv1 TLSv1.1 TLSv1.2;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables the specified protocols for HTTPS connections with Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_proxy",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_fetch_proxy",
    "syntax": "js_fetch_proxy url;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Configures a forward proxy URL with Fetch API. The url supports the HTTP scheme only and can contain optional user credentials in the format http://[user:password@]host:port for Basic authentication. Supports both HTT...",
    "isBlock": false
  },
  {
    "name": "js_fetch_proxy",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_fetch_proxy",
    "syntax": "js_fetch_proxy url;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Configures a forward proxy URL with Fetch API. The url supports the HTTP scheme only and can contain optional user credentials in the format http://[user:password@]host:port for Basic authentication. Supports both HTT...",
    "isBlock": false
  },
  {
    "name": "js_fetch_timeout",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_fetch_timeout",
    "syntax": "js_fetch_timeout time;",
    "default": "js_fetch_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for reading and writing for Fetch API. The timeout is set only between two successive read/write operations, not for the whole response. If no data is transmitted within this time, the connection is...",
    "isBlock": false
  },
  {
    "name": "js_fetch_timeout",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_fetch_timeout",
    "syntax": "js_fetch_timeout time;",
    "default": "js_fetch_timeout 60s;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Defines a timeout for reading and writing for Fetch API. The timeout is set only between two successive read/write operations, not for the whole response. If no data is transmitted within this time, the connection is...",
    "isBlock": false
  },
  {
    "name": "js_fetch_trusted_certificate",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_fetch_trusted_certificate",
    "syntax": "js_fetch_trusted_certificate file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify the HTTPS certificate with Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_trusted_certificate",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_fetch_trusted_certificate",
    "syntax": "js_fetch_trusted_certificate file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify the HTTPS certificate with Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_verify",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_fetch_verify",
    "syntax": "js_fetch_verify on | off;",
    "default": "js_fetch_verify on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables verification of the HTTPS server certificate with Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_verify",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_fetch_verify",
    "syntax": "js_fetch_verify on | off;",
    "default": "js_fetch_verify on;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables or disables verification of the HTTPS server certificate with Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_verify_depth",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_fetch_verify_depth",
    "syntax": "js_fetch_verify_depth number;",
    "default": "js_fetch_verify_depth 100;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the verification depth in the HTTPS server certificates chain with Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_fetch_verify_depth",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_fetch_verify_depth",
    "syntax": "js_fetch_verify_depth number;",
    "default": "js_fetch_verify_depth 100;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the verification depth in the HTTPS server certificates chain with Fetch API.",
    "isBlock": false
  },
  {
    "name": "js_filter",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_filter",
    "syntax": "js_filter module.function;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets a data filter. Since 0.4.0, a module function can be referenced. The filter function is called once at the moment when the stream session reaches the content phase.",
    "isBlock": false
  },
  {
    "name": "js_header_filter",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_header_filter",
    "syntax": "js_header_filter module.function;",
    "default": "—",
    "contexts": [
      "location",
      "if in location",
      "limit_except"
    ],
    "summary": "Sets an njs function as a response header filter. The directive allows changing arbitrary header fields of a response header.",
    "isBlock": false
  },
  {
    "name": "js_import",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_import",
    "syntax": "js_import module.js | export_name from module.js;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Imports a module that implements location, variable, and filter handlers in njs. The export_name is used as a namespace to access module functions. If the export_name is not specified, the module name will be used as...",
    "isBlock": false
  },
  {
    "name": "js_import",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_import",
    "syntax": "js_import module.js | export_name from module.js;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Imports a module that implements session and variable handlers in njs. The export_name is used as a namespace to access module functions. If the export_name is not specified, the module name will be used as a namespace.",
    "isBlock": false
  },
  {
    "name": "js_include",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_include",
    "syntax": "js_include file;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Specifies a file that implements location and variable handlers in njs:",
    "isBlock": false
  },
  {
    "name": "js_include",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_include",
    "syntax": "js_include file;",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Specifies a file that implements server and variable handlers in njs:",
    "isBlock": false
  },
  {
    "name": "js_load_http_native_module",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_load_http_native_module",
    "syntax": "js_load_http_native_module path [as name];",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Loads a native module (shared library) for use in HTTP JavaScript code. The directive is QuickJS-only and is not available when using the njs built-in JavaScript engine.",
    "isBlock": false
  },
  {
    "name": "js_load_stream_native_module",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_load_stream_native_module",
    "syntax": "js_load_stream_native_module path [as name];",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Loads a native module (shared library) for use in Stream JavaScript code. The directive is QuickJS-only and is not available when using the njs built-in JavaScript engine.",
    "isBlock": false
  },
  {
    "name": "js_path",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_path",
    "syntax": "js_path path;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets an additional path for njs modules.",
    "isBlock": false
  },
  {
    "name": "js_path",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_path",
    "syntax": "js_path path;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets an additional path for njs modules.",
    "isBlock": false
  },
  {
    "name": "js_periodic",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_periodic",
    "syntax": "js_periodic module.function [interval=time] [jitter=number] [worker_affinity=mask];",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Specifies a content handler to run at regular interval. The handler receives a session object as its first argument, it also has access to global objects such as ngx.",
    "isBlock": false
  },
  {
    "name": "js_periodic",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_periodic",
    "syntax": "js_periodic module.function [interval=time] [jitter=number] [worker_affinity=mask];",
    "default": "—",
    "contexts": [
      "server"
    ],
    "summary": "Specifies a content handler to run at regular interval. The handler receives a session object as its first argument, it also has access to global objects such as ngx.",
    "isBlock": false
  },
  {
    "name": "js_preload_object",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_preload_object",
    "syntax": "js_preload_object name.json | name from file.json;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Preloads an immutable object at configure time. The name is used as a name of the global variable though which the object is available in njs code. If the name is not specified, the file name will be used instead.",
    "isBlock": false
  },
  {
    "name": "js_preload_object",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_preload_object",
    "syntax": "js_preload_object name.json | name from file.json;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Preloads an immutable object at configure time. The name is used as a name of the global variable though which the object is available in njs code. If the name is not specified, the file name will be used instead.",
    "isBlock": false
  },
  {
    "name": "js_preread",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_preread",
    "syntax": "js_preread module.function;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets an njs function which will be called at the preread phase. Since 0.4.0, a module function can be referenced.",
    "isBlock": false
  },
  {
    "name": "js_set",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_set",
    "syntax": "js_set $variable module.function [nocache];",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets an njs function for the specified variable. Since 0.4.0, a module function can be referenced.",
    "isBlock": false
  },
  {
    "name": "js_set",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_set",
    "syntax": "js_set $variable module.function [nocache];",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets an njs function for the specified variable. Since 0.4.0, a module function can be referenced.",
    "isBlock": false
  },
  {
    "name": "js_shared_dict_zone",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_shared_dict_zone",
    "syntax": "js_shared_dict_zone zone=name:size [timeout=time] [type=string|number] [evict] [state=file];",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets the name and size of the shared memory zone that keeps the key-value dictionary shared between worker processes.",
    "isBlock": false
  },
  {
    "name": "js_shared_dict_zone",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_shared_dict_zone",
    "syntax": "js_shared_dict_zone zone=name:size [timeout=time] [type=string|number] [evict] [state=file];",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Sets the name and size of the shared memory zone that keeps the key-value dictionary shared between worker processes.",
    "isBlock": false
  },
  {
    "name": "js_var",
    "module": "ngx_http_js_module",
    "scope": "http",
    "docPath": "http/ngx_http_js_module.html#js_var",
    "syntax": "js_var $variable [value];",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Declares a writable variable. The value can contain text, variables, and their combination. The variable is not overwritten after a redirect unlike variables created with the set directive.",
    "isBlock": false
  },
  {
    "name": "js_var",
    "module": "ngx_stream_js_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_js_module.html#js_var",
    "syntax": "js_var $variable [value];",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Declares a writable variable. The value can contain text, variables, and their combination.",
    "isBlock": false
  },
  {
    "name": "json_max_depth",
    "module": "ngx_http_json_module",
    "scope": "http",
    "docPath": "http/ngx_http_json_module.html#json_max_depth",
    "syntax": "json_max_depth number;",
    "default": "json_max_depth 32;",
    "contexts": [
      "http"
    ],
    "summary": "Sets the maximum nesting depth of JSON documents. A document nested deeper is considered invalid. Acceptable values are in the range from 1 to 256.",
    "isBlock": false
  },
  {
    "name": "json_set",
    "module": "ngx_http_json_module",
    "scope": "http",
    "docPath": "http/ngx_http_json_module.html#json_set",
    "syntax": "json_set $variable $source path;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets the variable to the value extracted from the JSON document held in the source variable at the given path.",
    "isBlock": false
  },
  {
    "name": "keepalive",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#keepalive",
    "syntax": "keepalive connections [local];",
    "default": "keepalive 32 local;",
    "contexts": [
      "upstream"
    ],
    "summary": "Enables or disables caching of keepalive connections to upstream servers. Since 1.29.7, by default the cache for connections is activated and these connections are not shared between different locations.",
    "isBlock": false
  },
  {
    "name": "keepalive_disable",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#keepalive_disable",
    "syntax": "keepalive_disable none | browser ...;",
    "default": "keepalive_disable msie6;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Disables keep-alive connections with misbehaving browsers. The browser parameters specify which browsers will be affected. The value msie6 disables keep-alive connections with old versions of MSIE, once a POST request...",
    "isBlock": false
  },
  {
    "name": "keepalive_min_timeout",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#keepalive_min_timeout",
    "syntax": "keepalive_min_timeout timeout;",
    "default": "keepalive_min_timeout 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout during which a keep-alive client connection will not be closed on the server side for connection reuse or on graceful shutdown of worker processes.",
    "isBlock": false
  },
  {
    "name": "keepalive_requests",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#keepalive_requests",
    "syntax": "keepalive_requests number;",
    "default": "keepalive_requests 1000;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the maximum number of requests that can be served through one keep-alive connection. After the maximum number of requests are made, the connection is closed.",
    "isBlock": false
  },
  {
    "name": "keepalive_requests",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#keepalive_requests",
    "syntax": "keepalive_requests number;",
    "default": "keepalive_requests 1000;",
    "contexts": [
      "upstream"
    ],
    "summary": "Sets the maximum number of requests that can be served through one keepalive connection. After the maximum number of requests is made, the connection is closed.",
    "isBlock": false
  },
  {
    "name": "keepalive_time",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#keepalive_time",
    "syntax": "keepalive_time time;",
    "default": "keepalive_time 1h;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the maximum time during which requests can be processed through one keep-alive connection. After this time is reached, the connection is closed following the subsequent request processing.",
    "isBlock": false
  },
  {
    "name": "keepalive_time",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#keepalive_time",
    "syntax": "keepalive_time time;",
    "default": "keepalive_time 1h;",
    "contexts": [
      "upstream"
    ],
    "summary": "Limits the maximum time during which requests can be processed through one keepalive connection. After this time is reached, the connection is closed following the subsequent request processing.",
    "isBlock": false
  },
  {
    "name": "keepalive_timeout",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#keepalive_timeout",
    "syntax": "keepalive_timeout timeout [header_timeout];",
    "default": "keepalive_timeout 75s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "The first parameter sets a timeout during which a keep-alive client connection will stay open on the server side. The zero value disables keep-alive client connections. The optional second parameter sets a value in th...",
    "isBlock": false
  },
  {
    "name": "keepalive_timeout",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#keepalive_timeout",
    "syntax": "keepalive_timeout timeout;",
    "default": "keepalive_timeout 60s;",
    "contexts": [
      "upstream"
    ],
    "summary": "Sets a timeout during which an idle keepalive connection to an upstream server will stay open.",
    "isBlock": false
  },
  {
    "name": "keyval",
    "module": "ngx_http_keyval_module",
    "scope": "http",
    "docPath": "http/ngx_http_keyval_module.html#keyval",
    "syntax": "keyval key $variable zone=name;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Creates a new $variable whose value is looked up by the key in the key-value database. Matching rules are defined by the type parameter of the keyval_zone directive. The database is stored in a shared memory zone spec...",
    "isBlock": false
  },
  {
    "name": "keyval",
    "module": "ngx_stream_keyval_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_keyval_module.html#keyval",
    "syntax": "keyval key $variable zone=name;",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Creates a new $variable whose value is looked up by the key in the key-value database. Matching rules are defined by the type parameter of the keyval_zone directive. The database is stored in a shared memory zone spec...",
    "isBlock": false
  },
  {
    "name": "keyval_zone",
    "module": "ngx_http_keyval_module",
    "scope": "http",
    "docPath": "http/ngx_http_keyval_module.html#keyval_zone",
    "syntax": "keyval_zone zone=name:size [state=file] [timeout=time] [type=string|ip|prefix] [sync];",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets the name and size of the shared memory zone that keeps the key-value database. Key-value pairs are managed by the API.",
    "isBlock": false
  },
  {
    "name": "keyval_zone",
    "module": "ngx_stream_keyval_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_keyval_module.html#keyval_zone",
    "syntax": "keyval_zone zone=name:size [state=file] [timeout=time] [type=string|ip|prefix] [sync];",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Sets the name and size of the shared memory zone that keeps the key-value database. Key-value pairs are managed by the API.",
    "isBlock": false
  },
  {
    "name": "large_client_header_buffers",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#large_client_header_buffers",
    "syntax": "large_client_header_buffers number size;",
    "default": "large_client_header_buffers 4 8k;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets the maximum number and size of buffers used for reading large client request header. A request line cannot exceed the size of one buffer, or the 414 (Request-URI Too Large) error is returned to the client. A requ...",
    "isBlock": false
  },
  {
    "name": "least_conn",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#least_conn",
    "syntax": "least_conn;",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Specifies that a group should use a load balancing method where a request is passed to the server with the least number of active connections, taking into account weights of servers. If there are several such servers,...",
    "isBlock": false
  },
  {
    "name": "least_conn",
    "module": "ngx_stream_upstream_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_upstream_module.html#least_conn",
    "syntax": "least_conn;",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Specifies that a group should use a load balancing method where a connection is passed to the server with the least number of active connections, taking into account weights of servers. If there are several such serve...",
    "isBlock": false
  },
  {
    "name": "least_time",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#least_time",
    "syntax": "least_time header | last_byte [inflight];",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Specifies that a group should use a load balancing method where a request is passed to the server with the least average response time and least number of active connections, taking into account weights of servers. If...",
    "isBlock": false
  },
  {
    "name": "least_time",
    "module": "ngx_stream_upstream_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_upstream_module.html#least_time",
    "syntax": "least_time connect | first_byte | last_byte [inflight];",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Specifies that a group should use a load balancing method where a connection is passed to the server with the least average time and least number of active connections, taking into account weights of servers. If there...",
    "isBlock": false
  },
  {
    "name": "license_pending_token",
    "module": "ngx_mgmt_module",
    "scope": "core",
    "docPath": "ngx_mgmt_module.html#license_pending_token",
    "syntax": "license_pending_token file | off;",
    "default": "—",
    "contexts": [
      "mgmt"
    ],
    "summary": "Controls how a renewed JWT license token is handled after it is received from the F5 licensing endpoint. By default, the renewed token is saved and applied immediately.",
    "isBlock": false
  },
  {
    "name": "license_token",
    "module": "ngx_mgmt_module",
    "scope": "core",
    "docPath": "ngx_mgmt_module.html#license_token",
    "syntax": "license_token file;",
    "default": "license_token license.jwt;",
    "contexts": [
      "mgmt"
    ],
    "summary": "Specifies a JWT license file. By default, the license.jwt file is expected to be at /etc/nginx/ for Linux or at /usr/local/etc/nginx/ for FreeBSD.",
    "isBlock": false
  },
  {
    "name": "limit_conn",
    "module": "ngx_http_limit_conn_module",
    "scope": "http",
    "docPath": "http/ngx_http_limit_conn_module.html#limit_conn",
    "syntax": "limit_conn zone number;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the shared memory zone and the maximum allowed number of connections for a given key value. When this limit is exceeded, the server will return the error in reply to a request. For example, the directives",
    "isBlock": false
  },
  {
    "name": "limit_conn",
    "module": "ngx_stream_limit_conn_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_limit_conn_module.html#limit_conn",
    "syntax": "limit_conn zone number;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the shared memory zone and the maximum allowed number of connections for a given key value. When this limit is exceeded, the server will close the connection. For example, the directives",
    "isBlock": false
  },
  {
    "name": "limit_conn_dry_run",
    "module": "ngx_http_limit_conn_module",
    "scope": "http",
    "docPath": "http/ngx_http_limit_conn_module.html#limit_conn_dry_run",
    "syntax": "limit_conn_dry_run on | off;",
    "default": "limit_conn_dry_run off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables the dry run mode. In this mode, the number of connections is not limited, however, in the shared memory zone, the number of excessive connections is accounted as usual.",
    "isBlock": false
  },
  {
    "name": "limit_conn_dry_run",
    "module": "ngx_stream_limit_conn_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_limit_conn_module.html#limit_conn_dry_run",
    "syntax": "limit_conn_dry_run on | off;",
    "default": "limit_conn_dry_run off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables the dry run mode. In this mode, the number of connections is not limited, however, in the shared memory zone, the number of excessive connections is accounted as usual.",
    "isBlock": false
  },
  {
    "name": "limit_conn_log_level",
    "module": "ngx_http_limit_conn_module",
    "scope": "http",
    "docPath": "http/ngx_http_limit_conn_module.html#limit_conn_log_level",
    "syntax": "limit_conn_log_level info | notice | warn | error;",
    "default": "limit_conn_log_level error;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the desired logging level for cases when the server limits the number of connections.",
    "isBlock": false
  },
  {
    "name": "limit_conn_log_level",
    "module": "ngx_stream_limit_conn_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_limit_conn_module.html#limit_conn_log_level",
    "syntax": "limit_conn_log_level info | notice | warn | error;",
    "default": "limit_conn_log_level error;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the desired logging level for cases when the server limits the number of connections.",
    "isBlock": false
  },
  {
    "name": "limit_conn_status",
    "module": "ngx_http_limit_conn_module",
    "scope": "http",
    "docPath": "http/ngx_http_limit_conn_module.html#limit_conn_status",
    "syntax": "limit_conn_status code;",
    "default": "limit_conn_status 503;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the status code to return in response to rejected requests.",
    "isBlock": false
  },
  {
    "name": "limit_conn_zone",
    "module": "ngx_http_limit_conn_module",
    "scope": "http",
    "docPath": "http/ngx_http_limit_conn_module.html#limit_conn_zone",
    "syntax": "limit_conn_zone key zone=name:size;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets parameters for a shared memory zone that will keep states for various keys. In particular, the state includes the current number of connections. The key can contain text, variables, and their combination. Request...",
    "isBlock": false
  },
  {
    "name": "limit_conn_zone",
    "module": "ngx_stream_limit_conn_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_limit_conn_module.html#limit_conn_zone",
    "syntax": "limit_conn_zone key zone=name:size;",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Sets parameters for a shared memory zone that will keep states for various keys. In particular, the state includes the current number of connections. The key can contain text, variables, and their combinations (1.11.2...",
    "isBlock": false
  },
  {
    "name": "limit_except",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#limit_except",
    "syntax": "limit_except method ... { ... }",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Limits allowed HTTP methods inside a location. The method parameter can be one of the following: GET, HEAD, POST, PUT, DELETE, MKCOL, COPY, MOVE, OPTIONS, PROPFIND, PROPPATCH, LOCK, UNLOCK, or PATCH. Allowing the GET...",
    "isBlock": true
  },
  {
    "name": "limit_rate",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#limit_rate",
    "syntax": "limit_rate rate;",
    "default": "limit_rate 0;",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Limits the rate of response transmission to a client. The rate is specified in bytes per second. The zero value disables rate limiting. The limit is set per a request, and so if a client simultaneously opens two conne...",
    "isBlock": false
  },
  {
    "name": "limit_rate_after",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#limit_rate_after",
    "syntax": "limit_rate_after size;",
    "default": "limit_rate_after 0;",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Sets the initial amount after which the further transmission of a response to a client will be rate limited. Parameter value can contain variables (1.17.0).",
    "isBlock": false
  },
  {
    "name": "limit_req",
    "module": "ngx_http_limit_req_module",
    "scope": "http",
    "docPath": "http/ngx_http_limit_req_module.html#limit_req",
    "syntax": "limit_req zone=name [burst=number] [nodelay | delay=number];",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the shared memory zone and the maximum burst size of requests. If the requests rate exceeds the rate configured for a zone, their processing is delayed such that requests are processed at a defined rate. Excessiv...",
    "isBlock": false
  },
  {
    "name": "limit_req_dry_run",
    "module": "ngx_http_limit_req_module",
    "scope": "http",
    "docPath": "http/ngx_http_limit_req_module.html#limit_req_dry_run",
    "syntax": "limit_req_dry_run on | off;",
    "default": "limit_req_dry_run off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables the dry run mode. In this mode, requests processing rate is not limited, however, in the shared memory zone, the number of excessive requests is accounted as usual.",
    "isBlock": false
  },
  {
    "name": "limit_req_log_level",
    "module": "ngx_http_limit_req_module",
    "scope": "http",
    "docPath": "http/ngx_http_limit_req_module.html#limit_req_log_level",
    "syntax": "limit_req_log_level info | notice | warn | error;",
    "default": "limit_req_log_level error;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the desired logging level for cases when the server refuses to process requests due to rate exceeding, or delays request processing. Logging level for delays is one point less than for refusals; for example, if “...",
    "isBlock": false
  },
  {
    "name": "limit_req_status",
    "module": "ngx_http_limit_req_module",
    "scope": "http",
    "docPath": "http/ngx_http_limit_req_module.html#limit_req_status",
    "syntax": "limit_req_status code;",
    "default": "limit_req_status 503;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the status code to return in response to rejected requests.",
    "isBlock": false
  },
  {
    "name": "limit_req_zone",
    "module": "ngx_http_limit_req_module",
    "scope": "http",
    "docPath": "http/ngx_http_limit_req_module.html#limit_req_zone",
    "syntax": "limit_req_zone key zone=name:size rate=rate [sync];",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets parameters for a shared memory zone that will keep states for various keys. In particular, the state stores the current number of excessive requests. The key can contain text, variables, and their combination. Re...",
    "isBlock": false
  },
  {
    "name": "limit_zone",
    "module": "ngx_http_limit_conn_module",
    "scope": "http",
    "docPath": "http/ngx_http_limit_conn_module.html#limit_zone",
    "syntax": "limit_zone name $variable size;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "This directive was made obsolete in version 1.1.8 and was removed in version 1.7.6. An equivalent limit_conn_zone directive with a changed syntax should be used instead:",
    "isBlock": false
  },
  {
    "name": "lingering_close",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#lingering_close",
    "syntax": "lingering_close off | on | always;",
    "default": "lingering_close on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Controls how nginx closes client connections.",
    "isBlock": false
  },
  {
    "name": "lingering_time",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#lingering_time",
    "syntax": "lingering_time time;",
    "default": "lingering_time 30s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When lingering_close is in effect, this directive specifies the maximum time during which nginx will process (read and ignore) additional data coming from a client. After that, the connection will be closed, even if t...",
    "isBlock": false
  },
  {
    "name": "lingering_timeout",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#lingering_timeout",
    "syntax": "lingering_timeout time;",
    "default": "lingering_timeout 5s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When lingering_close is in effect, this directive specifies the maximum waiting time for more client data to arrive. If data are not received during this time, the connection is closed. Otherwise, the data are read an...",
    "isBlock": false
  },
  {
    "name": "listen",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#listen",
    "syntax": "listen address[:port] [default_server] [ssl] [http2 | quic] [proxy_protocol] [setfib=number] [fastopen=number] [backlog=number] [rcvbuf=size] [sndbuf=size] [accept_filter=filter] [deferred] [bind] [ipv6only=on|off] [reuseport] [multipath] [so_keepalive=on|off|[keepidle]:[keepintvl]:[keepcnt]];  |  listen port [default_server] [ssl] [http2 | quic] [proxy_protocol] [setfib=number] [fastopen=number] [backlog=number] [rcvbuf=size] [sndbuf=size] [accept_filter=filter] [deferred] [bind] [ipv6only=on|off] [reuseport] [multipath] [so_keepalive=on|off|[keepidle]:[keepintvl]:[keepcnt]];  |  listen unix:path [default_server] [ssl] [http2 | quic] [proxy_protocol] [backlog=number] [rcvbuf=size] [sndbuf=size] [accept_filter=filter] [deferred] [bind] [so_keepalive=on|off|[keepidle]:[keepintvl]:[keepcnt]];",
    "default": "listen *:80 | *:8000;",
    "contexts": [
      "server"
    ],
    "summary": "Sets the address and port for IP, or the path for a UNIX-domain socket on which the server will accept requests. Both address and port, or only address or only port can be specified. An address may also be a hostname,...",
    "isBlock": false
  },
  {
    "name": "listen",
    "module": "ngx_mail_core_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_core_module.html#listen",
    "syntax": "listen address:port [ssl] [proxy_protocol] [backlog=number] [rcvbuf=size] [sndbuf=size] [bind] [ipv6only=on|off] [multipath] [so_keepalive=on|off|[keepidle]:[keepintvl]:[keepcnt]];",
    "default": "—",
    "contexts": [
      "server"
    ],
    "summary": "Sets the address and port for the socket on which the server will accept requests. It is possible to specify just the port. The address can also be a hostname, for example:",
    "isBlock": false
  },
  {
    "name": "listen",
    "module": "ngx_stream_core_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_core_module.html#listen",
    "syntax": "listen address:port [default_server] [ssl] [udp] [proxy_protocol] [setfib=number] [fastopen=number] [backlog=number] [rcvbuf=size] [sndbuf=size] [accept_filter=filter] [deferred] [bind] [ipv6only=on|off] [reuseport] [multipath] [so_keepalive=on|off|[keepidle]:[keepintvl]:[keepcnt]];",
    "default": "—",
    "contexts": [
      "server"
    ],
    "summary": "Sets the address and port for the socket on which the server will accept connections. It is possible to specify just the port. The address can also be a hostname, for example:",
    "isBlock": false
  },
  {
    "name": "load_module",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#load_module",
    "syntax": "load_module file;",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Loads a dynamic module.",
    "isBlock": false
  },
  {
    "name": "location",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#location",
    "syntax": "location [ = | ~ | ~* | ^~ ] uri { ... }  |  location $variable { ... }  |  location @name { ... }",
    "default": "—",
    "contexts": [
      "server",
      "location"
    ],
    "summary": "Sets configuration depending on a request URI or the value of a variable (1.31.5).",
    "isBlock": true
  },
  {
    "name": "lock_file",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#lock_file",
    "syntax": "lock_file file;",
    "default": "lock_file logs/nginx.lock;",
    "contexts": [
      "main"
    ],
    "summary": "nginx uses the locking mechanism to implement accept_mutex and serialize access to shared memory. On most systems the locks are implemented using atomic operations, and this directive is ignored. On other systems the...",
    "isBlock": false
  },
  {
    "name": "log_format",
    "module": "ngx_http_log_module",
    "scope": "http",
    "docPath": "http/ngx_http_log_module.html#log_format",
    "syntax": "log_format name [escape=default|json|none] string ...;",
    "default": "log_format combined \"...\";",
    "contexts": [
      "http"
    ],
    "summary": "Specifies log format.",
    "isBlock": false
  },
  {
    "name": "log_format",
    "module": "ngx_stream_log_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_log_module.html#log_format",
    "syntax": "log_format name [escape=default|json|none] string ...;",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Specifies the log format, for example:",
    "isBlock": false
  },
  {
    "name": "log_not_found",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#log_not_found",
    "syntax": "log_not_found on | off;",
    "default": "log_not_found on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables logging of errors about not found files into error_log.",
    "isBlock": false
  },
  {
    "name": "log_subrequest",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#log_subrequest",
    "syntax": "log_subrequest on | off;",
    "default": "log_subrequest off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables logging of subrequests into access_log.",
    "isBlock": false
  },
  {
    "name": "logout_token_hint",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#logout_token_hint",
    "syntax": "logout_token_hint on | off;",
    "default": "logout_token_hint off;",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Adds the id_token_hint argument to the Provider's Logout Endpoint when redirecting user during logout. This argument can be required by some OpenID Providers.",
    "isBlock": false
  },
  {
    "name": "logout_uri",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#logout_uri",
    "syntax": "logout_uri uri;",
    "default": "—",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Defines the URI path for initiating session logout. Upon session termination, the user is redirected to Provider's Logout Endpoint or to the post logout page. If neither is configured, the built-in post logout page is...",
    "isBlock": false
  },
  {
    "name": "mail",
    "module": "ngx_mail_core_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_core_module.html#mail",
    "syntax": "mail { ... }",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Provides the configuration file context in which the mail server directives are specified.",
    "isBlock": true
  },
  {
    "name": "map",
    "module": "ngx_http_map_module",
    "scope": "http",
    "docPath": "http/ngx_http_map_module.html#map",
    "syntax": "map string $variable { ... }",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Creates a new variable whose value depends on values of one or more of the source variables specified in the first parameter.",
    "isBlock": true
  },
  {
    "name": "map",
    "module": "ngx_stream_map_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_map_module.html#map",
    "syntax": "map string $variable { ... }",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Creates a new variable whose value depends on values of one or more of the source variables specified in the first parameter.",
    "isBlock": true
  },
  {
    "name": "map_hash_bucket_size",
    "module": "ngx_http_map_module",
    "scope": "http",
    "docPath": "http/ngx_http_map_module.html#map_hash_bucket_size",
    "syntax": "map_hash_bucket_size size;",
    "default": "map_hash_bucket_size 32|64|128;",
    "contexts": [
      "http"
    ],
    "summary": "Sets the bucket size for the map variables hash tables. Default value depends on the processor’s cache line size. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "map_hash_bucket_size",
    "module": "ngx_stream_map_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_map_module.html#map_hash_bucket_size",
    "syntax": "map_hash_bucket_size size;",
    "default": "map_hash_bucket_size 32|64|128;",
    "contexts": [
      "stream"
    ],
    "summary": "Sets the bucket size for the map variables hash tables. Default value depends on the processor’s cache line size. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "map_hash_max_size",
    "module": "ngx_http_map_module",
    "scope": "http",
    "docPath": "http/ngx_http_map_module.html#map_hash_max_size",
    "syntax": "map_hash_max_size size;",
    "default": "map_hash_max_size 2048;",
    "contexts": [
      "http"
    ],
    "summary": "Sets the maximum size of the map variables hash tables. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "map_hash_max_size",
    "module": "ngx_stream_map_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_map_module.html#map_hash_max_size",
    "syntax": "map_hash_max_size size;",
    "default": "map_hash_max_size 2048;",
    "contexts": [
      "stream"
    ],
    "summary": "Sets the maximum size of the map variables hash tables. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "master_process",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#master_process",
    "syntax": "master_process on | off;",
    "default": "master_process on;",
    "contexts": [
      "main"
    ],
    "summary": "Determines whether worker processes are started. This directive is intended for nginx developers.",
    "isBlock": false
  },
  {
    "name": "match",
    "module": "ngx_http_upstream_hc_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_hc_module.html#match",
    "syntax": "match name { ... }",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Defines the named test set used to verify responses to health check requests.",
    "isBlock": true
  },
  {
    "name": "match",
    "module": "ngx_stream_upstream_hc_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_upstream_hc_module.html#match",
    "syntax": "match name { ... }",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Defines the named test set used to verify server responses to health checks.",
    "isBlock": true
  },
  {
    "name": "max_errors",
    "module": "ngx_mail_core_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_core_module.html#max_errors",
    "syntax": "max_errors number;",
    "default": "max_errors 5;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets the number of protocol errors after which the connection is closed.",
    "isBlock": false
  },
  {
    "name": "max_headers",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#max_headers",
    "syntax": "max_headers number;",
    "default": "max_headers 1000;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets the maximum allowed number of header lines in requests. If this limit is reached, the error 400 (Bad Request) is returned.",
    "isBlock": false
  },
  {
    "name": "max_ranges",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#max_ranges",
    "syntax": "max_ranges number;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the maximum allowed number of ranges in byte-range requests. Requests that exceed the limit are processed as if there were no byte ranges specified. By default, the number of ranges is not limited. The zero val...",
    "isBlock": false
  },
  {
    "name": "memcached_allow_upstream",
    "module": "ngx_http_memcached_module",
    "scope": "http",
    "docPath": "http/ngx_http_memcached_module.html#memcached_allow_upstream",
    "syntax": "memcached_allow_upstream string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which access to a memcached server is allowed or denied. If all string parameters are not empty and not equal to “0” then the access is allowed. The conditions are evaluated each time before a...",
    "isBlock": false
  },
  {
    "name": "memcached_bind",
    "module": "ngx_http_memcached_module",
    "scope": "http",
    "docPath": "http/ngx_http_memcached_module.html#memcached_bind",
    "syntax": "memcached_bind address [transparent ] | off;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Makes outgoing connections to a memcached server originate from the specified local IP address with an optional port (1.11.2). Parameter value can contain variables (1.3.12). The special value off (1.3.12) cancels the...",
    "isBlock": false
  },
  {
    "name": "memcached_bind_dynamic",
    "module": "ngx_http_memcached_module",
    "scope": "http",
    "docPath": "http/ngx_http_memcached_module.html#memcached_bind_dynamic",
    "syntax": "memcached_bind_dynamic on | off;",
    "default": "memcached_bind_dynamic off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When enabled, makes the bind operation at each connection attempt.",
    "isBlock": false
  },
  {
    "name": "memcached_buffer_size",
    "module": "ngx_http_memcached_module",
    "scope": "http",
    "docPath": "http/ngx_http_memcached_module.html#memcached_buffer_size",
    "syntax": "memcached_buffer_size size;",
    "default": "memcached_buffer_size 4k|8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the size of the buffer used for reading the response received from the memcached server. The response is passed to the client synchronously, as soon as it is received.",
    "isBlock": false
  },
  {
    "name": "memcached_connect_timeout",
    "module": "ngx_http_memcached_module",
    "scope": "http",
    "docPath": "http/ngx_http_memcached_module.html#memcached_connect_timeout",
    "syntax": "memcached_connect_timeout time;",
    "default": "memcached_connect_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for establishing a connection with a memcached server. It should be noted that this timeout cannot usually exceed 75 seconds.",
    "isBlock": false
  },
  {
    "name": "memcached_gzip_flag",
    "module": "ngx_http_memcached_module",
    "scope": "http",
    "docPath": "http/ngx_http_memcached_module.html#memcached_gzip_flag",
    "syntax": "memcached_gzip_flag flag;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables the test for the flag presence in the memcached server response and sets the “Content-Encoding” response header field to “gzip” if the flag is set.",
    "isBlock": false
  },
  {
    "name": "memcached_next_upstream",
    "module": "ngx_http_memcached_module",
    "scope": "http",
    "docPath": "http/ngx_http_memcached_module.html#memcached_next_upstream",
    "syntax": "memcached_next_upstream error | timeout | denied | invalid_response | not_found | off ...;",
    "default": "memcached_next_upstream error timeout;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies in which cases a request should be passed to the next server:",
    "isBlock": false
  },
  {
    "name": "memcached_next_upstream_timeout",
    "module": "ngx_http_memcached_module",
    "scope": "http",
    "docPath": "http/ngx_http_memcached_module.html#memcached_next_upstream_timeout",
    "syntax": "memcached_next_upstream_timeout time;",
    "default": "memcached_next_upstream_timeout 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the time during which a request can be passed to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "memcached_next_upstream_tries",
    "module": "ngx_http_memcached_module",
    "scope": "http",
    "docPath": "http/ngx_http_memcached_module.html#memcached_next_upstream_tries",
    "syntax": "memcached_next_upstream_tries number;",
    "default": "memcached_next_upstream_tries 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the number of possible tries for passing a request to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "memcached_pass",
    "module": "ngx_http_memcached_module",
    "scope": "http",
    "docPath": "http/ngx_http_memcached_module.html#memcached_pass",
    "syntax": "memcached_pass address;",
    "default": "—",
    "contexts": [
      "location",
      "if in location"
    ],
    "summary": "Sets the memcached server address. The address can be specified as a domain name or IP address, and a port:",
    "isBlock": false
  },
  {
    "name": "memcached_read_timeout",
    "module": "ngx_http_memcached_module",
    "scope": "http",
    "docPath": "http/ngx_http_memcached_module.html#memcached_read_timeout",
    "syntax": "memcached_read_timeout time;",
    "default": "memcached_read_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for reading a response from the memcached server. The timeout is set only between two successive read operations, not for the transmission of the whole response. If the memcached server does not tran...",
    "isBlock": false
  },
  {
    "name": "memcached_send_timeout",
    "module": "ngx_http_memcached_module",
    "scope": "http",
    "docPath": "http/ngx_http_memcached_module.html#memcached_send_timeout",
    "syntax": "memcached_send_timeout time;",
    "default": "memcached_send_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout for transmitting a request to the memcached server. The timeout is set only between two successive write operations, not for the transmission of the whole request. If the memcached server does not recei...",
    "isBlock": false
  },
  {
    "name": "memcached_socket_keepalive",
    "module": "ngx_http_memcached_module",
    "scope": "http",
    "docPath": "http/ngx_http_memcached_module.html#memcached_socket_keepalive",
    "syntax": "memcached_socket_keepalive on | off;",
    "default": "memcached_socket_keepalive off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Configures the “TCP keepalive” behavior for outgoing connections to a memcached server. By default, the operating system’s settings are in effect for the socket. If the directive is set to the value “on”, the SO_KEEPA...",
    "isBlock": false
  },
  {
    "name": "merge_slashes",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#merge_slashes",
    "syntax": "merge_slashes on | off;",
    "default": "merge_slashes on;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables or disables compression of two or more adjacent slashes in a URI into a single slash.",
    "isBlock": false
  },
  {
    "name": "mgmt",
    "module": "ngx_mgmt_module",
    "scope": "core",
    "docPath": "ngx_mgmt_module.html#mgmt",
    "syntax": "mgmt { ... }",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Provides the configuration file context in which usage reporting and license management directives are specified.",
    "isBlock": true
  },
  {
    "name": "min_delete_depth",
    "module": "ngx_http_dav_module",
    "scope": "http",
    "docPath": "http/ngx_http_dav_module.html#min_delete_depth",
    "syntax": "min_delete_depth number;",
    "default": "min_delete_depth 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows the DELETE method to remove files provided that the number of elements in a request path is not less than the specified number. For example, the directive",
    "isBlock": false
  },
  {
    "name": "mirror",
    "module": "ngx_http_mirror_module",
    "scope": "http",
    "docPath": "http/ngx_http_mirror_module.html#mirror",
    "syntax": "mirror uri | off;",
    "default": "mirror off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the URI to which an original request will be mirrored. Several mirrors can be specified on the same configuration level.",
    "isBlock": false
  },
  {
    "name": "mirror_request_body",
    "module": "ngx_http_mirror_module",
    "scope": "http",
    "docPath": "http/ngx_http_mirror_module.html#mirror_request_body",
    "syntax": "mirror_request_body on | off;",
    "default": "mirror_request_body on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Indicates whether the client request body is mirrored. When enabled, the client request body will be read prior to creating mirror subrequests. In this case, unbuffered client request body proxying set by the proxy_re...",
    "isBlock": false
  },
  {
    "name": "modern_browser",
    "module": "ngx_http_browser_module",
    "scope": "http",
    "docPath": "http/ngx_http_browser_module.html#modern_browser",
    "syntax": "modern_browser browser version;  |  modern_browser unlisted;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a version starting from which a browser is considered modern. A browser can be any one of the following: msie, gecko (browsers based on Mozilla), opera, safari, or konqueror.",
    "isBlock": false
  },
  {
    "name": "modern_browser_value",
    "module": "ngx_http_browser_module",
    "scope": "http",
    "docPath": "http/ngx_http_browser_module.html#modern_browser_value",
    "syntax": "modern_browser_value string;",
    "default": "modern_browser_value 1;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a value for the $modern_browser variables.",
    "isBlock": false
  },
  {
    "name": "mp4",
    "module": "ngx_http_mp4_module",
    "scope": "http",
    "docPath": "http/ngx_http_mp4_module.html#mp4",
    "syntax": "mp4;",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Turns on module processing in a surrounding location.",
    "isBlock": false
  },
  {
    "name": "mp4_buffer_size",
    "module": "ngx_http_mp4_module",
    "scope": "http",
    "docPath": "http/ngx_http_mp4_module.html#mp4_buffer_size",
    "syntax": "mp4_buffer_size size;",
    "default": "mp4_buffer_size 512K;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the initial size of the buffer used for processing MP4 files.",
    "isBlock": false
  },
  {
    "name": "mp4_limit_rate",
    "module": "ngx_http_mp4_module",
    "scope": "http",
    "docPath": "http/ngx_http_mp4_module.html#mp4_limit_rate",
    "syntax": "mp4_limit_rate on | off | factor;",
    "default": "mp4_limit_rate off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the rate of response transmission to a client. The rate is limited based on the average bitrate of the MP4 file served. To calculate the rate, the bitrate is multiplied by the specified factor. The special valu...",
    "isBlock": false
  },
  {
    "name": "mp4_limit_rate_after",
    "module": "ngx_http_mp4_module",
    "scope": "http",
    "docPath": "http/ngx_http_mp4_module.html#mp4_limit_rate_after",
    "syntax": "mp4_limit_rate_after time;",
    "default": "mp4_limit_rate_after 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the initial amount of media data (measured in playback time) after which the further transmission of the response to a client will be rate limited.",
    "isBlock": false
  },
  {
    "name": "mp4_max_buffer_size",
    "module": "ngx_http_mp4_module",
    "scope": "http",
    "docPath": "http/ngx_http_mp4_module.html#mp4_max_buffer_size",
    "syntax": "mp4_max_buffer_size size;",
    "default": "mp4_max_buffer_size 10M;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "During metadata processing, a larger buffer may become necessary. Its size cannot exceed the specified size, or else nginx will return the 500 (Internal Server Error) server error, and log the following message:",
    "isBlock": false
  },
  {
    "name": "mp4_start_key_frame",
    "module": "ngx_http_mp4_module",
    "scope": "http",
    "docPath": "http/ngx_http_mp4_module.html#mp4_start_key_frame",
    "syntax": "mp4_start_key_frame on | off;",
    "default": "mp4_start_key_frame off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Forces output video to always start with a key video frame. If the start argument does not point to a key frame, initial frames are hidden using an mp4 edit list. Edit lists are supported by major players and browsers...",
    "isBlock": false
  },
  {
    "name": "mqtt",
    "module": "ngx_stream_mqtt_filter_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_mqtt_filter_module.html#mqtt",
    "syntax": "mqtt on | off;",
    "default": "mqtt off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables the MQTT protocol for the given virtual server.",
    "isBlock": false
  },
  {
    "name": "mqtt_buffers",
    "module": "ngx_stream_mqtt_filter_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_mqtt_filter_module.html#mqtt_buffers",
    "syntax": "mqtt_buffers number size;",
    "default": "mqtt_buffers 100 1k;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the number and size of the buffers used for handling MQTT messages, for a single connection.",
    "isBlock": false
  },
  {
    "name": "mqtt_preread",
    "module": "ngx_stream_mqtt_preread_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_mqtt_preread_module.html#mqtt_preread",
    "syntax": "mqtt_preread on | off;",
    "default": "mqtt_preread off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables extracting information from the MQTT CONNECT message at the preread phase.",
    "isBlock": false
  },
  {
    "name": "mqtt_rewrite_buffer_size",
    "module": "ngx_stream_mqtt_filter_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_mqtt_filter_module.html#mqtt_rewrite_buffer_size",
    "syntax": "mqtt_rewrite_buffer_size size;",
    "default": "mqtt_rewrite_buffer_size 4k|8k;",
    "contexts": [
      "server"
    ],
    "summary": "",
    "isBlock": false
  },
  {
    "name": "mqtt_set_connect",
    "module": "ngx_stream_mqtt_filter_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_mqtt_filter_module.html#mqtt_set_connect",
    "syntax": "mqtt_set_connect field value;",
    "default": "—",
    "contexts": [
      "server"
    ],
    "summary": "Sets the message field to the given value for CONNECT message. The following fields are supported: clientid, username, and password. The value can contain text, variables, and their combination.",
    "isBlock": false
  },
  {
    "name": "msie_padding",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#msie_padding",
    "syntax": "msie_padding on | off;",
    "default": "msie_padding on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables adding comments to responses for MSIE clients with status greater than 400 to increase the response size to 512 bytes.",
    "isBlock": false
  },
  {
    "name": "msie_refresh",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#msie_refresh",
    "syntax": "msie_refresh on | off;",
    "default": "msie_refresh off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables issuing refreshes instead of redirects for MSIE clients.",
    "isBlock": false
  },
  {
    "name": "multi_accept",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#multi_accept",
    "syntax": "multi_accept on | off;",
    "default": "multi_accept off;",
    "contexts": [
      "events"
    ],
    "summary": "If multi_accept is disabled, a worker process will accept one new connection at a time. Otherwise, a worker process will accept all new connections at a time.",
    "isBlock": false
  },
  {
    "name": "ntlm",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#ntlm",
    "syntax": "ntlm;",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Allows proxying requests with NTLM Authentication. The upstream connection is bound to the client connection once the client sends a request with the “Authorization” header field value starting with “Negotiate” or “NT...",
    "isBlock": false
  },
  {
    "name": "num_map",
    "module": "ngx_http_num_map_module",
    "scope": "http",
    "docPath": "http/ngx_http_num_map_module.html#num_map",
    "syntax": "num_map [$number] $variable { ... }",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Describes how the values of the specified variable depend on numeric values or numeric value ranges.",
    "isBlock": true
  },
  {
    "name": "num_map",
    "module": "ngx_stream_num_map_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_num_map_module.html#num_map",
    "syntax": "num_map [$number] $variable { ... }",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Describes how the values of the specified variable depend on numeric values or numeric value ranges.",
    "isBlock": true
  },
  {
    "name": "oidc_provider",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#oidc_provider",
    "syntax": "oidc_provider name { ... }",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Defines an OpenID Provider for use with the auth_oidc directive.",
    "isBlock": true
  },
  {
    "name": "open_file_cache",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#open_file_cache",
    "syntax": "open_file_cache off;  |  open_file_cache max=N [inactive=time];",
    "default": "open_file_cache off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Configures a cache that can store:",
    "isBlock": false
  },
  {
    "name": "open_file_cache_errors",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#open_file_cache_errors",
    "syntax": "open_file_cache_errors on | off;",
    "default": "open_file_cache_errors off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables caching of file lookup errors by open_file_cache.",
    "isBlock": false
  },
  {
    "name": "open_file_cache_min_uses",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#open_file_cache_min_uses",
    "syntax": "open_file_cache_min_uses number;",
    "default": "open_file_cache_min_uses 1;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the minimum number of file accesses during the period configured by the inactive parameter of the open_file_cache directive, required for a file descriptor to remain open in the cache.",
    "isBlock": false
  },
  {
    "name": "open_file_cache_valid",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#open_file_cache_valid",
    "syntax": "open_file_cache_valid time;",
    "default": "open_file_cache_valid 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a time after which open_file_cache elements should be validated.",
    "isBlock": false
  },
  {
    "name": "open_log_file_cache",
    "module": "ngx_http_log_module",
    "scope": "http",
    "docPath": "http/ngx_http_log_module.html#open_log_file_cache",
    "syntax": "open_log_file_cache max=N [inactive=time] [min_uses=N] [valid=time];  |  open_log_file_cache off;",
    "default": "open_log_file_cache off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a cache that stores the file descriptors of frequently used logs whose names contain variables. The directive has the following parameters:",
    "isBlock": false
  },
  {
    "name": "open_log_file_cache",
    "module": "ngx_stream_log_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_log_module.html#open_log_file_cache",
    "syntax": "open_log_file_cache max=N [inactive=time] [min_uses=N] [valid=time];  |  open_log_file_cache off;",
    "default": "open_log_file_cache off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Defines a cache that stores the file descriptors of frequently used logs whose names contain variables. The directive has the following parameters:",
    "isBlock": false
  },
  {
    "name": "otel_exporter",
    "module": "ngx_otel_module",
    "scope": "core",
    "docPath": "ngx_otel_module.html#otel_exporter",
    "syntax": "otel_exporter { ... }",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Specifies OTel data export parameters:",
    "isBlock": true
  },
  {
    "name": "otel_resource_attr",
    "module": "ngx_otel_module",
    "scope": "core",
    "docPath": "ngx_otel_module.html#otel_resource_attr",
    "syntax": "otel_resource_attr name value;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets a custom OTel resource attribute.",
    "isBlock": false
  },
  {
    "name": "otel_service_name",
    "module": "ngx_otel_module",
    "scope": "core",
    "docPath": "ngx_otel_module.html#otel_service_name",
    "syntax": "otel_service_name name;",
    "default": "otel_service_name unknown_service:nginx;",
    "contexts": [
      "http"
    ],
    "summary": "Sets the “service.name” attribute of the OTel resource.",
    "isBlock": false
  },
  {
    "name": "otel_span_attr",
    "module": "ngx_otel_module",
    "scope": "core",
    "docPath": "ngx_otel_module.html#otel_span_attr",
    "syntax": "otel_span_attr name value;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Adds a custom OTel span attribute. The value can contain variables.",
    "isBlock": false
  },
  {
    "name": "otel_span_name",
    "module": "ngx_otel_module",
    "scope": "core",
    "docPath": "ngx_otel_module.html#otel_span_name",
    "syntax": "otel_span_name name;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines the name of the OTel span. By default, it is a name of the location for a request. The name can contain variables.",
    "isBlock": false
  },
  {
    "name": "otel_trace",
    "module": "ngx_otel_module",
    "scope": "core",
    "docPath": "ngx_otel_module.html#otel_trace",
    "syntax": "otel_trace on | off | $variable;",
    "default": "otel_trace off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables OpenTelemetry tracing. The directive can also be enabled by specifying a variable:",
    "isBlock": false
  },
  {
    "name": "otel_trace_context",
    "module": "ngx_otel_module",
    "scope": "core",
    "docPath": "ngx_otel_module.html#otel_trace_context",
    "syntax": "otel_trace_context extract | inject | propagate | ignore;",
    "default": "otel_trace_context ignore;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies how to propagate traceparent/tracestate headers:",
    "isBlock": false
  },
  {
    "name": "output_buffers",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#output_buffers",
    "syntax": "output_buffers number size;",
    "default": "output_buffers 2 32k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the number and size of the buffers used for reading a response from a disk.",
    "isBlock": false
  },
  {
    "name": "override_charset",
    "module": "ngx_http_charset_module",
    "scope": "http",
    "docPath": "http/ngx_http_charset_module.html#override_charset",
    "syntax": "override_charset on | off;",
    "default": "override_charset off;",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Determines whether a conversion should be performed for answers received from a proxied or a FastCGI/uwsgi/SCGI/gRPC server when the answers already carry a charset in the “Content-Type” response header field. If conv...",
    "isBlock": false
  },
  {
    "name": "pass",
    "module": "ngx_stream_pass_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_pass_module.html#pass",
    "syntax": "pass address;",
    "default": "—",
    "contexts": [
      "server"
    ],
    "summary": "Sets server address to pass client connection to. The address can be specified as an IP address and a port:",
    "isBlock": false
  },
  {
    "name": "pcre_jit",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#pcre_jit",
    "syntax": "pcre_jit on | off;",
    "default": "pcre_jit off;",
    "contexts": [
      "main"
    ],
    "summary": "Enables or disables the use of “just-in-time compilation” (PCRE JIT) for the regular expressions known by the time of configuration parsing.",
    "isBlock": false
  },
  {
    "name": "perl",
    "module": "ngx_http_perl_module",
    "scope": "http",
    "docPath": "http/ngx_http_perl_module.html#perl",
    "syntax": "perl module::function|'sub { ... }';",
    "default": "—",
    "contexts": [
      "location",
      "limit_except"
    ],
    "summary": "Sets a Perl handler for the given location.",
    "isBlock": false
  },
  {
    "name": "perl_modules",
    "module": "ngx_http_perl_module",
    "scope": "http",
    "docPath": "http/ngx_http_perl_module.html#perl_modules",
    "syntax": "perl_modules path;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets an additional path for Perl modules.",
    "isBlock": false
  },
  {
    "name": "perl_require",
    "module": "ngx_http_perl_module",
    "scope": "http",
    "docPath": "http/ngx_http_perl_module.html#perl_require",
    "syntax": "perl_require module;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Defines the name of a module that will be loaded during each reconfiguration. Several perl_require directives can be present.",
    "isBlock": false
  },
  {
    "name": "perl_set",
    "module": "ngx_http_perl_module",
    "scope": "http",
    "docPath": "http/ngx_http_perl_module.html#perl_set",
    "syntax": "perl_set $variable module::function|'sub { ... }';",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Installs a Perl handler for the specified variable.",
    "isBlock": false
  },
  {
    "name": "pid",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#pid",
    "syntax": "pid file;",
    "default": "pid logs/nginx.pid;",
    "contexts": [
      "main"
    ],
    "summary": "Defines a file that will store the process ID of the main process.",
    "isBlock": false
  },
  {
    "name": "pkce",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#pkce",
    "syntax": "pkce on | off;",
    "default": "—",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Explicitly enables or disables PKCE. By default, PKCE is automatically enabled based on OpenID Provider metadata.",
    "isBlock": false
  },
  {
    "name": "pop3_auth",
    "module": "ngx_mail_pop3_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_pop3_module.html#pop3_auth",
    "syntax": "pop3_auth method ...;",
    "default": "pop3_auth plain;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets permitted methods of authentication for POP3 clients. Supported methods are:",
    "isBlock": false
  },
  {
    "name": "pop3_capabilities",
    "module": "ngx_mail_pop3_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_pop3_module.html#pop3_capabilities",
    "syntax": "pop3_capabilities extension ...;",
    "default": "pop3_capabilities TOP USER UIDL;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets the POP3 protocol extensions list that is passed to the client in response to the CAPA command. The authentication methods specified in the pop3_auth directive (SASL extension) and STLS are automatically added to...",
    "isBlock": false
  },
  {
    "name": "port_in_redirect",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#port_in_redirect",
    "syntax": "port_in_redirect on | off;",
    "default": "port_in_redirect on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables specifying the port in absolute redirects issued by nginx.",
    "isBlock": false
  },
  {
    "name": "post_logout_uri",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#post_logout_uri",
    "syntax": "post_logout_uri uri;",
    "default": "—",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Defines the path or absolute URI to redirect the user to after the logout. The uri must match the configuration on the Provider's side. If the post logout page is served by NGINX, the OIDC module shouldn't be enabled...",
    "isBlock": false
  },
  {
    "name": "postpone_output",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#postpone_output",
    "syntax": "postpone_output size;",
    "default": "postpone_output 1460;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If possible, the transmission of client data will be postponed until nginx has at least size bytes of data to send. The zero value disables postponing data transmission.",
    "isBlock": false
  },
  {
    "name": "preferred_chain",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#preferred_chain",
    "syntax": "preferred_chain name;",
    "default": "—",
    "contexts": [
      "acme_issuer"
    ],
    "summary": "Specifies the preferred certificate chain.",
    "isBlock": false
  },
  {
    "name": "preread_buffer_size",
    "module": "ngx_stream_core_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_core_module.html#preread_buffer_size",
    "syntax": "preread_buffer_size size;",
    "default": "preread_buffer_size 16k;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a size of the preread buffer.",
    "isBlock": false
  },
  {
    "name": "preread_timeout",
    "module": "ngx_stream_core_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_core_module.html#preread_timeout",
    "syntax": "preread_timeout timeout;",
    "default": "preread_timeout 30s;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a timeout of the preread phase.",
    "isBlock": false
  },
  {
    "name": "profile",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#profile",
    "syntax": "profile name [require];",
    "default": "—",
    "contexts": [
      "acme_issuer"
    ],
    "summary": "Requests the certificate profile name from the ACME server.",
    "isBlock": false
  },
  {
    "name": "protocol",
    "module": "ngx_mail_core_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_core_module.html#protocol",
    "syntax": "protocol imap | pop3 | smtp;",
    "default": "—",
    "contexts": [
      "server"
    ],
    "summary": "Sets the protocol for a proxied server. Supported protocols are IMAP, POP3, and SMTP.",
    "isBlock": false
  },
  {
    "name": "proxy",
    "module": "ngx_mgmt_module",
    "scope": "core",
    "docPath": "ngx_mgmt_module.html#proxy",
    "syntax": "proxy host:port;",
    "default": "—",
    "contexts": [
      "mgmt"
    ],
    "summary": "Sets the HTTP CONNECT proxy used for sending the usage report.",
    "isBlock": false
  },
  {
    "name": "proxy_allow_upstream",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_allow_upstream",
    "syntax": "proxy_allow_upstream string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which access to a proxied server is allowed or denied. If all string parameters are not empty and not equal to “0” then the access is allowed. The conditions are evaluated each time before a c...",
    "isBlock": false
  },
  {
    "name": "proxy_bind",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_bind",
    "syntax": "proxy_bind address [transparent] | off;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Makes outgoing connections to a proxied server originate from the specified local IP address with an optional port (1.11.2). Parameter value can contain variables (1.3.12). The special value off (1.3.12) cancels the e...",
    "isBlock": false
  },
  {
    "name": "proxy_bind",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_bind",
    "syntax": "proxy_bind address [transparent] | off;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Makes outgoing connections to a proxied server originate from the specified local IP address. Parameter value can contain variables (1.11.2). The special value off cancels the effect of the proxy_bind directive inheri...",
    "isBlock": false
  },
  {
    "name": "proxy_bind_dynamic",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_bind_dynamic",
    "syntax": "proxy_bind_dynamic on | off;",
    "default": "proxy_bind_dynamic off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When enabled, makes the bind operation at each connection attempt.",
    "isBlock": false
  },
  {
    "name": "proxy_bind_dynamic",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_bind_dynamic",
    "syntax": "proxy_bind_dynamic on | off;",
    "default": "proxy_bind_dynamic off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "When enabled, makes the bind operation at each connection attempt.",
    "isBlock": false
  },
  {
    "name": "proxy_buffer",
    "module": "ngx_mail_proxy_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_proxy_module.html#proxy_buffer",
    "syntax": "proxy_buffer size;",
    "default": "proxy_buffer 4k|8k;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets the size of the buffer used for proxying. By default, the buffer size is equal to one memory page. Depending on a platform, it is either 4K or 8K.",
    "isBlock": false
  },
  {
    "name": "proxy_buffer_size",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_buffer_size",
    "syntax": "proxy_buffer_size size;",
    "default": "proxy_buffer_size 4k|8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the size of the buffer used for reading the first part of the response received from the proxied server. This part usually contains a small response header; if it exceeds the buffer size, the response is consider...",
    "isBlock": false
  },
  {
    "name": "proxy_buffer_size",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_buffer_size",
    "syntax": "proxy_buffer_size size;",
    "default": "proxy_buffer_size 16k;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the size of the buffer used for reading data from the proxied server. Also sets the size of the buffer used for reading data from the client.",
    "isBlock": false
  },
  {
    "name": "proxy_buffering",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_buffering",
    "syntax": "proxy_buffering on | off;",
    "default": "proxy_buffering on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables buffering of responses from the proxied server.",
    "isBlock": false
  },
  {
    "name": "proxy_buffers",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_buffers",
    "syntax": "proxy_buffers number size;",
    "default": "proxy_buffers 8 4k|8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the number and size of the buffers used for reading a response from the proxied server, for a single connection. By default, the buffer size is equal to one memory page. This is either 4K or 8K, depending on a pl...",
    "isBlock": false
  },
  {
    "name": "proxy_busy_buffers_size",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_busy_buffers_size",
    "syntax": "proxy_busy_buffers_size size;",
    "default": "proxy_busy_buffers_size 8k|16k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When buffering of responses from the proxied server is enabled, limits the total size of buffers that can be busy sending a response to the client while the response is not yet fully read. In the meantime, the rest of...",
    "isBlock": false
  },
  {
    "name": "proxy_cache",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache",
    "syntax": "proxy_cache zone | off;",
    "default": "proxy_cache off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a shared memory zone used for caching. The same zone can be used in several places. Parameter value can contain variables (1.7.9). The off parameter disables caching inherited from the previous configuration l...",
    "isBlock": false
  },
  {
    "name": "proxy_cache_background_update",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_background_update",
    "syntax": "proxy_cache_background_update on | off;",
    "default": "proxy_cache_background_update off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows starting a background subrequest to update an expired cache item, while a stale cached response is returned to the client. Note that it is necessary to allow the usage of a stale cached response when it is bein...",
    "isBlock": false
  },
  {
    "name": "proxy_cache_bypass",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_bypass",
    "syntax": "proxy_cache_bypass string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which the response will not be taken from a cache. If at least one value of the string parameters is not empty and is not equal to “0” then the response will not be taken from the cache:",
    "isBlock": false
  },
  {
    "name": "proxy_cache_convert_head",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_convert_head",
    "syntax": "proxy_cache_convert_head on | off;",
    "default": "proxy_cache_convert_head on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables the conversion of the “HEAD” method to “GET” for caching. When the conversion is disabled, the cache key should be configured to include the $request_method.",
    "isBlock": false
  },
  {
    "name": "proxy_cache_key",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_key",
    "syntax": "proxy_cache_key string;",
    "default": "proxy_cache_key $scheme$proxy_host$request_uri;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a key for caching, for example",
    "isBlock": false
  },
  {
    "name": "proxy_cache_lock",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_lock",
    "syntax": "proxy_cache_lock on | off;",
    "default": "proxy_cache_lock off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When enabled, only one request at a time will be allowed to populate a new cache element identified according to the proxy_cache_key directive by passing a request to a proxied server. Other requests of the same cache...",
    "isBlock": false
  },
  {
    "name": "proxy_cache_lock_age",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_lock_age",
    "syntax": "proxy_cache_lock_age time;",
    "default": "proxy_cache_lock_age 5s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If the last request passed to the proxied server for populating a new cache element has not completed for the specified time, one more request may be passed to the proxied server.",
    "isBlock": false
  },
  {
    "name": "proxy_cache_lock_timeout",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_lock_timeout",
    "syntax": "proxy_cache_lock_timeout time;",
    "default": "proxy_cache_lock_timeout 5s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout for proxy_cache_lock. When the time expires, the request will be passed to the proxied server, however, the response will not be cached.",
    "isBlock": false
  },
  {
    "name": "proxy_cache_max_range_offset",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_max_range_offset",
    "syntax": "proxy_cache_max_range_offset number;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets an offset in bytes for byte-range requests. If the range is beyond the offset, the range request will be passed to the proxied server and the response will not be cached.",
    "isBlock": false
  },
  {
    "name": "proxy_cache_methods",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_methods",
    "syntax": "proxy_cache_methods GET | HEAD | POST ...;",
    "default": "proxy_cache_methods GET HEAD;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If the client request method is listed in this directive then the response will be cached. “GET” and “HEAD” methods are always added to the list, though it is recommended to specify them explicitly. See also the proxy...",
    "isBlock": false
  },
  {
    "name": "proxy_cache_min_uses",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_min_uses",
    "syntax": "proxy_cache_min_uses number;",
    "default": "proxy_cache_min_uses 1;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the number of requests after which the response will be cached.",
    "isBlock": false
  },
  {
    "name": "proxy_cache_path",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_path",
    "syntax": "proxy_cache_path path [levels=levels] [use_temp_path=on|off] keys_zone=name:size [inactive=time] [max_size=size] [min_free=size] [manager_files=number] [manager_sleep=time] [manager_threshold=time] [loader_files=number] [loader_sleep=time] [loader_threshold=time] [purger=on|off] [purger_files=number] [purger_sleep=time] [purger_threshold=time];",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets the path and other parameters of a cache. Cache data are stored in files. The file name in a cache is a result of applying the MD5 function to the cache key. The levels parameter defines hierarchy levels of a cac...",
    "isBlock": false
  },
  {
    "name": "proxy_cache_purge",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_purge",
    "syntax": "proxy_cache_purge string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which the request will be considered a cache purge request. If at least one value of the string parameters is not empty and is not equal to “0” then the cache entry with a corresponding cache...",
    "isBlock": false
  },
  {
    "name": "proxy_cache_revalidate",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_revalidate",
    "syntax": "proxy_cache_revalidate on | off;",
    "default": "proxy_cache_revalidate off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables revalidation of expired cache items using conditional requests with the “If-Modified-Since” and “If-None-Match” header fields.",
    "isBlock": false
  },
  {
    "name": "proxy_cache_use_stale",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_use_stale",
    "syntax": "proxy_cache_use_stale error | timeout | invalid_header | updating | http_500 | http_502 | http_503 | http_504 | http_403 | http_404 | http_429 | off ...;",
    "default": "proxy_cache_use_stale off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines in which cases a stale cached response can be used during communication with the proxied server. The directive’s parameters match the parameters of the proxy_next_upstream directive.",
    "isBlock": false
  },
  {
    "name": "proxy_cache_valid",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cache_valid",
    "syntax": "proxy_cache_valid [code ...] time;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets caching time for different response codes. For example, the following directives",
    "isBlock": false
  },
  {
    "name": "proxy_connect_timeout",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_connect_timeout",
    "syntax": "proxy_connect_timeout time;",
    "default": "proxy_connect_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for establishing a connection with a proxied server. It should be noted that this timeout cannot usually exceed 75 seconds.",
    "isBlock": false
  },
  {
    "name": "proxy_connect_timeout",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_connect_timeout",
    "syntax": "proxy_connect_timeout time;",
    "default": "proxy_connect_timeout 60s;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Defines a timeout for establishing a connection with a proxied server.",
    "isBlock": false
  },
  {
    "name": "proxy_cookie_domain",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cookie_domain",
    "syntax": "proxy_cookie_domain off;  |  proxy_cookie_domain domain replacement;",
    "default": "proxy_cookie_domain off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a text that should be changed in the domain attribute of the “Set-Cookie” header fields of a proxied server response. Suppose a proxied server returned the “Set-Cookie” header field with the attribute “domain=loc...",
    "isBlock": false
  },
  {
    "name": "proxy_cookie_flags",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cookie_flags",
    "syntax": "proxy_cookie_flags off | cookie [flag ...];",
    "default": "proxy_cookie_flags off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets one or more flags for the cookie. The cookie can contain text, variables, and their combinations. The flag can contain text, variables, and their combinations (1.19.8). The secure, httponly, samesite=strict, same...",
    "isBlock": false
  },
  {
    "name": "proxy_cookie_path",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_cookie_path",
    "syntax": "proxy_cookie_path off;  |  proxy_cookie_path path replacement;",
    "default": "proxy_cookie_path off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a text that should be changed in the path attribute of the “Set-Cookie” header fields of a proxied server response. Suppose a proxied server returned the “Set-Cookie” header field with the attribute “path=/two/so...",
    "isBlock": false
  },
  {
    "name": "proxy_download_rate",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_download_rate",
    "syntax": "proxy_download_rate rate;",
    "default": "proxy_download_rate 0;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Limits the speed of reading the data from the proxied server. The rate is specified in bytes per second. The zero value disables rate limiting. The limit is set per a connection, so if nginx simultaneously opens two c...",
    "isBlock": false
  },
  {
    "name": "proxy_force_ranges",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_force_ranges",
    "syntax": "proxy_force_ranges on | off;",
    "default": "proxy_force_ranges off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables byte-range support for both cached and uncached responses from the proxied server regardless of the “Accept-Ranges” field in these responses.",
    "isBlock": false
  },
  {
    "name": "proxy_half_close",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_half_close",
    "syntax": "proxy_half_close on | off;",
    "default": "proxy_half_close off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables or disables closing each direction of a TCP connection independently (“TCP half-close”). If enabled, proxying over TCP will be kept until both sides close the connection.",
    "isBlock": false
  },
  {
    "name": "proxy_headers_hash_bucket_size",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_headers_hash_bucket_size",
    "syntax": "proxy_headers_hash_bucket_size size;",
    "default": "proxy_headers_hash_bucket_size 64;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the bucket size for hash tables used by the proxy_hide_header and proxy_set_header directives. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "proxy_headers_hash_max_size",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_headers_hash_max_size",
    "syntax": "proxy_headers_hash_max_size size;",
    "default": "proxy_headers_hash_max_size 512;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the maximum size of hash tables used by the proxy_hide_header and proxy_set_header directives. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "proxy_hide_header",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_hide_header",
    "syntax": "proxy_hide_header field;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "By default, nginx does not pass the header fields “Date”, “Server”, “X-Pad”, and “X-Accel-...” from the response of a proxied server to a client. The proxy_hide_header directive sets additional fields that will not be...",
    "isBlock": false
  },
  {
    "name": "proxy_http_version",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_http_version",
    "syntax": "proxy_http_version 1.0 | 1.1 | 2;",
    "default": "proxy_http_version 1.1;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the HTTP protocol version for proxying. Since 1.29.7, version 1.1 is used by default. Before 1.29.7, version 1.0 was used by default. Version 1.1 or 2 (1.29.4) is recommended for use with keepalive connections an...",
    "isBlock": false
  },
  {
    "name": "proxy_ignore_client_abort",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ignore_client_abort",
    "syntax": "proxy_ignore_client_abort on | off;",
    "default": "proxy_ignore_client_abort off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether the connection with a proxied server should be closed when a client closes the connection without waiting for a response.",
    "isBlock": false
  },
  {
    "name": "proxy_ignore_headers",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ignore_headers",
    "syntax": "proxy_ignore_headers field ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Disables processing of certain response header fields from the proxied server. The following fields can be ignored: “X-Accel-Redirect”, “X-Accel-Expires”, “X-Accel-Limit-Rate” (1.1.6), “X-Accel-Buffering” (1.1.6), “X-...",
    "isBlock": false
  },
  {
    "name": "proxy_intercept_errors",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_intercept_errors",
    "syntax": "proxy_intercept_errors on | off;",
    "default": "proxy_intercept_errors off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether proxied responses with codes greater than or equal to 300 should be passed to a client or be intercepted and redirected to nginx for processing with the error_page directive.",
    "isBlock": false
  },
  {
    "name": "proxy_limit_rate",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_limit_rate",
    "syntax": "proxy_limit_rate rate;",
    "default": "proxy_limit_rate 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the speed of reading the response from the proxied server. The rate is specified in bytes per second. The zero value disables rate limiting. The limit is set per a request, and so if nginx simultaneously opens...",
    "isBlock": false
  },
  {
    "name": "proxy_max_temp_file_size",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_max_temp_file_size",
    "syntax": "proxy_max_temp_file_size size;",
    "default": "proxy_max_temp_file_size 1024m;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When buffering of responses from the proxied server is enabled, and the whole response does not fit into the buffers set by the proxy_buffer_size and proxy_buffers directives, a part of the response can be saved to a...",
    "isBlock": false
  },
  {
    "name": "proxy_method",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_method",
    "syntax": "proxy_method method;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies the HTTP method to use in requests forwarded to the proxied server instead of the method from the client request. Parameter value can contain variables (1.11.6).",
    "isBlock": false
  },
  {
    "name": "proxy_next_upstream",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_next_upstream",
    "syntax": "proxy_next_upstream error | timeout | denied | invalid_header | http_500 | http_502 | http_503 | http_504 | http_403 | http_404 | http_429 | non_idempotent | off ...;",
    "default": "proxy_next_upstream error timeout;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies in which cases a request should be passed to the next server:",
    "isBlock": false
  },
  {
    "name": "proxy_next_upstream",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_next_upstream",
    "syntax": "proxy_next_upstream on | off;",
    "default": "proxy_next_upstream on;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "When a connection to the proxied server cannot be established, determines whether a client connection will be passed to the next server.",
    "isBlock": false
  },
  {
    "name": "proxy_next_upstream_timeout",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_next_upstream_timeout",
    "syntax": "proxy_next_upstream_timeout time;",
    "default": "proxy_next_upstream_timeout 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the time during which a request can be passed to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "proxy_next_upstream_timeout",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_next_upstream_timeout",
    "syntax": "proxy_next_upstream_timeout time;",
    "default": "proxy_next_upstream_timeout 0;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Limits the time allowed to pass a connection to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "proxy_next_upstream_tries",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_next_upstream_tries",
    "syntax": "proxy_next_upstream_tries number;",
    "default": "proxy_next_upstream_tries 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the number of possible tries for passing a request to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "proxy_next_upstream_tries",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_next_upstream_tries",
    "syntax": "proxy_next_upstream_tries number;",
    "default": "proxy_next_upstream_tries 0;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Limits the number of possible tries for passing a connection to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "proxy_no_cache",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_no_cache",
    "syntax": "proxy_no_cache string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which the response will not be saved to a cache. If at least one value of the string parameters is not empty and is not equal to “0” then the response will not be saved:",
    "isBlock": false
  },
  {
    "name": "proxy_pass",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_pass",
    "syntax": "proxy_pass URL;",
    "default": "—",
    "contexts": [
      "location",
      "if in location",
      "limit_except"
    ],
    "summary": "Sets the protocol and address of a proxied server and an optional URI to which a location should be mapped. As a protocol, “http” or “https” can be specified. The address can be specified as a domain name or IP addres...",
    "isBlock": false
  },
  {
    "name": "proxy_pass",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_pass",
    "syntax": "proxy_pass address;",
    "default": "—",
    "contexts": [
      "server"
    ],
    "summary": "Sets the address of a proxied server. The address can be specified as a domain name or IP address, and a port:",
    "isBlock": false
  },
  {
    "name": "proxy_pass_error_message",
    "module": "ngx_mail_proxy_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_proxy_module.html#proxy_pass_error_message",
    "syntax": "proxy_pass_error_message on | off;",
    "default": "proxy_pass_error_message off;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Indicates whether to pass the error message obtained during the authentication on the backend to the client.",
    "isBlock": false
  },
  {
    "name": "proxy_pass_header",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_pass_header",
    "syntax": "proxy_pass_header field;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Permits passing otherwise disabled header fields from a proxied server to a client.",
    "isBlock": false
  },
  {
    "name": "proxy_pass_request_body",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_pass_request_body",
    "syntax": "proxy_pass_request_body on | off;",
    "default": "proxy_pass_request_body on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Indicates whether the original request body is passed to the proxied server.",
    "isBlock": false
  },
  {
    "name": "proxy_pass_request_headers",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_pass_request_headers",
    "syntax": "proxy_pass_request_headers on | off;",
    "default": "proxy_pass_request_headers on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Indicates whether the header fields of the original request are passed to the proxied server.",
    "isBlock": false
  },
  {
    "name": "proxy_pass_trailers",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_pass_trailers",
    "syntax": "proxy_pass_trailers on | off;",
    "default": "proxy_pass_trailers off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Permits passing trailer fields from a proxied server to a client.",
    "isBlock": false
  },
  {
    "name": "proxy_password",
    "module": "ngx_mgmt_module",
    "scope": "core",
    "docPath": "ngx_mgmt_module.html#proxy_password",
    "syntax": "proxy_password string;",
    "default": "—",
    "contexts": [
      "mgmt"
    ],
    "summary": "Sets the password used for authentication on the proxy.",
    "isBlock": false
  },
  {
    "name": "proxy_protocol",
    "module": "ngx_mail_proxy_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_proxy_module.html#proxy_protocol",
    "syntax": "proxy_protocol on | off | v2;",
    "default": "proxy_protocol off;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Enables the PROXY protocol for connections to a backend. The on parameter enables version 1 of the PROXY protocol (text format). The v2 parameter (1.31.4) enables version 2 of the PROXY protocol (binary format).",
    "isBlock": false
  },
  {
    "name": "proxy_protocol",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_protocol",
    "syntax": "proxy_protocol on | off | v2;",
    "default": "proxy_protocol off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables the PROXY protocol for connections to a proxied server. The on parameter enables version 1 of the PROXY protocol (text format). The v2 parameter (1.31.4) enables version 2 of the PROXY protocol (binary format).",
    "isBlock": false
  },
  {
    "name": "proxy_protocol_timeout",
    "module": "ngx_stream_core_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_core_module.html#proxy_protocol_timeout",
    "syntax": "proxy_protocol_timeout timeout;",
    "default": "proxy_protocol_timeout 30s;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a timeout for reading the PROXY protocol header to complete. If no entire header is transmitted within this time, the connection is closed.",
    "isBlock": false
  },
  {
    "name": "proxy_read_timeout",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_read_timeout",
    "syntax": "proxy_read_timeout time;",
    "default": "proxy_read_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for reading a response from the proxied server. The timeout is set only between two successive read operations, not for the transmission of the whole response. If the proxied server does not transmit...",
    "isBlock": false
  },
  {
    "name": "proxy_redirect",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_redirect",
    "syntax": "proxy_redirect default;  |  proxy_redirect off;  |  proxy_redirect redirect replacement;",
    "default": "proxy_redirect default;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the text that should be changed in the “Location” and “Refresh” header fields of a proxied server response. Suppose a proxied server returned the header field “Location: http://localhost:8000/two/some/uri/”. The...",
    "isBlock": false
  },
  {
    "name": "proxy_request_buffering",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_request_buffering",
    "syntax": "proxy_request_buffering on | off;",
    "default": "proxy_request_buffering on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables buffering of a client request body.",
    "isBlock": false
  },
  {
    "name": "proxy_request_dynamic",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_request_dynamic",
    "syntax": "proxy_request_dynamic on | off;",
    "default": "proxy_request_dynamic off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables creation of a separate request instance for each proxied server. By default, a single request is used for all proxied servers. If enabled, a separate request instance is created, allowing per-serve...",
    "isBlock": false
  },
  {
    "name": "proxy_requests",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_requests",
    "syntax": "proxy_requests number;",
    "default": "proxy_requests 0;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the number of client datagrams at which binding between a client and existing UDP stream session is dropped. After receiving the specified number of datagrams, next datagram from the same client starts a new sess...",
    "isBlock": false
  },
  {
    "name": "proxy_responses",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_responses",
    "syntax": "proxy_responses number;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the number of datagrams expected from the proxied server in response to a client datagram if the UDP protocol is used. The number serves as a hint for session termination. By default, the number of datagrams is n...",
    "isBlock": false
  },
  {
    "name": "proxy_send_lowat",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_send_lowat",
    "syntax": "proxy_send_lowat size;",
    "default": "proxy_send_lowat 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If the directive is set to a non-zero value, nginx will try to minimize the number of send operations on outgoing connections to a proxied server by using either NOTE_LOWAT flag of the kqueue method, or the SO_SNDLOWA...",
    "isBlock": false
  },
  {
    "name": "proxy_send_timeout",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_send_timeout",
    "syntax": "proxy_send_timeout time;",
    "default": "proxy_send_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout for transmitting a request to the proxied server. The timeout is set only between two successive write operations, not for the transmission of the whole request. If the proxied server does not receive a...",
    "isBlock": false
  },
  {
    "name": "proxy_session_drop",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_session_drop",
    "syntax": "proxy_session_drop on | off;",
    "default": "proxy_session_drop off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables terminating all sessions to a proxied server after it was removed from the group or marked as permanently unavailable. This can occur because of re-resolve or with the API DELETE command. A server can be marke...",
    "isBlock": false
  },
  {
    "name": "proxy_set_body",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_set_body",
    "syntax": "proxy_set_body value;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows redefining the request body passed to the proxied server. The value can contain text, variables, and their combination.",
    "isBlock": false
  },
  {
    "name": "proxy_set_header",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_set_header",
    "syntax": "proxy_set_header field value;",
    "default": "proxy_set_header Host $proxy_host;proxy_set_header Connection close;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows redefining or appending fields to the request header passed to the proxied server. The value can contain text, variables, and their combinations. These directives are inherited from the previous configuration l...",
    "isBlock": false
  },
  {
    "name": "proxy_smtp_auth",
    "module": "ngx_mail_proxy_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_proxy_module.html#proxy_smtp_auth",
    "syntax": "proxy_smtp_auth on | off;",
    "default": "proxy_smtp_auth off;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Enables or disables user authentication on the SMTP backend using the AUTH command.",
    "isBlock": false
  },
  {
    "name": "proxy_socket_keepalive",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_socket_keepalive",
    "syntax": "proxy_socket_keepalive on | off;",
    "default": "proxy_socket_keepalive off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Configures the “TCP keepalive” behavior for outgoing connections to a proxied server. By default, the operating system’s settings are in effect for the socket. If the directive is set to the value “on”, the SO_KEEPALI...",
    "isBlock": false
  },
  {
    "name": "proxy_socket_keepalive",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_socket_keepalive",
    "syntax": "proxy_socket_keepalive on | off;",
    "default": "proxy_socket_keepalive off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Configures the “TCP keepalive” behavior for outgoing connections to a proxied server. By default, the operating system’s settings are in effect for the socket. If the directive is set to the value “on”, the SO_KEEPALI...",
    "isBlock": false
  },
  {
    "name": "proxy_socket_rcvbuf",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_socket_rcvbuf",
    "syntax": "proxy_socket_rcvbuf size;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the receive buffer size (the SO_RCVBUF option) for outgoing connections to a proxied server. The special value 0 cancels the effect of the proxy_socket_rcvbuf directive inherited from the previous configuration l...",
    "isBlock": false
  },
  {
    "name": "proxy_socket_rcvbuf",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_socket_rcvbuf",
    "syntax": "proxy_socket_rcvbuf size;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the receive buffer size (the SO_RCVBUF option) for outgoing connections to a proxied server. The special value 0 cancels the effect of the proxy_socket_rcvbuf directive inherited from the previous configuration l...",
    "isBlock": false
  },
  {
    "name": "proxy_socket_sndbuf",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_socket_sndbuf",
    "syntax": "proxy_socket_sndbuf size;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the send buffer size (the SO_SNDBUF option) for outgoing connections to a proxied server. The special value 0 cancels the effect of the proxy_socket_sndbuf directive inherited from the previous configuration leve...",
    "isBlock": false
  },
  {
    "name": "proxy_socket_sndbuf",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_socket_sndbuf",
    "syntax": "proxy_socket_sndbuf size;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the send buffer size (the SO_SNDBUF option) for outgoing connections to a proxied server. The special value 0 cancels the effect of the proxy_socket_sndbuf directive inherited from the previous configuration leve...",
    "isBlock": false
  },
  {
    "name": "proxy_ssl",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl",
    "syntax": "proxy_ssl on | off;",
    "default": "proxy_ssl off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables the SSL/TLS protocol for connections to a proxied server.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_alpn",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_alpn",
    "syntax": "proxy_ssl_alpn protocol ...;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies the list of protocols to advertise via the ALPN extension when establishing a connection with the proxied server. For example:",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_certificate",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_certificate",
    "syntax": "proxy_ssl_certificate file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with the certificate in the PEM format used for authentication to a proxied HTTPS server.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_certificate",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_certificate",
    "syntax": "proxy_ssl_certificate file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with the certificate in the PEM format used for authentication to a proxied server.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_certificate_cache",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_certificate_cache",
    "syntax": "proxy_ssl_certificate_cache off;  |  proxy_ssl_certificate_cache max=N [inactive=time] [valid=time];",
    "default": "proxy_ssl_certificate_cache off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a cache that stores SSL certificates and secret keys specified with variables.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_certificate_cache",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_certificate_cache",
    "syntax": "proxy_ssl_certificate_cache off;  |  proxy_ssl_certificate_cache max=N [inactive=time] [valid=time];",
    "default": "proxy_ssl_certificate_cache off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Defines a cache that stores SSL certificates and secret keys specified with variables.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_certificate_key",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_certificate_key",
    "syntax": "proxy_ssl_certificate_key file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with the secret key in the PEM format used for authentication to a proxied HTTPS server.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_certificate_key",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_certificate_key",
    "syntax": "proxy_ssl_certificate_key file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "The value store:scheme:id can be specified instead of the file (1.29.0), which is used to load a secret key with a specified id and OpenSSL provider registered URI scheme, such as pkcs11.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_ciphers",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_ciphers",
    "syntax": "proxy_ssl_ciphers ciphers;",
    "default": "proxy_ssl_ciphers DEFAULT;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies the enabled ciphers for requests to a proxied HTTPS server. The ciphers are specified in the format understood by the OpenSSL library.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_ciphers",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_ciphers",
    "syntax": "proxy_ssl_ciphers ciphers;",
    "default": "proxy_ssl_ciphers DEFAULT;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies the enabled ciphers for connections to a proxied server. The ciphers are specified in the format understood by the OpenSSL library.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_conf_command",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_conf_command",
    "syntax": "proxy_ssl_conf_command name value;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets arbitrary OpenSSL configuration commands when establishing a connection with the proxied HTTPS server.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_conf_command",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_conf_command",
    "syntax": "proxy_ssl_conf_command name value;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets arbitrary OpenSSL configuration commands when establishing a connection with the proxied server.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_crl",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_crl",
    "syntax": "proxy_ssl_crl file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with revoked certificates (CRL) in the PEM format used to verify the certificate of the proxied HTTPS server. When using intermediate certificates, their CRLs should be specified in the same file.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_crl",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_crl",
    "syntax": "proxy_ssl_crl file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with revoked certificates (CRL) in the PEM format used to verify the certificate of the proxied server. When using intermediate certificates, their CRLs should be specified in the same file.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_key_log",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_key_log",
    "syntax": "proxy_ssl_key_log path;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables logging of proxied HTTPS server connection SSL keys and specifies the path to the key log file. Keys are logged in the SSLKEYLOGFILE format compatible with Wireshark.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_key_log",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_key_log",
    "syntax": "proxy_ssl_key_log path;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables logging of proxied server connection SSL keys and specifies the path to the key log file. Keys are logged in the SSLKEYLOGFILE format compatible with Wireshark.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_name",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_name",
    "syntax": "proxy_ssl_name name;",
    "default": "proxy_ssl_name $proxy_host;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows overriding the server name used to verify the certificate of the proxied HTTPS server and to be passed through SNI when establishing a connection with the proxied HTTPS server.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_name",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_name",
    "syntax": "proxy_ssl_name name;",
    "default": "proxy_ssl_name host from proxy_pass;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Allows overriding the server name used to verify the certificate of the proxied server and to be passed through SNI when establishing a connection with the proxied server. The server name can also be specified using v...",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_password_file",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_password_file",
    "syntax": "proxy_ssl_password_file file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with passphrases for secret keys where each passphrase is specified on a separate line. Passphrases are tried in turn when loading the key.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_password_file",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_password_file",
    "syntax": "proxy_ssl_password_file file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with passphrases for secret keys where each passphrase is specified on a separate line. Passphrases are tried in turn when loading the key.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_protocols",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_protocols",
    "syntax": "proxy_ssl_protocols [SSLv2] [SSLv3] [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];",
    "default": "proxy_ssl_protocols TLSv1.2 TLSv1.3;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables the specified protocols for requests to a proxied HTTPS server.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_protocols",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_protocols",
    "syntax": "proxy_ssl_protocols [SSLv2] [SSLv3] [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];",
    "default": "proxy_ssl_protocols TLSv1.2 TLSv1.3;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables the specified protocols for connections to a proxied server.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_server_name",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_server_name",
    "syntax": "proxy_ssl_server_name on | off;",
    "default": "proxy_ssl_server_name off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables passing of the server name through TLS Server Name Indication extension (SNI, RFC 6066) when establishing a connection with the proxied HTTPS server.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_server_name",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_server_name",
    "syntax": "proxy_ssl_server_name on | off;",
    "default": "proxy_ssl_server_name off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables or disables passing of the server name through TLS Server Name Indication extension (SNI, RFC 6066) when establishing a connection with the proxied server.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_session_reuse",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_session_reuse",
    "syntax": "proxy_ssl_session_reuse on | off;",
    "default": "proxy_ssl_session_reuse on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether SSL sessions can be reused when working with the proxied server. If the errors “digest check failed” appear in the logs, try disabling session reuse.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_session_reuse",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_session_reuse",
    "syntax": "proxy_ssl_session_reuse on | off;",
    "default": "proxy_ssl_session_reuse on;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Determines whether SSL sessions can be reused when working with the proxied server. If the errors “digest check failed” appear in the logs, try disabling session reuse.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_trusted_certificate",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_trusted_certificate",
    "syntax": "proxy_ssl_trusted_certificate file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify the certificate of the proxied HTTPS server.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_trusted_certificate",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_trusted_certificate",
    "syntax": "proxy_ssl_trusted_certificate file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify the certificate of the proxied server.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_verify",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_verify",
    "syntax": "proxy_ssl_verify on | off;",
    "default": "proxy_ssl_verify off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables verification of the proxied HTTPS server certificate.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_verify",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_verify",
    "syntax": "proxy_ssl_verify on | off;",
    "default": "proxy_ssl_verify off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables or disables verification of the proxied server certificate.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_verify_depth",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_ssl_verify_depth",
    "syntax": "proxy_ssl_verify_depth number;",
    "default": "proxy_ssl_verify_depth 1;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the verification depth in the proxied HTTPS server certificates chain.",
    "isBlock": false
  },
  {
    "name": "proxy_ssl_verify_depth",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_ssl_verify_depth",
    "syntax": "proxy_ssl_verify_depth number;",
    "default": "proxy_ssl_verify_depth 1;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the verification depth in the proxied server certificates chain.",
    "isBlock": false
  },
  {
    "name": "proxy_store",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_store",
    "syntax": "proxy_store on | off | string;",
    "default": "proxy_store off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables saving of files to a disk. The on parameter saves files with paths corresponding to the directives alias or root. The off parameter disables saving of files. In addition, the file name can be set explicitly us...",
    "isBlock": false
  },
  {
    "name": "proxy_store_access",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_store_access",
    "syntax": "proxy_store_access users:permissions ...;",
    "default": "proxy_store_access user:rw;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets access permissions for newly created files and directories, e.g.:",
    "isBlock": false
  },
  {
    "name": "proxy_temp_file_write_size",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_temp_file_write_size",
    "syntax": "proxy_temp_file_write_size size;",
    "default": "proxy_temp_file_write_size 8k|16k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the size of data written to a temporary file at a time, when buffering of responses from the proxied server to temporary files is enabled. By default, size is limited by two buffers set by the proxy_buffer_size...",
    "isBlock": false
  },
  {
    "name": "proxy_temp_path",
    "module": "ngx_http_proxy_module",
    "scope": "http",
    "docPath": "http/ngx_http_proxy_module.html#proxy_temp_path",
    "syntax": "proxy_temp_path path [level1 [level2 [level3]]];",
    "default": "proxy_temp_path proxy_temp;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a directory for storing temporary files with data received from proxied servers. Up to three-level subdirectory hierarchy can be used underneath the specified directory. For example, in the following configura...",
    "isBlock": false
  },
  {
    "name": "proxy_timeout",
    "module": "ngx_mail_proxy_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_proxy_module.html#proxy_timeout",
    "syntax": "proxy_timeout timeout;",
    "default": "proxy_timeout 24h;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets the timeout between two successive read or write operations on client or proxied server connections. If no data is transmitted within this time, the connection is closed.",
    "isBlock": false
  },
  {
    "name": "proxy_timeout",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_timeout",
    "syntax": "proxy_timeout timeout;",
    "default": "proxy_timeout 10m;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the timeout between two successive read or write operations on client or proxied server connections. If no data is transmitted within this time, the connection is closed.",
    "isBlock": false
  },
  {
    "name": "proxy_upload_rate",
    "module": "ngx_stream_proxy_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_proxy_module.html#proxy_upload_rate",
    "syntax": "proxy_upload_rate rate;",
    "default": "proxy_upload_rate 0;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Limits the speed of reading the data from the client. The rate is specified in bytes per second. The zero value disables rate limiting. The limit is set per a connection, so if the client simultaneously opens two conn...",
    "isBlock": false
  },
  {
    "name": "proxy_username",
    "module": "ngx_mgmt_module",
    "scope": "core",
    "docPath": "ngx_mgmt_module.html#proxy_username",
    "syntax": "proxy_username string;",
    "default": "—",
    "contexts": [
      "mgmt"
    ],
    "summary": "Sets the user name used for authentication on the proxy.",
    "isBlock": false
  },
  {
    "name": "queue",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#queue",
    "syntax": "queue number [timeout=time];",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "If an upstream server cannot be selected immediately while processing a request, the request will be placed into the queue. The directive specifies the maximum number of requests that can be in the queue at the same t...",
    "isBlock": false
  },
  {
    "name": "quic_active_connection_id_limit",
    "module": "ngx_http_v3_module",
    "scope": "http",
    "docPath": "http/ngx_http_v3_module.html#quic_active_connection_id_limit",
    "syntax": "quic_active_connection_id_limit number;",
    "default": "quic_active_connection_id_limit 2;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets the QUIC active_connection_id_limit transport parameter value. This is the maximum number of client connection IDs which can be stored on the server.",
    "isBlock": false
  },
  {
    "name": "quic_bpf",
    "module": "ngx_http_v3_module",
    "scope": "http",
    "docPath": "http/ngx_http_v3_module.html#quic_bpf",
    "syntax": "quic_bpf on | off;",
    "default": "quic_bpf off;",
    "contexts": [
      "main"
    ],
    "summary": "Enables routing of QUIC packets using eBPF. When enabled, this allows supporting QUIC connection migration. Since 1.31.7, this also allows established QUIC connections to be preserved during configuration reloads and...",
    "isBlock": false
  },
  {
    "name": "quic_gso",
    "module": "ngx_http_v3_module",
    "scope": "http",
    "docPath": "http/ngx_http_v3_module.html#quic_gso",
    "syntax": "quic_gso on | off;",
    "default": "quic_gso off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables sending in optimized batch mode using segmentation offloading.",
    "isBlock": false
  },
  {
    "name": "quic_host_key",
    "module": "ngx_http_v3_module",
    "scope": "http",
    "docPath": "http/ngx_http_v3_module.html#quic_host_key",
    "syntax": "quic_host_key file;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets a file with the secret key used to encrypt stateless reset and address validation tokens. By default, a random key is generated on each reload. Tokens generated with old keys are not accepted.",
    "isBlock": false
  },
  {
    "name": "quic_retry",
    "module": "ngx_http_v3_module",
    "scope": "http",
    "docPath": "http/ngx_http_v3_module.html#quic_retry",
    "syntax": "quic_retry on | off;",
    "default": "quic_retry off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables the QUIC Address Validation feature. This includes sending a new token in a Retry packet or a NEW_TOKEN frame and validating a token received in the Initial packet.",
    "isBlock": false
  },
  {
    "name": "random",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#random",
    "syntax": "random [two [method]];",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Specifies that a group should use a load balancing method where a request is passed to a randomly selected server, taking into account weights of servers.",
    "isBlock": false
  },
  {
    "name": "random",
    "module": "ngx_stream_upstream_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_upstream_module.html#random",
    "syntax": "random [two [method]];",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Specifies that a group should use a load balancing method where a connection is passed to a randomly selected server, taking into account weights of servers.",
    "isBlock": false
  },
  {
    "name": "random_index",
    "module": "ngx_http_random_index_module",
    "scope": "http",
    "docPath": "http/ngx_http_random_index_module.html#random_index",
    "syntax": "random_index on | off;",
    "default": "random_index off;",
    "contexts": [
      "location"
    ],
    "summary": "Enables or disables module processing in a surrounding location.",
    "isBlock": false
  },
  {
    "name": "read_ahead",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#read_ahead",
    "syntax": "read_ahead size;",
    "default": "read_ahead 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the amount of pre-reading for the kernel when working with file.",
    "isBlock": false
  },
  {
    "name": "real_ip_header",
    "module": "ngx_http_realip_module",
    "scope": "http",
    "docPath": "http/ngx_http_realip_module.html#real_ip_header",
    "syntax": "real_ip_header field | X-Real-IP | X-Forwarded-For | proxy_protocol;",
    "default": "real_ip_header X-Real-IP;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines the request header field whose value will be used to replace the client address.",
    "isBlock": false
  },
  {
    "name": "real_ip_recursive",
    "module": "ngx_http_realip_module",
    "scope": "http",
    "docPath": "http/ngx_http_realip_module.html#real_ip_recursive",
    "syntax": "real_ip_recursive on | off;",
    "default": "real_ip_recursive off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If recursive search is disabled, the original client address that matches one of the trusted addresses is replaced by the last address sent in the request header field defined by the real_ip_header directive. If recur...",
    "isBlock": false
  },
  {
    "name": "recursive_error_pages",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#recursive_error_pages",
    "syntax": "recursive_error_pages on | off;",
    "default": "recursive_error_pages off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables doing several redirects using the error_page directive. The number of such redirects is limited.",
    "isBlock": false
  },
  {
    "name": "redirect_uri",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#redirect_uri",
    "syntax": "redirect_uri uri;",
    "default": "redirect_uri /oidc_callback;",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Defines the Redirection URI path for post-authentication redirects expected by the module from the OpenID Provider. The uri must match the configuration on the Provider's side.",
    "isBlock": false
  },
  {
    "name": "referer_hash_bucket_size",
    "module": "ngx_http_referer_module",
    "scope": "http",
    "docPath": "http/ngx_http_referer_module.html#referer_hash_bucket_size",
    "syntax": "referer_hash_bucket_size size;",
    "default": "referer_hash_bucket_size 64;",
    "contexts": [
      "server",
      "location"
    ],
    "summary": "Sets the bucket size for the valid referers hash tables. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "referer_hash_max_size",
    "module": "ngx_http_referer_module",
    "scope": "http",
    "docPath": "http/ngx_http_referer_module.html#referer_hash_max_size",
    "syntax": "referer_hash_max_size size;",
    "default": "referer_hash_max_size 2048;",
    "contexts": [
      "server",
      "location"
    ],
    "summary": "Sets the maximum size of the valid referers hash tables. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "request_pool_size",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#request_pool_size",
    "syntax": "request_pool_size size;",
    "default": "request_pool_size 4k;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Allows accurate tuning of per-request memory allocations. This directive has minimal impact on performance and should not generally be used.",
    "isBlock": false
  },
  {
    "name": "reset_timedout_connection",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#reset_timedout_connection",
    "syntax": "reset_timedout_connection on | off;",
    "default": "reset_timedout_connection off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables resetting timed out connections and connections closed with the non-standard code 444 (1.15.2). The reset is performed as follows. Before closing a socket, the SO_LINGER option is set on it with a...",
    "isBlock": false
  },
  {
    "name": "resolver",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#resolver",
    "syntax": "resolver address ... [valid=time] [ipv4=on|off] [ipv6=on|off] [status_zone=zone];",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Configures name servers used to resolve names of upstream servers into addresses, for example:",
    "isBlock": false
  },
  {
    "name": "resolver",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#resolver",
    "syntax": "resolver address ... [valid=time] [ipv4=on|off] [ipv6=on|off] [status_zone=zone];",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Configures name servers used to resolve names of upstream servers into addresses, for example:",
    "isBlock": false
  },
  {
    "name": "resolver",
    "module": "ngx_mail_core_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_core_module.html#resolver",
    "syntax": "resolver address ... [valid=time] [ipv4=on|off] [ipv6=on|off] [status_zone=zone];  |  resolver off;",
    "default": "resolver off;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Configures name servers used to find the client’s hostname to pass it to the authentication server, and in the XCLIENT command when proxying SMTP. For example:",
    "isBlock": false
  },
  {
    "name": "resolver",
    "module": "ngx_stream_core_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_core_module.html#resolver",
    "syntax": "resolver address ... [valid=time] [ipv4=on|off] [ipv6=on|off] [status_zone=zone];",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Configures name servers used to resolve names of upstream servers into addresses, for example:",
    "isBlock": false
  },
  {
    "name": "resolver",
    "module": "ngx_stream_upstream_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_upstream_module.html#resolver",
    "syntax": "resolver address ... [valid=time] [ipv4=on|off] [ipv6=on|off] [status_zone=zone];",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Configures name servers used to resolve names of upstream servers into addresses, for example:",
    "isBlock": false
  },
  {
    "name": "resolver",
    "module": "ngx_mgmt_module",
    "scope": "core",
    "docPath": "ngx_mgmt_module.html#resolver",
    "syntax": "resolver address ... [valid=time] [ipv4=on|off] [ipv6=on|off] [status_zone=zone];",
    "default": "—",
    "contexts": [
      "mgmt"
    ],
    "summary": "Configures name servers used to resolve usage reporting endpoint name. By default, the system resolver is used.",
    "isBlock": false
  },
  {
    "name": "resolver_timeout",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#resolver_timeout",
    "syntax": "resolver_timeout time;",
    "default": "resolver_timeout 30s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout for name resolution, for example:",
    "isBlock": false
  },
  {
    "name": "resolver_timeout",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#resolver_timeout",
    "syntax": "resolver_timeout time;",
    "default": "resolver_timeout 30s;",
    "contexts": [
      "upstream"
    ],
    "summary": "Sets a timeout for name resolution, for example:",
    "isBlock": false
  },
  {
    "name": "resolver_timeout",
    "module": "ngx_mail_core_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_core_module.html#resolver_timeout",
    "syntax": "resolver_timeout time;",
    "default": "resolver_timeout 30s;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets a timeout for DNS operations, for example:",
    "isBlock": false
  },
  {
    "name": "resolver_timeout",
    "module": "ngx_stream_core_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_core_module.html#resolver_timeout",
    "syntax": "resolver_timeout time;",
    "default": "resolver_timeout 30s;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets a timeout for name resolution, for example:",
    "isBlock": false
  },
  {
    "name": "resolver_timeout",
    "module": "ngx_stream_upstream_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_upstream_module.html#resolver_timeout",
    "syntax": "resolver_timeout time;",
    "default": "resolver_timeout 30s;",
    "contexts": [
      "upstream"
    ],
    "summary": "Sets a timeout for name resolution, for example:",
    "isBlock": false
  },
  {
    "name": "return",
    "module": "ngx_http_rewrite_module",
    "scope": "http",
    "docPath": "http/ngx_http_rewrite_module.html#return",
    "syntax": "return code [text];  |  return code URL;  |  return URL;",
    "default": "—",
    "contexts": [
      "server",
      "location",
      "if"
    ],
    "summary": "Stops processing and returns the specified code to a client. The non-standard code 444 closes a connection without sending a response header.",
    "isBlock": false
  },
  {
    "name": "return",
    "module": "ngx_stream_return_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_return_module.html#return",
    "syntax": "return value;",
    "default": "—",
    "contexts": [
      "server"
    ],
    "summary": "Specifies a value to send to the client. The value can contain text, variables, and their combination.",
    "isBlock": false
  },
  {
    "name": "rewrite",
    "module": "ngx_http_rewrite_module",
    "scope": "http",
    "docPath": "http/ngx_http_rewrite_module.html#rewrite",
    "syntax": "rewrite regex replacement [flag];",
    "default": "—",
    "contexts": [
      "server",
      "location",
      "if"
    ],
    "summary": "If the specified regular expression matches a request URI, URI is changed as specified in the replacement string. The rewrite directives are executed sequentially in order of their appearance in the configuration file...",
    "isBlock": false
  },
  {
    "name": "rewrite_log",
    "module": "ngx_http_rewrite_module",
    "scope": "http",
    "docPath": "http/ngx_http_rewrite_module.html#rewrite_log",
    "syntax": "rewrite_log on | off;",
    "default": "rewrite_log off;",
    "contexts": [
      "http",
      "server",
      "location",
      "if"
    ],
    "summary": "Enables or disables logging of ngx_http_rewrite_module module directives processing results into the error_log at the notice level.",
    "isBlock": false
  },
  {
    "name": "root",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#root",
    "syntax": "root path;",
    "default": "root html;",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Sets the root directory for requests. For example, with the following configuration",
    "isBlock": false
  },
  {
    "name": "satisfy",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#satisfy",
    "syntax": "satisfy all | any;",
    "default": "satisfy all;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows access if all (all) or at least one (any) of the ngx_http_access_module, ngx_http_auth_basic_module, ngx_http_auth_request_module, ngx_http_auth_jwt_module (1.13.10), or ngx_http_auth_oidc_module (1.27.4) modul...",
    "isBlock": false
  },
  {
    "name": "scgi_allow_upstream",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_allow_upstream",
    "syntax": "scgi_allow_upstream string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which access to an SCGI server is allowed or denied. If all string parameters are not empty and not equal to “0” then the access is allowed. The conditions are evaluated each time before a con...",
    "isBlock": false
  },
  {
    "name": "scgi_bind",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_bind",
    "syntax": "scgi_bind address [transparent] | off;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Makes outgoing connections to an SCGI server originate from the specified local IP address with an optional port (1.11.2). Parameter value can contain variables (1.3.12). The special value off (1.3.12) cancels the eff...",
    "isBlock": false
  },
  {
    "name": "scgi_bind_dynamic",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_bind_dynamic",
    "syntax": "scgi_bind_dynamic on | off;",
    "default": "scgi_bind_dynamic off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When enabled, makes the bind operation at each connection attempt.",
    "isBlock": false
  },
  {
    "name": "scgi_buffer_size",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_buffer_size",
    "syntax": "scgi_buffer_size size;",
    "default": "scgi_buffer_size 4k|8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the size of the buffer used for reading the first part of the response received from the SCGI server. This part usually contains a small response header; if it exceeds the buffer size, the response is considered...",
    "isBlock": false
  },
  {
    "name": "scgi_buffering",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_buffering",
    "syntax": "scgi_buffering on | off;",
    "default": "scgi_buffering on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables buffering of responses from the SCGI server.",
    "isBlock": false
  },
  {
    "name": "scgi_buffers",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_buffers",
    "syntax": "scgi_buffers number size;",
    "default": "scgi_buffers 8 4k|8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the number and size of the buffers used for reading a response from the SCGI server, for a single connection. By default, the buffer size is equal to one memory page. This is either 4K or 8K, depending on a platf...",
    "isBlock": false
  },
  {
    "name": "scgi_busy_buffers_size",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_busy_buffers_size",
    "syntax": "scgi_busy_buffers_size size;",
    "default": "scgi_busy_buffers_size 8k|16k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When buffering of responses from the SCGI server is enabled, limits the total size of buffers that can be busy sending a response to the client while the response is not yet fully read. In the meantime, the rest of th...",
    "isBlock": false
  },
  {
    "name": "scgi_cache",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache",
    "syntax": "scgi_cache zone | off;",
    "default": "scgi_cache off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a shared memory zone used for caching. The same zone can be used in several places. Parameter value can contain variables (1.7.9). The off parameter disables caching inherited from the previous configuration l...",
    "isBlock": false
  },
  {
    "name": "scgi_cache_background_update",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache_background_update",
    "syntax": "scgi_cache_background_update on | off;",
    "default": "scgi_cache_background_update off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows starting a background subrequest to update an expired cache item, while a stale cached response is returned to the client. Note that it is necessary to allow the usage of a stale cached response when it is bein...",
    "isBlock": false
  },
  {
    "name": "scgi_cache_bypass",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache_bypass",
    "syntax": "scgi_cache_bypass string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which the response will not be taken from a cache. If at least one value of the string parameters is not empty and is not equal to “0” then the response will not be taken from the cache:",
    "isBlock": false
  },
  {
    "name": "scgi_cache_key",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache_key",
    "syntax": "scgi_cache_key string;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a key for caching, for example",
    "isBlock": false
  },
  {
    "name": "scgi_cache_lock",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache_lock",
    "syntax": "scgi_cache_lock on | off;",
    "default": "scgi_cache_lock off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When enabled, only one request at a time will be allowed to populate a new cache element identified according to the scgi_cache_key directive by passing a request to an SCGI server. Other requests of the same cache el...",
    "isBlock": false
  },
  {
    "name": "scgi_cache_lock_age",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache_lock_age",
    "syntax": "scgi_cache_lock_age time;",
    "default": "scgi_cache_lock_age 5s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If the last request passed to the SCGI server for populating a new cache element has not completed for the specified time, one more request may be passed to the SCGI server.",
    "isBlock": false
  },
  {
    "name": "scgi_cache_lock_timeout",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache_lock_timeout",
    "syntax": "scgi_cache_lock_timeout time;",
    "default": "scgi_cache_lock_timeout 5s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout for scgi_cache_lock. When the time expires, the request will be passed to the SCGI server, however, the response will not be cached.",
    "isBlock": false
  },
  {
    "name": "scgi_cache_max_range_offset",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache_max_range_offset",
    "syntax": "scgi_cache_max_range_offset number;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets an offset in bytes for byte-range requests. If the range is beyond the offset, the range request will be passed to the SCGI server and the response will not be cached.",
    "isBlock": false
  },
  {
    "name": "scgi_cache_methods",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache_methods",
    "syntax": "scgi_cache_methods GET | HEAD | POST ...;",
    "default": "scgi_cache_methods GET HEAD;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If the client request method is listed in this directive then the response will be cached. “GET” and “HEAD” methods are always added to the list, though it is recommended to specify them explicitly. See also the scgi_...",
    "isBlock": false
  },
  {
    "name": "scgi_cache_min_uses",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache_min_uses",
    "syntax": "scgi_cache_min_uses number;",
    "default": "scgi_cache_min_uses 1;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the number of requests after which the response will be cached.",
    "isBlock": false
  },
  {
    "name": "scgi_cache_path",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache_path",
    "syntax": "scgi_cache_path path [levels=levels] [use_temp_path=on|off] keys_zone=name:size [inactive=time] [max_size=size] [min_free=size] [manager_files=number] [manager_sleep=time] [manager_threshold=time] [loader_files=number] [loader_sleep=time] [loader_threshold=time] [purger=on|off] [purger_files=number] [purger_sleep=time] [purger_threshold=time];",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets the path and other parameters of a cache. Cache data are stored in files. The file name in a cache is a result of applying the MD5 function to the cache key. The levels parameter defines hierarchy levels of a cac...",
    "isBlock": false
  },
  {
    "name": "scgi_cache_purge",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache_purge",
    "syntax": "scgi_cache_purge string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which the request will be considered a cache purge request. If at least one value of the string parameters is not empty and is not equal to “0” then the cache entry with a corresponding cache...",
    "isBlock": false
  },
  {
    "name": "scgi_cache_revalidate",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache_revalidate",
    "syntax": "scgi_cache_revalidate on | off;",
    "default": "scgi_cache_revalidate off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables revalidation of expired cache items using conditional requests with the “If-Modified-Since” and “If-None-Match” header fields.",
    "isBlock": false
  },
  {
    "name": "scgi_cache_use_stale",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache_use_stale",
    "syntax": "scgi_cache_use_stale error | timeout | invalid_header | updating | http_500 | http_503 | http_403 | http_404 | http_429 | off ...;",
    "default": "scgi_cache_use_stale off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines in which cases a stale cached response can be used when an error occurs during communication with the SCGI server. The directive’s parameters match the parameters of the scgi_next_upstream directive.",
    "isBlock": false
  },
  {
    "name": "scgi_cache_valid",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_cache_valid",
    "syntax": "scgi_cache_valid [code ...] time;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets caching time for different response codes. For example, the following directives",
    "isBlock": false
  },
  {
    "name": "scgi_connect_timeout",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_connect_timeout",
    "syntax": "scgi_connect_timeout time;",
    "default": "scgi_connect_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for establishing a connection with an SCGI server. It should be noted that this timeout cannot usually exceed 75 seconds.",
    "isBlock": false
  },
  {
    "name": "scgi_force_ranges",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_force_ranges",
    "syntax": "scgi_force_ranges on | off;",
    "default": "scgi_force_ranges off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables byte-range support for both cached and uncached responses from the SCGI server regardless of the “Accept-Ranges” field in these responses.",
    "isBlock": false
  },
  {
    "name": "scgi_hide_header",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_hide_header",
    "syntax": "scgi_hide_header field;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "By default, nginx does not pass the header fields “Status” and “X-Accel-...” from the response of an SCGI server to a client. The scgi_hide_header directive sets additional fields that will not be passed. If, on the c...",
    "isBlock": false
  },
  {
    "name": "scgi_ignore_client_abort",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_ignore_client_abort",
    "syntax": "scgi_ignore_client_abort on | off;",
    "default": "scgi_ignore_client_abort off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether the connection with an SCGI server should be closed when a client closes the connection without waiting for a response.",
    "isBlock": false
  },
  {
    "name": "scgi_ignore_headers",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_ignore_headers",
    "syntax": "scgi_ignore_headers field ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Disables processing of certain response header fields from the SCGI server. The following fields can be ignored: “X-Accel-Redirect”, “X-Accel-Expires”, “X-Accel-Limit-Rate” (1.1.6), “X-Accel-Buffering” (1.1.6), “X-Acc...",
    "isBlock": false
  },
  {
    "name": "scgi_intercept_errors",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_intercept_errors",
    "syntax": "scgi_intercept_errors on | off;",
    "default": "scgi_intercept_errors off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether an SCGI server responses with codes greater than or equal to 300 should be passed to a client or be intercepted and redirected to nginx for processing with the error_page directive.",
    "isBlock": false
  },
  {
    "name": "scgi_limit_rate",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_limit_rate",
    "syntax": "scgi_limit_rate rate;",
    "default": "scgi_limit_rate 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the speed of reading the response from the SCGI server. The rate is specified in bytes per second. The zero value disables rate limiting. The limit is set per a request, and so if nginx simultaneously opens two...",
    "isBlock": false
  },
  {
    "name": "scgi_max_temp_file_size",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_max_temp_file_size",
    "syntax": "scgi_max_temp_file_size size;",
    "default": "scgi_max_temp_file_size 1024m;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When buffering of responses from the SCGI server is enabled, and the whole response does not fit into the buffers set by the scgi_buffer_size and scgi_buffers directives, a part of the response can be saved to a tempo...",
    "isBlock": false
  },
  {
    "name": "scgi_next_upstream",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_next_upstream",
    "syntax": "scgi_next_upstream error | timeout | denied | invalid_header | http_500 | http_503 | http_403 | http_404 | http_429 | non_idempotent | off ...;",
    "default": "scgi_next_upstream error timeout;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies in which cases a request should be passed to the next server:",
    "isBlock": false
  },
  {
    "name": "scgi_next_upstream_timeout",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_next_upstream_timeout",
    "syntax": "scgi_next_upstream_timeout time;",
    "default": "scgi_next_upstream_timeout 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the time during which a request can be passed to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "scgi_next_upstream_tries",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_next_upstream_tries",
    "syntax": "scgi_next_upstream_tries number;",
    "default": "scgi_next_upstream_tries 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the number of possible tries for passing a request to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "scgi_no_cache",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_no_cache",
    "syntax": "scgi_no_cache string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which the response will not be saved to a cache. If at least one value of the string parameters is not empty and is not equal to “0” then the response will not be saved:",
    "isBlock": false
  },
  {
    "name": "scgi_param",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_param",
    "syntax": "scgi_param parameter value [if_not_empty];",
    "default": "scgi_param HTTP_HOST $host$is_request_port$request_port;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a parameter that should be passed to the SCGI server. The value can contain text, variables, and their combination. These directives are inherited from the previous configuration level if and only if there are no...",
    "isBlock": false
  },
  {
    "name": "scgi_pass",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_pass",
    "syntax": "scgi_pass address;",
    "default": "—",
    "contexts": [
      "location",
      "if in location"
    ],
    "summary": "Sets the address of an SCGI server. The address can be specified as a domain name or IP address, and a port:",
    "isBlock": false
  },
  {
    "name": "scgi_pass_header",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_pass_header",
    "syntax": "scgi_pass_header field;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Permits passing otherwise disabled header fields from an SCGI server to a client.",
    "isBlock": false
  },
  {
    "name": "scgi_pass_request_body",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_pass_request_body",
    "syntax": "scgi_pass_request_body on | off;",
    "default": "scgi_pass_request_body on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Indicates whether the original request body is passed to the SCGI server. See also the scgi_pass_request_headers directive.",
    "isBlock": false
  },
  {
    "name": "scgi_pass_request_headers",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_pass_request_headers",
    "syntax": "scgi_pass_request_headers on | off;",
    "default": "scgi_pass_request_headers on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Indicates whether the header fields of the original request are passed to the SCGI server. See also the scgi_pass_request_body directive.",
    "isBlock": false
  },
  {
    "name": "scgi_read_timeout",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_read_timeout",
    "syntax": "scgi_read_timeout time;",
    "default": "scgi_read_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for reading a response from the SCGI server. The timeout is set only between two successive read operations, not for the transmission of the whole response. If the SCGI server does not transmit anyth...",
    "isBlock": false
  },
  {
    "name": "scgi_request_buffering",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_request_buffering",
    "syntax": "scgi_request_buffering on | off;",
    "default": "scgi_request_buffering on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables buffering of a client request body.",
    "isBlock": false
  },
  {
    "name": "scgi_request_dynamic",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_request_dynamic",
    "syntax": "scgi_request_dynamic on | off;",
    "default": "scgi_request_dynamic off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables creation of a separate request instance for each SCGI server. By default, a single request is used for all SCGI servers. If enabled, a separate request instance is created, allowing per-server requ...",
    "isBlock": false
  },
  {
    "name": "scgi_send_timeout",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_send_timeout",
    "syntax": "scgi_send_timeout time;",
    "default": "scgi_send_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout for transmitting a request to the SCGI server. The timeout is set only between two successive write operations, not for the transmission of the whole request. If the SCGI server does not receive anythin...",
    "isBlock": false
  },
  {
    "name": "scgi_socket_keepalive",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_socket_keepalive",
    "syntax": "scgi_socket_keepalive on | off;",
    "default": "scgi_socket_keepalive off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Configures the “TCP keepalive” behavior for outgoing connections to an SCGI server. By default, the operating system’s settings are in effect for the socket. If the directive is set to the value “on”, the SO_KEEPALIVE...",
    "isBlock": false
  },
  {
    "name": "scgi_socket_rcvbuf",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_socket_rcvbuf",
    "syntax": "scgi_socket_rcvbuf size;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the receive buffer size (the SO_RCVBUF option) for outgoing connections to an SCGI server. The special value 0 cancels the effect of the scgi_socket_rcvbuf directive inherited from the previous configuration leve...",
    "isBlock": false
  },
  {
    "name": "scgi_socket_sndbuf",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_socket_sndbuf",
    "syntax": "scgi_socket_sndbuf size;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the send buffer size (the SO_SNDBUF option) for outgoing connections to an SCGI server. The special value 0 cancels the effect of the scgi_socket_sndbuf directive inherited from the previous configuration level,...",
    "isBlock": false
  },
  {
    "name": "scgi_store",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_store",
    "syntax": "scgi_store on | off | string;",
    "default": "scgi_store off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables saving of files to a disk. The on parameter saves files with paths corresponding to the directives alias or root. The off parameter disables saving of files. In addition, the file name can be set explicitly us...",
    "isBlock": false
  },
  {
    "name": "scgi_store_access",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_store_access",
    "syntax": "scgi_store_access users:permissions ...;",
    "default": "scgi_store_access user:rw;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets access permissions for newly created files and directories, e.g.:",
    "isBlock": false
  },
  {
    "name": "scgi_temp_file_write_size",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_temp_file_write_size",
    "syntax": "scgi_temp_file_write_size size;",
    "default": "scgi_temp_file_write_size 8k|16k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the size of data written to a temporary file at a time, when buffering of responses from the SCGI server to temporary files is enabled. By default, size is limited by two buffers set by the scgi_buffer_size and...",
    "isBlock": false
  },
  {
    "name": "scgi_temp_path",
    "module": "ngx_http_scgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_scgi_module.html#scgi_temp_path",
    "syntax": "scgi_temp_path path [level1 [level2 [level3]]];",
    "default": "scgi_temp_path scgi_temp;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a directory for storing temporary files with data received from SCGI servers. Up to three-level subdirectory hierarchy can be used underneath the specified directory. For example, in the following configuration",
    "isBlock": false
  },
  {
    "name": "scope",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#scope",
    "syntax": "scope scope ...;",
    "default": "scope openid;",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Sets requested scopes. The openid scope is always required by OIDC.",
    "isBlock": false
  },
  {
    "name": "secure_link",
    "module": "ngx_http_secure_link_module",
    "scope": "http",
    "docPath": "http/ngx_http_secure_link_module.html#secure_link",
    "syntax": "secure_link expression;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a string with variables from which the checksum value and lifetime of a link will be extracted.",
    "isBlock": false
  },
  {
    "name": "secure_link_md5",
    "module": "ngx_http_secure_link_module",
    "scope": "http",
    "docPath": "http/ngx_http_secure_link_module.html#secure_link_md5",
    "syntax": "secure_link_md5 expression;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines an expression for which the MD5 hash value will be computed and compared with the value passed in a request.",
    "isBlock": false
  },
  {
    "name": "secure_link_secret",
    "module": "ngx_http_secure_link_module",
    "scope": "http",
    "docPath": "http/ngx_http_secure_link_module.html#secure_link_secret",
    "syntax": "secure_link_secret word;",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Defines a secret word used to check authenticity of requested links.",
    "isBlock": false
  },
  {
    "name": "send_lowat",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#send_lowat",
    "syntax": "send_lowat size;",
    "default": "send_lowat 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If the directive is set to a non-zero value, nginx will try to minimize the number of send operations on client sockets by using either NOTE_LOWAT flag of the kqueue method or the SO_SNDLOWAT socket option. In both ca...",
    "isBlock": false
  },
  {
    "name": "send_timeout",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#send_timeout",
    "syntax": "send_timeout time;",
    "default": "send_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout for transmitting a response to the client. The timeout is set only between two successive write operations, not for the transmission of the whole response. If the client does not receive anything within...",
    "isBlock": false
  },
  {
    "name": "sendfile",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#sendfile",
    "syntax": "sendfile on | off;",
    "default": "sendfile off;",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Enables or disables the use of sendfile().",
    "isBlock": false
  },
  {
    "name": "sendfile_max_chunk",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#sendfile_max_chunk",
    "syntax": "sendfile_max_chunk size;",
    "default": "sendfile_max_chunk 2m;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the amount of data that can be transferred in a single sendfile() call. Without the limit, one fast connection may seize the worker process entirely.",
    "isBlock": false
  },
  {
    "name": "server",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#server",
    "syntax": "server { ... }",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets configuration for a virtual server. There is no clear separation between IP-based (based on the IP address) and name-based (based on the “Host” request header field) virtual servers. Instead, the listen directive...",
    "isBlock": true
  },
  {
    "name": "server",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#server",
    "syntax": "server address [parameters];",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Defines the address and other parameters of a server. The address can be specified as a domain name or IP address, with an optional port, or as a UNIX-domain socket path specified after the “unix:” prefix. If a port i...",
    "isBlock": false
  },
  {
    "name": "server",
    "module": "ngx_mail_core_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_core_module.html#server",
    "syntax": "server { ... }",
    "default": "—",
    "contexts": [
      "mail"
    ],
    "summary": "Sets the configuration for a server.",
    "isBlock": true
  },
  {
    "name": "server",
    "module": "ngx_stream_core_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_core_module.html#server",
    "syntax": "server { ... }",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Sets the configuration for a virtual server. There is no clear separation between IP-based (based on the IP address) and name-based (based on the TLS Server Name Indication extension (SNI, RFC 6066)) (1.25.5) virtual...",
    "isBlock": true
  },
  {
    "name": "server",
    "module": "ngx_stream_upstream_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_upstream_module.html#server",
    "syntax": "server address [parameters];",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Defines the address and other parameters of a server. The address can be specified as a domain name or IP address with an obligatory port, or as a UNIX-domain socket path specified after the “unix:” prefix. A domain n...",
    "isBlock": false
  },
  {
    "name": "server_name",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#server_name",
    "syntax": "server_name name ...;",
    "default": "server_name \"\";",
    "contexts": [
      "server"
    ],
    "summary": "Sets names of a virtual server, for example:",
    "isBlock": false
  },
  {
    "name": "server_name",
    "module": "ngx_mail_core_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_core_module.html#server_name",
    "syntax": "server_name name;",
    "default": "server_name hostname;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets the server name that is used:",
    "isBlock": false
  },
  {
    "name": "server_name",
    "module": "ngx_stream_core_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_core_module.html#server_name",
    "syntax": "server_name name ...;",
    "default": "server_name \"\";",
    "contexts": [
      "server"
    ],
    "summary": "Sets names of a virtual server, for example:",
    "isBlock": false
  },
  {
    "name": "server_name_in_redirect",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#server_name_in_redirect",
    "syntax": "server_name_in_redirect on | off;",
    "default": "server_name_in_redirect off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables the use of the primary server name, specified by the server_name directive, in absolute redirects issued by nginx. When the use of the primary server name is disabled, the name from the “Host” requ...",
    "isBlock": false
  },
  {
    "name": "server_names_hash_bucket_size",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#server_names_hash_bucket_size",
    "syntax": "server_names_hash_bucket_size size;",
    "default": "server_names_hash_bucket_size 32|64|128;",
    "contexts": [
      "http"
    ],
    "summary": "Sets the bucket size for the server names hash tables. The default value depends on the size of the processor’s cache line. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "server_names_hash_bucket_size",
    "module": "ngx_stream_core_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_core_module.html#server_names_hash_bucket_size",
    "syntax": "server_names_hash_bucket_size size;",
    "default": "server_names_hash_bucket_size 32|64|128;",
    "contexts": [
      "stream"
    ],
    "summary": "Sets the bucket size for the server names hash tables. The default value depends on the size of the processor’s cache line. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "server_names_hash_max_size",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#server_names_hash_max_size",
    "syntax": "server_names_hash_max_size size;",
    "default": "server_names_hash_max_size 512;",
    "contexts": [
      "http"
    ],
    "summary": "Sets the maximum size of the server names hash tables. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "server_names_hash_max_size",
    "module": "ngx_stream_core_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_core_module.html#server_names_hash_max_size",
    "syntax": "server_names_hash_max_size size;",
    "default": "server_names_hash_max_size 512;",
    "contexts": [
      "stream"
    ],
    "summary": "Sets the maximum size of the server names hash tables. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "server_tokens",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#server_tokens",
    "syntax": "server_tokens on | off | build | string;",
    "default": "server_tokens on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables emitting nginx version on error pages and in the “Server” response header field.",
    "isBlock": false
  },
  {
    "name": "session_log",
    "module": "ngx_http_session_log_module",
    "scope": "http",
    "docPath": "http/ngx_http_session_log_module.html#session_log",
    "syntax": "session_log name | off;",
    "default": "session_log off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables the use of the specified session log. The special value off cancels the effect of the session_log directives inherited from the previous configuration level.",
    "isBlock": false
  },
  {
    "name": "session_log_format",
    "module": "ngx_http_session_log_module",
    "scope": "http",
    "docPath": "http/ngx_http_session_log_module.html#session_log_format",
    "syntax": "session_log_format name string ...;",
    "default": "session_log_format combined \"...\";",
    "contexts": [
      "http"
    ],
    "summary": "Specifies the output format of a log. The value of the $body_bytes_sent variable is aggregated across all requests in a session. The values of all other variables available for logging correspond to the first request...",
    "isBlock": false
  },
  {
    "name": "session_log_zone",
    "module": "ngx_http_session_log_module",
    "scope": "http",
    "docPath": "http/ngx_http_session_log_module.html#session_log_zone",
    "syntax": "session_log_zone path zone=name:size [format=format] [timeout=time] [id=id] [md5=md5] ;",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets the path to a log file and configures the shared memory zone that is used to store currently active sessions.",
    "isBlock": false
  },
  {
    "name": "session_store",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#session_store",
    "syntax": "session_store name;",
    "default": "—",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Specifies a custom key-value database that stores session data. By default, an 8-megabyte key-value database named oidc_default_store_<provider name> is created automatically.",
    "isBlock": false
  },
  {
    "name": "session_sync_leeway",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#session_sync_leeway",
    "syntax": "session_sync_leeway time;",
    "default": "session_sync_leeway 0;",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Sets the maximum wait time for a session to appear in the key-value zone if a request contains a session cookie but the corresponding session is not found. This allows for session synchronization delays between cluste...",
    "isBlock": false
  },
  {
    "name": "session_timeout",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#session_timeout",
    "syntax": "session_timeout time;",
    "default": "session_timeout 8h;",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Sets a timeout after which the session is deleted, unless it was refreshed.",
    "isBlock": false
  },
  {
    "name": "set",
    "module": "ngx_http_rewrite_module",
    "scope": "http",
    "docPath": "http/ngx_http_rewrite_module.html#set",
    "syntax": "set $variable value;",
    "default": "—",
    "contexts": [
      "server",
      "location",
      "if"
    ],
    "summary": "Sets a value for the specified variable. The value can contain text, variables, and their combination.",
    "isBlock": false
  },
  {
    "name": "set",
    "module": "ngx_stream_set_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_set_module.html#set",
    "syntax": "set $variable value;",
    "default": "—",
    "contexts": [
      "server"
    ],
    "summary": "Sets a value for the specified variable. The value can contain text, variables, and their combination.",
    "isBlock": false
  },
  {
    "name": "set_real_ip_from",
    "module": "ngx_http_realip_module",
    "scope": "http",
    "docPath": "http/ngx_http_realip_module.html#set_real_ip_from",
    "syntax": "set_real_ip_from address | CIDR | unix:;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines trusted addresses that are known to send correct replacement addresses. If the special value unix: is specified, all UNIX-domain sockets will be trusted. Trusted addresses may also be specified using a hostnam...",
    "isBlock": false
  },
  {
    "name": "set_real_ip_from",
    "module": "ngx_mail_realip_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_realip_module.html#set_real_ip_from",
    "syntax": "set_real_ip_from address | CIDR | unix:;",
    "default": "—",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Defines trusted addresses that are known to send correct replacement addresses. If the special value unix: is specified, all UNIX-domain sockets will be trusted.",
    "isBlock": false
  },
  {
    "name": "set_real_ip_from",
    "module": "ngx_stream_realip_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_realip_module.html#set_real_ip_from",
    "syntax": "set_real_ip_from address | CIDR | unix:;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Defines trusted addresses that are known to send correct replacement addresses. If the special value unix: is specified, all UNIX-domain sockets will be trusted.",
    "isBlock": false
  },
  {
    "name": "slice",
    "module": "ngx_http_slice_module",
    "scope": "http",
    "docPath": "http/ngx_http_slice_module.html#slice",
    "syntax": "slice size;",
    "default": "slice 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the size of the slice. The zero value disables splitting responses into slices. Note that a too low value may result in excessive memory usage and opening a large number of files.",
    "isBlock": false
  },
  {
    "name": "smtp_auth",
    "module": "ngx_mail_smtp_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_smtp_module.html#smtp_auth",
    "syntax": "smtp_auth method ...;",
    "default": "smtp_auth plain login;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets permitted methods of SASL authentication for SMTP clients. Supported methods are:",
    "isBlock": false
  },
  {
    "name": "smtp_capabilities",
    "module": "ngx_mail_smtp_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_smtp_module.html#smtp_capabilities",
    "syntax": "smtp_capabilities extension ...;",
    "default": "—",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets the SMTP protocol extensions list that is passed to the client in response to the EHLO command. The authentication methods specified in the smtp_auth directive and STARTTLS are automatically added to this list de...",
    "isBlock": false
  },
  {
    "name": "smtp_client_buffer",
    "module": "ngx_mail_smtp_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_smtp_module.html#smtp_client_buffer",
    "syntax": "smtp_client_buffer size;",
    "default": "smtp_client_buffer 4k|8k;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets the size of the buffer used for reading SMTP commands. By default, the buffer size is equal to one memory page. This is either 4K or 8K, depending on a platform.",
    "isBlock": false
  },
  {
    "name": "smtp_greeting_delay",
    "module": "ngx_mail_smtp_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_smtp_module.html#smtp_greeting_delay",
    "syntax": "smtp_greeting_delay time;",
    "default": "smtp_greeting_delay 0;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Allows setting a delay before sending an SMTP greeting in order to reject clients who fail to wait for the greeting before sending SMTP commands.",
    "isBlock": false
  },
  {
    "name": "source_charset",
    "module": "ngx_http_charset_module",
    "scope": "http",
    "docPath": "http/ngx_http_charset_module.html#source_charset",
    "syntax": "source_charset charset;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Defines the source charset of a response. If this charset is different from the charset specified in the charset directive, a conversion is performed.",
    "isBlock": false
  },
  {
    "name": "split_clients",
    "module": "ngx_http_split_clients_module",
    "scope": "http",
    "docPath": "http/ngx_http_split_clients_module.html#split_clients",
    "syntax": "split_clients string $variable { ... }",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Creates a variable for A/B testing, for example:",
    "isBlock": true
  },
  {
    "name": "split_clients",
    "module": "ngx_stream_split_clients_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_split_clients_module.html#split_clients",
    "syntax": "split_clients string $variable { ... }",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Creates a variable for A/B testing, for example:",
    "isBlock": true
  },
  {
    "name": "ssi",
    "module": "ngx_http_ssi_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssi_module.html#ssi",
    "syntax": "ssi on | off;",
    "default": "ssi off;",
    "contexts": [
      "http",
      "server",
      "location",
      "if in location"
    ],
    "summary": "Enables or disables processing of SSI commands in responses.",
    "isBlock": false
  },
  {
    "name": "ssi_last_modified",
    "module": "ngx_http_ssi_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssi_module.html#ssi_last_modified",
    "syntax": "ssi_last_modified on | off;",
    "default": "ssi_last_modified off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows preserving the “Last-Modified” header field from the original response during SSI processing to facilitate response caching.",
    "isBlock": false
  },
  {
    "name": "ssi_min_file_chunk",
    "module": "ngx_http_ssi_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssi_module.html#ssi_min_file_chunk",
    "syntax": "ssi_min_file_chunk size;",
    "default": "ssi_min_file_chunk 1k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the minimum size for parts of a response stored on disk, starting from which it makes sense to send them using sendfile.",
    "isBlock": false
  },
  {
    "name": "ssi_silent_errors",
    "module": "ngx_http_ssi_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssi_module.html#ssi_silent_errors",
    "syntax": "ssi_silent_errors on | off;",
    "default": "ssi_silent_errors off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If enabled, suppresses the output of the “[an error occurred while processing the directive]” string if an error occurred during SSI processing.",
    "isBlock": false
  },
  {
    "name": "ssi_types",
    "module": "ngx_http_ssi_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssi_module.html#ssi_types",
    "syntax": "ssi_types mime-type ...;",
    "default": "ssi_types text/html;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables processing of SSI commands in responses with the specified MIME types in addition to “text/html”. The special value “*” matches any MIME type (0.8.29).",
    "isBlock": false
  },
  {
    "name": "ssi_value_length",
    "module": "ngx_http_ssi_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssi_module.html#ssi_value_length",
    "syntax": "ssi_value_length length;",
    "default": "ssi_value_length 256;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the maximum length of parameter values in SSI commands.",
    "isBlock": false
  },
  {
    "name": "ssl",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl",
    "syntax": "ssl on | off;",
    "default": "ssl off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "This directive was made obsolete in version 1.15.0 and was removed in version 1.25.1. The ssl parameter of the listen directive should be used instead.",
    "isBlock": false
  },
  {
    "name": "ssl",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl",
    "syntax": "ssl on | off;",
    "default": "ssl off;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "This directive was made obsolete in version 1.15.0 and was removed in version 1.25.1. The ssl parameter of the listen directive should be used instead.",
    "isBlock": false
  },
  {
    "name": "ssl_alpn",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_alpn",
    "syntax": "ssl_alpn protocol ...;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies the list of supported ALPN protocols. One of the protocols must be negotiated if the client uses ALPN:",
    "isBlock": false
  },
  {
    "name": "ssl_buffer_size",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_buffer_size",
    "syntax": "ssl_buffer_size size;",
    "default": "ssl_buffer_size 16k;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets the size of the buffer used for sending data.",
    "isBlock": false
  },
  {
    "name": "ssl_certificate",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_certificate",
    "syntax": "ssl_certificate file;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Specifies a file with the certificate in the PEM format for the given virtual server. If intermediate certificates should be specified in addition to a primary certificate, they should be specified in the same file in...",
    "isBlock": false
  },
  {
    "name": "ssl_certificate",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_certificate",
    "syntax": "ssl_certificate file;",
    "default": "—",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Specifies a file with the certificate in the PEM format for the given server. If intermediate certificates should be specified in addition to a primary certificate, they should be specified in the same file in the fol...",
    "isBlock": false
  },
  {
    "name": "ssl_certificate",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_certificate",
    "syntax": "ssl_certificate file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with the certificate in the PEM format for the given virtual server. If intermediate certificates should be specified in addition to a primary certificate, they should be specified in the same file in...",
    "isBlock": false
  },
  {
    "name": "ssl_certificate_cache",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_certificate_cache",
    "syntax": "ssl_certificate_cache off;  |  ssl_certificate_cache max=N [inactive=time] [valid=time];",
    "default": "ssl_certificate_cache off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Defines a cache that stores SSL certificates and secret keys specified with variables.",
    "isBlock": false
  },
  {
    "name": "ssl_certificate_cache",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_certificate_cache",
    "syntax": "ssl_certificate_cache off;  |  ssl_certificate_cache max=N [inactive=time] [valid=time];",
    "default": "ssl_certificate_cache off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Defines a cache that stores SSL certificates and secret keys specified with variables.",
    "isBlock": false
  },
  {
    "name": "ssl_certificate_compression",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_certificate_compression",
    "syntax": "ssl_certificate_compression on | off;",
    "default": "ssl_certificate_compression off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables TLS 1.3 compression of server certificates.",
    "isBlock": false
  },
  {
    "name": "ssl_certificate_compression",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_certificate_compression",
    "syntax": "ssl_certificate_compression on | off;",
    "default": "ssl_certificate_compression off;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Enables TLS 1.3 compression of server certificates.",
    "isBlock": false
  },
  {
    "name": "ssl_certificate_compression",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_certificate_compression",
    "syntax": "ssl_certificate_compression on | off;",
    "default": "ssl_certificate_compression off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables TLS 1.3 compression of server certificates.",
    "isBlock": false
  },
  {
    "name": "ssl_certificate_key",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_certificate_key",
    "syntax": "ssl_certificate_key file;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Specifies a file with the secret key in the PEM format for the given virtual server.",
    "isBlock": false
  },
  {
    "name": "ssl_certificate_key",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_certificate_key",
    "syntax": "ssl_certificate_key file;",
    "default": "—",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Specifies a file with the secret key in the PEM format for the given server.",
    "isBlock": false
  },
  {
    "name": "ssl_certificate_key",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_certificate_key",
    "syntax": "ssl_certificate_key file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with the secret key in the PEM format for the given virtual server.",
    "isBlock": false
  },
  {
    "name": "ssl_ciphers",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_ciphers",
    "syntax": "ssl_ciphers ciphers;",
    "default": "ssl_ciphers HIGH:!aNULL:!MD5;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Specifies the enabled ciphers. The ciphers are specified in the format understood by the OpenSSL library, for example:",
    "isBlock": false
  },
  {
    "name": "ssl_ciphers",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_ciphers",
    "syntax": "ssl_ciphers ciphers;",
    "default": "ssl_ciphers HIGH:!aNULL:!MD5;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Specifies the enabled ciphers. The ciphers are specified in the format understood by the OpenSSL library, for example:",
    "isBlock": false
  },
  {
    "name": "ssl_ciphers",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_ciphers",
    "syntax": "ssl_ciphers ciphers;",
    "default": "ssl_ciphers HIGH:!aNULL:!MD5;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies the enabled ciphers. The ciphers are specified in the format understood by the OpenSSL library, for example:",
    "isBlock": false
  },
  {
    "name": "ssl_client_certificate",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_client_certificate",
    "syntax": "ssl_client_certificate file;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify client certificates and OCSP responses if ssl_stapling is enabled.",
    "isBlock": false
  },
  {
    "name": "ssl_client_certificate",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_client_certificate",
    "syntax": "ssl_client_certificate file;",
    "default": "—",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify client certificates.",
    "isBlock": false
  },
  {
    "name": "ssl_client_certificate",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_client_certificate",
    "syntax": "ssl_client_certificate file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify client certificates and OCSP responses if ssl_stapling is enabled.",
    "isBlock": false
  },
  {
    "name": "ssl_conf_command",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_conf_command",
    "syntax": "ssl_conf_command name value;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets arbitrary OpenSSL configuration commands.",
    "isBlock": false
  },
  {
    "name": "ssl_conf_command",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_conf_command",
    "syntax": "ssl_conf_command name value;",
    "default": "—",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets arbitrary OpenSSL configuration commands.",
    "isBlock": false
  },
  {
    "name": "ssl_conf_command",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_conf_command",
    "syntax": "ssl_conf_command name value;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets arbitrary OpenSSL configuration commands.",
    "isBlock": false
  },
  {
    "name": "ssl_crl",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#ssl_crl",
    "syntax": "ssl_crl file;",
    "default": "—",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Specifies a file with revoked certificates (CRL) in the PEM format used to verify the certificates of the OpenID Provider endpoints. When using intermediate certificates, their CRLs should be specified in the same file.",
    "isBlock": false
  },
  {
    "name": "ssl_crl",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_crl",
    "syntax": "ssl_crl file;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Specifies a file with revoked certificates (CRL) in the PEM format used to verify client certificates. When using intermediate certificates, their CRLs should be specified in the same file.",
    "isBlock": false
  },
  {
    "name": "ssl_crl",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_crl",
    "syntax": "ssl_crl file;",
    "default": "—",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Specifies a file with revoked certificates (CRL) in the PEM format used to verify client certificates. When using intermediate certificates, their CRLs should be specified in the same file.",
    "isBlock": false
  },
  {
    "name": "ssl_crl",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_crl",
    "syntax": "ssl_crl file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with revoked certificates (CRL) in the PEM format used to verify client certificates. When using intermediate certificates, their CRLs should be specified in the same file.",
    "isBlock": false
  },
  {
    "name": "ssl_crl",
    "module": "ngx_mgmt_module",
    "scope": "core",
    "docPath": "ngx_mgmt_module.html#ssl_crl",
    "syntax": "ssl_crl file;",
    "default": "—",
    "contexts": [
      "mgmt"
    ],
    "summary": "Specifies a file with revoked certificates (CRL) in the PEM format used to verify the certificate of the usage reporting endpoint. When using intermediate certificates, their CRLs should be specified in the same file.",
    "isBlock": false
  },
  {
    "name": "ssl_dhparam",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_dhparam",
    "syntax": "ssl_dhparam file;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Specifies a file with DH parameters for DHE ciphers.",
    "isBlock": false
  },
  {
    "name": "ssl_dhparam",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_dhparam",
    "syntax": "ssl_dhparam file;",
    "default": "—",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Specifies a file with DH parameters for DHE ciphers.",
    "isBlock": false
  },
  {
    "name": "ssl_dhparam",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_dhparam",
    "syntax": "ssl_dhparam file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with DH parameters for DHE ciphers.",
    "isBlock": false
  },
  {
    "name": "ssl_early_data",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_early_data",
    "syntax": "ssl_early_data on | off;",
    "default": "ssl_early_data off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables or disables TLS 1.3 early data.",
    "isBlock": false
  },
  {
    "name": "ssl_ecdh_curve",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_ecdh_curve",
    "syntax": "ssl_ecdh_curve curve;",
    "default": "ssl_ecdh_curve auto;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Specifies a curve for ECDHE ciphers.",
    "isBlock": false
  },
  {
    "name": "ssl_ecdh_curve",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_ecdh_curve",
    "syntax": "ssl_ecdh_curve curve;",
    "default": "ssl_ecdh_curve auto;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Specifies a curve for ECDHE ciphers.",
    "isBlock": false
  },
  {
    "name": "ssl_ecdh_curve",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_ecdh_curve",
    "syntax": "ssl_ecdh_curve curve;",
    "default": "ssl_ecdh_curve auto;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a curve for ECDHE ciphers.",
    "isBlock": false
  },
  {
    "name": "ssl_ech_file",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_ech_file",
    "syntax": "ssl_ech_file file;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Specifies a file with encrypted ClientHello configuration (ECHConfig) in the PEM format used to enable TLS 1.3 ECH in shared mode.",
    "isBlock": false
  },
  {
    "name": "ssl_ech_file",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_ech_file",
    "syntax": "ssl_ech_file file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with encrypted ClientHello configuration (ECHConfig) in the PEM format used to enable TLS 1.3 ECH in shared mode.",
    "isBlock": false
  },
  {
    "name": "ssl_engine",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#ssl_engine",
    "syntax": "ssl_engine device;",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Defines the name of the hardware SSL accelerator.",
    "isBlock": false
  },
  {
    "name": "ssl_handshake_timeout",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_handshake_timeout",
    "syntax": "ssl_handshake_timeout time;",
    "default": "ssl_handshake_timeout 60s;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a timeout for the SSL handshake to complete.",
    "isBlock": false
  },
  {
    "name": "ssl_key_log",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_key_log",
    "syntax": "ssl_key_log path;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables logging of client connection SSL keys and specifies the path to the key log file. Keys are logged in the SSLKEYLOGFILE format compatible with Wireshark.",
    "isBlock": false
  },
  {
    "name": "ssl_key_log",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_key_log",
    "syntax": "ssl_key_log path;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables logging of client connection SSL keys and specifies the path to the key log file. Keys are logged in the SSLKEYLOGFILE format compatible with Wireshark.",
    "isBlock": false
  },
  {
    "name": "ssl_object_cache_inheritable",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#ssl_object_cache_inheritable",
    "syntax": "ssl_object_cache_inheritable on | off;",
    "default": "ssl_object_cache_inheritable on;",
    "contexts": [
      "main"
    ],
    "summary": "If enabled, SSL objects (SSL certificates, secret keys, trusted CA certificates, CRL lists) will be inherited across configuration reloads.",
    "isBlock": false
  },
  {
    "name": "ssl_ocsp",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_ocsp",
    "syntax": "ssl_ocsp on | off | leaf;",
    "default": "ssl_ocsp off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables OCSP validation of the client certificate chain. The leaf parameter enables validation of the client certificate only.",
    "isBlock": false
  },
  {
    "name": "ssl_ocsp",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_ocsp",
    "syntax": "ssl_ocsp on | off | leaf;",
    "default": "ssl_ocsp off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables OCSP validation of the client certificate chain. The leaf parameter enables validation of the client certificate only.",
    "isBlock": false
  },
  {
    "name": "ssl_ocsp_cache",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_ocsp_cache",
    "syntax": "ssl_ocsp_cache off | [shared:name:size];",
    "default": "ssl_ocsp_cache off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets name and size of the cache that stores client certificates status for OCSP validation. The cache is shared between all worker processes. A cache with the same name can be used in several virtual servers.",
    "isBlock": false
  },
  {
    "name": "ssl_ocsp_cache",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_ocsp_cache",
    "syntax": "ssl_ocsp_cache off | [shared:name:size];",
    "default": "ssl_ocsp_cache off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets name and size of the cache that stores client certificates status for OCSP validation. The cache is shared between all worker processes. A cache with the same name can be used in several virtual servers.",
    "isBlock": false
  },
  {
    "name": "ssl_ocsp_responder",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_ocsp_responder",
    "syntax": "ssl_ocsp_responder url;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Overrides the URL of the OCSP responder specified in the “Authority Information Access” certificate extension for validation of client certificates.",
    "isBlock": false
  },
  {
    "name": "ssl_ocsp_responder",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_ocsp_responder",
    "syntax": "ssl_ocsp_responder url;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Overrides the URL of the OCSP responder specified in the “Authority Information Access” certificate extension for validation of client certificates.",
    "isBlock": false
  },
  {
    "name": "ssl_password_file",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_password_file",
    "syntax": "ssl_password_file file;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Specifies a file with passphrases for secret keys where each passphrase is specified on a separate line. Passphrases are tried in turn when loading the key.",
    "isBlock": false
  },
  {
    "name": "ssl_password_file",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_password_file",
    "syntax": "ssl_password_file file;",
    "default": "—",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Specifies a file with passphrases for secret keys where each passphrase is specified on a separate line. Passphrases are tried in turn when loading the key.",
    "isBlock": false
  },
  {
    "name": "ssl_password_file",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_password_file",
    "syntax": "ssl_password_file file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with passphrases for secret keys where each passphrase is specified on a separate line. Passphrases are tried in turn when loading the key.",
    "isBlock": false
  },
  {
    "name": "ssl_prefer_server_ciphers",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_prefer_server_ciphers",
    "syntax": "ssl_prefer_server_ciphers on | off;",
    "default": "ssl_prefer_server_ciphers off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Specifies that server ciphers should be preferred over client ciphers when the SSLv3 and TLS protocols are used.",
    "isBlock": false
  },
  {
    "name": "ssl_prefer_server_ciphers",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_prefer_server_ciphers",
    "syntax": "ssl_prefer_server_ciphers on | off;",
    "default": "ssl_prefer_server_ciphers off;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Specifies that server ciphers should be preferred over client ciphers when the SSLv3 and TLS protocols are used.",
    "isBlock": false
  },
  {
    "name": "ssl_prefer_server_ciphers",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_prefer_server_ciphers",
    "syntax": "ssl_prefer_server_ciphers on | off;",
    "default": "ssl_prefer_server_ciphers off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies that server ciphers should be preferred over client ciphers when the SSLv3 and TLS protocols are used.",
    "isBlock": false
  },
  {
    "name": "ssl_preread",
    "module": "ngx_stream_ssl_preread_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_preread_module.html#ssl_preread",
    "syntax": "ssl_preread on | off;",
    "default": "ssl_preread off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables extracting information from the ClientHello message at the preread phase.",
    "isBlock": false
  },
  {
    "name": "ssl_protocols",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_protocols",
    "syntax": "ssl_protocols [SSLv2] [SSLv3] [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];",
    "default": "ssl_protocols TLSv1.2 TLSv1.3;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables the specified protocols.",
    "isBlock": false
  },
  {
    "name": "ssl_protocols",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_protocols",
    "syntax": "ssl_protocols [SSLv2] [SSLv3] [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];",
    "default": "ssl_protocols TLSv1.2 TLSv1.3;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Enables the specified protocols.",
    "isBlock": false
  },
  {
    "name": "ssl_protocols",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_protocols",
    "syntax": "ssl_protocols [SSLv2] [SSLv3] [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];",
    "default": "ssl_protocols TLSv1.2 TLSv1.3;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables the specified protocols.",
    "isBlock": false
  },
  {
    "name": "ssl_reject_handshake",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_reject_handshake",
    "syntax": "ssl_reject_handshake on | off;",
    "default": "ssl_reject_handshake off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "If enabled, SSL handshakes in the server block will be rejected.",
    "isBlock": false
  },
  {
    "name": "ssl_reject_handshake",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_reject_handshake",
    "syntax": "ssl_reject_handshake on | off;",
    "default": "ssl_reject_handshake off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "If enabled, SSL handshakes in the server block will be rejected.",
    "isBlock": false
  },
  {
    "name": "ssl_session_cache",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_session_cache",
    "syntax": "ssl_session_cache off | none | [builtin[:size]] [shared:name:size];",
    "default": "ssl_session_cache none;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets the types and sizes of caches that store session parameters. A cache can be of any of the following types:",
    "isBlock": false
  },
  {
    "name": "ssl_session_cache",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_session_cache",
    "syntax": "ssl_session_cache off | none | [builtin[:size]] [shared:name:size];",
    "default": "ssl_session_cache none;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets the types and sizes of caches that store session parameters. A cache can be of any of the following types:",
    "isBlock": false
  },
  {
    "name": "ssl_session_cache",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_session_cache",
    "syntax": "ssl_session_cache off | none | [builtin[:size]] [shared:name:size];",
    "default": "ssl_session_cache none;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the types and sizes of caches that store session parameters. A cache can be of any of the following types:",
    "isBlock": false
  },
  {
    "name": "ssl_session_ticket_key",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_session_ticket_key",
    "syntax": "ssl_session_ticket_key file;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets a file with the secret key used to encrypt and decrypt TLS session tickets. The directive is necessary if the same key has to be shared between multiple servers. By default, a randomly generated key is used.",
    "isBlock": false
  },
  {
    "name": "ssl_session_ticket_key",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_session_ticket_key",
    "syntax": "ssl_session_ticket_key file;",
    "default": "—",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets a file with the secret key used to encrypt and decrypt TLS session tickets. The directive is necessary if the same key has to be shared between multiple servers. By default, a randomly generated key is used.",
    "isBlock": false
  },
  {
    "name": "ssl_session_ticket_key",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_session_ticket_key",
    "syntax": "ssl_session_ticket_key file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets a file with the secret key used to encrypt and decrypt TLS session tickets. The directive is necessary if the same key has to be shared between multiple servers. By default, a randomly generated key is used.",
    "isBlock": false
  },
  {
    "name": "ssl_session_tickets",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_session_tickets",
    "syntax": "ssl_session_tickets on | off;",
    "default": "ssl_session_tickets on;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables or disables session resumption through TLS session tickets.",
    "isBlock": false
  },
  {
    "name": "ssl_session_tickets",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_session_tickets",
    "syntax": "ssl_session_tickets on | off;",
    "default": "ssl_session_tickets on;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Enables or disables session resumption through TLS session tickets.",
    "isBlock": false
  },
  {
    "name": "ssl_session_tickets",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_session_tickets",
    "syntax": "ssl_session_tickets on | off;",
    "default": "ssl_session_tickets on;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables or disables session resumption through TLS session tickets.",
    "isBlock": false
  },
  {
    "name": "ssl_session_timeout",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_session_timeout",
    "syntax": "ssl_session_timeout time;",
    "default": "ssl_session_timeout 5m;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Specifies a time during which a client may reuse the session parameters.",
    "isBlock": false
  },
  {
    "name": "ssl_session_timeout",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_session_timeout",
    "syntax": "ssl_session_timeout time;",
    "default": "ssl_session_timeout 5m;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Specifies a time during which a client may reuse the session parameters.",
    "isBlock": false
  },
  {
    "name": "ssl_session_timeout",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_session_timeout",
    "syntax": "ssl_session_timeout time;",
    "default": "ssl_session_timeout 5m;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a time during which a client may reuse the session parameters.",
    "isBlock": false
  },
  {
    "name": "ssl_stapling",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_stapling",
    "syntax": "ssl_stapling on | off;",
    "default": "ssl_stapling off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables or disables stapling of OCSP responses by the server. Example:",
    "isBlock": false
  },
  {
    "name": "ssl_stapling",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_stapling",
    "syntax": "ssl_stapling on | off;",
    "default": "ssl_stapling off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables or disables stapling of OCSP responses by the server. Example:",
    "isBlock": false
  },
  {
    "name": "ssl_stapling_file",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_stapling_file",
    "syntax": "ssl_stapling_file file;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "When set, the stapled OCSP response will be taken from the specified file instead of querying the OCSP responder specified in the server certificate.",
    "isBlock": false
  },
  {
    "name": "ssl_stapling_file",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_stapling_file",
    "syntax": "ssl_stapling_file file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "When set, the stapled OCSP response will be taken from the specified file instead of querying the OCSP responder specified in the server certificate.",
    "isBlock": false
  },
  {
    "name": "ssl_stapling_responder",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_stapling_responder",
    "syntax": "ssl_stapling_responder url;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Overrides the URL of the OCSP responder specified in the “Authority Information Access” certificate extension.",
    "isBlock": false
  },
  {
    "name": "ssl_stapling_responder",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_stapling_responder",
    "syntax": "ssl_stapling_responder url;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Overrides the URL of the OCSP responder specified in the “Authority Information Access” certificate extension.",
    "isBlock": false
  },
  {
    "name": "ssl_stapling_verify",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_stapling_verify",
    "syntax": "ssl_stapling_verify on | off;",
    "default": "ssl_stapling_verify off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables or disables verification of OCSP responses by the server.",
    "isBlock": false
  },
  {
    "name": "ssl_stapling_verify",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_stapling_verify",
    "syntax": "ssl_stapling_verify on | off;",
    "default": "ssl_stapling_verify off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables or disables verification of OCSP responses by the server.",
    "isBlock": false
  },
  {
    "name": "ssl_trusted_certificate",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#ssl_trusted_certificate",
    "syntax": "ssl_trusted_certificate file;",
    "default": "ssl_trusted_certificate system CA bundle;",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify the certificates of the OpenID Provider endpoints.",
    "isBlock": false
  },
  {
    "name": "ssl_trusted_certificate",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_trusted_certificate",
    "syntax": "ssl_trusted_certificate file;",
    "default": "—",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify client certificates and OCSP responses if ssl_stapling is enabled.",
    "isBlock": false
  },
  {
    "name": "ssl_trusted_certificate",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#ssl_trusted_certificate",
    "syntax": "ssl_trusted_certificate file;",
    "default": "—",
    "contexts": [
      "acme_issuer"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify the certificate of the ACME server.",
    "isBlock": false
  },
  {
    "name": "ssl_trusted_certificate",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_trusted_certificate",
    "syntax": "ssl_trusted_certificate file;",
    "default": "—",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify client certificates.",
    "isBlock": false
  },
  {
    "name": "ssl_trusted_certificate",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_trusted_certificate",
    "syntax": "ssl_trusted_certificate file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify client certificates and OCSP responses if ssl_stapling is enabled.",
    "isBlock": false
  },
  {
    "name": "ssl_trusted_certificate",
    "module": "ngx_mgmt_module",
    "scope": "core",
    "docPath": "ngx_mgmt_module.html#ssl_trusted_certificate",
    "syntax": "ssl_trusted_certificate file;",
    "default": "ssl_trusted_certificate system CA bundle;",
    "contexts": [
      "mgmt"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify the certificate of the usage reporting endpoint.",
    "isBlock": false
  },
  {
    "name": "ssl_verify",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#ssl_verify",
    "syntax": "ssl_verify on | off;",
    "default": "ssl_verify on;",
    "contexts": [
      "acme_issuer"
    ],
    "summary": "Enables or disables verification of the ACME server certificate.",
    "isBlock": false
  },
  {
    "name": "ssl_verify",
    "module": "ngx_mgmt_module",
    "scope": "core",
    "docPath": "ngx_mgmt_module.html#ssl_verify",
    "syntax": "ssl_verify on | off;",
    "default": "ssl_verify on;",
    "contexts": [
      "mgmt"
    ],
    "summary": "Enables or disables verification of the usage reporting endpoint certificate.",
    "isBlock": false
  },
  {
    "name": "ssl_verify_client",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_verify_client",
    "syntax": "ssl_verify_client on | off | optional | optional_no_ca;",
    "default": "ssl_verify_client off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables verification of client certificates. The verification result is stored in the $ssl_client_verify variable.",
    "isBlock": false
  },
  {
    "name": "ssl_verify_client",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_verify_client",
    "syntax": "ssl_verify_client on | off | optional | optional_no_ca;",
    "default": "ssl_verify_client off;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Enables verification of client certificates. The verification result is passed in the “Auth-SSL-Verify” header of the authentication request.",
    "isBlock": false
  },
  {
    "name": "ssl_verify_client",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_verify_client",
    "syntax": "ssl_verify_client on | off | optional | optional_no_ca;",
    "default": "ssl_verify_client off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables verification of client certificates. The verification result is stored in the $ssl_client_verify variable. If an error has occurred during the client certificate verification or a client has not presented the...",
    "isBlock": false
  },
  {
    "name": "ssl_verify_depth",
    "module": "ngx_http_ssl_module",
    "scope": "http",
    "docPath": "http/ngx_http_ssl_module.html#ssl_verify_depth",
    "syntax": "ssl_verify_depth number;",
    "default": "ssl_verify_depth 1;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Sets the verification depth in the client certificates chain.",
    "isBlock": false
  },
  {
    "name": "ssl_verify_depth",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#ssl_verify_depth",
    "syntax": "ssl_verify_depth number;",
    "default": "ssl_verify_depth 1;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets the verification depth in the client certificates chain.",
    "isBlock": false
  },
  {
    "name": "ssl_verify_depth",
    "module": "ngx_stream_ssl_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_ssl_module.html#ssl_verify_depth",
    "syntax": "ssl_verify_depth number;",
    "default": "ssl_verify_depth 1;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the verification depth in the client certificates chain.",
    "isBlock": false
  },
  {
    "name": "stall_threshold",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#stall_threshold",
    "syntax": "stall_threshold time;",
    "default": "stall_threshold 1000ms;",
    "contexts": [
      "events"
    ],
    "summary": "Allows overriding the default time threshold for the event loop iteration before a stall is reported. By default, a stall is reported when an event loop iteration exceeds 1000ms. If the timer_resolution directive is e...",
    "isBlock": false
  },
  {
    "name": "starttls",
    "module": "ngx_mail_ssl_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_ssl_module.html#starttls",
    "syntax": "starttls on | off | only;",
    "default": "starttls off;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "",
    "isBlock": false
  },
  {
    "name": "state",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#state",
    "syntax": "state file;",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Specifies a file that keeps the state of the dynamically configurable group.",
    "isBlock": false
  },
  {
    "name": "state",
    "module": "ngx_stream_upstream_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_upstream_module.html#state",
    "syntax": "state file;",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Specifies a file that keeps the state of the dynamically configurable group.",
    "isBlock": false
  },
  {
    "name": "state_path",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#state_path",
    "syntax": "state_path path | off;",
    "default": "state_path acme_<issuer>;",
    "contexts": [
      "acme_issuer"
    ],
    "summary": "Defines a directory for storing the module data that can be persisted across restarts. This can improve the load time by skipping some requests on startup, and avoid hitting request rate limits on the ACME server.",
    "isBlock": false
  },
  {
    "name": "state_path",
    "module": "ngx_mgmt_module",
    "scope": "core",
    "docPath": "ngx_mgmt_module.html#state_path",
    "syntax": "state_path path;",
    "default": "—",
    "contexts": [
      "mgmt"
    ],
    "summary": "Defines a directory for storing state files (nginx-mgmt-*) created by the ngx_mgmt_module module. The default directory for Linux is /var/lib/nginx/state, for FreeBSD is /var/db/nginx/state.",
    "isBlock": false
  },
  {
    "name": "status",
    "module": "ngx_http_status_module",
    "scope": "http",
    "docPath": "http/ngx_http_status_module.html#status",
    "syntax": "status;",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "The status information will be accessible from the surrounding location. Access to this location should be limited.",
    "isBlock": false
  },
  {
    "name": "status_format",
    "module": "ngx_http_status_module",
    "scope": "http",
    "docPath": "http/ngx_http_status_module.html#status_format",
    "syntax": "status_format json;  |  status_format jsonp [callback];",
    "default": "status_format json;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "By default, status information is output in the JSON format.",
    "isBlock": false
  },
  {
    "name": "status_zone",
    "module": "ngx_http_api_module",
    "scope": "http",
    "docPath": "http/ngx_http_api_module.html#status_zone",
    "syntax": "status_zone zone;",
    "default": "—",
    "contexts": [
      "server",
      "location",
      "if in location"
    ],
    "summary": "Enables collection of virtual http or stream server status information in the specified zone. Several servers may share the same zone.",
    "isBlock": false
  },
  {
    "name": "status_zone",
    "module": "ngx_http_status_module",
    "scope": "http",
    "docPath": "http/ngx_http_status_module.html#status_zone",
    "syntax": "status_zone zone;",
    "default": "—",
    "contexts": [
      "server"
    ],
    "summary": "Enables collection of virtual http or stream (1.7.11) server status information in the specified zone. Several servers may share the same zone.",
    "isBlock": false
  },
  {
    "name": "sticky",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#sticky",
    "syntax": "sticky cookie name [expires=time] [domain=domain] [httponly] [samesite=strict|lax|none|$variable] [secure] [path=path];  |  sticky route $variable ...;  |  sticky learn create=$variable lookup=$variable zone=name:size [timeout=time] [header] [sync];",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Enables session affinity, which causes requests from the same client to be passed to the same server in a group of servers. Three methods are available:",
    "isBlock": false
  },
  {
    "name": "stream",
    "module": "ngx_stream_core_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_core_module.html#stream",
    "syntax": "stream { ... }",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Provides the configuration file context in which the stream server directives are specified.",
    "isBlock": true
  },
  {
    "name": "stub_status",
    "module": "ngx_http_stub_status_module",
    "scope": "http",
    "docPath": "http/ngx_http_stub_status_module.html#stub_status",
    "syntax": "stub_status;",
    "default": "—",
    "contexts": [
      "server",
      "location"
    ],
    "summary": "The basic status information will be accessible from the surrounding location.",
    "isBlock": false
  },
  {
    "name": "sub_filter",
    "module": "ngx_http_sub_module",
    "scope": "http",
    "docPath": "http/ngx_http_sub_module.html#sub_filter",
    "syntax": "sub_filter string replacement;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a string to replace and a replacement string. The string to replace is matched ignoring the case. The string to replace (1.9.4) and replacement string can contain variables. Several sub_filter directives can be s...",
    "isBlock": false
  },
  {
    "name": "sub_filter_last_modified",
    "module": "ngx_http_sub_module",
    "scope": "http",
    "docPath": "http/ngx_http_sub_module.html#sub_filter_last_modified",
    "syntax": "sub_filter_last_modified on | off;",
    "default": "sub_filter_last_modified off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows preserving the “Last-Modified” header field from the original response during replacement to facilitate response caching.",
    "isBlock": false
  },
  {
    "name": "sub_filter_once",
    "module": "ngx_http_sub_module",
    "scope": "http",
    "docPath": "http/ngx_http_sub_module.html#sub_filter_once",
    "syntax": "sub_filter_once on | off;",
    "default": "sub_filter_once on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Indicates whether to look for each string to replace once or repeatedly.",
    "isBlock": false
  },
  {
    "name": "sub_filter_types",
    "module": "ngx_http_sub_module",
    "scope": "http",
    "docPath": "http/ngx_http_sub_module.html#sub_filter_types",
    "syntax": "sub_filter_types mime-type ...;",
    "default": "sub_filter_types text/html;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables string replacement in responses with the specified MIME types in addition to “text/html”. The special value “*” matches any MIME type (0.8.29).",
    "isBlock": false
  },
  {
    "name": "subrequest_output_buffer_size",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#subrequest_output_buffer_size",
    "syntax": "subrequest_output_buffer_size size;",
    "default": "subrequest_output_buffer_size 4k|8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the size of the buffer used for storing the response body of a subrequest. By default, the buffer size is equal to one memory page. This is either 4K or 8K, depending on a platform. It can be made smaller, however.",
    "isBlock": false
  },
  {
    "name": "tcp_nodelay",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#tcp_nodelay",
    "syntax": "tcp_nodelay on | off;",
    "default": "tcp_nodelay on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables the use of the TCP_NODELAY option. The option is enabled when a connection is transitioned into the keep-alive state. Additionally, it is enabled on SSL connections, for unbuffered proxying, and fo...",
    "isBlock": false
  },
  {
    "name": "tcp_nodelay",
    "module": "ngx_stream_core_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_core_module.html#tcp_nodelay",
    "syntax": "tcp_nodelay on | off;",
    "default": "tcp_nodelay on;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables or disables the use of the TCP_NODELAY option. The option is enabled for both client and proxied server connections.",
    "isBlock": false
  },
  {
    "name": "tcp_nopush",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#tcp_nopush",
    "syntax": "tcp_nopush on | off;",
    "default": "tcp_nopush off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables the use of the TCP_NOPUSH socket option on FreeBSD or the TCP_CORK socket option on Linux. The options are enabled only when sendfile is used. Enabling the option allows",
    "isBlock": false
  },
  {
    "name": "thread_pool",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#thread_pool",
    "syntax": "thread_pool name threads=number [max_queue=number];",
    "default": "thread_pool default threads=32 max_queue=65536;",
    "contexts": [
      "main"
    ],
    "summary": "Defines the name and parameters of a thread pool used for multi-threaded reading and sending of files without blocking worker processes.",
    "isBlock": false
  },
  {
    "name": "timeout",
    "module": "ngx_mail_core_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_core_module.html#timeout",
    "syntax": "timeout time;",
    "default": "timeout 60s;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Sets the timeout that is used before proxying to the backend starts.",
    "isBlock": false
  },
  {
    "name": "timer_resolution",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#timer_resolution",
    "syntax": "timer_resolution interval;",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Reduces timer resolution in worker processes, thus reducing the number of gettimeofday() system calls made. By default, gettimeofday() is called each time a kernel event is received. With reduced resolution, gettimeof...",
    "isBlock": false
  },
  {
    "name": "try_files",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#try_files",
    "syntax": "try_files file ... uri;  |  try_files file ... =code;",
    "default": "—",
    "contexts": [
      "server",
      "location"
    ],
    "summary": "Checks the existence of files in the specified order and uses the first found file for request processing; the processing is performed in the current context. The path to a file is constructed from the file parameter...",
    "isBlock": false
  },
  {
    "name": "tunnel_allow_upstream",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_allow_upstream",
    "syntax": "tunnel_allow_upstream string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which access to the backend server is allowed or denied. If all string parameters are not empty and not equal to “0” then the access is allowed. The conditions are evaluated each time before a...",
    "isBlock": false
  },
  {
    "name": "tunnel_bind",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_bind",
    "syntax": "tunnel_bind address | off;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Makes outgoing connections to a backend server originate from the specified local IP address with an optional port. Parameter value can contain variables. The special value off cancels the effect of the tunnel_bind di...",
    "isBlock": false
  },
  {
    "name": "tunnel_bind_dynamic",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_bind_dynamic",
    "syntax": "tunnel_bind_dynamic on | off;",
    "default": "tunnel_bind_dynamic off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When enabled, makes the tunnel_bind operation at each connection attempt:",
    "isBlock": false
  },
  {
    "name": "tunnel_buffer_size",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_buffer_size",
    "syntax": "tunnel_buffer_size size;",
    "default": "tunnel_buffer_size 16k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the size of the buffer used for reading data from the backend server. Also sets the size of the buffer used for reading data from the client.",
    "isBlock": false
  },
  {
    "name": "tunnel_connect_timeout",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_connect_timeout",
    "syntax": "tunnel_connect_timeout time;",
    "default": "tunnel_connect_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for establishing a connection with a backend server. It should be noted that this timeout cannot usually exceed 75 seconds.",
    "isBlock": false
  },
  {
    "name": "tunnel_next_upstream",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_next_upstream",
    "syntax": "tunnel_next_upstream error | timeout | denied | off ...;",
    "default": "tunnel_next_upstream error timeout;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies in which cases a request should be passed to the next server:",
    "isBlock": false
  },
  {
    "name": "tunnel_next_upstream_timeout",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_next_upstream_timeout",
    "syntax": "tunnel_next_upstream_timeout time;",
    "default": "tunnel_next_upstream_timeout 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the time during which a request can be passed to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "tunnel_next_upstream_tries",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_next_upstream_tries",
    "syntax": "tunnel_next_upstream_tries number;",
    "default": "tunnel_next_upstream_tries 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the number of possible tries for passing a request to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "tunnel_pass",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_pass",
    "syntax": "tunnel_pass [address];",
    "default": "—",
    "contexts": [
      "server",
      "location",
      "if in location"
    ],
    "summary": "Enables handling of CONNECT requests and sets the address of a backend server. By default, the address is $host:$request_port and is taken from the client request. In most cases, tunnel_pass does not require configuri...",
    "isBlock": false
  },
  {
    "name": "tunnel_read_timeout",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_read_timeout",
    "syntax": "tunnel_read_timeout time;",
    "default": "tunnel_read_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the timeout between two successive read or write operations on client or backend server connections. If no data is transmitted within this time, the connection is closed.",
    "isBlock": false
  },
  {
    "name": "tunnel_send_lowat",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_send_lowat",
    "syntax": "tunnel_send_lowat size;",
    "default": "tunnel_send_lowat 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If the directive is set to a non-zero value, nginx will try to minimize the number of send operations on outgoing connections to a backend server by using either NOTE_LOWAT flag of the kqueue method, or the SO_SNDLOWA...",
    "isBlock": false
  },
  {
    "name": "tunnel_send_timeout",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_send_timeout",
    "syntax": "tunnel_send_timeout time;",
    "default": "tunnel_send_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout for transmitting a request to the backend server. The timeout is set only between two successive write operations, not for the transmission of the whole request. If the backend server does not receive a...",
    "isBlock": false
  },
  {
    "name": "tunnel_socket_keepalive",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_socket_keepalive",
    "syntax": "tunnel_socket_keepalive on | off;",
    "default": "tunnel_socket_keepalive off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Configures the “TCP keepalive” behavior for outgoing connections to a backend server. By default, the operating system’s settings are in effect for the socket. If the directive is set to the value “on”, the SO_KEEPALI...",
    "isBlock": false
  },
  {
    "name": "tunnel_socket_rcvbuf",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_socket_rcvbuf",
    "syntax": "tunnel_socket_rcvbuf size;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the receive buffer size (the SO_RCVBUF option) for outgoing connections to a backend server. The special value 0 cancels the effect of the tunnel_socket_rcvbuf directive inherited from the previous configuration...",
    "isBlock": false
  },
  {
    "name": "tunnel_socket_sndbuf",
    "module": "ngx_http_tunnel_module",
    "scope": "http",
    "docPath": "http/ngx_http_tunnel_module.html#tunnel_socket_sndbuf",
    "syntax": "tunnel_socket_sndbuf size;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the send buffer size (the SO_SNDBUF option) for outgoing connections to a backend server. The special value 0 cancels the effect of the tunnel_socket_sndbuf directive inherited from the previous configuration lev...",
    "isBlock": false
  },
  {
    "name": "types",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#types",
    "syntax": "types { ... }",
    "default": "types { text/html html; image/gif gif; image/jpeg jpg; }",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Maps file name extensions to MIME types of responses. Extensions are case-insensitive. Several extensions can be mapped to one type, for example:",
    "isBlock": true
  },
  {
    "name": "types_hash_bucket_size",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#types_hash_bucket_size",
    "syntax": "types_hash_bucket_size size;",
    "default": "types_hash_bucket_size 64;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the bucket size for the types hash tables. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "types_hash_max_size",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#types_hash_max_size",
    "syntax": "types_hash_max_size size;",
    "default": "types_hash_max_size 1024;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the maximum size of the types hash tables. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "underscores_in_headers",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#underscores_in_headers",
    "syntax": "underscores_in_headers on | off;",
    "default": "underscores_in_headers off;",
    "contexts": [
      "http",
      "server"
    ],
    "summary": "Enables or disables the use of underscores in client request header fields. When the use of underscores is disabled, request header fields whose names contain underscores are marked as invalid and become subject to th...",
    "isBlock": false
  },
  {
    "name": "uninitialized_variable_warn",
    "module": "ngx_http_rewrite_module",
    "scope": "http",
    "docPath": "http/ngx_http_rewrite_module.html#uninitialized_variable_warn",
    "syntax": "uninitialized_variable_warn on | off;",
    "default": "uninitialized_variable_warn on;",
    "contexts": [
      "http",
      "server",
      "location",
      "if"
    ],
    "summary": "Controls whether warnings about uninitialized variables are logged.",
    "isBlock": false
  },
  {
    "name": "upstream",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#upstream",
    "syntax": "upstream name { ... }",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Defines a group of servers. Servers can listen on different ports. In addition, servers listening on TCP and UNIX-domain sockets can be mixed.",
    "isBlock": true
  },
  {
    "name": "upstream",
    "module": "ngx_stream_upstream_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_upstream_module.html#upstream",
    "syntax": "upstream name { ... }",
    "default": "—",
    "contexts": [
      "stream"
    ],
    "summary": "Defines a group of servers. Servers can listen on different ports. In addition, servers listening on TCP and UNIX-domain sockets can be mixed.",
    "isBlock": true
  },
  {
    "name": "upstream_conf",
    "module": "ngx_http_upstream_conf_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_conf_module.html#upstream_conf",
    "syntax": "upstream_conf;",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Turns on the HTTP interface of upstream configuration in the surrounding location. Access to this location should be limited.",
    "isBlock": false
  },
  {
    "name": "uri",
    "module": "ngx_http_acme_module",
    "scope": "http",
    "docPath": "http/ngx_http_acme_module.html#uri",
    "syntax": "uri uri;",
    "default": "—",
    "contexts": [
      "acme_issuer"
    ],
    "summary": "The directory URL of the ACME server. This directive is mandatory.",
    "isBlock": false
  },
  {
    "name": "usage_report",
    "module": "ngx_mgmt_module",
    "scope": "core",
    "docPath": "ngx_mgmt_module.html#usage_report",
    "syntax": "usage_report [endpoint=address] [interval=time];",
    "default": "usage_report endpoint=product.connect.nginx.com interval=1h;",
    "contexts": [
      "mgmt"
    ],
    "summary": "Sets the address and port of the usage reporting endpoint. The interval parameter sets an interval between two consecutive reports.",
    "isBlock": false
  },
  {
    "name": "use",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#use",
    "syntax": "use method;",
    "default": "—",
    "contexts": [
      "events"
    ],
    "summary": "Specifies the connection processing method to use. There is normally no need to specify it explicitly, because nginx will by default use the most efficient method.",
    "isBlock": false
  },
  {
    "name": "user",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#user",
    "syntax": "user user [group];",
    "default": "user nobody nobody;",
    "contexts": [
      "main"
    ],
    "summary": "Defines user and group credentials used by worker processes. If group is omitted, a group whose name equals that of user is used.",
    "isBlock": false
  },
  {
    "name": "userid",
    "module": "ngx_http_userid_module",
    "scope": "http",
    "docPath": "http/ngx_http_userid_module.html#userid",
    "syntax": "userid on | v1 | log | off;",
    "default": "userid off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables setting cookies and logging the received cookies:",
    "isBlock": false
  },
  {
    "name": "userid_domain",
    "module": "ngx_http_userid_module",
    "scope": "http",
    "docPath": "http/ngx_http_userid_module.html#userid_domain",
    "syntax": "userid_domain name | none;",
    "default": "userid_domain none;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a domain for which the cookie is set. The none parameter disables setting of a domain for the cookie.",
    "isBlock": false
  },
  {
    "name": "userid_expires",
    "module": "ngx_http_userid_module",
    "scope": "http",
    "docPath": "http/ngx_http_userid_module.html#userid_expires",
    "syntax": "userid_expires time | max | off;",
    "default": "userid_expires off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a time during which a browser should keep the cookie. The parameter max will cause the cookie to expire on “31 Dec 2037 23:55:55 GMT”. The parameter off will cause the cookie to expire at the end of a browser ses...",
    "isBlock": false
  },
  {
    "name": "userid_flags",
    "module": "ngx_http_userid_module",
    "scope": "http",
    "docPath": "http/ngx_http_userid_module.html#userid_flags",
    "syntax": "userid_flags off | flag ...;",
    "default": "userid_flags off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If the parameter is not off, defines one or more additional flags for the cookie: secure, httponly, samesite=strict, samesite=lax, samesite=none.",
    "isBlock": false
  },
  {
    "name": "userid_mark",
    "module": "ngx_http_userid_module",
    "scope": "http",
    "docPath": "http/ngx_http_userid_module.html#userid_mark",
    "syntax": "userid_mark letter | digit | = | off;",
    "default": "userid_mark off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If the parameter is not off, enables the cookie marking mechanism and sets the character used as a mark. This mechanism is used to add or change userid_p3p and/or a cookie expiration time while preserving the client i...",
    "isBlock": false
  },
  {
    "name": "userid_name",
    "module": "ngx_http_userid_module",
    "scope": "http",
    "docPath": "http/ngx_http_userid_module.html#userid_name",
    "syntax": "userid_name name;",
    "default": "userid_name uid;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the cookie name.",
    "isBlock": false
  },
  {
    "name": "userid_p3p",
    "module": "ngx_http_userid_module",
    "scope": "http",
    "docPath": "http/ngx_http_userid_module.html#userid_p3p",
    "syntax": "userid_p3p string | none;",
    "default": "userid_p3p none;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a value for the “P3P” header field that will be sent along with the cookie. If the directive is set to the special value none, the “P3P” header will not be sent in a response.",
    "isBlock": false
  },
  {
    "name": "userid_path",
    "module": "ngx_http_userid_module",
    "scope": "http",
    "docPath": "http/ngx_http_userid_module.html#userid_path",
    "syntax": "userid_path path;",
    "default": "userid_path /;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a path for which the cookie is set.",
    "isBlock": false
  },
  {
    "name": "userid_service",
    "module": "ngx_http_userid_module",
    "scope": "http",
    "docPath": "http/ngx_http_userid_module.html#userid_service",
    "syntax": "userid_service number;",
    "default": "userid_service IP address of the server;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If identifiers are issued by multiple servers (services), each service should be assigned its own number to ensure that client identifiers are unique. For version 1 cookies, the default value is zero. For version 2 co...",
    "isBlock": false
  },
  {
    "name": "userinfo",
    "module": "ngx_http_oidc_module",
    "scope": "http",
    "docPath": "http/ngx_http_oidc_module.html#userinfo",
    "syntax": "userinfo on | off;",
    "default": "userinfo off;",
    "contexts": [
      "oidc_provider"
    ],
    "summary": "Enables downloading of the UserInfo data and makes UserInfo claims available via the $oidc_claim_name variables.",
    "isBlock": false
  },
  {
    "name": "uwsgi_allow_upstream",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_allow_upstream",
    "syntax": "uwsgi_allow_upstream string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which access to a uwsgi server is allowed or denied. If all string parameters are not empty and not equal to “0” then the access is allowed. The conditions are evaluated each time before a con...",
    "isBlock": false
  },
  {
    "name": "uwsgi_bind",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_bind",
    "syntax": "uwsgi_bind address [transparent] | off;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Makes outgoing connections to a uwsgi server originate from the specified local IP address with an optional port (1.11.2). Parameter value can contain variables (1.3.12). The special value off (1.3.12) cancels the eff...",
    "isBlock": false
  },
  {
    "name": "uwsgi_bind_dynamic",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_bind_dynamic",
    "syntax": "uwsgi_bind_dynamic on | off;",
    "default": "uwsgi_bind_dynamic off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When enabled, makes the bind operation at each connection attempt.",
    "isBlock": false
  },
  {
    "name": "uwsgi_buffer_size",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_buffer_size",
    "syntax": "uwsgi_buffer_size size;",
    "default": "uwsgi_buffer_size 4k|8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the size of the buffer used for reading the first part of the response received from the uwsgi server. This part usually contains a small response header; if it exceeds the buffer size, the response is considered...",
    "isBlock": false
  },
  {
    "name": "uwsgi_buffering",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_buffering",
    "syntax": "uwsgi_buffering on | off;",
    "default": "uwsgi_buffering on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables buffering of responses from the uwsgi server.",
    "isBlock": false
  },
  {
    "name": "uwsgi_buffers",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_buffers",
    "syntax": "uwsgi_buffers number size;",
    "default": "uwsgi_buffers 8 4k|8k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the number and size of the buffers used for reading a response from the uwsgi server, for a single connection. By default, the buffer size is equal to one memory page. This is either 4K or 8K, depending on a plat...",
    "isBlock": false
  },
  {
    "name": "uwsgi_busy_buffers_size",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_busy_buffers_size",
    "syntax": "uwsgi_busy_buffers_size size;",
    "default": "uwsgi_busy_buffers_size 8k|16k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When buffering of responses from the uwsgi server is enabled, limits the total size of buffers that can be busy sending a response to the client while the response is not yet fully read. In the meantime, the rest of t...",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache",
    "syntax": "uwsgi_cache zone | off;",
    "default": "uwsgi_cache off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a shared memory zone used for caching. The same zone can be used in several places. Parameter value can contain variables (1.7.9). The off parameter disables caching inherited from the previous configuration l...",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache_background_update",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache_background_update",
    "syntax": "uwsgi_cache_background_update on | off;",
    "default": "uwsgi_cache_background_update off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows starting a background subrequest to update an expired cache item, while a stale cached response is returned to the client. Note that it is necessary to allow the usage of a stale cached response when it is bein...",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache_bypass",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache_bypass",
    "syntax": "uwsgi_cache_bypass string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which the response will not be taken from a cache. If at least one value of the string parameters is not empty and is not equal to “0” then the response will not be taken from the cache:",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache_key",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache_key",
    "syntax": "uwsgi_cache_key string;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a key for caching, for example",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache_lock",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache_lock",
    "syntax": "uwsgi_cache_lock on | off;",
    "default": "uwsgi_cache_lock off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When enabled, only one request at a time will be allowed to populate a new cache element identified according to the uwsgi_cache_key directive by passing a request to a uwsgi server. Other requests of the same cache e...",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache_lock_age",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache_lock_age",
    "syntax": "uwsgi_cache_lock_age time;",
    "default": "uwsgi_cache_lock_age 5s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If the last request passed to the uwsgi server for populating a new cache element has not completed for the specified time, one more request may be passed to the uwsgi server.",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache_lock_timeout",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache_lock_timeout",
    "syntax": "uwsgi_cache_lock_timeout time;",
    "default": "uwsgi_cache_lock_timeout 5s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout for uwsgi_cache_lock. When the time expires, the request will be passed to the uwsgi server, however, the response will not be cached.",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache_max_range_offset",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache_max_range_offset",
    "syntax": "uwsgi_cache_max_range_offset number;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets an offset in bytes for byte-range requests. If the range is beyond the offset, the range request will be passed to the uwsgi server and the response will not be cached.",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache_methods",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache_methods",
    "syntax": "uwsgi_cache_methods GET | HEAD | POST ...;",
    "default": "uwsgi_cache_methods GET HEAD;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "If the client request method is listed in this directive then the response will be cached. “GET” and “HEAD” methods are always added to the list, though it is recommended to specify them explicitly. See also the uwsgi...",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache_min_uses",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache_min_uses",
    "syntax": "uwsgi_cache_min_uses number;",
    "default": "uwsgi_cache_min_uses 1;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the number of requests after which the response will be cached.",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache_path",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache_path",
    "syntax": "uwsgi_cache_path path [levels=levels] [use_temp_path=on|off] keys_zone=name:size [inactive=time] [max_size=size] [min_free=size] [manager_files=number] [manager_sleep=time] [manager_threshold=time] [loader_files=number] [loader_sleep=time] [loader_threshold=time] [purger=on|off] [purger_files=number] [purger_sleep=time] [purger_threshold=time];",
    "default": "—",
    "contexts": [
      "http"
    ],
    "summary": "Sets the path and other parameters of a cache. Cache data are stored in files. The file name in a cache is a result of applying the MD5 function to the cache key. The levels parameter defines hierarchy levels of a cac...",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache_purge",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache_purge",
    "syntax": "uwsgi_cache_purge string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which the request will be considered a cache purge request. If at least one value of the string parameters is not empty and is not equal to “0” then the cache entry with a corresponding cache...",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache_revalidate",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache_revalidate",
    "syntax": "uwsgi_cache_revalidate on | off;",
    "default": "uwsgi_cache_revalidate off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables revalidation of expired cache items using conditional requests with the “If-Modified-Since” and “If-None-Match” header fields.",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache_use_stale",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache_use_stale",
    "syntax": "uwsgi_cache_use_stale error | timeout | invalid_header | updating | http_500 | http_503 | http_403 | http_404 | http_429 | off ...;",
    "default": "uwsgi_cache_use_stale off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines in which cases a stale cached response can be used when an error occurs during communication with the uwsgi server. The directive’s parameters match the parameters of the uwsgi_next_upstream directive.",
    "isBlock": false
  },
  {
    "name": "uwsgi_cache_valid",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_cache_valid",
    "syntax": "uwsgi_cache_valid [code ...] time;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets caching time for different response codes. For example, the following directives",
    "isBlock": false
  },
  {
    "name": "uwsgi_connect_timeout",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_connect_timeout",
    "syntax": "uwsgi_connect_timeout time;",
    "default": "uwsgi_connect_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for establishing a connection with a uwsgi server. It should be noted that this timeout cannot usually exceed 75 seconds.",
    "isBlock": false
  },
  {
    "name": "uwsgi_force_ranges",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_force_ranges",
    "syntax": "uwsgi_force_ranges on | off;",
    "default": "uwsgi_force_ranges off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables byte-range support for both cached and uncached responses from the uwsgi server regardless of the “Accept-Ranges” field in these responses.",
    "isBlock": false
  },
  {
    "name": "uwsgi_hide_header",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_hide_header",
    "syntax": "uwsgi_hide_header field;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "By default, nginx does not pass the header fields “Status” and “X-Accel-...” from the response of a uwsgi server to a client. The uwsgi_hide_header directive sets additional fields that will not be passed. If, on the...",
    "isBlock": false
  },
  {
    "name": "uwsgi_ignore_client_abort",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ignore_client_abort",
    "syntax": "uwsgi_ignore_client_abort on | off;",
    "default": "uwsgi_ignore_client_abort off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether the connection with a uwsgi server should be closed when a client closes the connection without waiting for a response.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ignore_headers",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ignore_headers",
    "syntax": "uwsgi_ignore_headers field ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Disables processing of certain response header fields from the uwsgi server. The following fields can be ignored: “X-Accel-Redirect”, “X-Accel-Expires”, “X-Accel-Limit-Rate” (1.1.6), “X-Accel-Buffering” (1.1.6), “X-Ac...",
    "isBlock": false
  },
  {
    "name": "uwsgi_intercept_errors",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_intercept_errors",
    "syntax": "uwsgi_intercept_errors on | off;",
    "default": "uwsgi_intercept_errors off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether a uwsgi server responses with codes greater than or equal to 300 should be passed to a client or be intercepted and redirected to nginx for processing with the error_page directive.",
    "isBlock": false
  },
  {
    "name": "uwsgi_limit_rate",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_limit_rate",
    "syntax": "uwsgi_limit_rate rate;",
    "default": "uwsgi_limit_rate 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the speed of reading the response from the uwsgi server. The rate is specified in bytes per second. The zero value disables rate limiting. The limit is set per a request, and so if nginx simultaneously opens tw...",
    "isBlock": false
  },
  {
    "name": "uwsgi_max_temp_file_size",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_max_temp_file_size",
    "syntax": "uwsgi_max_temp_file_size size;",
    "default": "uwsgi_max_temp_file_size 1024m;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "When buffering of responses from the uwsgi server is enabled, and the whole response does not fit into the buffers set by the uwsgi_buffer_size and uwsgi_buffers directives, a part of the response can be saved to a te...",
    "isBlock": false
  },
  {
    "name": "uwsgi_modifier1",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_modifier1",
    "syntax": "uwsgi_modifier1 number;",
    "default": "uwsgi_modifier1 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the value of the modifier1 field in the uwsgi packet header.",
    "isBlock": false
  },
  {
    "name": "uwsgi_modifier2",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_modifier2",
    "syntax": "uwsgi_modifier2 number;",
    "default": "uwsgi_modifier2 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the value of the modifier2 field in the uwsgi packet header.",
    "isBlock": false
  },
  {
    "name": "uwsgi_next_upstream",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_next_upstream",
    "syntax": "uwsgi_next_upstream error | timeout | denied | invalid_header | http_500 | http_503 | http_403 | http_404 | http_429 | non_idempotent | off ...;",
    "default": "uwsgi_next_upstream error timeout;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies in which cases a request should be passed to the next server:",
    "isBlock": false
  },
  {
    "name": "uwsgi_next_upstream_timeout",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_next_upstream_timeout",
    "syntax": "uwsgi_next_upstream_timeout time;",
    "default": "uwsgi_next_upstream_timeout 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the time during which a request can be passed to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "uwsgi_next_upstream_tries",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_next_upstream_tries",
    "syntax": "uwsgi_next_upstream_tries number;",
    "default": "uwsgi_next_upstream_tries 0;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the number of possible tries for passing a request to the next server. The 0 value turns off this limitation.",
    "isBlock": false
  },
  {
    "name": "uwsgi_no_cache",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_no_cache",
    "syntax": "uwsgi_no_cache string ...;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines conditions under which the response will not be saved to a cache. If at least one value of the string parameters is not empty and is not equal to “0” then the response will not be saved:",
    "isBlock": false
  },
  {
    "name": "uwsgi_param",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_param",
    "syntax": "uwsgi_param parameter value [if_not_empty];",
    "default": "uwsgi_param HTTP_HOST $host$is_request_port$request_port;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a parameter that should be passed to the uwsgi server. The value can contain text, variables, and their combination. These directives are inherited from the previous configuration level if and only if there are n...",
    "isBlock": false
  },
  {
    "name": "uwsgi_pass",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_pass",
    "syntax": "uwsgi_pass [protocol://]address;",
    "default": "—",
    "contexts": [
      "location",
      "if in location"
    ],
    "summary": "Sets the protocol and address of a uwsgi server. As a protocol, “uwsgi” or “suwsgi” (secured uwsgi, uwsgi over SSL) can be specified. The address can be specified as a domain name or IP address, and a port:",
    "isBlock": false
  },
  {
    "name": "uwsgi_pass_header",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_pass_header",
    "syntax": "uwsgi_pass_header field;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Permits passing otherwise disabled header fields from a uwsgi server to a client.",
    "isBlock": false
  },
  {
    "name": "uwsgi_pass_request_body",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_pass_request_body",
    "syntax": "uwsgi_pass_request_body on | off;",
    "default": "uwsgi_pass_request_body on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Indicates whether the original request body is passed to the uwsgi server. See also the uwsgi_pass_request_headers directive.",
    "isBlock": false
  },
  {
    "name": "uwsgi_pass_request_headers",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_pass_request_headers",
    "syntax": "uwsgi_pass_request_headers on | off;",
    "default": "uwsgi_pass_request_headers on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Indicates whether the header fields of the original request are passed to the uwsgi server. See also the uwsgi_pass_request_body directive.",
    "isBlock": false
  },
  {
    "name": "uwsgi_read_timeout",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_read_timeout",
    "syntax": "uwsgi_read_timeout time;",
    "default": "uwsgi_read_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a timeout for reading a response from the uwsgi server. The timeout is set only between two successive read operations, not for the transmission of the whole response. If the uwsgi server does not transmit any...",
    "isBlock": false
  },
  {
    "name": "uwsgi_request_buffering",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_request_buffering",
    "syntax": "uwsgi_request_buffering on | off;",
    "default": "uwsgi_request_buffering on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables buffering of a client request body.",
    "isBlock": false
  },
  {
    "name": "uwsgi_request_dynamic",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_request_dynamic",
    "syntax": "uwsgi_request_dynamic on | off;",
    "default": "uwsgi_request_dynamic off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables creation of a separate request instance for each uwsgi server. By default, a single request is used for all uwsgi servers. If enabled, a separate request instance is created, allowing per-server re...",
    "isBlock": false
  },
  {
    "name": "uwsgi_send_timeout",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_send_timeout",
    "syntax": "uwsgi_send_timeout time;",
    "default": "uwsgi_send_timeout 60s;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets a timeout for transmitting a request to the uwsgi server. The timeout is set only between two successive write operations, not for the transmission of the whole request. If the uwsgi server does not receive anyth...",
    "isBlock": false
  },
  {
    "name": "uwsgi_socket_keepalive",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_socket_keepalive",
    "syntax": "uwsgi_socket_keepalive on | off;",
    "default": "uwsgi_socket_keepalive off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Configures the “TCP keepalive” behavior for outgoing connections to a uwsgi server. By default, the operating system’s settings are in effect for the socket. If the directive is set to the value “on”, the SO_KEEPALIVE...",
    "isBlock": false
  },
  {
    "name": "uwsgi_socket_rcvbuf",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_socket_rcvbuf",
    "syntax": "uwsgi_socket_rcvbuf size;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the receive buffer size (the SO_RCVBUF option) for outgoing connections to a uwsgi server. The special value 0 cancels the effect of the uwsgi_socket_rcvbuf directive inherited from the previous configuration lev...",
    "isBlock": false
  },
  {
    "name": "uwsgi_socket_sndbuf",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_socket_sndbuf",
    "syntax": "uwsgi_socket_sndbuf size;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the send buffer size (the SO_SNDBUF option) for outgoing connections to a uwsgi server. The special value 0 cancels the effect of the uwsgi_socket_sndbuf directive inherited from the previous configuration level,...",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_certificate",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_certificate",
    "syntax": "uwsgi_ssl_certificate file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with the certificate in the PEM format used for authentication to a secured uwsgi server.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_certificate_cache",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_certificate_cache",
    "syntax": "uwsgi_ssl_certificate_cache off;  |  uwsgi_ssl_certificate_cache max=N [inactive=time] [valid=time];",
    "default": "uwsgi_ssl_certificate_cache off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a cache that stores SSL certificates and secret keys specified with variables.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_certificate_key",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_certificate_key",
    "syntax": "uwsgi_ssl_certificate_key file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with the secret key in the PEM format used for authentication to a secured uwsgi server.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_ciphers",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_ciphers",
    "syntax": "uwsgi_ssl_ciphers ciphers;",
    "default": "uwsgi_ssl_ciphers DEFAULT;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies the enabled ciphers for requests to a secured uwsgi server. The ciphers are specified in the format understood by the OpenSSL library.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_conf_command",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_conf_command",
    "syntax": "uwsgi_ssl_conf_command name value;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets arbitrary OpenSSL configuration commands when establishing a connection with the secured uwsgi server.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_crl",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_crl",
    "syntax": "uwsgi_ssl_crl file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with revoked certificates (CRL) in the PEM format used to verify the certificate of the secured uwsgi server. When using intermediate certificates, their CRLs should be specified in the same file.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_key_log",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_key_log",
    "syntax": "uwsgi_ssl_key_log path;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables logging of secured uwsgi server connection SSL keys and specifies the path to the key log file. Keys are logged in the SSLKEYLOGFILE format compatible with Wireshark.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_name",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_name",
    "syntax": "uwsgi_ssl_name name;",
    "default": "uwsgi_ssl_name host from uwsgi_pass;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows overriding the server name used to verify the certificate of the secured uwsgi server and to be passed through SNI when establishing a connection with the secured uwsgi server.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_password_file",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_password_file",
    "syntax": "uwsgi_ssl_password_file file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with passphrases for secret keys where each passphrase is specified on a separate line. Passphrases are tried in turn when loading the key.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_protocols",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_protocols",
    "syntax": "uwsgi_ssl_protocols [SSLv2] [SSLv3] [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];",
    "default": "uwsgi_ssl_protocols TLSv1.2 TLSv1.3;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables the specified protocols for requests to a secured uwsgi server.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_server_name",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_server_name",
    "syntax": "uwsgi_ssl_server_name on | off;",
    "default": "uwsgi_ssl_server_name off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables passing of the server name through TLS Server Name Indication extension (SNI, RFC 6066) when establishing a connection with the secured uwsgi server.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_session_reuse",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_session_reuse",
    "syntax": "uwsgi_ssl_session_reuse on | off;",
    "default": "uwsgi_ssl_session_reuse on;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Determines whether SSL sessions can be reused when working with a secured uwsgi server. If the errors “digest check failed” appear in the logs, try disabling session reuse.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_trusted_certificate",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_trusted_certificate",
    "syntax": "uwsgi_ssl_trusted_certificate file;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify the certificate of the secured uwsgi server.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_verify",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_verify",
    "syntax": "uwsgi_ssl_verify on | off;",
    "default": "uwsgi_ssl_verify off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables verification of the secured uwsgi server certificate.",
    "isBlock": false
  },
  {
    "name": "uwsgi_ssl_verify_depth",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_ssl_verify_depth",
    "syntax": "uwsgi_ssl_verify_depth number;",
    "default": "uwsgi_ssl_verify_depth 1;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets the verification depth in the secured uwsgi server certificates chain.",
    "isBlock": false
  },
  {
    "name": "uwsgi_store",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_store",
    "syntax": "uwsgi_store on | off | string;",
    "default": "uwsgi_store off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables saving of files to a disk. The on parameter saves files with paths corresponding to the directives alias or root. The off parameter disables saving of files. In addition, the file name can be set explicitly us...",
    "isBlock": false
  },
  {
    "name": "uwsgi_store_access",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_store_access",
    "syntax": "uwsgi_store_access users:permissions ...;",
    "default": "uwsgi_store_access user:rw;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Sets access permissions for newly created files and directories, e.g.:",
    "isBlock": false
  },
  {
    "name": "uwsgi_temp_file_write_size",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_temp_file_write_size",
    "syntax": "uwsgi_temp_file_write_size size;",
    "default": "uwsgi_temp_file_write_size 8k|16k;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Limits the size of data written to a temporary file at a time, when buffering of responses from the uwsgi server to temporary files is enabled. By default, size is limited by two buffers set by the uwsgi_buffer_size a...",
    "isBlock": false
  },
  {
    "name": "uwsgi_temp_path",
    "module": "ngx_http_uwsgi_module",
    "scope": "http",
    "docPath": "http/ngx_http_uwsgi_module.html#uwsgi_temp_path",
    "syntax": "uwsgi_temp_path path [level1 [level2 [level3]]];",
    "default": "uwsgi_temp_path uwsgi_temp;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines a directory for storing temporary files with data received from uwsgi servers. Up to three-level subdirectory hierarchy can be used underneath the specified directory. For example, in the following configuration",
    "isBlock": false
  },
  {
    "name": "valid_referers",
    "module": "ngx_http_referer_module",
    "scope": "http",
    "docPath": "http/ngx_http_referer_module.html#valid_referers",
    "syntax": "valid_referers none | blocked | server_names | string ...;",
    "default": "—",
    "contexts": [
      "server",
      "location"
    ],
    "summary": "Specifies the “Referer” request header field values that will cause the embedded $invalid_referer variable to be set to an empty string. Otherwise, the variable will be set to “1”. Search for a match is case-insensitive.",
    "isBlock": false
  },
  {
    "name": "variables_hash_bucket_size",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#variables_hash_bucket_size",
    "syntax": "variables_hash_bucket_size size;",
    "default": "variables_hash_bucket_size 64;",
    "contexts": [
      "http"
    ],
    "summary": "Sets the bucket size for the variables hash table. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "variables_hash_bucket_size",
    "module": "ngx_stream_core_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_core_module.html#variables_hash_bucket_size",
    "syntax": "variables_hash_bucket_size size;",
    "default": "variables_hash_bucket_size 64;",
    "contexts": [
      "stream"
    ],
    "summary": "Sets the bucket size for the variables hash table. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "variables_hash_max_size",
    "module": "ngx_http_core_module",
    "scope": "http",
    "docPath": "http/ngx_http_core_module.html#variables_hash_max_size",
    "syntax": "variables_hash_max_size size;",
    "default": "variables_hash_max_size 1024;",
    "contexts": [
      "http"
    ],
    "summary": "Sets the maximum size of the variables hash table. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "variables_hash_max_size",
    "module": "ngx_stream_core_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_core_module.html#variables_hash_max_size",
    "syntax": "variables_hash_max_size size;",
    "default": "variables_hash_max_size 1024;",
    "contexts": [
      "stream"
    ],
    "summary": "Sets the maximum size of the variables hash table. The details of setting up hash tables are provided in a separate document.",
    "isBlock": false
  },
  {
    "name": "worker_aio_requests",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#worker_aio_requests",
    "syntax": "worker_aio_requests number;",
    "default": "worker_aio_requests 32;",
    "contexts": [
      "events"
    ],
    "summary": "When using aio with the epoll connection processing method, sets the maximum number of outstanding asynchronous I/O operations for a single worker process.",
    "isBlock": false
  },
  {
    "name": "worker_connections",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#worker_connections",
    "syntax": "worker_connections number;",
    "default": "worker_connections 512;",
    "contexts": [
      "events"
    ],
    "summary": "Sets the maximum number of simultaneous connections that can be opened by a worker process.",
    "isBlock": false
  },
  {
    "name": "worker_cpu_affinity",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#worker_cpu_affinity",
    "syntax": "worker_cpu_affinity cpumask ...;  |  worker_cpu_affinity auto [cpumask];",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Binds worker processes to the sets of CPUs. Each CPU set is represented by a bitmask of allowed CPUs. There should be a separate set defined for each of the worker processes. By default, worker processes are not bound...",
    "isBlock": false
  },
  {
    "name": "worker_priority",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#worker_priority",
    "syntax": "worker_priority number;",
    "default": "worker_priority 0;",
    "contexts": [
      "main"
    ],
    "summary": "Defines the scheduling priority for worker processes like it is done by the nice command: a negative number means higher priority. Allowed range normally varies from -20 to 20.",
    "isBlock": false
  },
  {
    "name": "worker_processes",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#worker_processes",
    "syntax": "worker_processes number | auto;",
    "default": "worker_processes 1;",
    "contexts": [
      "main"
    ],
    "summary": "Defines the number of worker processes.",
    "isBlock": false
  },
  {
    "name": "worker_rlimit_core",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#worker_rlimit_core",
    "syntax": "worker_rlimit_core size;",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Changes the limit on the largest size of a core file (RLIMIT_CORE) for worker processes. Used to increase the limit without restarting the main process.",
    "isBlock": false
  },
  {
    "name": "worker_rlimit_nofile",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#worker_rlimit_nofile",
    "syntax": "worker_rlimit_nofile number;",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Changes the limit on the maximum number of open files (RLIMIT_NOFILE) for worker processes. Used to increase the limit without restarting the main process.",
    "isBlock": false
  },
  {
    "name": "worker_shutdown_timeout",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#worker_shutdown_timeout",
    "syntax": "worker_shutdown_timeout time;",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Configures a timeout for a graceful shutdown of worker processes. When the time expires, nginx will try to close all the connections currently open to facilitate shutdown.",
    "isBlock": false
  },
  {
    "name": "working_directory",
    "module": "ngx_core_module",
    "scope": "core",
    "docPath": "ngx_core_module.html#working_directory",
    "syntax": "working_directory directory;",
    "default": "—",
    "contexts": [
      "main"
    ],
    "summary": "Defines the current working directory for a worker process. It is primarily used when writing a core-file, in which case a worker process should have write permission for the specified directory.",
    "isBlock": false
  },
  {
    "name": "xclient",
    "module": "ngx_mail_proxy_module",
    "scope": "mail",
    "docPath": "mail/ngx_mail_proxy_module.html#xclient",
    "syntax": "xclient on | off;",
    "default": "xclient on;",
    "contexts": [
      "mail",
      "server"
    ],
    "summary": "Enables or disables the passing of the XCLIENT command with client parameters when connecting to the SMTP backend.",
    "isBlock": false
  },
  {
    "name": "xml_entities",
    "module": "ngx_http_xslt_module",
    "scope": "http",
    "docPath": "http/ngx_http_xslt_module.html#xml_entities",
    "syntax": "xml_entities path;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Specifies the DTD file that declares character entities. This file is compiled at the configuration stage. For technical reasons, the module is unable to use the external subset declared in the processed XML, so it is...",
    "isBlock": false
  },
  {
    "name": "xml_external_entities",
    "module": "ngx_http_xslt_module",
    "scope": "http",
    "docPath": "http/ngx_http_xslt_module.html#xml_external_entities",
    "syntax": "xml_external_entities on | off;",
    "default": "xml_external_entities off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables or disables loading of external entities declared in the internal DTD subset of the processed XML. Only loading of file-based external entities is supported.",
    "isBlock": false
  },
  {
    "name": "xslt_last_modified",
    "module": "ngx_http_xslt_module",
    "scope": "http",
    "docPath": "http/ngx_http_xslt_module.html#xslt_last_modified",
    "syntax": "xslt_last_modified on | off;",
    "default": "xslt_last_modified off;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Allows preserving the “Last-Modified” header field from the original response during XSLT transformations to facilitate response caching.",
    "isBlock": false
  },
  {
    "name": "xslt_param",
    "module": "ngx_http_xslt_module",
    "scope": "http",
    "docPath": "http/ngx_http_xslt_module.html#xslt_param",
    "syntax": "xslt_param parameter value;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines the parameters for XSLT stylesheets. The value is treated as an XPath expression. The value can contain variables. To pass a string value to a stylesheet, the xslt_string_param directive can be used.",
    "isBlock": false
  },
  {
    "name": "xslt_string_param",
    "module": "ngx_http_xslt_module",
    "scope": "http",
    "docPath": "http/ngx_http_xslt_module.html#xslt_string_param",
    "syntax": "xslt_string_param parameter value;",
    "default": "—",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Defines the string parameters for XSLT stylesheets. XPath expressions in the value are not interpreted. The value can contain variables.",
    "isBlock": false
  },
  {
    "name": "xslt_stylesheet",
    "module": "ngx_http_xslt_module",
    "scope": "http",
    "docPath": "http/ngx_http_xslt_module.html#xslt_stylesheet",
    "syntax": "xslt_stylesheet stylesheet [parameter=value ...];",
    "default": "—",
    "contexts": [
      "location"
    ],
    "summary": "Defines the XSLT stylesheet and its optional parameters. A stylesheet is compiled at the configuration stage.",
    "isBlock": false
  },
  {
    "name": "xslt_types",
    "module": "ngx_http_xslt_module",
    "scope": "http",
    "docPath": "http/ngx_http_xslt_module.html#xslt_types",
    "syntax": "xslt_types mime-type ...;",
    "default": "xslt_types text/xml;",
    "contexts": [
      "http",
      "server",
      "location"
    ],
    "summary": "Enables transformations in responses with the specified MIME types in addition to “text/xml”. The special value “*” matches any MIME type (0.8.29). If the transformation result is an HTML response, its MIME type is ch...",
    "isBlock": false
  },
  {
    "name": "zone",
    "module": "ngx_http_upstream_module",
    "scope": "http",
    "docPath": "http/ngx_http_upstream_module.html#zone",
    "syntax": "zone name [size];",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Defines the name and size of the shared memory zone that keeps the group’s configuration and run-time state that are shared between worker processes. Several groups may share the same zone. In this case, it is enough...",
    "isBlock": false
  },
  {
    "name": "zone",
    "module": "ngx_stream_upstream_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_upstream_module.html#zone",
    "syntax": "zone name [size];",
    "default": "—",
    "contexts": [
      "upstream"
    ],
    "summary": "Defines the name and size of the shared memory zone that keeps the group’s configuration and run-time state that are shared between worker processes. Several groups may share the same zone. In this case, it is enough...",
    "isBlock": false
  },
  {
    "name": "zone_sync",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync",
    "syntax": "zone_sync;",
    "default": "—",
    "contexts": [
      "server"
    ],
    "summary": "Enables the synchronization of shared memory zones between cluster nodes. Cluster nodes are defined using zone_sync_server directives.",
    "isBlock": false
  },
  {
    "name": "zone_sync_buffers",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_buffers",
    "syntax": "zone_sync_buffers number size;",
    "default": "zone_sync_buffers 8 4k|8k;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the number and size of the per-zone buffers used for pushing zone contents. By default, the buffer size is equal to one memory page. This is either 4K or 8K, depending on a platform.",
    "isBlock": false
  },
  {
    "name": "zone_sync_connect_retry_interval",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_connect_retry_interval",
    "syntax": "zone_sync_connect_retry_interval time;",
    "default": "zone_sync_connect_retry_interval 1s;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Defines an interval between connection attempts to another cluster node.",
    "isBlock": false
  },
  {
    "name": "zone_sync_connect_timeout",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_connect_timeout",
    "syntax": "zone_sync_connect_timeout time;",
    "default": "zone_sync_connect_timeout 5s;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Defines a timeout for establishing a connection with another cluster node.",
    "isBlock": false
  },
  {
    "name": "zone_sync_interval",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_interval",
    "syntax": "zone_sync_interval time;",
    "default": "zone_sync_interval 1s;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Defines an interval for polling updates in a shared memory zone.",
    "isBlock": false
  },
  {
    "name": "zone_sync_recv_buffer_size",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_recv_buffer_size",
    "syntax": "zone_sync_recv_buffer_size size;",
    "default": "zone_sync_recv_buffer_size 4k|8k;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets size of a per-connection receive buffer used to parse incoming stream of synchronization messages. The buffer size must be equal or greater than one of the zone_sync_buffers. By default, the buffer size is equal...",
    "isBlock": false
  },
  {
    "name": "zone_sync_server",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_server",
    "syntax": "zone_sync_server address [resolve];",
    "default": "—",
    "contexts": [
      "server"
    ],
    "summary": "Defines the address of a cluster node. The address can be specified as a domain name or IP address with a mandatory port, or as a UNIX-domain socket path specified after the “unix:” prefix. A domain name that resolves...",
    "isBlock": false
  },
  {
    "name": "zone_sync_ssl",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_ssl",
    "syntax": "zone_sync_ssl on | off;",
    "default": "zone_sync_ssl off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables the SSL/TLS protocol for connections to another cluster server.",
    "isBlock": false
  },
  {
    "name": "zone_sync_ssl_certificate",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_ssl_certificate",
    "syntax": "zone_sync_ssl_certificate file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with the certificate in the PEM format used for authentication to another cluster server.",
    "isBlock": false
  },
  {
    "name": "zone_sync_ssl_certificate_key",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_ssl_certificate_key",
    "syntax": "zone_sync_ssl_certificate_key file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with the secret key in the PEM format used for authentication to another cluster server.",
    "isBlock": false
  },
  {
    "name": "zone_sync_ssl_ciphers",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_ssl_ciphers",
    "syntax": "zone_sync_ssl_ciphers ciphers;",
    "default": "zone_sync_ssl_ciphers DEFAULT;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies the enabled ciphers for connections to another cluster server. The ciphers are specified in the format understood by the OpenSSL library.",
    "isBlock": false
  },
  {
    "name": "zone_sync_ssl_conf_command",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_ssl_conf_command",
    "syntax": "zone_sync_ssl_conf_command name value;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets arbitrary OpenSSL configuration commands when establishing a connection with another cluster server.",
    "isBlock": false
  },
  {
    "name": "zone_sync_ssl_crl",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_ssl_crl",
    "syntax": "zone_sync_ssl_crl file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with revoked certificates (CRL) in the PEM format used to verify the certificate of another cluster server. When using intermediate certificates, their CRLs should be specified in the same file.",
    "isBlock": false
  },
  {
    "name": "zone_sync_ssl_name",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_ssl_name",
    "syntax": "zone_sync_ssl_name name;",
    "default": "zone_sync_ssl_name host from zone_sync_server;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Allows overriding the server name used to verify the certificate of a cluster server and to be passed through SNI when establishing a connection with the cluster server.",
    "isBlock": false
  },
  {
    "name": "zone_sync_ssl_password_file",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_ssl_password_file",
    "syntax": "zone_sync_ssl_password_file file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with passphrases for secret keys where each passphrase is specified on a separate line. Passphrases are tried in turn when loading the key.",
    "isBlock": false
  },
  {
    "name": "zone_sync_ssl_protocols",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_ssl_protocols",
    "syntax": "zone_sync_ssl_protocols [SSLv2] [SSLv3] [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];",
    "default": "zone_sync_ssl_protocols TLSv1.2 TLSv1.3;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables the specified protocols for connections to another cluster server.",
    "isBlock": false
  },
  {
    "name": "zone_sync_ssl_server_name",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_ssl_server_name",
    "syntax": "zone_sync_ssl_server_name on | off;",
    "default": "zone_sync_ssl_server_name off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables or disables passing of the server name through TLS Server Name Indication extension (SNI, RFC 6066) when establishing a connection with another cluster server.",
    "isBlock": false
  },
  {
    "name": "zone_sync_ssl_trusted_certificate",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_ssl_trusted_certificate",
    "syntax": "zone_sync_ssl_trusted_certificate file;",
    "default": "—",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Specifies a file with trusted CA certificates in the PEM format used to verify the certificate of another cluster server.",
    "isBlock": false
  },
  {
    "name": "zone_sync_ssl_verify",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_ssl_verify",
    "syntax": "zone_sync_ssl_verify on | off;",
    "default": "zone_sync_ssl_verify off;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Enables or disables verification of another cluster server certificate.",
    "isBlock": false
  },
  {
    "name": "zone_sync_ssl_verify_depth",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_ssl_verify_depth",
    "syntax": "zone_sync_ssl_verify_depth number;",
    "default": "zone_sync_ssl_verify_depth 1;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the verification depth in another cluster server certificates chain.",
    "isBlock": false
  },
  {
    "name": "zone_sync_timeout",
    "module": "ngx_stream_zone_sync_module",
    "scope": "stream",
    "docPath": "stream/ngx_stream_zone_sync_module.html#zone_sync_timeout",
    "syntax": "zone_sync_timeout timeout;",
    "default": "zone_sync_timeout 5s;",
    "contexts": [
      "stream",
      "server"
    ],
    "summary": "Sets the timeout between two successive read or write operations on connection to another cluster node. If no data is transmitted within this time, the connection is closed.",
    "isBlock": false
  }
];
