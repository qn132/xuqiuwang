/**
 * 需求购后台 API 路由入口
 *
 * 该模块负责：
 * - 处理用户登录与鉴权
 * - 管理需求发布、列表、详情、取消等业务
 * - 管理报价、选中报价、信用记录等流程
 */
const crypto = require('crypto');
const express = require('express');
const { pool } = require('../../gongju/lianjieshujuku');

const router = express.Router();
const tokenSecret = process.env.TOKEN_SECRET || 'qiugouwang-development-secret';

// 统一响应封装：成功时返回 code=200，并附带 data 与 msg
const ok = (res, data = {}, msg = 'success') => res.json({ code: 200, msg, data });

// 统一失败响应封装：返回对应状态码与错误信息
const fail = (res, code, msg) => res.status(code).json({ code, msg, data: null });

/**
 * 生成 JWT 风格 token（这里使用自定义签名，不依赖第三方库）
 * 结构：payload.signature
 * payload 中包含 userId 和 exp（过期时间）
 */
function createToken(userId) {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 7 * 86400000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

/**
 * 校验 token，并确认未过期
 */
function parseToken(token) {
  try {
    const [payload, signature] = String(token || '').split('.');
    const expected = crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url');
    if (!payload || signature?.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() ? data : null;
  } catch (error) { return null; }
}

/**
 * 根据用户 ID 查询用户基础信息
 */
async function getUser(id) {
  const [rows] = await pool.query('SELECT * FROM `user` WHERE id = ? AND status = 1', [id]);
  return rows[0];
}

/**
 * 获取用户信用统计数据
 * deals: 成功交易数
 * noShow: 违约次数
 * complaints: 投诉记录数
 */
async function stats(userId) {
  const [rows] = await pool.query(`SELECT COALESCE(SUM(type = 1), 0) deals, COALESCE(SUM(type = 2), 0) noShow, COALESCE(SUM(type = 3), 0) complaints FROM credit_record WHERE user_id = ?`, [userId]);
  return rows[0];
}

/**
 * 鉴权中间件：校验 Authorization 头中的 Bearer token
 * 验证通过后，把当前用户挂载到 req.user
 */
function auth() {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
      const data = parseToken(token);
      if (!data) return fail(res, 401, '请先登录');
      req.user = await getUser(data.userId);
      if (!req.user) return fail(res, 401, '登录已失效');
      next();
    } catch (error) { next(error); }
  };
}

/**
 * 把字符串或空值标准化成数字，空值返回 null
 */
function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// 健康检查接口，便于部署和监控
router.get('/', (req, res) => ok(res, { service: '需求购后台' }));
router.get('/health', (req, res) => ok(res, { status: 'ok', timestamp: new Date().toISOString() }));

/**
 * 用户登录 / 注册接口
 * - 若手机号存在，则直接登录
 * - 若不存在，则自动注册一个新用户
 */
router.post('/api/v1/user/login', async (req, res, next) => {
  try {
    const phone = String(req.body.phone || '').trim();
    if (!/^1\d{10}$/.test(phone)) return fail(res, 400, '请输入正确的手机号');
    const [found] = await pool.query('SELECT * FROM `user` WHERE phone = ?', [phone]);
    let user = found[0];
    if (!user) {
      const [result] = await pool.query('INSERT INTO `user` (phone, nickname) VALUES (?, ?)', [phone, `用户_${phone.slice(-4)}`]);
      user = await getUser(result.insertId);
    }
    if (!user || user.status !== 1) return fail(res, 403, '账号已被禁用');
    return ok(res, { token: createToken(user.id), userInfo: user });
  } catch (error) { next(error); }
});

// 获取当前用户的信用统计
router.get('/api/v1/user/stats', auth(), async (req, res, next) => {
  try { return ok(res, await stats(req.user.id)); } catch (error) { next(error); }
});

/**
 * 需求发布接口
 * 接收：title, category, content, tradeLocation, tradeTime, city 等信息
 */
