import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

admin.initializeApp();
const db = admin.firestore();

const apiKeySecret = defineSecret('KAIKEI_API_KEY');
const userIdSecret = defineSecret('KAIKEI_USER_ID');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ===== OpenAPI仕様（認証不要・公開）=====
app.get('/api/openapi.json', (req, res) => {
  const base = `${req.protocol}://${req.hostname}`;
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'ひとり帳 API',
      version: '1.0.0',
      description: 'フリーランス向け会計管理アプリ「ひとり帳」のREST API。経費・売上・ToDo・メモ・ノートパッド・日報の取得・作成・更新・削除が可能。',
    },
    servers: [{ url: base }],
    security: [{ ApiKeyAuth: [] }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
      },
    },
    paths: {
      '/api/expenses': {
        get: {
          summary: '経費一覧を取得',
          parameters: [{ name: 'year', in: 'query', schema: { type: 'string' }, description: '年（省略時は今年）' }],
          responses: { '200': { description: '経費一覧' } },
        },
        post: {
          summary: '経費を追加',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object',
            required: ['date', 'category', 'amountWithTax', 'taxRate', 'payee', 'expenseType'],
            properties: {
              date: { type: 'string', description: 'YYYY-MM-DD' },
              category: { type: 'string', description: '勘定科目（通信費/消耗品費/地代家賃/外注費/旅費交通費/接待交際費/会議費/広告宣伝費/水道光熱費/新聞図書費/ソフトウェア利用料/機材購入/雑費）' },
              amountWithTax: { type: 'number', description: '税込金額' },
              taxRate: { type: 'number', description: '税率（0/8/10）' },
              payee: { type: 'string', description: '支払先' },
              expenseType: { type: 'string', enum: ['固定費', '変動費'] },
              purpose: { type: 'string' },
              memo: { type: 'string' },
            },
          } } } },
          responses: { '201': { description: '作成した経費' } },
        },
      },
      '/api/expenses/{id}': {
        put: {
          summary: '経費を更新',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'year', in: 'query', schema: { type: 'string' } },
          ],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: '更新後の経費' } },
        },
        delete: {
          summary: '経費を削除',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'year', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: '削除成功' } },
        },
      },
      '/api/sales': {
        get: {
          summary: '売上一覧を取得',
          parameters: [{ name: 'year', in: 'query', schema: { type: 'string' } }],
          responses: { '200': { description: '売上一覧' } },
        },
        post: {
          summary: '売上を追加',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object',
            required: ['date', 'paymentDueDate', 'status', 'client', 'amount'],
            properties: {
              date: { type: 'string', description: 'YYYY-MM-DD' },
              paymentDueDate: { type: 'string', description: '入金予定日 YYYY-MM-DD' },
              paymentDate: { type: 'string', description: '入金日 YYYY-MM-DD（任意）' },
              status: { type: 'string', enum: ['見込み', '請求済', '入金済'] },
              client: { type: 'string', description: '請求先' },
              amount: { type: 'number' },
              memo: { type: 'string' },
            },
          } } } },
          responses: { '201': { description: '作成した売上' } },
        },
      },
      '/api/sales/{id}': {
        put: { summary: '売上を更新', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { name: 'year', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: '更新後の売上' } } },
        delete: { summary: '売上を削除', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { name: 'year', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: '削除成功' } } },
      },
      '/api/settings': {
        get: { summary: '設定を取得', responses: { '200': { description: '設定データ' } } },
        put: { summary: '設定を更新', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: '更新後の設定' } } },
      },
      '/api/todos': {
        get: { summary: 'ToDo一覧を取得', responses: { '200': { description: 'ToDo一覧' } } },
        post: {
          summary: 'ToDoを追加',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object',
            required: ['text', 'priority'],
            properties: {
              text: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              done: { type: 'boolean', default: false },
            },
          } } } },
          responses: { '201': { description: '作成したToDo' } },
        },
      },
      '/api/todos/{id}': {
        put: { summary: 'ToDoを更新（doneでチェック管理）', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: '更新後のToDo' } } },
        delete: { summary: 'ToDoを削除', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: '削除成功' } } },
      },
      '/api/memos': {
        get: { summary: 'メモ一覧を取得', responses: { '200': { description: 'メモ一覧' } } },
        post: {
          summary: 'メモを追加',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object',
            required: ['title', 'category', 'body'],
            properties: {
              title: { type: 'string' },
              category: { type: 'string', enum: ['command', 'script', 'prompt', 'other'] },
              body: { type: 'string' },
            },
          } } } },
          responses: { '201': { description: '作成したメモ' } },
        },
      },
      '/api/memos/{id}': {
        put: { summary: 'メモを更新', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: '更新後のメモ' } } },
        delete: { summary: 'メモを削除', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: '削除成功' } } },
      },
      '/api/notepad': {
        get: { summary: 'ノートパッドの内容を取得', responses: { '200': { description: 'ノートパッドデータ' } } },
        put: {
          summary: 'ノートパッドを更新',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' } } } } } },
          responses: { '200': { description: '更新後のノートパッド' } },
        },
      },
      '/api/daily-reports': {
        get: { summary: '日報一覧を取得', responses: { '200': { description: '日報一覧' } } },
        post: {
          summary: '日報を追加',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object',
            required: ['date', 'done', 'plan', 'note'],
            properties: {
              date: { type: 'string', description: 'YYYY-MM-DD' },
              done: { type: 'string', description: '今日やったこと' },
              plan: { type: 'string', description: '明日やること' },
              note: { type: 'string', description: '所感' },
            },
          } } } },
          responses: { '201': { description: '作成した日報' } },
        },
      },
      '/api/daily-reports/{id}': {
        put: { summary: '日報を更新', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: '更新後の日報' } } },
        delete: { summary: '日報を削除', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: '削除成功' } } },
      },
    },
  });
});

