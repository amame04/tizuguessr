import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from shapely.geometry import Polygon, MultiPolygon, box

spec = importlib.util.spec_from_file_location('generate_data', Path(__file__).with_name('generate-data.py'))
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)


class GenerationTests(unittest.TestCase):
    def test_holes_islands_and_ambiguous_borders(self):
        land = Polygon([(0, 0), (2, 0), (2, 2), (0, 2)],
                       holes=[[(0.5, 0.5), (1, 0.5), (1, 1), (0.5, 1)]])
        lookup = generator.PrefectureLookup({
            'JP-01': MultiPolygon([land, box(4, 4, 5, 5)]),
            'JP-02': box(2, 0, 3, 2),
        })
        self.assertEqual(lookup.find(0.25, 0.25), 'JP-01')
        self.assertEqual(lookup.find(4.5, 4.5), 'JP-01')
        self.assertIsNone(lookup.find(0.75, 0.75))
        self.assertIsNone(lookup.find(1, 2))
        self.assertIsNone(lookup.find(9, 9))

    def test_osm_pipeline_and_missing_nodes(self):
        with tempfile.TemporaryDirectory() as work, patch.dict(
                generator.CODES, {'JP-01': '北海道', 'JP-02': '青森県'}, clear=True):
            work = Path(work)
            nodes = [(1, 0, 0), (2, 2, 0), (3, 2, 2), (4, 0, 2),
                     (5, 3, 0), (6, 3, 2), (9, 1, 1), (10, 2.5, 1), (11, 2, 1)]
            xml = '<osm version="0.6">' + ''.join(
                f'<node id="{i}" lon="{x}" lat="{y}" version="1"/>' for i, x, y in nodes)
            for i, refs in [(1, [1, 2, 3, 4, 1]), (2, [2, 5, 6, 3, 2])]:
                xml += f'<way id="{i}" version="1">' + ''.join(f'<nd ref="{n}"/>' for n in refs) + '</way>'
            for i in [1, 2]:
                xml += (f'<relation id="{i}" version="1"><member type="way" ref="{i}" role="outer"/>'
                        f'<tag k="type" v="boundary"/><tag k="boundary" v="administrative"/>'
                        f'<tag k="ISO3166-2" v="JP-{i:02}"/></relation>')
            source = work / 'source.osm'
            source.write_text(xml + '</osm>')
            boundary_file = work / 'boundaries.osm.pbf'
            generator.extract_boundaries(source, boundary_file)
            lookup = generator.PrefectureLookup(generator.load_boundaries(boundary_file))
            groups, missing, unresolved = generator.extract_crossings(source, {9, 10, 11, 12}, lookup)
            self.assertEqual(groups, {'JP-01': [[9, 1.0, 1.0]], 'JP-02': [[10, 1.0, 2.5]]})
            self.assertEqual(missing, [12])
            self.assertEqual(unresolved, [11])
            output = work / 'data'
            output.mkdir()
            (output / 'obsolete.json').write_text('old')
            generator.write_dataset(output, groups, {}, {})
            self.assertFalse((output / 'obsolete.json').exists())
            self.assertTrue((output / 'index.json').exists())
            with self.assertRaises(ValueError):
                generator.write_dataset(output, {'JP-01': []}, {}, {})
            self.assertTrue((output / 'index.json').exists())


if __name__ == '__main__':
    unittest.main()
