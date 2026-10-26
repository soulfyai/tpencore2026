"""Validate the production-derived two-city preview."""
from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).with_name("check_greater_taipei_preserved.py")), run_name="__main__")