router.post('/api/v1/demand/create', auth(), async (req, res, next) => {
  try {
    const { title, category, content, tradeLocation, tradeTime, city } = req.body;
    const expireHour = Number(req.body.expireHour || 48);
    if (!title || !category || !content || !tradeLocation || !city || !Number.isFinite(expireHour) || expireHour <= 0) return fail(res, 400, '需求参数不完整');
    const [result] = await pool.query(`INSERT INTO demand (user_id, title, category, price_min, price_max, content, trade_location, trade_time, expire_time, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [req.user.id, title, category, numberOrNull(req.body.priceMin), numberOrNull(req.body.priceMax), content, tradeLocation, tradeTime || null, new Date(Date.now() + expireHour * 3600000), city]);
    return ok(res, { demandId: result.insertId }, '需求发布成功');
  } catch (error) { next(error); }
});

// 获取未关闭、未过期的需求列表，并支持城市/分类筛选
router.get('/api/v1/demand/list', auth(), async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const size = Math.min(Math.max(Number.parseInt(req.query.size, 10) || 10, 1), 100);
    const conditions = ['d.status = 0', 'd.expire_time > NOW()'];
    const params = [];
    if (req.query.city) { conditions.push('d.city = ?'); params.push(req.query.city); }
    if (req.query.category) { conditions.push('d.category = ?'); params.push(req.query.category); }
    const where = conditions.join(' AND ');
    const [count] = await pool.query(`SELECT COUNT(*) total FROM demand d WHERE ${where}`, params);
    const [rows] = await pool.query(`SELECT d.id, d.title, d.category, d.price_min priceMin, d.price_max priceMax, d.trade_location tradeLocation, d.trade_time tradeTime, d.status, d.create_time createAt, d.expire_time expireTime, (SELECT COUNT(*) FROM offer o WHERE o.demand_id = d.id) offerCount, u.nickname userName, u.id userId FROM demand d JOIN \`user\` u ON u.id = d.user_id WHERE ${where} ORDER BY d.create_time DESC LIMIT ? OFFSET ?`, [...params, size, (page - 1) * size]);
    const list = await Promise.all(rows.map(async ({ userName, userId, ...row }) => ({ ...row, user: { name: userName, ...(await stats(userId)) } })));
    return ok(res, { list, total: count[0].total, page, size });
  } catch (error) { next(error); }
});

// 获取单个需求详情，并附带报价信息与发布人信用数据
router.get('/api/v1/demand/detail/:demandId', auth(), async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT d.*, u.nickname userName FROM demand d JOIN \`user\` u ON u.id = d.user_id WHERE d.id = ?`, [req.params.demandId]);
    const demand = rows[0];
    if (!demand) return fail(res, 404, '需求不存在');
    const [offers] = await pool.query(`SELECT o.id, o.offer_price offerPrice, o.remark, o.is_selected isSelected, o.create_time createAt, u.nickname seller, u.id sellerId FROM offer o JOIN \`user\` u ON u.id = o.supply_user_id WHERE o.demand_id = ? ORDER BY o.create_time DESC`, [demand.id]);
    const selectedOffer = offers.find((offer) => offer.isSelected === 1);
    const offerList = await Promise.all(offers.map(async ({ sellerId, ...offer }) => ({ ...offer, ...(await stats(sellerId)) })));
    return ok(res, { id: demand.id, title: demand.title, category: demand.category, priceMin: demand.price_min, priceMax: demand.price_max, content: demand.content, tradeLocation: demand.trade_location, tradeTime: demand.trade_time, status: demand.status, expireTime: demand.expire_time, offerCount: offers.length, ownerId: demand.user_id, selectedSupplierId: selectedOffer?.sellerId ?? null, user: { name: demand.userName, ...(await stats(demand.user_id)) }, offers: req.user.id === demand.user_id ? offerList : [] });
  } catch (error) { next(error); }
});

