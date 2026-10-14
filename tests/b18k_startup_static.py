"""B18-K static checks: run from repository root with python tests/b18k_startup_static.py."""
from pathlib import Path
import re, hashlib, json
root=Path(__file__).resolve().parents[1] / 'public'
html=(root/'index.html').read_text(encoding='utf-8')
style=re.search(r'<style>(.*?)</style>',html,re.S)
assert style and all(key in style.group(1) for key in (
 '#startup .loading-inner','#startup .loading-logo','#startup h2','#startup p',
 '#startup .loading-spinner','prefers-reduced-motion','#startup.is-complete'))
assert 'Carregando agenda' in html and '14 e 15 de outubro · São Paulo' in html
assert '<link rel="preload" href="/logo-conahp.svg" as="image"' in html
assert 'conahp2026:flora:preferences:b18' in (root/'b18.js').read_text()
assert 'conahp-b18j-public-v1' in (root/'service-worker.js').read_text()
expected={
 'schedule.json':'0eb7a64a6d10afde2b9890969518a80024cdca03',
 'schedule-utils.js':'603002d521d4ccb03a6830805dda56b8c83c3234',
 'logo-conahp.svg':'b06b4ce8037cd67ff7bc06122931a16f49ed20b4',
 'icon-192.png':'643ac882cdc3fbd1a7ff499b2e83eab3bc706cc0',
 'icon-512.png':'4b539ae04d969284e33d459678422b0dfb53ac7f',
 'icon-maskable-192.png':'f1eaf7d1278a443a15968c5006bf900ad21d6b5a',
 'icon-maskable-512.png':'47a92c0c4aec518e9c4720e9c4e9a0cd411b8721',
 'manifest.webmanifest':'e8969612104f3e205b81face97f1009c6f54fd3a'}
for name,sha in expected.items():
 assert hashlib.sha1((root/name).read_bytes()).hexdigest()==sha,name
assert json.loads((root/'manifest.webmanifest').read_text())['display']=='standalone'
print('PASS B18-K: first paint independent of external CSS; 8 immutable assets verified')
