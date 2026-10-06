import { readFile, readdir, writeFile } from "node:fs/promises";
import { parse } from "@babel/parser";

const findings = [];
let buttons = 0,
  files = 0;
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      await scan(path);
      continue;
    }
    if (!entry.name.endsWith(".jsx")) continue;
    files++;
    const source = await readFile(path, "utf8");
    const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });
    function visit(node, inForm = false) {
      if (!node || typeof node !== "object") return;
      if (node.type === "JSXElement") {
        const opening = node.openingElement;
        const name = opening.name.name;
        const attributes = Object.fromEntries(
          opening.attributes
            .filter((a) => a.type === "JSXAttribute")
            .map((a) => [a.name.name, a.value]),
        );
        if (name === "button") {
          buttons++;
          const type = attributes.type?.value;
          if (
            !("onClick" in attributes) &&
            !("disabled" in attributes) &&
            !(inForm && type !== "button")
          ) {
            findings.push({
              path,
              line: node.loc.start.line,
              kind: "button-without-action",
              snippet: source
                .slice(node.start, node.end)
                .replace(/\s+/g, " ")
                .slice(0, 180),
            });
          }
        }
        if (
          ["Link", "a"].includes(name) &&
          ["#", ""].includes(attributes.href?.value)
        )
          findings.push({
            path,
            line: node.loc.start.line,
            kind: "empty-link",
          });
        inForm ||= name === "form";
      }
      for (const [key, value] of Object.entries(node)) {
        if (["loc", "start", "end"].includes(key)) continue;
        if (Array.isArray(value))
          value.forEach((child) => visit(child, inForm));
        else if (value && typeof value === "object") visit(value, inForm);
      }
    }
    visit(ast);
  }
}
await scan("resources/js/Pages/Admin");
await scan("resources/js/Components/Admin");
const report = { files, buttons, findings };
await writeFile(
  "storage/logs/panel-actions-audit.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
