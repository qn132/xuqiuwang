# 需求购

需求购是一个同城线下需求撮合平台。买家发布求购信息，供应者浏览需求并报价，买家选定供应者后在线下完成交易；平台记录双方确认结果，并提供履约统计和信用档案。

平台当前只负责信息撮合和信用记录，不提供在线支付、资金托管或纠纷裁决。

## 功能概览

- 手机号登录或首次登录自动注册
- 按城市和分类浏览未关闭、未过期的求购需求
- 发布需求，设置分类、预算、地点、期望时间和有效期
- 供应者对需求报价；同一用户对同一需求只保留一条报价，可再次提交更新
- 需求发布者查看报价并选择供应者，或取消尚未处理的需求
- 买卖双方分别确认交易完成后，系统写入双方履约记录并完成需求
- 对爽约或供应商品问题登记信用记录
- 查看我的需求、我的报价、信用统计和信用记录

## 技术栈

| 部分 | 技术 |
| --- | --- |
| 前端 | React 19、TypeScript、Vite 8 |
| 后端 | Node.js、Express 5、CommonJS |
| 数据库 | MySQL、mysql2/promise |
| 登录鉴权 | 服务端 HMAC 签名 token，使用 Bearer 请求头 |

## 目录结构

```text
qiugouwang/
├── README.md
├── qiantai/                       # React 前端
│   ├── src/
│   │   ├── api/requestApi.ts       # API 请求封装与数据归一化
│   │   ├── components/            # 导航、列表、筛选和详情组件
│   │   ├── types/demand.ts        # 需求数据类型
│   │   ├── App.tsx                # 页面与主要业务流程
│   │   └── main.tsx               # 前端入口
│   ├── package.json
│   └── vite.config.ts              # 开发服务器和 API 代理
└── houtai/                         # Express 后端
      ├── gongju/lianjieshujuku.js    # MySQL 连接池与建表
      ├── src/routes/index.js         # API 路由和业务逻辑
      ├── server.js                  # 服务启动和过期需求扫描
      └── package.json
```

## 本地运行

### 环境要求

- Node.js（建议使用当前仍受支持的 LTS 版本）和 npm
- MySQL 8.x 或兼容版本

### 1. 创建数据库

服务启动时会自动创建所需数据表，但不会自动创建 MySQL 数据库。先登录 MySQL 执行：

```sql
CREATE DATABASE qiugouwang
   CHARACTER SET utf8mb4
   COLLATE utf8mb4_unicode_ci;
```

### 2. 配置并启动后端

在 `houtai` 目录创建 `.env` 文件。下面的值需按本机 MySQL 配置修改：

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=qiugouwang
DB_CONNECTION_LIMIT=10
TOKEN_SECRET=replace_with_a_long_random_secret
```

安装依赖并启动：

```bash
cd houtai
npm install
npm start
```

开发模式（文件变更后由 nodemon 重启）：

```bash
npm run dev
```

后端默认监听 `http://localhost:3000`。启动时会连接数据库并创建缺失的业务表；此后每分钟扫描一次，将已过期且仍处于待报价状态的需求标记为过期。

### 3. 启动前端

另开一个终端：

```bash
cd qiantai
npm install
npm run dev
```

打开 Vite 输出的本地地址，默认是 `http://localhost:5173`。开发服务器会把 `/api` 请求代理到 `http://localhost:3000`，因此默认配置下需同时启动后端。

生产构建与本地预览：

```bash
cd qiantai
npm run build
npm run preview
```

## 登录与接口约定

除登录、根路径和健康检查外，业务 API 都要求提供登录 token：

```http
Authorization: Bearer <token>
```

登录接口接受手机号；当前实现不发送短信验证码。首次使用的手机号会自动创建账号。token 有效期为 7 天，前端将 token 和用户信息保存在 `sessionStorage` 中。

业务接口返回 JSON 信封：

```json
{
   "code": 200,
   "msg": "success",
   "data": {}
}
```

失败时响应体中的 `code` 和 `msg` 描述错误；常见业务状态包括 400（参数或状态不符合要求）、401（未登录或登录失效）、403（无权操作）、404（资源不存在）和 500（服务器异常）。列表分页参数为 `page` 和 `size`。

