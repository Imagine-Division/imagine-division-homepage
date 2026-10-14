import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const events = JSON.parse(readFileSync(join(root, "refined-content/event-history.json"), "utf8"));
assert.equal(events.length, 20, "Every supplied event must be retained");
assert.equal(new Set(events.map((event) => event.id)).size, events.length);
for (const event of events) {
  for (const date of [event.date, event.endDate].filter(Boolean)) {
    assert.match(date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Date(date).toISOString().slice(0, 10), date, "Invalid calendar date");
  }
  assert.ok(!event.endDate || event.endDate >= event.date);
  assert.ok(event.name && event.org.en && event.org.zh && event.roles.length);
  assert.equal(new URL(event.source).protocol, "https:");
  if (event.photoSource) assert.equal(new URL(event.photoSource).protocol, "https:");
  assert.ok(event.image, "Every event needs a local photo");
  if (event.image) assert.ok(existsSync(join(root, event.image)), "Missing event photo: " + event.id);
  if (event.project) assert.ok(existsSync(join(root, "en/projects", event.project, "index.html")));
}
const sorted = [...events].sort((a, b) => b.date.localeCompare(a.date)).map((event) => event.id);
for (const lang of ["en", "zh-hk"]) {
  const html = readFileSync(join(root, lang, "projects/index.html"), "utf8");
  const rows = [...html.matchAll(/<tr role="row" data-event-id="([^"]+)" data-event-date="([^"]+)">([\s\S]*?)<\/tr>/g)];
  assert.deepEqual(rows.map((row) => row[1]), sorted, "Events must render in date order");
  assert.ok(rows.every((row) => (row[3].match(/<td\b/g) || []).length === 5));
  assert.ok(!/undefined|Invalid Date|活動策劃 \/ undefined/.test(rows.map((row) => row[3]).join("")));
  assert.equal((html.match(/class="event-photo"/g) || []).length, events.filter((event) => event.image).length);
  const section = html.slice(html.indexOf('id="event-history"'), html.indexOf('</section>', html.indexOf('id="event-history"')));
  assert.ok(!/event-note|event-history-caption|View imagery source|查看影像來源|<a[^>]+https?:/.test(section), "Research notes and external links must not be published");
  assert.equal((section.match(/class="event-photo"/g) || []).length, 20);
    assert.ok(section.includes("2024年11月15-17日"), "Compact Chinese range format");
    assert.ok(section.includes("2022年8月27-28日"));
    assert.ok(section.includes("2026年5月29日"));
    assert.ok(!section.includes("2024年11月15日 –"));
  assert.match(html, /href="#event-history"/);
  assert.match(html, /role="region" aria-label="[^"]+" tabindex="0"/);
  assert.match(html, /<th scope="col"/);
}
assert.equal(events.find((event) => event.id === "foresight-2023").date, "2022-12-02");
assert.equal(events.find((event) => event.id === "hkgcc-165").date, "2026-05-29");
console.log("Event history checks passed: 20 events, two languages, chronology, requested date format, local photos, and no public notes or source links.");
