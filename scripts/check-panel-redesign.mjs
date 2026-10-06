import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer";

const origin = process.env.PANEL_ORIGIN || "http://127.0.0.1:8001";
const session = JSON.parse(
  await readFile("storage/logs/admin-audit-session.json", "utf8"),
);
const routeReport = JSON.parse(
  await readFile("storage/logs/admin-pages-audit.json", "utf8"),
);
const routes = process.env.PANEL_ROUTES?.split(",") || [
  ...new Set([
    ...routeReport
      .filter(
        (r) =>
          r.status === 200 &&
          !/export|buscar|search|notificaciones|api-profile/.test(r.path),
      )
      .map((r) => r.path.split("?")[0]),
    "/admin/equipo",
    "/admin/asistente",
    "/admin/chatbot/conocimiento",
  ]),
];
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const report = { pages: [], interactions: [] };
try {
  await browser.setCookie({
    name: session.name,
    value: session.value,
    domain: "127.0.0.1",
    path: "/",
    httpOnly: true,
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  await page.setRequestInterception(true);
  page.on("request", (request) =>
    request.resourceType() === "image" ? request.abort() : request.continue(),
  );
  let errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      message.text().startsWith("React Error Caught:")
    )
      errors.push(message.text());
  });
  for (const width of (process.env.PANEL_WIDTHS || "1440,390")
    .split(",")
    .map(Number)) {
    await page.setViewport({ width, height: 1000 });
    for (const route of routes) {
      errors = [];
      try {
        const response = await page.goto(origin + route, {
          waitUntil: "domcontentloaded",
          timeout: 25000,
        });
        await page.waitForSelector(".panel-shell #panel-content", {
          timeout: 12000,
        });
        await new Promise((resolve) => setTimeout(resolve, 400));
        const dimensions = await page.evaluate(() => ({
          viewport: innerWidth,
          width: document.documentElement.scrollWidth,
          empty: !document.querySelector("#panel-content")?.innerText.trim(),
        }));
        const row = {
          route,
          width,
          status: response.status(),
          ...dimensions,
          errors: [...errors],
        };
        report.pages.push(row);
        if (
          row.status !== 200 ||
          row.empty ||
          row.width > row.viewport + 2 ||
          row.errors.length
        )
          console.log("Finding:", JSON.stringify(row));
        if (
          [
            "/admin",
            "/admin/products",
            "/admin/crm/pipeline",
            "/admin/crm/tasks",
            "/admin/pos",
            "/admin/inbox",
          ].includes(route)
        )
          await page.screenshot({
            path: `storage/logs/panel-after-${route.replaceAll("/", "-")}-${width}.png`,
          });
      } catch (error) {
        const body = await page
          .$eval("body", (element) => element.innerText.slice(0, 1500))
          .catch(() => "");
        report.pages.push({
          route,
          width,
          error: error.message,
          errors: [...errors],
          body,
        });
        console.log("Finding:", route, error.message, errors, body);
      }
    }
    console.log(`Checked ${routes.length} pages at ${width}px.`);
  }
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(origin + "/admin", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".panel-shell");
  await page.click('[aria-label="Contraer navegación"]');
  assert(await page.$(".panel-shell.is-collapsed"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".panel-shell.is-collapsed");
  await page.click('[aria-label="Expandir navegación"]');
  report.interactions.push("Sidebar collapse preference survives reload");
  await page.keyboard.down("Control");
  await page.keyboard.press("k");
  await page.keyboard.up("Control");
  await page.waitForSelector(".panel-command");
  await page.type(".panel-command input", "empresas");
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => location.pathname === "/admin/crm/companies",
  );
  report.interactions.push("Command search opens the requested module");
  await page.goto(origin + "/admin/crm/pipeline", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(
    '.premium-column-header button[aria-label^="Crear oportunidad"]',
  );
  const stageButtons = await page.$$(
    '.premium-column-header button[aria-label^="Crear oportunidad"]',
  );
  const stageButton = stageButtons[Math.min(1, stageButtons.length - 1)];
  const stageName = await stageButton.evaluate((element) =>
    element.getAttribute("aria-label").replace("Crear oportunidad en ", ""),
  );
  await stageButton.click();
  await page.waitForSelector('.twenty-drawer[role="dialog"]');
  const selected = await page.$eval(
    ".twenty-drawer select",
    (element) => element.selectedOptions[0].textContent,
  );
  assert.equal(selected.trim(), stageName);
  await page.keyboard.press("Escape");
  report.interactions.push(
    "Kanban stage creates an opportunity in the selected stage and Escape closes the form",
  );
  for (const route of [
    "/admin/crm/tasks?create=true",
    "/admin/crm/companies?create=true",
  ]) {
    await page.goto(origin + route, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('.twenty-drawer[role="dialog"]');
    await page.keyboard.press("Escape");
    report.interactions.push(`Creation shortcut opens form: ${route}`);
  }
  await page.goto(origin + '/admin/products/create', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.panel-shell');
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Nueva Categoría')).click());
  await page.waitForSelector('[role="dialog"][aria-label="Nueva categoría"]');
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"][aria-label="Nueva categoría"]', { hidden: true });
  report.interactions.push('Quick category dialog opens and closes by keyboard');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(origin + "/admin", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".panel-shell");
  await page.click('[aria-label="Abrir navegación"]');
  await page.waitForSelector(".panel-shell.mobile-open");
  await page.keyboard.press("Escape");
  assert(!(await page.$(".panel-shell.mobile-open")));
  report.interactions.push("Mobile menu opens and closes by keyboard");
  await page.click('[aria-label^="Notificaciones"]');
  await page.waitForSelector(".panel-notifications");
  await page.click('[aria-label="Cerrar notificaciones"]');
  report.interactions.push("Notifications open and close");
  await page.click(".panel-assistant-launcher");
  await page.waitForSelector('.panel-assistant-drawer[role="dialog"]');
  await page.keyboard.press("Escape");
  await page.waitForSelector(".panel-assistant-drawer", { hidden: true });
  report.interactions.push("Assistant dialog opens and closes by keyboard");
} catch (error) {
  report.interactionError = error.stack;
  console.log(error.stack);
  process.exitCode = 1;
} finally {
  await writeFile(
    process.env.PANEL_REPORT || "storage/logs/panel-redesign-browser.json",
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
if (
  report.pages.some(
    (row) =>
      row.error ||
      row.status !== 200 ||
      row.empty ||
      row.errors?.length ||
      row.width > row.viewport + 2,
  )
)
  process.exitCode = 1;
console.log(
  JSON.stringify({
    pages: report.pages.length,
    interactions: report.interactions,
    failure: report.interactionError || null,
  }),
);
