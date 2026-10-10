import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('./osm.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const { getPref, prefectures } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);

test('実際の北海道の応答からprovinceを採用する', () => {
  const response = {
    display_name: '東一条一丁目, 芽室南, 芽室町, 河西郡, 十勝総合振興局, 北海道, 北海道地方, 082-0014, 日本',
    address: {
      neighbourhood: '東一条一丁目', quarter: '芽室南', town: '芽室町',
      county: '河西郡', subprovince: '十勝総合振興局', province: '北海道',
      'ISO3166-2-lvl4': 'JP-01', region: '北海道地方', postcode: '082-0014',
      country: '日本', country_code: 'jp',
    },
  };
  assert.equal(getPref(response.address), '北海道');
  const { postcode, ...withoutPostcode } = response.address;
  assert.equal(getPref(withoutPostcode), '北海道');
});

test('全47都道府県をstateとprovinceのどちらからも認識する', () => {
  for (const pref of prefectures) {
    assert.equal(getPref({ country_code: 'jp', state: pref }), pref);
    assert.equal(getPref({ country_code: 'jp', province: pref }), pref);
    assert.equal(getPref({ country_code: 'jp', state: pref, province: pref }), pref);
  }
});

test('施設名や他の住所階層にある都道府県名は採用しない', () => {
  assert.equal(getPref({ country_code: 'jp', state: '東京都', neighbourhood: '北海道' }), '東京都');
  assert.equal(getPref({ country_code: 'jp', neighbourhood: '北海道', region: '北海道地方' }), null);
});

test('欠落、不正値、国外、都道府県の矛盾はnullを返す', () => {
  for (const address of [
    undefined, null, {}, { country_code: 'jp' },
    { country_code: 'jp', state: '北海道地方' },
    { country_code: 'jp', province: '十勝総合振興局' },
    { country_code: 'us', state: '北海道' },
    { state: '北海道' },
    { country_code: 'jp', state: '東京都', province: '北海道' },
  ]) {
    assert.equal(getPref(address), null);
  }
});