// ===== APIキー認証ミドルウェア =====
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') { next(); return; }
  const key = req.headers['x-api-key'] as string | undefined;
  const fromEnv = process.env.KAIKEI_API_KEY;
  const fromSecret = (() => { try { return apiKeySecret.value(); } catch { return ''; } })();
  const expectedKey = (fromEnv ?? fromSecret).trim();
  if (!key || key !== expectedKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
});

// ===== ヘルパー =====
const uid = () => (process.env.KAIKEI_USER_ID ?? userIdSecret.value()).trim();
const nowIso = () => new Date().toISOString();
const yearOf = (date: string) => date.slice(0, 4);
const currentYear = () => new Date().getFullYear().toString();

const calcTax = (amountWithTax: number, taxRate: number) => {
  if (taxRate === 0) return { amountWithoutTax: amountWithTax, taxAmount: 0 };
  const amountWithoutTax = Math.floor(amountWithTax / (1 + taxRate / 100));
  return { amountWithoutTax, taxAmount: amountWithTax - amountWithoutTax };
};

// ===== 経費 =====
app.get('/api/expenses', async (req, res) => {
  try {
    const year = (req.query.year as string) || currentYear();
    const snap = await db.collection(`users/${uid()}/expenses/${year}/items`)
      .orderBy('date', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { date, category, amountWithTax, taxRate, payee, expenseType, purpose, memo } = req.body;
    const now = nowIso();
    const tax = calcTax(amountWithTax, taxRate);
    const data = {
      date, category, amountWithTax, taxRate, ...tax, payee, expenseType,
      ...(purpose != null ? { purpose } : {}),
      ...(memo != null ? { memo } : {}),
      createdAt: now, updatedAt: now,
    };
    const ref = await db.collection(`users/${uid()}/expenses/${yearOf(date)}/items`).add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, category, amountWithTax, taxRate, payee, expenseType, purpose, memo } = req.body;
    const year = (req.query.year as string) || yearOf(date) || currentYear();
    const tax = calcTax(amountWithTax, taxRate);
    const data = {
      date, category, amountWithTax, taxRate, ...tax, payee, expenseType,
      ...(purpose !== undefined ? { purpose } : {}),
      ...(memo !== undefined ? { memo } : {}),
      updatedAt: nowIso(),
    };
    await db.doc(`users/${uid()}/expenses/${year}/items/${id}`).update(data);
    res.json({ id, ...data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const year = (req.query.year as string) || currentYear();
    await db.doc(`users/${uid()}/expenses/${year}/items/${req.params.id}`).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ===== 売上 =====
app.get('/api/sales', async (req, res) => {
  try {
    const year = (req.query.year as string) || currentYear();
    const snap = await db.collection(`users/${uid()}/sales/${year}/items`)
      .orderBy('date', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { date, paymentDueDate, paymentDate, status, client, amount, memo } = req.body;
    const now = nowIso();
    const data = {
      date, paymentDueDate, status, client, amount,
      ...(paymentDate != null ? { paymentDate } : {}),
      ...(memo != null ? { memo } : {}),
      createdAt: now, updatedAt: now,
    };
    const ref = await db.collection(`users/${uid()}/sales/${yearOf(date)}/items`).add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, paymentDueDate, paymentDate, status, client, amount, memo } = req.body;
    const year = (req.query.year as string) || yearOf(date) || currentYear();
    const data = {
      date, paymentDueDate, status, client, amount,
      ...(paymentDate !== undefined ? { paymentDate } : {}),
      ...(memo !== undefined ? { memo } : {}),
      updatedAt: nowIso(),
    };
    await db.doc(`users/${uid()}/sales/${year}/items/${id}`).update(data);
    res.json({ id, ...data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/sales/:id', async (req, res) => {
  try {
    const year = (req.query.year as string) || currentYear();
    await db.doc(`users/${uid()}/sales/${year}/items/${req.params.id}`).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ===== 設定 =====
app.get('/api/settings', async (req, res) => {
  try {
    const doc = await db.doc(`users/${uid()}/settings/main`).get();
    res.json(doc.exists ? doc.data() : {});
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/settings', async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: nowIso() };
    await db.doc(`users/${uid()}/settings/main`).set(data, { merge: true });
    res.json(data);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ===== ToDo =====
app.get('/api/todos', async (req, res) => {
  try {
    const snap = await db.collection(`users/${uid()}/todos`)
      .orderBy('createdAt', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/todos', async (req, res) => {
  try {
    const { text, priority, done = false } = req.body;
    const now = nowIso();
    const data = { text, priority, done, createdAt: now, updatedAt: now };
    const ref = await db.collection(`users/${uid()}/todos`).add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, priority, done } = req.body;
    const data = {
      ...(text !== undefined ? { text } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(done !== undefined ? { done } : {}),
      updatedAt: nowIso(),
    };
    await db.doc(`users/${uid()}/todos/${id}`).update(data);
    res.json({ id, ...data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    await db.doc(`users/${uid()}/todos/${req.params.id}`).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ===== メモ =====
app.get('/api/memos', async (req, res) => {
  try {
    const snap = await db.collection(`users/${uid()}/memos`)
      .orderBy('createdAt', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/memos', async (req, res) => {
  try {
    const { title, category, body } = req.body;
    const now = nowIso();
    const data = { title, category, body, createdAt: now, updatedAt: now };
    const ref = await db.collection(`users/${uid()}/memos`).add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/memos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, body } = req.body;
    const data = {
      ...(title !== undefined ? { title } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(body !== undefined ? { body } : {}),
      updatedAt: nowIso(),
    };
    await db.doc(`users/${uid()}/memos/${id}`).update(data);
    res.json({ id, ...data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/memos/:id', async (req, res) => {
  try {
    await db.doc(`users/${uid()}/memos/${req.params.id}`).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ===== ノートパッド =====
app.get('/api/notepad', async (req, res) => {
  try {
    const doc = await db.doc(`users/${uid()}/notepad/main`).get();
    res.json(doc.exists ? doc.data() : { content: '' });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/notepad', async (req, res) => {
  try {
    const data = { content: req.body.content as string, updatedAt: nowIso() };
    await db.doc(`users/${uid()}/notepad/main`).set(data);
    res.json(data);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ===== 日報 =====
app.get('/api/daily-reports', async (req, res) => {
  try {
    const snap = await db.collection(`users/${uid()}/dailyReports`)
      .orderBy('date', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/api/daily-reports', async (req, res) => {
  try {
    const { date, done, plan, note } = req.body;
    const now = nowIso();
    const data = { date, done, plan, note, createdAt: now, updatedAt: now };
    const ref = await db.collection(`users/${uid()}/dailyReports`).add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put('/api/daily-reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, done, plan, note } = req.body;
    const data = {
      ...(date !== undefined ? { date } : {}),
      ...(done !== undefined ? { done } : {}),
      ...(plan !== undefined ? { plan } : {}),
      ...(note !== undefined ? { note } : {}),
      updatedAt: nowIso(),
    };
    await db.doc(`users/${uid()}/dailyReports/${id}`).update(data);
    res.json({ id, ...data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete('/api/daily-reports/:id', async (req, res) => {
  try {
    await db.doc(`users/${uid()}/dailyReports/${req.params.id}`).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

export const api = onRequest(
  { secrets: [apiKeySecret, userIdSecret], region: 'us-central1' },
  app
);
