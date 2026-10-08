import { app, BrowserWindow } from "electron";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv.find((a) => /^--port=/.test(a))?.split("=")[1] || 0);
const USERDATA = process.argv.find((a) => /^--userdata=/.test(a))?.slice("--userdata=".length);
if (USERDATA) app.setPath("userData", USERDATA);
app.commandLine.appendSwitch("disable-features", "ServiceWorker");

app.whenReady().then(async () => {
    const server = createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<!doctype html><html><body>idb-inspector</body></html>");
    });
    try {
        await new Promise((r, j) => {
            server.once("error", j);
            server.listen(PORT, "127.0.0.1", r);
        });
    } catch (e) {
        console.log(JSON.stringify({ port: PORT, error: "listen-failed: " + String(e && e.code || e) }));
        app.exit(1);
        return;
    }
    const win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, nodeIntegration: false } });
    await win.loadURL(`http://127.0.0.1:${PORT}/`);
    const out = await win.webContents.executeJavaScript(`
        (async () => {
            const trim = (v) => {
                if (Array.isArray(v)) return { count: v.length, first: v[0] ?? null, last: v[v.length - 1] ?? null };
                return v;
            };
            const dumpDb = (name) => new Promise((res) => {
                try {
                    const req = indexedDB.open(name);
                    req.onsuccess = () => {
                        const db = req.result;
                        const stores = [...db.objectStoreNames];
                        if (!stores.length) { db.close(); res({ stores: [], data: {} }); return; }
                        try {
                            const tx = db.transaction(stores, "readonly");
                            const data = {};
                            let pending = stores.length;
                            stores.forEach((s) => {
                                const g = tx.objectStore(s).getAll();
                                g.onsuccess = () => { data[s] = trim(g.result); if (--pending === 0) { db.close(); res({ stores, data }); } };
                                g.onerror = () => { data[s] = "err"; if (--pending === 0) { db.close(); res({ stores, data }); } };
                            });
                        } catch (e) { db.close(); res({ stores, data: { err: String(e) } }); }
                    };
                    req.onerror = () => res({ error: "open-error" });
                    req.onblocked = () => res({ error: "blocked" });
                } catch (e) { res({ error: String(e) }); }
            });
            const dbs = (await indexedDB.databases()).map((d) => d.name);
            const data = {};
            for (const name of dbs) data[name] = await dumpDb(name);
            return { port: ${PORT}, dbs, data };
        })()
    `);
    console.log(JSON.stringify(out, null, 1));
    win.destroy();
    app.exit(0);
}).catch((e) => { console.log("FATAL: " + e); app.exit(1); });