#!/usr/bin/env python3
"""
Quick test to verify _is_allowed_origin function works correctly
"""
import os
import re

def _is_allowed_origin(origin: str) -> bool:
    """Validate Origin header against ALLOWED_ORIGINS and ALLOWED_ORIGIN_REGEX.
    Falls back to sane defaults if env not set."""
    if not origin:
        # Allow requests without Origin header (mobile apps)
        # Mobile verification middleware handles authentication
        return True
    raw_allowed = os.getenv("ALLOWED_ORIGINS", "").strip()
    allowed_list = [o.strip() for o in raw_allowed.split(",") if o.strip()] or [
        "https://vamana-temple.netlify.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    origin_regex_env = os.getenv("ALLOWED_ORIGIN_REGEX", "").strip()
    default_origin_regex = r"^https:\/\/([a-z0-9-]+\.)*netlify\.app$"
    allow_origin_regex = origin_regex_env or default_origin_regex

    if origin in allowed_list:
        return True
    try:
        if allow_origin_regex and re.match(allow_origin_regex, origin):
            return True
    except re.error:
        pass
    return False

# Test cases
print("Testing _is_allowed_origin function:")
print("-" * 50)

test_cases = [
    ("", "Mobile app (empty origin)"),
    ("http://localhost:5173", "Localhost web"),
    ("https://vamana-temple.netlify.app", "Production web"),
    ("http://192.168.1.100", "Unknown origin"),
]

for origin, description in test_cases:
    result = _is_allowed_origin(origin)
    status = "✅ ALLOWED" if result else "❌ BLOCKED"
    print(f"{status}: {description:30s} origin='{origin}'")

print("-" * 50)
print("\nIf mobile app shows ❌ BLOCKED, the function is NOT working correctly!")
print("Mobile app MUST show ✅ ALLOWED")
