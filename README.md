# 地図げっさー

開発には Node.js 22.13 以上の 22 系、または 24 以上を使用してください。

```sh
npm ci
npm run dev
```

検証は `npm test`、`npm run lint`、`npx tsc -b && npx vite build` で実行できます。
`npm run build` はビルド成功後に公開用の `docs` 全体を `dist` の内容で置き換えます。
`docs` 内に手作業でファイルを追加せず、静的ファイルは `public` に置いてください。
通常の検証では上記コマンドを使用します。`npm run rebuild` は `npm run build` と同じ処理です。
