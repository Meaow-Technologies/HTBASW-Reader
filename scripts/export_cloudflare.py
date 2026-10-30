from pathlib import Path
import shutil, re, zipfile

root = Path(__file__).resolve().parents[1]
src = root / "dist"
out = root / ".build-upload"
if out.exists():
    shutil.rmtree(out)
shutil.copytree(src, out)
# Domain-independent export: do not publish localhost canonical URLs or sitemap.
for p in out.rglob("*.html"):
    s = p.read_text()
    s = re.sub(r'<link\b[^>]*rel="canonical"[^>]*>\s*', "", s)
    s = re.sub(r'<meta\b[^>]*content="http://127\.0\.0\.1:8766[^"]*"[^>]*>\s*', "", s)
    s = re.sub(
        r'<script type="application/ld\+json">.*?</script>\s*', "", s, flags=re.S
    )
    p.write_text(s)
(out / "sitemap.xml").unlink(missing_ok=True)
p = out / "robots.txt"
p.write_text(
    "\n".join(l for l in p.read_text().splitlines() if not l.startswith("Sitemap:"))
    + "\n"
)
# Remove unused legacy novel artwork from the export; retain icons, profiles and server artwork.
legacy = [
    "background.png",
    "background.webp",
    "background_image-2.jpg",
    "first-cover.webp",
    "revised-cover.webp",
    "revised.jpg",
]
text = "\n".join(
    p.read_text(errors="ignore")
    for p in out.rglob("*")
    if p.is_file() and p.suffix in {".html", ".js", ".css", ".json"}
)
for name in legacy:
    if name not in text:
        (out / "assets/images" / name).unlink(missing_ok=True)
files = [p for p in out.rglob("*") if p.is_file()]
assert len(files) < 1000
assert all(p.stat().st_size < 25 * 1024 * 1024 for p in files)
assert not any(
    "127.0.0.1:8766" in p.read_text(errors="ignore")
    for p in files
    if p.suffix in {".html", ".xml", ".txt"}
)
archive = root / "HTBASW-Cloudflare-Upload.zip"
with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as z:
    for p in files:
        z.write(p, p.relative_to(out))
with zipfile.ZipFile(archive) as z:
    assert "index.html" in z.namelist()
    assert z.testzip() is None
print(
    f"Upload ZIP verified: {len(files)} files; {archive.stat().st_size/1048576:.1f} MB"
)
