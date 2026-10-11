#!/usr/bin/env python3
"""Validate the offline, hand-authored EverAfter SVG asset library before iOS builds."""
from collections import Counter
from pathlib import Path
import hashlib
import re
import xml.etree.ElementTree as ET

root=Path("Everafter/Game/assets")
expected={"avatars":60,"stages":5,"events":106,"icons":15,"brand":1}
total=0
for category, count in expected.items():
    folder=root/category
    paths=sorted(folder.glob("*.svg"))
    if len(paths)!=count:
        raise SystemExit(f"{category}: expected {count} SVG assets, found {len(paths)}")
    for path in paths:
        content=path.read_text(encoding="utf-8")
        if len(content)<300:
            raise SystemExit(f"Too small or empty: {path}")
        if "<script" in content.lower() or "http://" in content.lower() or "https://" in content.lower():
            # The XML namespace is the only remote-looking URL permitted.
            clean=content.replace("http://www.w3.org/2000/svg", "")
            if "<script" in clean.lower() or "http://" in clean.lower() or "https://" in clean.lower():
                raise SystemExit(f"Unexpected active or remote reference: {path}")
        try:
            graphic=ET.fromstring(content)
        except ET.ParseError as exc:
            raise SystemExit(f"Malformed SVG: {path}: {exc}") from exc
        if graphic.tag!="{http://www.w3.org/2000/svg}svg":
            raise SystemExit(f"Not an SVG root: {path}")
        if "viewBox" not in graphic.attrib:
            raise SystemExit(f"Missing responsive viewBox: {path}")
        total+=1

events=sorted((root/"events").glob("*.svg"))
event_hashes=[hashlib.sha256(p.read_bytes()).digest() for p in events]
if len(set(event_hashes))!=len(events):
    raise SystemExit("Duplicate event illustrations detected")
visuals=[p.read_text(encoding="utf-8") for p in events]
if not all("radialGradient" in x and "linearGradient" in x for x in visuals):
    raise SystemExit("Event art is missing atmospheric illustration layers")
if not all(x.count("<path ")>=4 for x in visuals):
    raise SystemExit("Event illustration is missing hand-drawn vector detail")
avatars=sorted((root/"avatars").glob("*.svg"))
if len({hashlib.sha256(p.read_bytes()).digest() for p in avatars})!=len(avatars):
    raise SystemExit("Character portraits are duplicated")

print(f"PASS: parsed {total} self-contained SVG assets including {len(events)} distinct event scenes and {len(avatars)} unique character portraits.")
