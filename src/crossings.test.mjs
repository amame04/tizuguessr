import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('./crossings.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const moduleText = outputText.replace('../data/prefectures.json', new URL('../data/prefectures.json', import.meta.url).href);
const { createCrossingLoader, prefectures } = await import(
  `data:text/javascript;base64,${Buffer.from(moduleText).toString('base64')}`
);

function fixture() {
  const files = new Map();
  const entries = prefectures.map((name, i) => {
    const code = String(i + 1).padStart(2, '0');
    const count = i === 0 ? 2 : i === 1 ? 3 : 1;
    const file = `crossings/${code}-0123456789abcdef.json`;
    files.set(`./data/${file}`, {
      version: 1, prefecture: code,
      crossings: Array.from({ length: count }, (_, j) => [i * 10 + j + 1, 35 + j / 10, 135]),
    });
    return { code, name, count, file };
  });
  const index = { version: 1, total: entries.reduce((sum, entry) => sum + entry.count, 0), prefectures: entries };
  files.set('./data/index.json', index);
  const requests = [];
  const fetcher = async path => {
    requests.push(path);
    assert.ok(path.startsWith('./data/'), `External request: ${path}`);
    const data = files.get(path);
    return data ? new Response(JSON.stringify(data)) : new Response('Not found', { status: 404 });
  };
  return { files, index, requests, fetcher };
}

test('全地点の先頭・都道府県境界・末尾を均等に抽選できる', async () => {
  const f = fixture();
  let row = 0;
  const loader = createCrossingLoader(f.fetcher, () => (row + 0.5) / f.index.total);
  const actual = [];
  for (row = 0; row < f.index.total; row++) {
    const place = await loader();
    actual.push([place.pref, place.id]);
  }
  const expected = f.index.prefectures.flatMap(entry =>
    f.files.get(`./data/${entry.file}`).crossings.map(([id]) => [entry.name, id]));
  assert.deepEqual(actual, expected);
  assert.equal(f.requests.filter(path => path.endsWith('index.json')).length, 1);
  assert.equal(f.requests.length, 48);
});

test('必要な都道府県だけ読み込み、並行呼び出しでも重複取得しない', async () => {
  const f = fixture();
  const loader = createCrossingLoader(f.fetcher, () => 0);
  const [first, second] = await Promise.all([loader(), loader()]);
  assert.deepEqual(first, second);
  assert.equal(first.pref, '北海道');
  assert.deepEqual(f.requests, ['./data/index.json', `./data/${f.index.prefectures[0].file}`]);
});

test('HTTPエラーで明示的に失敗し、次の呼び出しで再取得できる', async () => {
  const f = fixture();
  const path = `./data/${f.index.prefectures[0].file}`;
  const saved = f.files.get(path);
  f.files.delete(path);
  const loader = createCrossingLoader(f.fetcher, () => 0);
  await assert.rejects(loader(), /HTTP 404/);
  f.files.set(path, saved);
  assert.equal((await loader()).pref, '北海道');
});

test('HTMLのエラー応答を問題として扱わない', async () => {
  const loader = createCrossingLoader(async () => new Response('<html>busy</html>'), () => 0);
  await assert.rejects(loader());
});

test('件数不一致・都道府県の取り違え・不正座標・重複IDを拒否する', async () => {
  for (const mutate of [
    f => { f.index.total++; },
    f => { f.index.prefectures[0].name = '京都府'; },
    f => { f.files.get(`./data/${f.index.prefectures[0].file}`).prefecture = '26'; },
    f => { f.files.get(`./data/${f.index.prefectures[0].file}`).crossings.pop(); },
    f => { f.files.get(`./data/${f.index.prefectures[0].file}`).crossings[0][1] = 91; },
    f => { f.files.get(`./data/${f.index.prefectures[0].file}`).crossings[1][0] = 1; },
    f => { f.index.prefectures[0].file = '../outside.json'; },
  ]) {
    const f = fixture();
    mutate(f);
    await assert.rejects(createCrossingLoader(f.fetcher, () => 0)());
  }
});
