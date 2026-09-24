# 需求购｜后端接口 & 数据库设计文档

> 
> 项目名称：需求购
> 业务定位：同城线下个人交易撮合平台，反向电商：买家发布需求，卖家主动报价接单；平台不触碰资金，只做信息撮合、信用记录
> 技术栈：Node.js + MySQL + Vue 前端页面
> 文档用途：约束后端接口、前后端入参出参、数据库表结构，开发直接使用

## 一、业务简述

1. 角色：普通用户（可发布需求）、供应用户（可报价接单，同一账号可切换）
2. 核心流程
   1. 用户注册 / 登录 → 发布同城求购需求（填写商品、预算区间、交易地点、期望交易时间、需求有效期）
   2. 供应者浏览同城需求，对需求提交报价
   3. 需求发布者查看多条报价，选择一位供应者达成意向
   4. 双方线下约定地点当面交易，当场验货
   5. 交易完成 / 爽约 → 双方确认，生成信用记录，更新用户履约统计
3. 重要约束：**平台不托管资金、不做押金；纠纷仅留存证据，生成信用档案**

## 二、数据库表设计（MySQL）

### 2.1 用户表 `user`

```
CREATE TABLE `user` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户主键ID',
  `phone` VARCHAR(20) NOT NULL COMMENT '手机号，登录账号',
  `nickname` VARCHAR(50) NOT NULL COMMENT '昵称',
  `avatar` VARCHAR(255) DEFAULT '' COMMENT '头像地址',
  `credit_score` INT NOT NULL DEFAULT 100 COMMENT '信用分初始100',
  `address_city` VARCHAR(32) DEFAULT '' COMMENT '常驻城市，用于同城筛选',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1正常 0禁用',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

### 2.2 需求表 `demand`

```
CREATE TABLE `demand` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '需求ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '发布人user.id',
  `title` VARCHAR(100) NOT NULL COMMENT '需求标题',
  `category` VARCHAR(50) NOT NULL COMMENT '商品分类：日用百货/数码电子等',
  `price_min` DECIMAL(10,2) DEFAULT NULL COMMENT '预算最低',
  `price_max` DECIMAL(10,2) DEFAULT NULL COMMENT '预算最高',
  `content` TEXT NOT NULL COMMENT '需求详细描述',
  `trade_location` VARCHAR(255) NOT NULL COMMENT '线下交易地点',
  `trade_time` VARCHAR(100) DEFAULT NULL COMMENT '期望交易时间段（文本）',
  `expire_time` DATETIME NOT NULL COMMENT '需求过期时间',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0待报价，1已选中供应，2交易完成，3需求取消，4需求过期',
  `city` VARCHAR(32) NOT NULL COMMENT '同城城市',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_city_status` (`city`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户需求表';
```

### 2.3 报价表 `offer`

```
CREATE TABLE `offer` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '报价ID',
  `demand_id` BIGINT UNSIGNED NOT NULL COMMENT '关联需求demand.id',
  `supply_user_id` BIGINT UNSIGNED NOT NULL COMMENT '供应者user.id',
  `offer_price` DECIMAL(10,2) NOT NULL COMMENT '报价金额',
  `remark` VARCHAR(255) DEFAULT '' COMMENT '报价备注，商品情况、可到场时间',
  `is_selected` TINYINT NOT NULL DEFAULT 0 COMMENT '0未选中，1被买家选中接单',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_demand_id` (`demand_id`),
  UNIQUE KEY `uk_demand_supply` (`demand_id`,`supply_user_id`) -- 同一供应不能对同一需求多次报价
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='供应报价表';
```

### 2.4 信用记录表 `credit_record`

```
CREATE TABLE `credit_record` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '被记录用户ID',
  `related_demand_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联需求单',
  `type` TINYINT NOT NULL COMMENT '1履约加分，2买家失信，3卖家商品问题失信',
  `desc` VARCHAR(255) NOT NULL COMMENT '记录说明',
  `evidence_img` VARCHAR(500) DEFAULT '' COMMENT '凭证图片url，逗号分隔多图',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='信用履约记录';
```

> 
> 统计字段说明：`deals`成交笔数、`noShow`爽约次数、`complaints`投诉次数，**不存入 user 表，接口查询实时 count 信用记录表计算**，保证数据一致性。

## 三、接口通用规范

1. 请求方式：`GET` 查询；`POST`新增；`PUT`修改；`DELETE`删除
2. 基础前缀：`/api/v1`
3. 请求头：`Authorization: Bearer {token}` 登录接口除外
4. 统一返回格式

```
{
  "code": 200,
  "msg": "success",
  "data": {}
}
```

- code：200 成功；401 未登录；403 无权限；404 资源不存在；500 服务器异常

5. 分页通用参数

> 
> 请求参数：`page=1, size=10`
> 返回分页：`{list:[], total, page, size}`

## 四、接口清单（核心接口）

### 1. 用户模块

#### 1.1 手机号登录 / 注册

`POST /api/v1/user/login`
请求

```
{
  "phone":"13800002917"
}
```

响应