// 获取当前用户发布过的需求列表
router.get('/api/v1/demand/myList', auth(), async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT d.id, d.title, d.category, d.price_min priceMin, d.price_max priceMax, d.trade_location tradeLocation, d.trade_time tradeTime, d.status, d.create_time createAt, d.expire_time expireTime FROM demand d WHERE d.user_id = ? ORDER BY d.create_time DESC`, [req.user.id]);
    return ok(res, { list: rows });
  } catch (error) { next(error); }
});

/**
 * 需求发布者选择某个报价作为成交方案
 * 使用事务保证“选中报价”和“需求状态更新”同时成功或同时失败
 */
router.put('/api/v1/demand/selectOffer', auth(), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [demands] = await connection.query('SELECT * FROM demand WHERE id = ? AND user_id = ? FOR UPDATE', [req.body.demandId, req.user.id]);
    const [offers] = await connection.query('SELECT * FROM offer WHERE id = ? AND demand_id = ?', [req.body.offerId, req.body.demandId]);
    if (!demands[0] || !offers[0] || demands[0].status !== 0) { await connection.rollback(); return fail(res, 400, '需求或报价不可用'); }
    await connection.query('UPDATE offer SET is_selected = (id = ?) WHERE demand_id = ?', [req.body.offerId, req.body.demandId]);
    await connection.query('UPDATE demand SET status = 1 WHERE id = ?', [req.body.demandId]);
    await connection.commit();
    return ok(res, {}, '已选中报价');
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
});

// 需求发布者取消未处理的需求
router.put('/api/v1/demand/cancel/:demandId', auth(), async (req, res, next) => {
  try {
    const [demands] = await pool.query('SELECT user_id, status FROM demand WHERE id = ?', [req.params.demandId]);
    const demand = demands[0];
    if (!demand) return fail(res, 404, '需求不存在');
    if (Number(demand.user_id) !== Number(req.user.id)) return fail(res, 403, '只有需求发布者可以取消需求');
    if (demand.status !== 0) return fail(res, 400, '需求不存在或不可取消');

    const [result] = await pool.query('UPDATE demand SET status = 3 WHERE id = ? AND user_id = ? AND status = 0', [req.params.demandId, req.user.id]);
    if (!result.affectedRows) return fail(res, 400, '需求不存在或不可取消');
    return ok(res, {}, '需求已取消');
  } catch (error) { next(error); }
});

/**
 * 供应者对某需求提交报价
 * 要求：需求必须未关闭且未过期；重复提交时更新自己的报价
 */
router.post('/api/v1/offer/create', auth(), async (req, res, next) => {
  try {
    const offerPrice = Number(req.body.offerPrice);
    if (!req.body.demandId || !Number.isFinite(offerPrice) || offerPrice < 0) return fail(res, 400, '报价参数不正确');
    const [demands] = await pool.query('SELECT id FROM demand WHERE id = ? AND status = 0 AND expire_time > NOW()', [req.body.demandId]);
    if (!demands[0]) return fail(res, 404, '需求不存在或已关闭');
    await pool.query(`INSERT INTO offer (demand_id, supply_user_id, offer_price, remark)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        offer_price = VALUES(offer_price),
        remark = VALUES(remark),
        update_time = CURRENT_TIMESTAMP`, [req.body.demandId, req.user.id, offerPrice, req.body.remark || '']);
    return ok(res, {}, '报价已提交');
  } catch (error) { next(error); }
});

// 获取当前用户所有报价记录
router.get('/api/v1/offer/myList', auth(), async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT o.id, o.demand_id demandId, o.offer_price offerPrice, o.remark, o.is_selected isSelected, o.create_time createAt, d.title, d.status FROM offer o JOIN demand d ON d.id = o.demand_id WHERE o.supply_user_id = ? ORDER BY o.create_time DESC`, [req.user.id]);
    return ok(res, { list: rows });
  } catch (error) { next(error); }
});

/**
 * 信用记录提交接口
 * resultType:
 * 1 = 交易完成确认（需求方和供应商都确认后，双方各增加一次成交）
 * 2 = 买家爽约
 * 3 = 供应者问题
 */
