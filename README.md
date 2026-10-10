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

## 出題データ

出題時は `public/data/index.json` と、抽選した都道府県のJSONを読み込みます。
Overpass API・Nominatimへの通信はありません。地図タイルはOpenStreetMapから取得します。
全交差点を同じ確率で抽選します。回答後は都道府県名と座標を表示します。

生成対象の交差点IDは `data/crossing-ids.txt`、都道府県名は `data/prefectures.json` です。
日本のOSM抽出ファイルから座標と行政境界を読み、所属を一意に決められる地点だけ収録します。
削除済みなど元データに存在しない地点、境界が重なる地点、所属不明の地点は除外します。
生成日時・OSM時点・入力ファイルのSHA-256を `index.json` に、除外IDを `report.json` に保存します。
47都道府県がそろい、元IDの95%以上を収録できた場合のみ公開データを置き換えます。
ファイル名には内容のハッシュを含め、更新時に古い都道府県データを誤って使うのを防ぎます。

更新にはPythonとデータ生成用ライブラリが必要です。通常のアプリ開発やビルドには不要です。

```sh
python3 -m venv .venv-data
.venv-data/bin/python -m pip install -r scripts/requirements-data.txt
.venv-data/bin/python scripts/generate-data.py \
  --osm japan-261009.osm.pbf \
  --source-url https://download.geofabrik.de/asia/japan-261009.osm.pbf
.venv-data/bin/python scripts/test-generate-data.py
npm run data:validate
npm test
npm run lint
npm run build
```

OSMファイルは[Geofabrikの日本データ](https://download.geofabrik.de/asia/japan.html)から取得します。
更新時はファイル名・URLを実際のスナップショットに変更してください。
`.osm.pbf`とPython仮想環境はGit管理対象外です。生成済みの `public/data` と `docs/data` はコミットします。

出題データは © OpenStreetMap contributors、[ODbL 1.0](https://www.openstreetmap.org/copyright) に基づき提供します。
生成済みデータのライセンス表示は `public/data/LICENSE.txt` にあります。
