# Deploying SMA Fuel & Market to myasp.net

The shop now runs on **ASP.NET Core 10 + MySQL**, because myasp.net runs neither
Node nor PostgreSQL. Nothing about the shop itself changed — same catalogue, same
photographs, same admin panel, same prices.

Everything ships as **one site**: the storefront, the admin panel and the API all
come from the same application and the same domain. No CORS to configure, no
second site to keep in step.

---

## What is where

| Folder | What it is |
|---|---|
| `api-dotnet/` | The ASP.NET Core API — the replacement for `api/` |
| `smafuelmarket/` | The React storefront, unchanged except for how it fetches data |
| `api/` | The old NestJS API. Kept for reference; not deployed |
| `mysql-import.sql` | Your live data, exported from PostgreSQL |
| `build-deploy.ps1` | Builds both halves into `publish/` |

---

## One-time setup on myasp.net

### 1. Create the MySQL database

From the myasp.net control panel, create a MySQL database and note the host,
database name, user and password.

### 2. Load your data into it

`mysql-import.sql` holds everything from the current shop — all 36 products with
their photographs, 9 departments, 26 categories, the Karachi store and its
delivery radius, the fuel prices, the hero slides, the showcase cards, the
promotions, the accounts and the order history. Product ids are preserved, so
bookmarked links and the admin panel's "order 41" still mean the same thing.

Load it with the panel's phpMyAdmin import, or from your machine:

```bash
mysql -h YOUR_HOST -u YOUR_USER -p YOUR_DATABASE < mysql-import.sql
```

To regenerate it later from the still-running PostgreSQL database:

```bash
cd api && npx tsx scripts/export-to-mysql.ts
```

### 3. Upload the photographs

Copy everything in `api/uploads/` to a folder on the host **outside the site
directory** — for example `C:\home\uploads`.

Outside, not inside, and this matters: publishing to IIS replaces the site folder
wholesale, so photographs kept inside it would be erased by a routine redeploy.

---

## Building and uploading

```powershell
.\build-deploy.ps1
```

Run the API locally first — the build asks it which products exist so each one
gets its own prerendered page.

Then edit `publish\appsettings.Production.json`:

| Setting | What to put |
|---|---|
| `ConnectionStrings:Default` | `server=HOST;port=3306;database=DB;user=USER;password=PASS;SslMode=Preferred` |
| `Jwt:Secret` | 32+ random characters. **The app refuses to start without it** |
| `FrontendUrl` | `https://your-site.myasp.net` — used for password-reset links |
| `Uploads:Directory` | The folder from step 3, e.g. `C:\\home\\uploads` |
| `Mail:ResendApiKey` | Your Resend key, if you want password-reset emails |

Upload the contents of `publish\` to the site root. `web.config` is already there.

Check `https://your-site.myasp.net/api/health` — it should answer
`{"status":"ok","database":true}`.

### Why `Jwt:Secret` is mandatory

Session tokens are signed with it. If the app fell back to a built-in default,
anyone who read this repository could mint themselves an administrator token and
sign in as you. Refusing to start is a five-minute problem; starting with a known
key is a silent one that ends with someone else's orders.

### Email

Use **Resend**, not SMTP. Shared Windows hosts almost always block outbound SMTP
ports, and Resend goes out over ordinary HTTPS. Set `Mail:ResendApiKey` and set
`Mail:From` to an address at a domain you have verified in Resend.

Leave the key empty and password resets simply do not send; nothing else breaks.

---

## Day-to-day

**Adding products, editing prices, uploading photos** — all through the admin
panel, as before. Changes reach customers on their next page load. No rebuild.

**Rebuild only when you change the code.** One thing does improve with a rebuild:
products added since the last one are served through a generic shell that fills
itself in from the URL. They work correctly — they just arrive as HTML that has to
fetch its content. Rebuilding gives them their own page. Worth doing occasionally,
never urgent.

---

## What changed in the storefront

The pages used to be rendered on a server as each visitor asked for them. With no
Node on the host there is no server to do that, so the storefront is exported to
static HTML and fetches the catalogue, promotions and store details from the API
**in the browser** instead.

The trade is deliberate. Baking the data in at build time would have been less
work, but the catalogue would freeze: every price change would need a rebuild and
a re-upload before any customer saw it. Fetching in the browser keeps the admin
panel meaning what it says.

The cost is that search engines see less of the page content in the initial HTML.
Titles and descriptions are still there, and the product pages are still one URL
each.

---

## If something is wrong

**Site loads but no products, or the seed catalogue shows instead**
The browser cannot reach `/api/products`. Open it directly in a browser. If it
404s, the API half did not deploy; if it 500s, check the connection string.

**`/api/health` says `"database": false`**
Wrong connection string, or the host has not whitelisted the connection.

**Photographs missing**
`Uploads:Directory` points somewhere with no files in it. Check
`https://your-site.myasp.net/uploads/` against a filename from the `Products`
table's `ImageUrl` column.

**The app will not start at all**
Nearly always `Jwt:Secret` being empty or under 32 characters. The Windows Event
Log on the host will say so.