```
{
  "code":200,
  "msg":"success",
  "data":{
    "token":"xxxx",
    "userInfo":{
      "id":1,
      "phone":"13800002917",
      "nickname":"用户_2917",
      "avatar":"",
      "credit_score":100
    }
  }
}
```

#### 1.2 获取用户履约统计（deals /noShow/complaints）

`GET /api/v1/user/stats`

> 
> 自动统计 credit_record 表数据
> 响应

```
{
  "code":200,
  "data":{
    "deals":12,
    "noShow":0,
    "complaints":0
  }
}
```

### 2. 需求模块（核心）

#### 2.1 发布需求

`POST /api/v1/demand/create`
请求

```
{
  "title":"家用不锈钢汤勺 2把",
  "category":"日用百货",
  "priceMin":15,
  "priceMax":22,
  "content":"全新，接受轻微划痕，不要替代款，要304不锈钢材质",
  "tradeLocation":"海淀田村地铁站A口",
  "tradeTime":"09-08 17:00-19:00",
  "expireHour":48,
  "city":"北京"
}
```

响应

```
{
  "code":200,
  "msg":"需求发布成功",
  "data":{
    "demandId":1
  }
}
```

#### 2.2 获取同城需求列表（供应者浏览）

`GET /api/v1/demand/list`
Query 参数
`city=北京&category=日用百货&page=1&size=10`

响应

```
{
  "code":200,
  "data":{
    "list":[
      {
        "id":1,
        "title":"家用不锈钢汤勺 2把",
        "category":"日用百货",
        "priceMin":15,
        "priceMax":22,
        "tradeLocation":"海淀田村地铁站A口",
        "tradeTime":"09-08 17:00-19:00",
        "status":0,
        "createAt":"2026-09-08 15:00:00",
        "expireTime":"2026-09-10 15:00:00",
        "user":{
          "name":"用户_2917",
          "deals":12,
          "noShow":0,
          "complaints":0
        }
      }
    ],
    "total":4,
    "page":1,
    "size":10
  }
}
```

#### 2.3 需求详情（包含当前所有报价）

`GET /api/v1/demand/detail/:demandId`
响应

```
{
  "code":200,
  "data":{
    "id":1,
    "title":"家用不锈钢汤勺 2把",
    "category":"日用百货",
    "priceMin":15,
    "priceMax":22,
    "content":"全新，接受轻微划痕，不要替代款，要304不锈钢材质",
    "tradeLocation":"海淀田村地铁站A口",
    "tradeTime":"09-08 17:00-19:00",
    "status":0,
    "user":{
      "name":"用户_2917",
      "deals":12,
      "noShow":0,
      "complaints":0
    },
    "offers":[
      {
        "id":1,
        "seller":"百货小铺",
        "offerPrice":18,
        "remark":"304不锈钢汤勺，全新带包装，可当场验货",
        "createAt":"2026-09-08 16:00:00",
        "deals":45,
        "noShow":1,
        "complaints":0
      }
    ]
  }
}
```

#### 2.4 买家选中报价（确定接单供应）

`PUT /api/v1/demand/selectOffer`
请求

```
{
  "demandId":1,
  "offerId":1
}
```

#### 2.5 取消需求

`PUT /api/v1/demand/cancel/:demandId`

### 3. 报价模块

#### 3.1 供应者提交报价

`POST /api/v1/offer/create`
请求

```
{
  "demandId":1,
  "offerPrice":18,
  "remark":"304不锈钢汤勺，全新带包装，可当场验货，17:30可到达"
}
```

#### 3.2 我的报价列表

`GET /api/v1/offer/myList`

### 4. 履约 & 信用模块

#### 4.1 交易确认（完成 / 爽约）

`POST /api/v1/credit/report`

```
{
  "demandId":1,
  "resultType":1, //1履约 2买家爽约 3卖家商品问题
  "desc":"按约定地点完成交易，商品符合描述",
  "evidenceImg":["url1","url2"]
}
```

#### 4.2 获取用户信用记录

`GET /api/v1/credit/list/:userId`

## 五、业务状态枚举

demand.status
0 = 待报价（开放中 open）
1 = 已选中供应（待线下交易）
2 = 交易完成
3 = 需求主动取消
4 = 需求过期自动关闭

credit_record.type
1 = 正常履约加分
2 = 买家失信（无故不到场）
3 = 卖家失信（货不对版、不到场）

## 六、Node 后端开发要点

1. 定时任务：Node.js 定时脚本，扫描`demand.expire_time`，自动把过期需求 status 改为 4
2. 权限控制：
   - 只有需求发布者可以查看全部报价、选中报价、取消需求
   - 供应者只能给自己提交报价，不能修改别人报价
3. 数据统计：deals/noShow/complaints 接口实时 count，不冗余存储
4. 图片上传：单独文件服务，仅存 url 入库
5. 安全：使用 mysql2 占位符，禁止字符串拼接 SQL，防止注入

## 七、可扩展规划（二期）

- 聊天私信接口（当前一期不做，先完成撮合 + 信用）
- 分类管理接口
- 消息通知（需求新报价推送）