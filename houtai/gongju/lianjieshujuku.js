const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT) || 3306,
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'qiugouwang',
	waitForConnections: true,
	connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
	queueLimit: 0,
});

async function initializeDatabase() {
	const statements = [
		`CREATE TABLE IF NOT EXISTS \`user\` (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, phone VARCHAR(20) NOT NULL, nickname VARCHAR(50) NOT NULL, avatar VARCHAR(255) DEFAULT '', credit_score INT NOT NULL DEFAULT 100, address_city VARCHAR(32) DEFAULT '', status TINYINT NOT NULL DEFAULT 1, create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY uk_phone (phone)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
		`CREATE TABLE IF NOT EXISTS demand (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, user_id BIGINT UNSIGNED NOT NULL, title VARCHAR(100) NOT NULL, category VARCHAR(50) NOT NULL, price_min DECIMAL(10,2) DEFAULT NULL, price_max DECIMAL(10,2) DEFAULT NULL, content TEXT NOT NULL, trade_location VARCHAR(255) NOT NULL, trade_time VARCHAR(100) DEFAULT NULL, expire_time DATETIME NOT NULL, status TINYINT NOT NULL DEFAULT 0, city VARCHAR(32) NOT NULL, create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY idx_demand_user (user_id), KEY idx_demand_city_status (city, status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
		`CREATE TABLE IF NOT EXISTS offer (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, demand_id BIGINT UNSIGNED NOT NULL, supply_user_id BIGINT UNSIGNED NOT NULL, offer_price DECIMAL(10,2) NOT NULL, remark VARCHAR(255) DEFAULT '', is_selected TINYINT NOT NULL DEFAULT 0, create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY idx_offer_demand (demand_id), UNIQUE KEY uk_demand_supply (demand_id, supply_user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
		`CREATE TABLE IF NOT EXISTS credit_record (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, user_id BIGINT UNSIGNED NOT NULL, related_demand_id BIGINT UNSIGNED DEFAULT NULL, type TINYINT NOT NULL, \`desc\` VARCHAR(255) NOT NULL, evidence_img VARCHAR(500) DEFAULT '', create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY idx_credit_user (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
	];
	for (const statement of statements) await pool.query(statement);
}

async function connectDatabase() {
	const connection = await pool.getConnection();

	try {
		await connection.ping();
		console.log('数据库连接成功');
	} finally {
		connection.release();
	}
}

async function closeDatabase() {
	await pool.end();
}

module.exports = {
	pool,
	connectDatabase,
	initializeDatabase,
	closeDatabase,
};
