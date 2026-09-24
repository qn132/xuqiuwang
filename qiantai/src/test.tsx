import React from 'react'
import './test.css'
function Yemian() {
    
    return (
        <div>
            <section>
                <div>
                    <div>需</div>
                    <p>同城需求撮合平台</p>
                    <h1>先登录，再一起把需求办成</h1>
                    <p>手机号登录即注册，所有交易在线下完成，平台只记录撮合和信用。</p>
                    <label>
                        手机号
                        <input type="tel" placeholder="请输入 11 位手机号" />
                    </label>
                    <button type="button">进入需求购</button>
                    <p>登录提示信息</p>
                </div>
            </section>

            <section>
                <header className="topbar">
                    <div className="brand-wrap">
                        <div className="brand-badge">需</div>
                        <div>
                            <div className="brand-title">同城需求撮合平台</div>
                            <div className="brand-sub">需求购</div>
                        </div>
                    </div>

                    <nav className="topnav">
                        <button className="nav-btn" type="button">广场</button>
                        <button className="nav-btn" type="button">我的需求</button>
                        <button className="nav-btn" type="button">我的报价</button>
                        <button className="nav-btn" type="button">信用档案</button>
                    </nav>

                    <div className="user-panel">
                        <span className="city-tag">北京</span>
                        <span className="user-name">用户昵称</span>
                        <button className="login-btn" type="button">退出</button>
                    </div>
                </header>

                <div>操作提示信息</div>

                <main>
                    <section>
                        <header>
                            <div>
                                <p>同城线下交易</p>
                                <h1>买家发布需求，卖家主动报价接单</h1>
                            </div>
                            <button type="button">发布需求</button>
                        </header>

                        <section>
                            <h2>筛选需求</h2>
                            <div>
                                <button type="button">全部</button>
                                <button type="button">日用百货</button>
                                <button type="button">数码电子</button>
                                <button type="button">家居家具</button>
                                <button type="button">服饰配件</button>
                                <button type="button">其他</button>
                            </div>
                        </section>

                        <section>
                            <h2>需求列表</h2>
                            <div>正在加载需求数据...</div>
                            <div>暂无需求数据</div>
                            <article>
                                <header>
                                    <span>日用百货</span>
                                    <span>待报价</span>
                                </header>
                                <h3>求购家用不锈钢汤勺 2 把</h3>
                                <div>
                                    <span>预算：¥20 - ¥50</span>
                                    <span>交易地：北京市朝阳区</span>
                                </div>
                                <div>
                                    <span>时间：周六 17:00-19:00</span>
                                    <span>截止：2026-09-20</span>
                                </div>
                                <footer>
                                    <strong>用户昵称</strong>
                                    <span>成交 12</span>
                                    <span>爽约 0</span>
                                    <span>投诉 0</span>
                                </footer>
                            </article>
                            <article>
                                <header>
                                    <span>数码电子</span>
                                    <span>已选中供应</span>
                                </header>
                                <h3>求购二手显示器一台</h3>
                                <div>
                                    <span>预算：¥300 - ¥600</span>
                                    <span>交易地：北京市海淀区</span>
                                </div>
                                <div>
                                    <span>时间：工作日晚上</span>
                                    <span>截止：2026-09-22</span>
                                </div>
                                <footer>
                                    <strong>另一位用户</strong>
                                    <span>成交 8</span>
                                    <span>爽约 1</span>
                                    <span>投诉 0</span>
                                </footer>
                            </article>
                        </section>
                    </section>

                    <aside>
                        <section>
                            <header>
                                <div>
                                    <p>需求详情</p>
                                    <h2>求购家用不锈钢汤勺 2 把</h2>
                                </div>
                                <span>待报价</span>
                            </header>

                            <dl>
                                <div><dt>分类</dt><dd>日用百货</dd></div>
                                <div><dt>预算</dt><dd>¥20 - ¥50</dd></div>
                                <div><dt>地点</dt><dd>北京市朝阳区</dd></div>
                                <div><dt>时间</dt><dd>周六 17:00-19:00</dd></div>
                            </dl>

                            <section>
                                <h3>需求说明</h3>
                                <p>需要购买两把家用不锈钢汤勺，希望商品干净无损，可以在约定地点当面交易。</p>
                            </section>

                            <section>
                                <header>
                                    <strong>用户昵称</strong>
                                    <span>发单人</span>
                                </header>
                                <div>
                                    <span>成交 12</span>
                                    <span>爽约 0</span>
                                    <span>投诉 0</span>
                                </div>
                            </section>

                            <section>
                                <strong>需求还在等待报价</strong>
                                <button type="button">取消需求</button>
                            </section>
                            <section>
                                <strong>你是需求发布者</strong>
                                <button type="button">确认交易完成</button>
                                <button type="button">登记供应者未按约定完成</button>
                            </section>
                            <section>
                                <strong>你是已选中的供应者</strong>
                                <button type="button">确认交易完成</button>
                                <button type="button">登记买家爽约</button>
                            </section>
                        </section>

                        <section>
                            <header>
                                <h2>报价列表</h2>
                                <span>2 条</span>
                            </header>
                            <div>暂无报价</div>
                            <article>
                                <header>
                                    <div>
                                        <strong>供应者甲</strong>
                                        <span>2026-09-18 10:30</span>
                                    </div>
                                    <strong>¥35</strong>
                                </header>
                                <p>全新不锈钢汤勺，可以在朝阳区约定地点交易。</p>
                                <div>
                                    <span>成交 20</span>
                                    <span>爽约 0</span>
                                    <span>投诉 0</span>
                                </div>
                                <button type="button">选中接单</button>
                            </article>
                            <form>
                                <h3>提交我的报价</h3>
                                <div>
                                    <label>
                                        报价金额
                                        <input type="number" />
                                    </label>
                                    <label>
                                        报价说明
                                        <input type="text" />
                                    </label>
                                    <button type="submit">提交报价</button>
                                </div>
                            </form>
                        </section>
                    </aside>
                </main>
            </section>

            <section>
                <header>
                    <div>
                        <p>供应者工作台</p>
                        <h1>我的报价</h1>
                    </div>
                    <button type="button">回到需求广场</button>
                </header>
                <div>
                        <div>还没有报价，去广场看看附近的需求。</div>
                    <article>
                        <div>
                            <strong>求购家用不锈钢汤勺 2 把</strong>
                            <p>全新商品，可按时到场交易。</p>
                            <small>点击查看订单详情</small>
                        </div>
                        <strong>¥35</strong>
                        <span>等待回复</span>
                    </article>
                </div>
            </section>

            <section>
                <header>
                    <div>
                        <p>买家工作台</p>
                        <h1>我的需求</h1>
                    </div>
                    <button type="button">发布新需求</button>
                </header>
                <div>
                        <div>还没有发布需求。</div>
                    <article>
                        <div>
                            <strong>求购家用不锈钢汤勺 2 把</strong>
                            <p>北京市朝阳区 · 周六 17:00-19:00</p>
                        </div>
                        <span>等待报价</span>
                    </article>
                </div>
            </section>

            <section>
                <header>
                    <div>
                        <p>履约记录</p>
                        <h1>我的信用档案</h1>
                    </div>
                    <div>
                        <span>成交 12</span>
                        <span>爽约 0</span>
                        <span>投诉 0</span>
                    </div>
                </header>
                <div>
                        <div>完成一次交易后，信用记录会显示在这里。</div>
                    <article>
                        <div>
                            <strong>正常履约</strong>
                            <p>按约定地点完成交易，商品符合描述。</p>
                        </div>
                        <span>2026-09-18</span>
                    </article>
                </div>
            </section>

            <section>
                <form>
                    <header>
                        <h2>发布一条新需求</h2>
                        <button type="button">关闭</button>
                    </header>
                    <label>
                        需求标题
                        <input type="text" />
                    </label>
                    <div>
                        <label>
                            分类
                            <select>
                                <option>日用百货</option>
                                <option>数码电子</option>
                                <option>家居家具</option>
                                <option>服饰配件</option>
                                <option>其他</option>
                            </select>
                        </label>
                        <label>
                            城市
                            <input type="text" value="北京" readOnly />
                        </label>
                        <label>
                            预算最低
                            <input type="number" />
                        </label>
                        <label>
                            预算最高
                            <input type="number" />
                        </label>
                        <label>
                            交易地点
                            <input type="text" />
                        </label>
                        <label>
                            期望时间
                            <input type="text" />
                        </label>
                    </div>
                    <label>
                        详细描述
                        <textarea rows={4} />
                    </label>
                    <label>
                        有效期（小时）
                        <input type="number" value={48} readOnly />
                    </label>
                    <button type="submit">发布需求</button>
                </form>
            </section>
        </div>
    )
}

export default Yemian