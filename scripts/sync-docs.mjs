import { cpSync, rmSync, statSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
const docs = new URL('../docs/', import.meta.url);

// ビルド結果が存在することを確認してから、公開用ファイルを置き換える。
if (!statSync(dist).isDirectory()) {
  throw new Error('dist directory is missing');
}
rmSync(docs, { recursive: true, force: true });
cpSync(dist, docs, { recursive: true });
