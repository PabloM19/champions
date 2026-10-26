#!/usr/bin/env python3
"""Fetch the two pinned catalogue inputs, validate hashes, then extract trusted source."""

import hashlib
import json
import subprocess
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCK = json.loads(Path(__file__).with_name('input-lock.json').read_text())


def fetch(url, destination, expected_hash):
    destination = ROOT / destination
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not destination.exists():
        temporary = destination.with_suffix('.download')
        try:
            subprocess.run([
                'curl', '--fail', '--silent', '--show-error', '--location',
                '--proto', '=https', '--proto-redir', '=https', '--max-time', '60',
                '--output', str(temporary), url,
            ], check=True)
            actual = hashlib.sha256(temporary.read_bytes()).hexdigest()
            if actual != expected_hash:
                raise ValueError(f'Changed input at {url}: expected {expected_hash}, got {actual}. Review a new dataset version.')
            temporary.replace(destination)
        finally:
            temporary.unlink(missing_ok=True)
    actual = hashlib.sha256(destination.read_bytes()).hexdigest()
    if actual != expected_hash:
        raise ValueError(f'Cached input changed: {destination}')
    return destination


def main():
    official, showdown = LOCK['official'], LOCK['showdown']
    fetch(official['eligibilityUrl'], official['cachedHtml'], official['sha256'])
    archive = fetch(showdown['archiveUrl'], showdown['archivePath'], showdown['archiveSha256'])
    destination = ROOT / '.cache' / 'upstream'
    expected_prefix = 'pokemon-showdown-' + showdown['commit']
    with tarfile.open(archive) as source:
        if any(Path(member.name).parts[0] != expected_prefix for member in source.getmembers()):
            raise ValueError('Unexpected source archive prefix.')
        source.extractall(destination, filter='data')
    print('Pinned official list and Pokémon Showdown source are ready.')


if __name__ == '__main__':
    main()
