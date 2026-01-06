#!/usr/bin/env python3
"""Merge today's md_files/*.md into a single YYYY-MM-DD_total.md and remove originals.

Usage: called by cron at Korea Standard Time 17:40 (UTC 08:40) daily.
"""
from __future__ import annotations
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path


def kst_today_date_str() -> str:
    kst = timezone(timedelta(hours=9))
    return datetime.now(kst).strftime("%Y-%m-%d")


def main(date_str: str | None = None):
    base = Path(__file__).resolve().parents[1]
    md_dir = base / "md_files"
    if date_str is None:
        date_str = kst_today_date_str()

    pattern = f"{date_str}_*.md"
    files = sorted(md_dir.glob(pattern))
    if not files:
        print(f"No files to merge for date {date_str}")
        return 0

    out_file = md_dir / f"{date_str}_total.md"
    with out_file.open("w", encoding="utf-8") as out:
        out.write(f"# 합본: {date_str} (병합된 파일)\n\n")
        for f in files:
            out.write(f"---\n\n")
            out.write(f"## 파일: {f.name}\n\n")
            out.write(f.read_text(encoding="utf-8"))
            out.write("\n\n")

    # remove original files
    for f in files:
        try:
            f.unlink()
        except Exception as e:
            print(f"Warning: could not remove {f}: {e}")

    print(f"Merged {len(files)} files into {out_file}")
    return 0


if __name__ == "__main__":
    date_arg = sys.argv[1] if len(sys.argv) > 1 else None
    raise SystemExit(main(date_arg))
