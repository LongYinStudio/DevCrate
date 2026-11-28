export interface JsonToTypesSample {
  id: string;
  labelKey: string;
  rootName: string;
  json: string;
}

export const JSON_TO_TYPES_SAMPLES: JsonToTypesSample[] = [
  {
    id: 'paginated-api',
    labelKey: 'tools.jsonToTypes.samples.paginatedApi',
    rootName: 'UserListResponse',
    json: `{
  "code": 0,
  "message": "ok",
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "hasNext": true
  },
  "items": [
    {
      "id": 1001,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "username": "alice",
      "email": "alice@example.com",
      "avatarUrl": "https://cdn.example.com/u/1001.png",
      "balance": 128.5,
      "roles": ["admin", "editor"],
      "lastLoginAt": "2026-11-28T09:15:30Z"
    },
    {
      "id": 1002,
      "uuid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "username": "bob",
      "email": null,
      "balance": 99,
      "roles": ["viewer"],
      "department": {
        "deptId": "eng-01",
        "name": "Platform"
      }
    }
  ]
}`,
  },
  {
    id: 'nested-order',
    labelKey: 'tools.jsonToTypes.samples.nestedOrder',
    rootName: 'OrderPayload',
    json: `{
  "order_id": "ORD-20261128-991",
  "type": "subscription",
  "amount": 299.9,
  "currency": "CNY",
  "headers": {
    "content-type": "application/json",
    "x-request-id": "req_98ab12"
  },
  "customer": {
    "userId": 8842,
    "tier": "pro",
    "verified": true
  },
  "lineItems": [
    { "sku": "PRO-YEAR", "qty": 1, "discount": 0.15 },
    { "sku": "ADDON-AI", "qty": 2, "couponCode": "DEV2026" }
  ]
}`,
  },
  {
    id: 'root-array',
    labelKey: 'tools.jsonToTypes.samples.rootArray',
    rootName: 'ReleaseAsset',
    json: `[
  {
    "id": 1,
    "name": "DevCrate_0.6.0_amd64.deb",
    "size": 18432910,
    "downloadUrl": "https://github.com/LongYinStudio/DevCrate/releases/download/v0.6.0/DevCrate.deb",
    "sha256": null,
    "createdAt": "2026-11-26T21:18:00Z"
  },
  {
    "id": 2,
    "name": "DevCrate_0.6.0_universal.dmg",
    "size": 21904120,
    "downloadUrl": "https://github.com/LongYinStudio/DevCrate/releases/download/v0.6.0/DevCrate.dmg",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb924",
    "prerelease": false,
    "createdAt": "2026-11-26T21:20:00Z"
  }
]`,
  },
];
