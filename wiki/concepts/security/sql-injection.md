---
title: "SQL 注入"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [security, database, backend]
status: active
sources: []
---

# SQL 注入

## 定义

SQL 注入(SQL Injection,SQLi)是一种把恶意 SQL 片段拼接进应用查询字符串,改变原查询语义的注入攻击。攻击者借此绕过认证、读取/篡改/删除数据库数据,甚至通过数据库扩展执行操作系统命令。SQL 注入位列 OWASP Top 10 中"注入(Injection)"类别多年,根因始终是"把不可信数据当作代码执行"——只要使用字符串拼接构造 SQL,就存在风险。

## 工作原理

**典型漏洞代码：**

```js
// ❌ 字符串拼接
const sql = `SELECT * FROM users WHERE name='${name}' AND pwd='${pwd}'`;

// 攻击者输入: name = admin'-- ,pwd = anything
// 实际执行: SELECT * FROM users WHERE name='admin'-- ' AND pwd='anything'
// → 注释掉了密码校验,以 admin 身份登录
```

**注入类型：**

1. **联合查询注入(UNION-based)**：拼接 `UNION SELECT` 读取其他表
2. **报错注入(Error-based)**：故意制造错误,从错误信息中提取数据
3. **布尔盲注(Boolean Blind)**：通过响应差异(true/false)逐位猜测
4. **时间盲注(Time-based Blind)**：用 `SLEEP(5)` 通过响应时间判断
5. **二阶注入(Second-Order)**：恶意数据先存入库,后续查询时被触发

**核心防御:参数化查询(Prepared Statements)**

参数化查询把"SQL 模板"与"参数值"分两次发给数据库,数据库永远把参数当数据,不解析为代码。

```js
// ✅ Node + pg
await client.query('SELECT * FROM users WHERE name=$1 AND pwd=$2', [name, pwd]);

// ✅ Python + psycopg
cur.execute("SELECT * FROM users WHERE name=%s AND pwd=%s", (name, pwd))

// ✅ Java JDBC
PreparedStatement ps = conn.prepareStatement("SELECT * FROM u WHERE name=?");
ps.setString(1, name);

// ✅ Go database/sql
db.Query("SELECT * FROM u WHERE name=$1", name)
```

**ORM 防护：** 主流 ORM(Prisma、TypeORM、SQLAlchemy、Django ORM、Hibernate)默认使用参数化查询。但要警惕 `raw()` / 原生 SQL 接口与 `whereRaw('... ' + input)` 的二次拼接。

```ts
// ✅ Prisma 安全
prisma.user.findMany({ where: { name: input } });

// ❌ Prisma 危险
prisma.$queryRawUnsafe(`SELECT * FROM u WHERE name='${input}'`);

// ✅ Prisma 参数化原生 SQL
prisma.$queryRaw`SELECT * FROM u WHERE name=${input}`;
```

**纵深防御：**

- **最小权限原则**：应用账户只授予所需权限,禁止 DROP/DDL,禁用 `xp_cmdshell` 等危险扩展
- **白名单校验**：表名、列名、ORDER BY 字段无法参数化,必须用白名单匹配
- **WAF + 数据库审计**：检测可疑模式,记录异常查询
- **错误信息脱敏**：不要把数据库错误堆栈暴露给前端
- **存储过程**：仅当内部不再拼接 SQL 时才安全

## 优势与局限(防御措施)

- ✅ 参数化查询彻底从语法层消除注入,几乎零性能开销
- ✅ 现代 ORM 默认安全,大幅降低开发者出错概率
- ✅ 最小权限将注入危害限制在受限账户范围
- ❌ 拼接动态表名/列名/排序字段时无法参数化,仍需手工白名单
- ❌ 二阶注入隐蔽,代码审查易遗漏
- ❌ 历史遗留系统大量字符串拼接,改造成本高
- ❌ NoSQL 同样存在注入(MongoDB `$where`、操作符注入),思路相同需独立防护

## 应用场景

- **登录/注册接口**：所有用户可输入字段必须参数化
- **搜索/过滤功能**：动态 WHERE 条件须用 ORM 构造器或参数化
- **管理后台**:风险最高,常被忽视;务必组合最小权限 + 审计
- **遗留系统改造**：渐进式替换为参数化查询,优先改造高危接口
- **多租户 SaaS**：表前缀/Schema 切换须严格白名单,防止跨租户读取

## 相关概念

- [[concepts/security/xss]]: 同属注入家族,本质都是"数据被当代码"
- input validation: 输入验证是辅助防线,不能替代参数化
- orm: 现代防御主力,但需正确使用
- least privilege: 数据库权限最小化原则
- waf: 应用层防火墙作为纵深防御
