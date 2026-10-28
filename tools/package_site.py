"""Build and stage only public website files for static hosting."""
import argparse
import hashlib
import shutil
import zipfile
import json
from datetime import datetime, timezone
from pathlib import Path
import runpy
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def package(output):
    result = runpy.run_path(str(ROOT / "build.py"))
    if result["problems"]:
        raise RuntimeError("Source validation failed; refusing to publish")
    runpy.run_path(str(ROOT / "tools/build_greater_taipei_preserved.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_geographic_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_architecture_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_mobile_opening_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_mobile_panorama_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_policy_district_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_street_infill_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_transport_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_bridge_art_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_desktop_frame_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_activity_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_remote_traffic_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_marine_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_panorama_life_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_district_craft.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_district_craft_v2.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_landmark_assets_v030.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_taipei_real_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_taipei_real_shell_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_greater_taipei_real_map_preview.py"), run_name="__main__")
    runpy.run_path(str(ROOT / "tools/build_greater_taipei_region_preview.py"), run_name="__main__")
    output.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ROOT / "assets/art-v030", output / "assets/art-v030", dirs_exist_ok=True)
    prefix = ('<!doctype html>\n<html lang="zh-Hant">\n'
              '<meta charset="utf-8">\n'
              '<meta name="viewport" content="width=device-width, initial-scale=1">\n')
    for source, target in [("index3d.html", "index.html"),
                           ("index3d.html", "index3d.html"),
                           ("index.html", "2d.html")]:
        html = (ROOT / source).read_text(encoding="utf-8")
        (output / target).write_text(prefix + html + "\n</html>\n", encoding="utf-8")
    # Standalone art study, deliberately separate from the production city.
    for name in ["landmark-art-v0.3.0.html", "landmark-asset-art-v030.js", "landmark-assets-v030.js", "district-craft-v0.2.0.html", "district-craft-art-v2.js", "district-craft-v2.js", "district-craft-v0.1.0.html", "district-craft-art-v1.js", "district-craft-v1.js", "greater-taipei-v0.4.12.html", "panorama-life-v0412.js", "greater-taipei-v0.4.11.html", "transport-network-v0411.js", "marine-life-v0411.js", "greater-taipei-v0.4.10.html", "transport-network-v0410.js", "remote-traffic-v0410.js", "greater-taipei-v0.4.9.html", "v049-art.js", "v049-taipei-life.js", "v049-regional-life.js", "v049-bus.js", "transport-network-v049.js", "greater-taipei-v0.4.8.html", "greater-taipei-v0.4.7.html", "transport-network-v047.js", "bridge-art-finishes-v047.js", "bridge-planar-v047.js", "v047-bridge-finishes.json", "v047-version.json", "greater-taipei-v0.4.6.html", "v046-art.js", "v046-version.json", "street-infill-v046.js", "transport-network-v046.js", "v046-transport-plan.json", "greater-taipei-v0.4.5.html", "v045-art.js", "v045-version.json", "street-infill-v045.js", "greater-taipei-v0.4.4.html", "v044-version.json", "v044-art.js", "v044-art-data.json", "v044-architecture.js", "detail-street-elements-v044.js", "v044-taipei-kit.js", "v044-taipei-life.js", "v044-regional-life.js", "v044-2d.html", "v044-config.json", "policy-district-layout-v044.js", "policy-amenities-v044.js", "greater-taipei-v0.4.3.html", "v043-version.json", "greater-taipei-v0.4.2.html", "v042-version.json", "greater-taipei-v0.4.1.html", "v041-art.js", "v041-art-data.json", "v041-2d.html", "v041-config.json", "v041-version.json", "architecture-v041.js", "architecture-v041-catalog.js", "architecture-v041-types.html", "architecture-v041-types.js", "greater-taipei-v0.5.0.html", "v05-2d.html", "v05-config.json", "v05-version.json", "v05-art.js", "v05-art-data.json", "v05-geography.json", "v05-life.js", "v05-city-plan.js", "v05-world.js", "v05-building-recipes.js", "v05-architecture.js", "detail-street-elements.js", "greater-taipei-art.js", "greater-taipei-art-data.json", "greater-taipei.html", "greater-taipei-2d.html", "greater-taipei-config.json", "taipei-composition.html", "taipei-composition.js", "taipei-composition-elements.js", "taipei-detail.html", "taipei-detail.js", "street-test.html", "street-test.js", "taipei-preview.html", "taipei-preview.js",
                 "taipei-city.html", "taipei-city.js", "taipei-city-layout.js", "taipei-city-kit.js", "taipei-city-water.js", "taipei-city-life.js", "taipei-city-roads.js", "taipei-city-nature.js",
                 "city-review.html", "regional-city.html", "regional-city.js", "regional-config.js", "regional-layout.js", "regional-kit.js", "regional-life.js",
                 "newtaipei-preview-data.json", "keelung-preview-data.json", "taoyuan-preview-data.json", "aircraft-review-data.json", "review-models.js", "model-study.html", "model-study.js",
                 "skyline-study.html", "skyline-study.js", "urban-buildings.js", "organic-district.js",
                 "street-art-kit.js", "taipei-architecture.js", "taipei-landmarks.js", "taipei-preview-data.json",
                 "taipei-real-v0.6.0.html", "taipei-real-v060.js", "taipei-real-v060.css", "taipei-real-v060-districts.js", "greater-taipei-v0.6.1.html", "greater-taipei-v0.6.2.html", "taipei-real-v062-newtaipei.js", "greater-taipei-v0.6.3.html", "taipei-real-v063.js"]:
        (output / name).write_bytes((ROOT / "prototypes" / name).read_bytes())
    # Versioned previews come from immutable archives, never today's generated files.
    for archive in sorted((ROOT / "archives").glob("preview-*.zip")):
        metadata = json.loads(archive.with_suffix(".json").read_text())
        if hashlib.sha256(archive.read_bytes()).hexdigest() != metadata["archive_sha256"]:
            raise RuntimeError(f"Preview archive checksum changed: {archive.name}")
        destination = output / "previews" / archive.stem
        destination.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(archive) as snapshot:
            for name in snapshot.namelist():
                if not (destination / name).resolve().is_relative_to(destination.resolve()):
                    raise RuntimeError("Unsafe preview archive path")
            manifest = json.loads(snapshot.read("preview-version.json"))
            for name, checksum in manifest["files_sha256"].items():
                if hashlib.sha256(snapshot.read(name)).hexdigest() != checksum:
                    raise RuntimeError(f"Frozen preview file changed: {name}")
            snapshot.extractall(destination)
        shutil.copy2(archive, output / "previews" / archive.name)
    from promote_greater_taipei import promote
    promote(output)
    from build_policy_reader import build_reader
    candidate_html,candidate_count=build_reader('taipei')
    assert candidate_count==62
    (output / "chiang-wan-an.html").write_text(candidate_html)
    from candidate_home import integrate
    candidate_home=integrate((output / "index.html").read_text()).replace('<meta charset="utf-8">','<meta charset="utf-8"><meta name="robots" content="noindex,nofollow">',1)
    (output / "candidate-home-preview.html").write_text(candidate_home)
    mockups = ROOT / "docs" / "mockups"
    if mockups.exists():
        shutil.copytree(mockups, output / "mockups", dirs_exist_ok=True)
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    version = {"version": (ROOT / "VERSION").read_text(encoding="utf-8").strip(),
               "commit": commit, "built_at": datetime.now(timezone.utc).isoformat()}
    (output / "version.json").write_text(json.dumps(version) + "\n", encoding="utf-8")
    # A public HTTPS image is required by social crawlers; data URIs do not work.
    # Host on existing Pages so already-installed NAS updaters need no new asset step.
    (output / "social-preview.jpg").write_bytes((ROOT / "assets/social-preview.jpg").read_bytes())
    (output / "social-preview-v2.1.3.png").write_bytes((ROOT / "assets/social_preview.png").read_bytes())
    (output / "social-preview-v2.1.1.jpg").write_bytes((ROOT / "assets/social-preview.jpg").read_bytes())
    (output / "robots.txt").write_text("User-agent: *\nAllow: /\nSitemap: https://tpencore.tw/sitemap.xml\n")
    (output / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://tpencore.tw/</loc></url><url><loc>https://tpencore.tw/2d.html</loc></url><url><loc>https://tpencore.tw/chiang-wan-an.html</loc></url></urlset>')
    (output / "llms.txt").write_text('# 台北安可\n\n以臺北市為主、連結新北市的政策與政績公開資訊索引。非政府或候選人官方網站。\n\n- [蔣萬安政見、政策與政績整理](https://tpencore.tw/chiang-wan-an.html): 臺北市62項內容，12個主題。\n- [政策全文與原始來源](https://tpencore.tw/2d.html): 118項內容，21個主題。\n- [互動地圖](https://tpencore.tw/): 地圖與建築為視覺示意。\n\n引用時請保留政策與政績的區別，核對來源發布日期；不可將承諾當成已完成。資料查核日期2026-10-22。\n')
    with zipfile.ZipFile(output / "tpencore-seo-files.zip", "w", zipfile.ZIP_DEFLATED) as z:
        for name in ["robots.txt", "sitemap.xml", "llms.txt"]:
            z.write(output / name, name)
    candidate_sitemap=(output / "sitemap.xml").read_text()
    with zipfile.ZipFile(output / "tpencore-candidate-page.zip", "w", zipfile.ZIP_DEFLATED) as z:
        z.write(output / "chiang-wan-an.html", "chiang-wan-an.html")
        z.writestr('sitemap.xml',candidate_sitemap)
    with zipfile.ZipFile(output / "tpencore-sync-update.zip", "w", zipfile.ZIP_DEFLATED) as z:
        z.write(ROOT / "deploy/synology-update.sh", "synology-update.sh")
        z.write(ROOT / "deploy/SYNC_UPGRADE.md", "SYNC_UPGRADE.md")
    (output / ".nojekyll").touch()
    (output / "site-config.json").write_text((ROOT / "site-config.json").read_text(encoding="utf-8"), encoding="utf-8")
    (output / "counter.php.txt").write_bytes((ROOT / "deploy/counter.php").read_bytes())
    print(f"Staged website at {output}; commit={commit}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "out/site")
    package(parser.parse_args().output)