router.post('/api/v1/credit/report', auth(), async (req, res, next) => {
  try {
    const resultType = Number(req.body.resultType);
    if (![1, 2, 3].includes(resultType) || !req.body.demandId || !req.body.desc) return fail(res, 400, '信用记录参数不完整');
    const [demands] = await pool.query(`SELECT d.*, o.supply_user_id FROM demand d LEFT JOIN offer o ON o.demand_id = d.id AND o.is_selected = 1 WHERE d.id = ?`, [req.body.demandId]);
    const demand = demands[0];
    if (!demand || demand.status !== 1 || !demand.supply_user_id) return fail(res, 400, '当前需求还没有可确认的成交关系');
    const isBuyer = req.user.id === demand.user_id;
    const isSelectedSupplier = req.user.id === demand.supply_user_id;
    if (!isBuyer && !isSelectedSupplier) return fail(res, 403, '只有交易双方可以提交信用记录');
    if (resultType === 2 && !isSelectedSupplier) return fail(res, 403, '只有选中的供应者可以登记买家爽约');
    if (resultType === 3 && !isBuyer) return fail(res, 403, '只有需求发布者可以登记供应者问题');
    if (resultType === 1) {
      await pool.query('INSERT IGNORE INTO transaction_confirmation (demand_id, user_id) VALUES (?, ?)', [req.body.demandId, req.user.id]);
      const [confirmations] = await pool.query('SELECT user_id FROM transaction_confirmation WHERE demand_id = ?', [req.body.demandId]);
      const confirmedUserIds = confirmations.map((confirmation) => Number(confirmation.user_id));
      if (confirmedUserIds.includes(Number(demand.user_id)) && confirmedUserIds.includes(Number(demand.supply_user_id))) {
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();
          const [lockedDemands] = await connection.query('SELECT status FROM demand WHERE id = ? FOR UPDATE', [req.body.demandId]);
          if (lockedDemands[0]?.status === 1) {
            await connection.query('INSERT INTO credit_record (user_id, related_demand_id, type, `desc`, evidence_img) SELECT ?, ?, 1, ?, ? WHERE NOT EXISTS (SELECT 1 FROM credit_record WHERE user_id = ? AND related_demand_id = ? AND type = 1)', [demand.user_id, req.body.demandId, '作为需求方完成交易', '', demand.user_id, req.body.demandId]);
            await connection.query('INSERT INTO credit_record (user_id, related_demand_id, type, `desc`, evidence_img) SELECT ?, ?, 1, ?, ? WHERE NOT EXISTS (SELECT 1 FROM credit_record WHERE user_id = ? AND related_demand_id = ? AND type = 1)', [demand.supply_user_id, req.body.demandId, '作为供应商完成交易', '', demand.supply_user_id, req.body.demandId]);
            await connection.query('UPDATE demand SET status = 2 WHERE id = ?', [req.body.demandId]);
          }
          await connection.commit();
        } catch (error) {
          await connection.rollback();
          throw error;
        } finally { connection.release(); }
        return ok(res, { completed: true }, '双方已确认，交易完成');
      }
      return ok(res, { completed: false }, '已记录确认，等待另一方确认');
    }

    const targetUserId = resultType === 2 ? demand.user_id : demand.supply_user_id;
    await pool.query('INSERT INTO credit_record (user_id, related_demand_id, type, `desc`, evidence_img) VALUES (?, ?, ?, ?, ?)', [targetUserId, req.body.demandId, resultType, req.body.desc, Array.isArray(req.body.evidenceImg) ? req.body.evidenceImg.join(',') : '']);
    return ok(res, {}, '信用记录已保存');
  } catch (error) { next(error); }
});

// 获取某用户的信用记录列表
router.get('/api/v1/credit/list/:userId', auth(), async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, user_id userId, related_demand_id demandId, type, `desc`, evidence_img evidenceImg, create_time createAt FROM credit_record WHERE user_id = ? ORDER BY create_time DESC', [req.params.userId]);
    return ok(res, { list: rows });
  } catch (error) { next(error); }
});

// 全局错误处理器：统一捕获请求中发生的异常并返回 500
router.use((error, req, res, next) => { console.error('请求处理失败:', error); return fail(res, 500, '服务器异常'); });

module.exports = router;
