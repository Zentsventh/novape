import puppeteer from "puppeteer";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const origin = "http://127.0.0.1:8000";
execFileSync("php", ["scripts/panel_communication_fixture.php"]);
const fixture = JSON.parse(
  await readFile("storage/logs/panel-communication-fixture.json", "utf8"),
);
let browser;
const errors = [];
try {
  browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const pages = [];
  for (const user of fixture.users.slice(0, 2)) {
    const context = await browser.createBrowserContext();
    await context.setCookie({
      name: user.name,
      value: user.value,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", async (r) => {
      if (r.status() >= 400 && r.url().includes("/admin/api/"))
        console.log(
          "API failure",
          r.status(),
          new URL(r.url()).pathname,
          (await r.text()).slice(0, 300),
        );
    });
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(origin + "/admin/equipo", { waitUntil: "networkidle2" });
    await page.waitForSelector(".panel-team-new");
    await page.waitForFunction(
      () => window.Echo?.connector.pusher.connection.state === "connected",
      { timeout: 15000 },
    );
    await page.waitForFunction(
      (id) =>
        window.Echo?.connector.pusher.channels.channels[
          `private-novape-team.user.${id}`
        ]?.subscribed,
      { timeout: 15000 },
      user.id,
    );
    pages.push(page);
  }
  const [a, b] = pages;
  await a.click(".panel-team-new");
  await a.type('input[aria-label="Buscar trabajador"]', "Panel QA 2");
  await a.waitForFunction(
    () => document.querySelectorAll(".panel-team-workers input").length === 1,
  );
  await a.click(".panel-team-workers input");
  await a.click(".panel-team-create button");
  await a.waitForSelector('textarea[aria-label="Mensaje interno al equipo"]');
  await a.waitForFunction(
    () =>
      !document.querySelector(
        'textarea[aria-label="Mensaje interno al equipo"]',
      ).disabled,
  );
  await a.type(
    'textarea[aria-label="Mensaje interno al equipo"]',
    "Coordinación interna QA: revisar seguimiento.",
  );
  await a.waitForFunction(
    () =>
      document.querySelector('textarea[aria-label="Mensaje interno al equipo"]')
        .value.length > 20,
  );
  await a.click('button[aria-label="Enviar mensaje interno"]');
  await a.waitForFunction(() =>
    document
      .querySelector(".panel-team-messages")
      ?.textContent.includes("Coordinación interna QA"),
  );
  // Recipient gets the thread via Reverb; polling remains a fallback.
  await b.waitForSelector('nav[aria-label="Conversaciones internas"] button', {
    timeout: 30000,
  });
  await b.click('nav[aria-label="Conversaciones internas"] button');
  await b.waitForFunction(() =>
    document
      .querySelector(".panel-team-messages")
      ?.textContent.includes("Coordinación interna QA"),
  );
  await a.click(".panel-team-new");
  await a.type('input[aria-label="Nombre del grupo"]', "Coordinación QA");
  await a.type('input[aria-label="Buscar trabajador"]', "Panel QA");
  await a.waitForFunction(
    () => document.querySelectorAll(".panel-team-workers input").length === 2,
  );
  for (const checkbox of await a.$$(".panel-team-workers input"))
    await checkbox.click();
  await a.click(".panel-team-create button");
  await a.waitForFunction(
    () =>
      document
        .querySelector(".panel-team-chat header")
        ?.textContent.includes("Coordinación QA") &&
      !document.querySelector(
        'textarea[aria-label="Mensaje interno al equipo"]',
      ).disabled,
  );
  await a.type(
    'textarea[aria-label="Mensaje interno al equipo"]',
    "Seguimiento grupo QA.",
  );
  await a.click('button[aria-label="Enviar mensaje interno"]');
  await a.waitForFunction(() =>
    document
      .querySelector(".panel-team-messages")
      ?.textContent.includes("Seguimiento grupo QA."),
  );
  await a.screenshot({
    path: "storage/logs/panel-team-desktop.png",
    fullPage: true,
  });

  await a.goto(origin + "/admin/inbox", { waitUntil: "networkidle2" });
  await a.waitForFunction(() =>
    [...document.querySelectorAll("*")].some(
      (n) =>
        n.children.length === 0 &&
        n.textContent === "Cliente Panel QA Temporal",
    ),
  );
  await a.evaluate(() =>
    [...document.querySelectorAll("*")]
      .find(
        (n) =>
          n.children.length === 0 &&
          n.textContent === "Cliente Panel QA Temporal",
      )
      .click(),
  );
  await a.waitForSelector('button[title="Asistente privado del panel"]');
  await a.click('button[title="Asistente privado del panel"]');
  await a.waitForSelector(".panel-assistant-drawer");
  await a.evaluate(() =>
    [...document.querySelectorAll(".panel-communication-shortcuts button")]
      .find((n) => n.textContent === "Preparar respuesta")
      .click(),
  );
  await a.waitForFunction(
    () =>
      document
        .querySelector(".panel-assistant-answer button")
        ?.textContent.includes("Usar como borrador"),
    { timeout: 30000 },
  );
  const mode = await a.$eval(
    ".panel-assistant-answer small",
    (n) => n.textContent,
  );
  await a.screenshot({
    path: "storage/logs/panel-assistant-inbox.png",
    fullPage: true,
  });
  await a.click(".panel-assistant-answer button");
  await a.waitForFunction(
    () => document.querySelector(".inbox-chat textarea")?.value.length > 10,
  );
  const counts = await a.evaluate(
    async (id) =>
      (
        await (
          await fetch(`/admin/api/omnichannel/conversations/${id}/messages`, {
            headers: { Accept: "application/json" },
          })
        ).json()
      ).data.length,
    fixture.conversation,
  );
  assert.equal(counts, 1, "Assistant draft must not send a customer message");
  for (const width of [390, 1440]) {
    await a.setViewport({ width, height: 900 });
    await a.goto(origin + "/admin/asistente", { waitUntil: "networkidle2" });
    await a.waitForSelector(
      'textarea[aria-label="Consulta al asistente del panel"]',
    );
    const overflow = await a.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 2,
    );
    assert.equal(overflow, false, `Assistant horizontal overflow at ${width}`);
    assert((await a.$eval('.panel-assistant-full', n => n.getBoundingClientRect().width)) > (width === 390 ? 330 : 500), 'Assistant must have usable width');
    if (width === 390) {
      await a.click('button[aria-label="Abrir o cerrar menú CRM"]');
      await a.waitForSelector('.twenty-sidebar.mobile-open');
      await a.click('button[aria-label="Cerrar menú CRM"]');
    }
    await a.screenshot({
      path: `storage/logs/panel-assistant-${width}.png`,
      fullPage: true,
    });
  }
  await a.goto(origin + "/admin", { waitUntil: "networkidle2" });
  await a.waitForSelector(".panel-assistant-launcher");
  assert.deepEqual(errors, []);
  const report = {
    result: "OK",
    team: "direct chat and a group of three isolated workers; private Reverb subscriptions verified",
    inbox: "draft copied to composer; customer messages remain 1",
    provider: mode,
    responsive: [390, 1440],
    errors,
  };
  await writeFile(
    "storage/logs/panel-communication-browser.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} catch (e) {
  for (const page of (await browser?.pages()) || []) {
    console.log(
      "Page state",
      new URL(page.url()).pathname,
      (await page.evaluate(() => document.body.innerText)).slice(-1400),
    );
  }
  throw e;
} finally {
  if (browser) await browser.close();
  execFileSync("php", ["scripts/panel_communication_fixture.php", "cleanup"]);
}
