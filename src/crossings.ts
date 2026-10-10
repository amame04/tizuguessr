import prefectureNames from '../data/prefectures.json' with { type: 'json' };

export const prefectures: readonly string[] = prefectureNames;

interface PrefectureFile {
  code: string;
  name: string;
  file: string;
  count: number;
}

interface Index {
  version: number;
  total: number;
  prefectures: PrefectureFile[];
}

export interface Crossing {
  id: number;
  lat: number;
  lng: number;
  pref: string;
}

type Row = [number, number, number];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseIndex(value: unknown): Index {
  if (!isObject(value) || value.version !== 1 || !Number.isSafeInteger(value.total)
    || !Array.isArray(value.prefectures) || value.prefectures.length !== prefectures.length) {
    throw new Error('Invalid crossing index');
  }
  const entries: PrefectureFile[] = [];
  for (const [i, entry] of value.prefectures.entries()) {
    const code = String(i + 1).padStart(2, '0');
    if (!isObject(entry) || entry.code !== code || entry.name !== prefectures[i]
      || typeof entry.file !== 'string'
      || !new RegExp(`^crossings/${code}-[a-f0-9]{16}\\.json$`).test(entry.file)
      || typeof entry.count !== 'number' || !Number.isSafeInteger(entry.count) || entry.count <= 0) {
      throw new Error('Invalid prefecture entry');
    }
    entries.push({ code, name: entry.name, file: entry.file, count: entry.count });
  }
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  if (!Number.isSafeInteger(total) || total !== value.total) {
    throw new Error('Crossing counts do not match');
  }
  return { version: 1, total, prefectures: entries };
}

function parseRows(value: unknown, entry: PrefectureFile): Row[] {
  if (!isObject(value) || value.version !== 1 || value.prefecture !== entry.code
    || !Array.isArray(value.crossings) || value.crossings.length !== entry.count) {
    throw new Error('Invalid prefecture data');
  }
  const rows: Row[] = [];
  let previousId = 0;
  for (const row of value.crossings) {
    if (!Array.isArray(row) || row.length !== 3
      || typeof row[0] !== 'number' || !Number.isSafeInteger(row[0]) || row[0] <= previousId
      || typeof row[1] !== 'number' || !Number.isFinite(row[1]) || row[1] < -90 || row[1] > 90
      || typeof row[2] !== 'number' || !Number.isFinite(row[2]) || row[2] < -180 || row[2] > 180) {
      throw new Error('Invalid crossing coordinates or ID');
    }
    previousId = row[0];
    rows.push([row[0], row[1], row[2]]);
  }
  return rows;
}

export function createCrossingLoader(fetcher: typeof fetch = fetch, random = Math.random) {
  let indexPromise: Promise<Index> | undefined;
  const shards = new Map<string, Promise<Row[]>>();

  async function loadJson(path: string) {
    const response = await fetcher(`./data/${path}`);
    if (!response.ok) throw new Error(`Could not load crossing data: HTTP ${response.status}`);
    return response.json() as Promise<unknown>;
  }

  return async function getRandomCrossing(): Promise<Crossing> {
    indexPromise ??= loadJson('index.json').then(parseIndex).catch(error => {
      indexPromise = undefined;
      throw error;
    });
    const index = await indexPromise;
    const draw = random();
    if (!Number.isFinite(draw) || draw < 0 || draw >= 1) throw new Error('Invalid random value');
    // Selecting a global row gives every crossing the same probability.
    let offset = Math.floor(draw * index.total);
    for (const entry of index.prefectures) {
      if (offset >= entry.count) {
        offset -= entry.count;
        continue;
      }
      let shard = shards.get(entry.file);
      if (!shard) {
        shard = loadJson(entry.file).then(value => parseRows(value, entry)).catch(error => {
          shards.delete(entry.file);
          throw error;
        });
        shards.set(entry.file, shard);
      }
      const [id, lat, lng] = (await shard)[offset];
      return { id, lat, lng, pref: entry.name };
    }
    throw new Error('Could not select crossing');
  };
}

export const getRandomCrossing = createCrossingLoader();
