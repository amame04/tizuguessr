import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const names = JSON.parse(await read('data/prefectures.json'));
const input = (await read('data/crossing-ids.txt')).trim().split(/\s+/).map(Number);
const inputIds = new Set(input);
assert.equal(inputIds.size, input.length, 'Input IDs must be unique');
const index = JSON.parse(await read('public/data/index.json'));
const report = JSON.parse(await read('public/data/report.json'));
assert.equal(index.version, 1);
assert.equal(index.prefectures.length, 47);
assert.ok(Number.isFinite(Date.parse(index.generatedAt)));
assert.ok(Number.isFinite(Date.parse(index.source.osmTimestamp)));
assert.match(index.source.sha256, /^[a-f0-9]{64}$/);
assert.equal(index.source.license, 'ODbL-1.0');
assert.equal(index.source.idsSha256, createHash('sha256').update(await read('data/crossing-ids.txt')).digest('hex'));
const seen = new Set();
let total = 0;
for (const [i, entry] of index.prefectures.entries()) {
  const code = String(i + 1).padStart(2, '0');
  assert.equal(entry.code, code);
  assert.equal(entry.name, names[i]);
  assert.match(entry.file, new RegExp(`^crossings/${code}-[a-f0-9]{16}\\.json$`));
  const text = await read(`public/data/${entry.file}`);
  const hash = createHash('sha256').update(text).digest('hex').slice(0, 16);
  assert.equal(entry.file, `crossings/${code}-${hash}.json`);
  const data = JSON.parse(text);
  assert.equal(data.version, 1);
  assert.equal(data.prefecture, code);
  assert.equal(data.crossings.length, entry.count);
  assert.ok(entry.count > 0);
  let previous = 0;
  for (const row of data.crossings) {
    assert.equal(row.length, 3);
    const [id, lat, lng] = row;
    assert.ok(Number.isSafeInteger(id) && id > previous);
    assert.ok(inputIds.has(id), `Unexpected node: ${id}`);
    assert.ok(!seen.has(id), `Duplicate node: ${id}`);
    assert.ok(Number.isFinite(lat) && lat >= 20 && lat <= 46, `Invalid Japan latitude: ${lat}`);
    assert.ok(Number.isFinite(lng) && lng >= 122 && lng <= 154, `Invalid Japan longitude: ${lng}`);
    seen.add(id);
    previous = id;
  }
  total += entry.count;
}
assert.equal(total, index.total);
assert.equal(total, report.included);
assert.equal(report.input, input.length);
assert.equal(report.missingIds.length, report.missingCount);
assert.equal(report.unresolvedIds.length, report.unresolvedCount);
assert.equal(report.missingCount, index.excluded.missing);
assert.equal(report.unresolvedCount, index.excluded.unresolved);
assert.ok(total >= input.length * 0.95, 'Unexpectedly low coverage');
for (const id of [...report.missingIds, ...report.unresolvedIds]) {
  assert.ok(inputIds.has(id) && !seen.has(id), `Invalid excluded ID: ${id}`);
  seen.add(id);
}
assert.equal(seen.size, inputIds.size, 'Every input ID must be included or accounted for');
console.log(`Validated ${total.toLocaleString()} crossings across 47 prefectures; missing=${report.missingCount}, unresolved=${report.unresolvedCount}`);
