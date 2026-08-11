/**
 * A web page for looking at the shop's MySQL database.
 *
 * MySQL has no address you can open in a browser — it speaks its own protocol on
 * a socket, not HTTP — so this puts one in front of it. Every table, every row,
 * clickable, at http://localhost:8088.
 *
 * Read-only on purpose. This exists to answer "what is actually in there?", and a
 * browser tab left open on a page with a Delete button is a bad way to find out
 * that it had one. Use DBeaver, or the mysql client, to change anything.
 *
 *   node db-browser.js
 */
const http = require('http');
const mysql = require('./api/node_modules/mysql2/promise');

const PORT = 8088;
const DB = {
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: '',
  database: 'smafuelmarket',
};

/** Rows shown per table. Enough to see the shape without loading a whole table. */
const LIMIT = 200;

let pool;

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Renders one cell.
 *
 * Image paths become thumbnails, because the whole reason for looking at this
 * table is usually to check that the photographs are still attached — and a
 * column of "/uploads/ms4gtyo0-….jpg" answers that far less directly than the
 * pictures themselves. They load from the running shop, so a broken thumbnail
 * means a broken link on the site too.
 */
function cell(column, value) {
  if (value === null) return '<span class="null">NULL</span>';

  const text = value instanceof Date ? value.toISOString().replace('T', ' ').slice(0, 19) : String(value);

  if (/^\/uploads\//.test(text)) {
    return `<a href="http://localhost:5080${escapeHtml(text)}" target="_blank">
      <img src="http://localhost:5080${escapeHtml(text)}" loading="lazy">
    </a><div class="path">${escapeHtml(text)}</div>`;
  }

  if (text.length > 160) {
    return `<details><summary>${escapeHtml(text.slice(0, 80))}…</summary>${escapeHtml(text)}</details>`;
  }

  return escapeHtml(text);
}

const PAGE = (title, body) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title><style>
  :root { color-scheme: dark }
  body { margin:0; background:#0b0b0d; color:#e8e8ea;
         font:14px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif }
  header { padding:18px 24px; border-bottom:1px solid #2a2a31; background:#15151a;
           position:sticky; top:0; z-index:2 }
  header b { color:#00b04f }
  nav { display:flex; flex-wrap:wrap; gap:8px; padding:14px 24px; border-bottom:1px solid #2a2a31 }
  nav a { padding:5px 11px; border:1px solid #2a2a31; border-radius:999px;
          color:#b8b8c0; text-decoration:none; font-size:13px }
  nav a:hover { border-color:#00b04f; color:#fff }
  nav a.on { background:#00b04f; border-color:#00b04f; color:#04140a; font-weight:700 }
  main { padding:24px; overflow-x:auto }
  h1 { font-size:19px; margin:0 0 4px }
  .count { color:#8a8a93; font-size:13px; margin-bottom:16px }
  table { border-collapse:collapse; font-size:13px }
  th,td { border:1px solid #2a2a31; padding:7px 10px; text-align:left; vertical-align:top;
          max-width:420px }
  th { background:#15151a; position:sticky; top:0; font-size:11px;
       text-transform:uppercase; letter-spacing:.05em; color:#8a8a93; white-space:nowrap }
  tr:nth-child(even) td { background:#101014 }
  img { height:54px; border-radius:4px; background:#fff; display:block }
  .path { color:#8a8a93; font-size:10px; margin-top:3px }
  .null { color:#55555e; font-style:italic }
  details summary { cursor:pointer; color:#00b04f }
  a.card { color:#00b04f }
</style></head><body>${body}</body></html>`;

async function tables() {
  const [rows] = await pool.query(
    'SELECT TABLE_NAME AS name, TABLE_ROWS AS approx FROM information_schema.TABLES ' +
    'WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME', [DB.database]);
  return rows;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const list = await tables();
    const wanted = url.searchParams.get('table');

    /* Checked against the real table list rather than interpolated. A table name
       from a query string is untrusted input, and MySQL will not take an
       identifier as a bound parameter. */
    const table = list.some((t) => t.name === wanted) ? wanted : null;

    const nav = '<nav>' + list.map((t) =>
      `<a class="${t.name === table ? 'on' : ''}" href="/?table=${encodeURIComponent(t.name)}">${escapeHtml(t.name)}</a>`
    ).join('') + '</nav>';

    const header = `<header><b>SMA Fuel &amp; Market</b> &nbsp;·&nbsp; MySQL ${DB.host}:${DB.port}/${DB.database}
      &nbsp;·&nbsp; <span style="color:#8a8a93">read-only</span></header>`;

    if (!table) {
      const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM Products');
      const body = `${header}${nav}<main>
        <h1>${list.length} tables</h1>
        <p class="count">Pick one above. ${n} products in the catalogue.</p></main>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(PAGE('Database', body));
    }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
    const [rows] = await pool.query(`SELECT * FROM \`${table}\` LIMIT ${LIMIT}`);

    const columns = rows.length ? Object.keys(rows[0]) : [];
    const head = columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('');
    const body = rows.map((r) =>
      '<tr>' + columns.map((c) => `<td>${cell(c, r[c])}</td>`).join('') + '</tr>').join('');

    const shown = rows.length < total ? `Showing the first ${rows.length} of ${total} rows.` : `${total} rows.`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(PAGE(table, `${header}${nav}<main>
      <h1>${escapeHtml(table)}</h1><p class="count">${shown}</p>
      <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></main>`));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(PAGE('Error', `<main><h1>Could not read the database</h1>
      <p class="count">${escapeHtml(err.message)}</p>
      <p class="count">Is MySQL running on port ${DB.port}?</p></main>`));
  }
});

(async () => {
  pool = mysql.createPool(DB);
  await pool.query('SELECT 1');
  server.listen(PORT, () => console.log(`Database browser: http://localhost:${PORT}`));
})().catch((err) => {
  console.error(`Could not connect to MySQL on ${DB.host}:${DB.port} — ${err.message}`);
  process.exit(1);
});
