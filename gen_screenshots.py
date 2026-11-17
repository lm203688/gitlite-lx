"""Generate 3 B1 GitLite screenshots (VS Code mockups)"""
from PIL import Image, ImageDraw, ImageFont
import os

out = os.path.join(os.path.dirname(__file__), 'materials')
os.makedirs(out, exist_ok=True)

def vscode_bg(w, h, title):
    img = Image.new('RGB', (w, h), '#1e1e1e')
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 30], fill='#252526')
    d.text((10, 8), title, fill='#cccccc')
    d.rectangle([0, 30, 48, h], fill='#333333')
    d.rectangle([48, 30, 220, h], fill='#252526')
    return img, d

# 1. Inline blame
img, d = vscode_bg(1366, 768, 'GitLite - Inline Blame')
d.rectangle([220, 30, 1366, 768], fill='#1e1e1e')
colors = ['#569cd6', '#4ec9b0', '#dcdcaa', '#ce9178']
for i, c in enumerate(colors):
    y = 80 + i * 60
    d.rectangle([220, y, 224, y+40], fill=c)
    d.text((240, y+10), f'line {i+1}  // author: dev{i+1}', fill='#d4d4d4')
    d.ellipse([1350, 80+i*60, 1360, 80+i*60+8], fill=c)
img.save(os.path.join(out, 'screenshot-blame.png'))

# 2. File History
img, d = vscode_bg(1366, 768, 'GitLite - File History')
commits = ['a1b2c3d feat: add auth', 'e4f5g6h fix: login bug', 'i7j8k9l chore: deps', 'm0n1o2p feat: dashboard']
for i, c in enumerate(commits):
    y = 60 + i * 35
    d.text((55, y), c, fill='#cccccc')
d.text((55, 210), '50 recent commits', fill='#888888')
img.save(os.path.join(out, 'screenshot-history.png'))

# 3. Diff viewer
img, d = vscode_bg(1366, 768, 'GitLite - Diff Viewer')
d.rectangle([220, 30, 1366, 768], fill='#1e1e1e')
d.text((240, 60), 'Diff: a1b2c3d -> e4f5g6h', fill='#d4d4d4')
lines = [
    ('meta', '@@ -1,5 +1,5 @@'),
    ('context', '  const x = 1;'),
    ('removed', '- const old = true;'),
    ('added', '+ const new = false;'),
    ('context', '  return x;'),
]
for i, (t, txt) in enumerate(lines):
    y = 100 + i * 30
    if t == 'added':
        d.rectangle([240, y, 1366, y+28], fill='#264026')
        d.text((260, y+5), txt, fill='#6a9955')
    elif t == 'removed':
        d.rectangle([240, y, 1366, y+28], fill='#6e2b2b')
        d.text((260, y+5), txt, fill='#f48771')
    else:
        d.text((260, y+5), txt, fill='#d4d4d4')
img.save(os.path.join(out, 'screenshot-diff.png'))

print('3 screenshots saved to', out)
