const express = require('express');

const { pool, connectDatabase, initializeDatabase } = require('./gongju/lianjieshujuku');
const routes = require('./src/routes');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(routes);

async function startServer() {
  await connectDatabase();
  await initializeDatabase();
  setInterval(async () => {
    try {
      await pool.query('UPDATE demand SET status = 4 WHERE status = 0 AND expire_time <= NOW()');
    } catch (error) {
      console.error('需求过期扫描失败:', error.message);
    }
  }, 60 * 1000);

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('服务器启动失败:', error.message);
  pool.end();
  process.exitCode = 1;
});