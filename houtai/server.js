/**
 * 需求购后台服务入口
 *
 * 作用：
 * 1. 创建 Express 应用
 * 2. 初始化数据库连接与表结构
 * 3. 注册所有 API 路由
 * 4. 启动定时任务，处理已过期的需求
 */
const express = require('express');

const { pool, connectDatabase, initializeDatabase } = require('./gongju/lianjieshujuku');
const routes = require('./src/routes');

// 创建 HTTP 服务实例
const app = express();
const port = Number(process.env.PORT) || 3000;

// 解析 JSON 请求体，便于接收前端提交的数据
app.use(express.json());

// 挂载所有业务路由
app.use(routes);

/**
 * 启动服务并完成初始化流程
 */
async function startServer() {
  // 1. 连接数据库
  await connectDatabase();

  // 2. 创建数据库表（如果不存在）
  await initializeDatabase();

  // 3. 定时扫描“已过期但仍未处理”的需求，并更新状态为 4
  setInterval(async () => {
    try {
      await pool.query('UPDATE demand SET status = 4 WHERE status = 0 AND expire_time <= NOW()');
    } catch (error) {
      console.error('需求过期扫描失败:', error.message);
    }
  }, 60 * 1000);

  // 4. 启动监听端口
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

// 启动应用并处理异常
startServer().catch((error) => {
  console.error('服务器启动失败:', error.message);
  pool.end();
  process.exitCode = 1;
});