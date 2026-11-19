date: 2026-11-19T08:06:47Z

## 1. /health
```
{"ok":false,"error":"not found"}
HTTP 404
```

## 2. /verify contract (extension POSTs {license})
```
{"ok":true,"valid":false,"plan":null}
HTTP 200
```

## 3. /verify bad json (expect ok:false 400)
```
{"ok":false,"error":"bad json"}
HTTP 400
```

## 4. B2 checkout page
```
HTTP 200 size=7501
price_7_present_count=1
powered by Paddle
```
