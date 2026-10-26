#!/usr/bin/env python3
"""Small public GET probes; caches locally and emits structural evidence only."""

import argparse
import hashlib
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache' / 'audit'
PROBES = {
    'official-eligibility': ('https://web-view.app.pokemonchampions.jp/battle/pages/events/rs178713870219xeaaio/en/pokemon.html', 'html'),
    'limitless-games': ('https://play.limitlesstcg.com/api/games', 'json'),
    'limitless-tournaments': ('https://play.limitlesstcg.com/api/tournaments?game=VGC&format=M-C&limit=3', 'json'),
    'limitless-details': ('https://play.limitlesstcg.com/api/tournaments/6acfe5ff8a8383117e3ebdde/details', 'json'),
    'limitless-standings': ('https://play.limitlesstcg.com/api/tournaments/6acfe5ff8a8383117e3ebdde/standings', 'json'),
    'pokeapi-version-groups': ('https://pokeapi.co/api/v2/version-group/?limit=100', 'json'),
    'pokeapi-garchomp': ('https://pokeapi.co/api/v2/pokemon/garchomp', 'json'),
    'champions-garchomp': ('https://championsbattledata.com/api/pokemon/garchomp?format=Doubles', 'json'),
}


def iso(timestamp):
    return datetime.fromtimestamp(timestamp, timezone.utc).isoformat()


def collect(refresh):
    CACHE.mkdir(parents=True, exist_ok=True)
    data, records = {}, []
    for name, (url, extension) in PROBES.items():
        path = CACHE / f'{name}.{extension}'
        try:
            if refresh or not path.exists():
                temporary = path.with_suffix('.download')
                try:
                    subprocess.run([
                        'curl', '--fail', '--silent', '--show-error', '--location',
                        '--proto', '=https', '--proto-redir', '=https', '--max-time', '25',
                        '--dump-header', str(CACHE / f'{name}.headers'),
                        '--output', str(temporary), url,
                    ], check=True, capture_output=True, text=True)
                    payload = temporary.read_bytes()
                    if extension == 'json':
                        json.loads(payload)
                    temporary.replace(path)
                finally:
                    temporary.unlink(missing_ok=True)
            payload = path.read_bytes()
            data[name] = json.loads(payload) if extension == 'json' else payload.decode()
            records.append({
                'id': name, 'url': url, 'status': 'readable', 'cachedAt': iso(path.stat().st_mtime),
                'bytes': len(payload), 'sha256': hashlib.sha256(payload).hexdigest(),
            })
        except (OSError, subprocess.CalledProcessError, ValueError) as error:
            detail = error.stderr if isinstance(error, subprocess.CalledProcessError) else str(error)
            records.append({'id': name, 'url': url, 'status': 'error', 'error': detail.strip()})
    return data, records


def summarize(data):
    findings = {}
    if 'official-eligibility' in data:
        match = re.search(r'const pokemons\s*=\s*(\[.*?\]);\s*const', data['official-eligibility'], re.S)
        if not match:
            raise ValueError('The official eligibility page changed: array not found.')
        rows = json.loads(match.group(1))
        findings['officialEligibility'] = {
            'entryCount': len(rows), 'uniqueOfficialIds': len({r[0] for r in rows}),
            'uniqueNationalDexNumbers': len({r[0].split('-')[0] for r in rows}),
            'scope': 'Published entries, not a complete catalogue of battle transformations.',
            'mappingExamples': [{'officialId': r[0], 'label': r[2]} for r in rows
                                if r[2] in ['Floette', 'Vivillon', 'Maushold', 'Squawkabilly']],
        }
    if 'limitless-games' in data:
        games = data['limitless-games']
        vgc = next(game for game in games if game['id'] == 'VGC')
        findings['limitlessFormats'] = {'game': 'VGC', 'mCLabel': vgc['formats'].get('M-C'), 'platforms': vgc['platforms']}
    if 'limitless-tournaments' in data:
        findings['tournamentDiscovery'] = {
            'limit': 3,
            'events': [{key: row.get(key) for key in ['id', 'name', 'date', 'format', 'players']}
                       for row in data['limitless-tournaments']],
            'scope': 'Discovery sample; not a metagame frequency estimate.',
        }
    if 'limitless-details' in data and 'limitless-standings' in data:
        details = data['limitless-details']
        standings = data['limitless-standings']
        lists = [row['decklist'] for row in standings if row.get('decklist')]
        members = [member for team in lists if isinstance(team, list) for member in team]
        findings['teamlistCoverage'] = {
            'eventId': details['id'], 'eventName': details['name'], 'eventDate': details['date'],
            'format': details['format'], 'platform': details['platform'], 'isPublic': details['isPublic'],
            'rows': len(standings), 'rowsWithTeamlist': len(lists),
            'teamSizeCounts': {str(size): sum(len(team) == size for team in lists)
                               for size in sorted({len(team) for team in lists})},
            'memberFieldNames': sorted({key for member in members for key in member}),
            'membersWithSpOrEvFields': sum(any(key.lower() in ['evs', 'sp', 'statpoints', 'stat_points']
                                                for key in member) for member in members),
            'scope': 'Field coverage only. No player names or raw teamlists redistributed; legality not yet validated.',
        }
    if 'pokeapi-version-groups' in data:
        groups = data['pokeapi-version-groups']
        findings['pokeapiChampionsGroup'] = {
            'present': any(row['name'] == 'champions' for row in groups['results']),
            'paginationComplete': groups.get('next') is None,
        }
    if 'pokeapi-garchomp' in data:
        pokemon = data['pokeapi-garchomp']
        findings['pokeapiGarchomp'] = {
            'baseStats': {row['stat']['name']: row['base_stat'] for row in pokemon['stats']},
            'movesWithChampionsVersionGroup': sum(any(v['version_group']['name'] == 'champions'
                for v in move['version_group_details']) for move in pokemon['moves']),
            'scope': 'Community data coverage; not official M-C legality.',
        }
    if 'champions-garchomp' in data:
        pokemon = data['champions-garchomp']
        primary = pokemon['summary']['primary']
        findings['battleDataSemantics'] = {
            'showdownId': pokemon['showdownId'], 'format': pokemon['requestedFormat'],
            'requestedSeason': pokemon['requestedSeason'],
            'summaryBaseStatsHp': pokemon['summary']['baseStats']['hp'],
            'summaryPrimaryHp': primary['hp'],
            'summaryPrimaryBaseStatTotal': primary['base_stat_total'],
            'battleSummaryCategories': sorted(pokemon['battleSummary']['values']),
            'scope': 'baseStats fields need an explicit mapping. Aggregates do not establish a joint set or a real team.',
        }
    return findings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true', help='Repeat the eight public GET requests.')
    parser.add_argument('--output', type=Path, help='Write the structural report to this file.')
    args = parser.parse_args()
    data, records = collect(args.refresh)
    report = {
        'schemaVersion': 1, 'generatedAt': datetime.now(timezone.utc).isoformat(),
        'probes': records, 'findings': summarize(data),
        'rawResponsesPublished': False,
    }
    serialized = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(serialized)
    print(serialized, end='')
    return int(any(record['status'] == 'error' for record in records))


if __name__ == '__main__':
    raise SystemExit(main())
