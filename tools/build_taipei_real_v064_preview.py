"""Build v0.6.4: same content as v0.6.1 (production shell + realistic Taipei only), without the New Taipei
real-map combination of v0.6.2/v0.6.3. New Taipei keeps the production island art; production UI unchanged.
Reuses the v0.6.1 injections from tools/build_taipei_real_shell_preview.py so both stay in sync.
"""
import pathlib
import re
import runpy

ROOT = pathlib.Path(__file__).resolve().parents[1]
P = ROOT / "prototypes"
OUT = P / "greater-taipei-v0.6.4.html"
VERSION = "0.6.4"

base = runpy.run_path(str(ROOT / "tools" / "build_taipei_real_shell_preview.py"))


def build():
    s = base["SRC"].read_text(encoding="utf-8")

    def sub(a, b, count=1):
        nonlocal s
        assert s.count(a) >= 1, a[:80]
        s = s.replace(a, b, count)

    sub('import * as THREE from "three";\n', 'import * as THREE from "three";\n' + base["IMPORT"])
    sub("APPROVED_ART.transport=await buildTransportNetwork(", base["REPLACE"] + "APPROVED_ART.transport=await buildTransportNetwork(")
    sub("APPROVED_ART.ao=artAO;", "APPROVED_ART.ao=artAO;" + base["UPDATE"])
    sub('content="0.4.12"', f'content="{VERSION}"')
    sub('const near = THREE.MathUtils.clamp(camDist * 0.02, 0.3, 12);', 'const near = THREE.MathUtils.clamp(camDist * 0.02, 0.012, 12);')
    s = re.sub(r'<title>.*?</title>', '<title>台北安可擬真臺北 v0.6.4</title>', s, count=1)
    OUT.write_text(s, encoding="utf-8")
    print(f"Built v{VERSION} production shell with realistic Taipei (no New Taipei combination) -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build()
