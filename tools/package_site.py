"""Build and stage only public website files for static hosting."""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
import runpy
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def package(output):
    result = runpy.run_path(str(ROOT / "build.py"))
    if result["problems"]:
        raise RuntimeError("Source validation failed; refusing to publish")
    output.mkdir(parents=True, exist_ok=True)
    prefix = ('<!doctype html>\n<html lang="zh-Hant">\n'
              '<meta charset="utf-8">\n'
              '<meta name="viewport" content="width=device-width, initial-scale=1">\n')
    for source, target in [("index3d.html", "index.html"),
                           ("index3d.html", "index3d.html"),
                           ("index.html", "2d.html")]:
        html = (ROOT / source).read_text(encoding="utf-8")
        (output / target).write_text(prefix + html + "\n</html>\n", encoding="utf-8")
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    version = {"version": (ROOT / "VERSION").read_text(encoding="utf-8").strip(),
               "commit": commit, "built_at": datetime.now(timezone.utc).isoformat()}
    (output / "version.json").write_text(json.dumps(version) + "\n", encoding="utf-8")
    # A public HTTPS image is required by social crawlers; data URIs do not work.
    # Host on existing Pages so already-installed NAS updaters need no new asset step.
    (output / "social-preview.jpg").write_bytes((ROOT / "assets/social-preview.jpg").read_bytes())
    (output / ".nojekyll").touch()
    (output / "site-config.json").write_text((ROOT / "site-config.json").read_text(encoding="utf-8"), encoding="utf-8")
    (output / "counter.php.txt").write_bytes((ROOT / "deploy/counter.php").read_bytes())
    print(f"Staged website at {output}; commit={commit}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "out/site")
    package(parser.parse_args().output)