## API 一览

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/` | 否 | 服务信息 |
| `GET` | `/health` | 否 | 健康检查 |
| `POST` | `/api/v1/user/login` | 否 | 手机号登录或自动注册 |
| `GET` | `/api/v1/user/stats` | 是 | 当前用户的成交、爽约和投诉统计 |
| `POST` | `/api/v1/demand/create` | 是 | 发布需求 |
| `GET` | `/api/v1/demand/list` | 是 | 查询需求；支持 `city`、`category`、`page`、`size` |
| `GET` | `/api/v1/demand/detail/:demandId` | 是 | 查询需求详情和报价 |
| `GET` | `/api/v1/demand/myList` | 是 | 当前用户发布的需求 |
| `PUT` | `/api/v1/demand/selectOffer` | 是 | 选择报价，JSON 参数为 `demandId`、`offerId` |
| `PUT` | `/api/v1/demand/cancel/:demandId` | 是 | 取消尚未处理的需求 |
| `POST` | `/api/v1/offer/create` | 是 | 提交或更新报价 |
| `GET` | `/api/v1/offer/myList` | 是 | 当前用户的报价 |
| `POST` | `/api/v1/credit/report` | 是 | 确认交易或提交信用记录 |
| `GET` | `/api/v1/credit/list/:userId` | 是 | 查询指定用户的信用记录 |

### 主要请求字段

发布需求 `POST /api/v1/demand/create`：

```json
{
   "title": "求购不锈钢汤勺",
   "category": "日用百货",
   "priceMin": 15,
   "priceMax": 22,
   "content": "希望是 304 不锈钢材质",
   "tradeLocation": "海淀区某地铁站",
   "tradeTime": "周六下午",
   "expireHour": 48,
   "city": "北京"
}
```

提交报价 `POST /api/v1/offer/create`：

```json
{
   "demandId": 1,
   "offerPrice": 20,
   "remark": "可在约定地点当面交易"
}
```

提交信用记录 `POST /api/v1/credit/report` 的 `resultType`：

| 值 | 含义 | 发起方 |
| --- | --- | --- |
| `1` | 确认交易完成；买卖双方都确认后记为完成 | 已选定的买家或供应者 |
| `2` | 登记买家爽约 | 已选定的供应者 |
| `3` | 登记供应者商品或履约问题 | 需求发布者 |

请求还需要提供 `demandId` 和 `desc`；`evidenceImg` 当前按图片地址数组接收并以逗号分隔保存，但项目尚未提供文件上传功能。

## 需求状态

| 值 | 状态 | 说明 |
| --- | --- | --- |
| `0` | 待报价 | 可显示在需求广场，可提交报价 |
| `1` | 已选供应 | 买家已选择报价，等待交易双方确认 |
| `2` | 已完成 | 双方确认交易完成 |
| `3` | 已取消 | 发布者取消需求 |
| `4` | 已过期 | 定时任务标记为过期 |

## 数据表

后端启动时通过 `houtai/gongju/lianjieshujuku.js` 创建以下表（若表不存在）：

| 表 | 用途 |
| --- | --- |
| `user` | 手机号、昵称、头像、信用分和账号状态 |
| `demand` | 需求内容、预算、地点、城市、状态和有效期 |
| `offer` | 供应者报价；`demand_id` 与 `supply_user_id` 组合唯一 |
| `credit_record` | 成交、买家爽约、供应者问题等信用记录 |
| `transaction_confirmation` | 记录需求双方对交易完成的确认；同一用户对同一需求只记录一次 |

`deals`、`noShow`、`complaints` 由 `credit_record.type` 实时汇总，不是 `user` 表中单独维护的统计列。

## 关键实现位置

- `qiantai/src/App.tsx`：登录态、导航、页面切换和发布需求弹窗
- `qiantai/src/api/requestApi.ts`：请求封装、鉴权头和响应数据归一化
- `qiantai/src/components/`：顶部栏、需求列表、分类筛选和需求详情
- `houtai/server.js`：启动 Express、初始化数据库、过期需求扫描
- `houtai/src/routes/index.js`：鉴权及全部业务 API
- `houtai/gongju/lianjieshujuku.js`：MySQL 连接池与表初始化

## 检查命令

后端语法检查：

```bash
cd houtai
npm test
```

前端 TypeScript 检查与生产构建：

```bash
cd qiantai
npm run build
```

## 当前范围与注意事项

- 项目是用于演示和开发练习的全栈原型，不是完整的线上交易系统。
- 不包含短信验证码、在线支付、订单资金托管、即时通讯或图片上传。
- 交易在线下完成；信用记录用于展示平台记录，不代表平台已仲裁争议。
- 默认 token 密钥仅适合本地开发；部署时必须通过 `TOKEN_SECRET` 设置独立随机密钥，并使用安全的数据库凭据。
- 正式上线前还应补充输入校验、速率限制、隐私保护、数据库迁移、日志与备份等生产级措施。
