"""Generate quiz data from an OSM extract; never calls an external API."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import shutil
import tempfile

import osmium
from shapely import wkb
from shapely.geometry import Point
from shapely.prepared import prep
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parent.parent
NAMES = json.loads((ROOT / 'data/prefectures.json').read_text(encoding='utf-8'))
CODES = {f'JP-{i:02}': name for i, name in enumerate(NAMES, 1)}


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def read_ids(path):
    ids = [int(line) for line in path.read_text(encoding='utf-8').splitlines() if line.strip()]
    if not ids or any(value <= 0 for value in ids) or len(ids) != len(set(ids)):
        raise ValueError('Input IDs must be positive, unique and non-empty')
    return set(ids)


def extract_boundaries(source, output):
    print('Extracting prefecture relations and their referenced ways/nodes...', flush=True)
    found = set()
    processor = osmium.FileProcessor(source, osmium.osm.RELATION).with_filter(
        osmium.filter.KeyFilter('ISO3166-2'))
    with osmium.BackReferenceWriter(output, ref_src=source, relation_depth=3) as writer:
        for relation in processor:
            code = relation.tags.get('ISO3166-2')
            if code in CODES and relation.tags.get('boundary') == 'administrative':
                if code in found:
                    raise ValueError(f'Duplicate prefecture relation: {code}')
                found.add(code)
                writer.add(relation)
    if found != set(CODES):
        raise ValueError(f'Missing prefecture relations: {sorted(set(CODES) - found)}')


def load_boundaries(source):
    factory = osmium.geom.WKBFactory()
    boundaries = {}
    processor = osmium.FileProcessor(source).with_areas().with_filter(
        osmium.filter.EntityFilter(osmium.osm.AREA))
    for area in processor:
        code = area.tags.get('ISO3166-2')
        if code in CODES and not area.from_way():
            geometry = wkb.loads(factory.create_multipolygon(area), hex=True)
            if geometry.is_empty or not geometry.is_valid:
                raise ValueError(f'Invalid boundary geometry: {code}')
            if code in boundaries:
                raise ValueError(f'Duplicate boundary: {code}')
            boundaries[code] = geometry
    if set(boundaries) != set(CODES):
        raise ValueError(f'Incomplete boundaries: {sorted(set(CODES) - set(boundaries))}')
    return boundaries


class PrefectureLookup:
    def __init__(self, boundaries):
        self.codes = sorted(boundaries)
        geometries = [boundaries[code] for code in self.codes]
        self.tree = STRtree(geometries)
        self.prepared = [prep(geometry) for geometry in geometries]

    def find(self, lat, lng):
        point = Point(lng, lat)
        # Covers also detects a shared border; ambiguous border points are excluded.
        candidates = [self.codes[int(i)] for i in self.tree.query(point)
                      if self.prepared[int(i)].covers(point)]
        return candidates[0] if len(candidates) == 1 else None


def extract_crossings(source, ids, lookup):
    groups = {code: [] for code in CODES}
    seen = set()
    excluded = []
    processor = osmium.FileProcessor(source, osmium.osm.NODE).with_filter(
        osmium.filter.IdFilter(ids))
    print(f'Extracting coordinates for {len(ids):,} IDs...', flush=True)
    for node in processor:
        if node.id in seen:
            raise ValueError(f'Duplicate OSM node: {node.id}')
        seen.add(node.id)
        if not node.location.valid():
            excluded.append(node.id)
            continue
        lat, lng = node.lat, node.lon
        code = lookup.find(lat, lng)
        if code is None:
            excluded.append(node.id)
        else:
            # Preserve OSM's coordinate precision, including points near borders.
            groups[code].append([node.id, lat, lng])
    return groups, sorted(ids - seen), sorted(excluded)


def write_dataset(output, groups, metadata, report):
    if any(not rows for rows in groups.values()):
        raise ValueError('Every prefecture must have at least one crossing')
    output.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix='.crossings-', dir=output.parent))
    backup = output.with_name(output.name + '.backup')
    try:
        (staging / 'crossings').mkdir()
        entries = []
        for code, rows in sorted(groups.items()):
            rows.sort(key=lambda row: row[0])
            payload = json.dumps({'version': 1, 'prefecture': code[3:], 'crossings': rows},
                                 ensure_ascii=False, separators=(',', ':')) + '\n'
            digest = hashlib.sha256(payload.encode()).hexdigest()
            filename = f'crossings/{code[3:]}-{digest[:16]}.json'
            (staging / filename).write_text(payload, encoding='utf-8')
            entries.append({'code': code[3:], 'name': CODES[code], 'file': filename,
                            'count': len(rows)})
        index = dict(metadata, version=1, total=sum(e['count'] for e in entries),
                     prefectures=entries)
        (staging / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (staging / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (staging / 'LICENSE.txt').write_text(
            'Contains information from OpenStreetMap, available under the Open Database License (ODbL) 1.0.\n'
            'Copyright OpenStreetMap contributors.\n'
            'https://www.openstreetmap.org/copyright\n'
            'https://opendatacommons.org/licenses/odbl/1-0/\n'
            'OSM extract provided by Geofabrik: https://download.geofabrik.de/asia/japan.html\n')
        if backup.exists():
            raise ValueError(f'Resolve previous backup before generating: {backup}')
        if output.exists():
            output.rename(backup)
        try:
            staging.rename(output)
        except BaseException:
            if backup.exists():
                backup.rename(output)
            raise
        if backup.exists():
            shutil.rmtree(backup)
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--osm', type=Path, required=True, help='Japan .osm.pbf extract')
    parser.add_argument('--source-url', required=True, help='URL identifying the source snapshot')
    parser.add_argument('--ids', type=Path, default=ROOT / 'data/crossing-ids.txt')
    parser.add_argument('--output', type=Path, default=ROOT / 'public/data')
    args = parser.parse_args()
    source, output = args.osm.resolve(), args.output.resolve()
    if source == output or output in source.parents or output in args.ids.resolve().parents:
        raise ValueError('Input files must be outside the generated output directory')
    if not re.match(r'^https://', args.source_url):
        raise ValueError('Provide the HTTPS source URL for provenance')
    ids = read_ids(args.ids)
    with osmium.io.Reader(str(source)) as reader:
        timestamp = reader.header().get('osmosis_replication_timestamp')
    if not timestamp:
        raise ValueError('OSM extract must include a replication timestamp')
    with tempfile.TemporaryDirectory(prefix='tizuguessr-boundaries-') as work:
        boundary_file = Path(work) / 'boundaries.osm.pbf'
        extract_boundaries(source, boundary_file)
        boundaries = load_boundaries(boundary_file)
        lookup = PrefectureLookup(boundaries)
        # Regression locations: supplied Hokkaido response and Kyoto's Shimogamo area.
        for lat, lng, expected in [(42.9159778, 143.0491587, 'JP-01'),
                                   (35.0449, 135.7718, 'JP-26')]:
            if lookup.find(lat, lng) != expected:
                raise ValueError(f'Prefecture regression failed: {expected}')
        groups, missing, excluded = extract_crossings(source, ids, lookup)
        total = sum(map(len, groups.values()))
        if total < len(ids) * 0.95:
            raise ValueError(f'Too many exclusions: only {total}/{len(ids)} remain')
        report = {'input': len(ids), 'included': total, 'missingCount': len(missing),
                  'unresolvedCount': len(excluded), 'missingIds': missing, 'unresolvedIds': excluded}
        metadata = {'generatedAt': datetime.now(timezone.utc).isoformat(),
                    'source': {'url': args.source_url, 'osmTimestamp': timestamp,
                               'sha256': sha256(source), 'idsSha256': sha256(args.ids),
                               'attribution': '© OpenStreetMap contributors',
                               'license': 'ODbL-1.0'},
                    'excluded': {'missing': len(missing), 'unresolved': len(excluded)}}
        write_dataset(output, groups, metadata, report)
        print(f'Generated {total:,} crossings; missing={len(missing)}, unresolved={len(excluded)}', flush=True)


if __name__ == '__main__':
    main()
