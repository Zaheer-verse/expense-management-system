import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { chromium } from "playwright";

const root = new URL("../", import.meta.url);
const allowedFiles = new Set([
  "/index.html",
  "/add-expense.html",
  "/analytics.html",
  "/goals.html",
  "/settings.html",
  "/app.js",
  "/styles.css"
]);

const mimeTypes = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8"
};

const payload =
  '<img data-security-probe src="/missing-security-probe" ' +
  'onerror="window.__securityProbe=true"> & " \'';

let server;
let browser;
let origin;

before(async () => {
  server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const path = url.pathname === "/" ? "/index.html" : url.pathname;

    if (
      !["GET", "HEAD"].includes(request.method) ||
      !allowedFiles.has(path)
    ) {
      response.writeHead(404);
      response.end();
      return;
    }

    try {
      const content = await readFile(new URL(path.slice(1), root));
      const extension = path.split(".").pop();
      response.writeHead(200, {
        "content-type": mimeTypes[extension],
        "cache-control": "no-store"
      });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  origin = "http://127.0.0.1:" + server.address().port;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  if (server?.listening) {
    await new Promise((resolve) => server.close(resolve));
  }
});

async function withPage(run) {
  const context = await browser.newContext({ timezoneId: "UTC" });
  try {
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      return url.origin === origin ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    await run(page);
  } finally {
    await context.close();
  }
}

async function assertLiteral(page, selector, expected) {
  const element = page.locator(selector).first();
  await element.waitFor({ state: "visible" });
  assert.equal(await element.textContent(), expected);
}

async function assertNoInjection(page) {
  assert.equal(
    await page.locator("img[data-security-probe]").count(),
    0,
    "User text must not create an image element"
  );
  assert.equal(
    await page.evaluate(() => Boolean(window.__securityProbe)),
    false,
    "User text must not execute its event handler"
  );
}

test("expense titles remain literal after save, reload, and dashboard navigation",
  { timeout: 30_000 },
  async () => {
    await withPage(async (page) => {
      await page.goto(origin + "/add-expense.html");
      await page.locator('#expenseForm input[name="title"]').fill(payload);
      await page.locator('#expenseForm input[name="amount"]').fill("100");
      await page.locator('#expenseForm select[name="category"]').selectOption("Food");
      await page.locator('#expenseForm input[name="date"]').fill(
        new Date().toISOString().slice(0, 10)
      );
      await page.locator('#expenseForm button[type="submit"]').click();

      await assertLiteral(page, "#expenseList li strong", payload);
      await assertNoInjection(page);

      await page.reload();
      await assertLiteral(page, "#expenseList li strong", payload);
      await assertNoInjection(page);

      await page.goto(origin + "/index.html");
      await assertLiteral(page, "#recentList li strong", payload);
      await assertNoInjection(page);
    });
  }
);

test("goal names remain literal after save and reload",
  { timeout: 30_000 },
  async () => {
    await withPage(async (page) => {
      await page.goto(origin + "/goals.html");
      await page.locator('#goalForm input[name="name"]').fill(payload);
      await page.locator('#goalForm input[name="target"]').fill("1000");
      await page.locator('#goalForm input[name="saved"]').fill("100");
      await page.locator('#goalForm button[type="submit"]').click();

      await assertLiteral(page, "#goalsList .card-head strong", payload);
      await assertNoInjection(page);

      await page.reload();
      await assertLiteral(page, "#goalsList .card-head strong", payload);
      await assertNoInjection(page);
    });
  }
);

test("existing expense category and date text cannot create HTML",
  { timeout: 30_000 },
  async () => {
    await withPage(async (page) => {
      await page.goto(origin + "/add-expense.html");
      await page.evaluate((value) => {
        localStorage.setItem("se_expenses", JSON.stringify([{
          title: "Stored expense",
          amount: 10,
          category: value,
          date: value
        }]));
      }, payload);

      await page.reload();
      await assertLiteral(
        page,
        "#expenseList .meta",
        payload + " - " + payload
      );
      await assertNoInjection(page);
    });
  }
);
