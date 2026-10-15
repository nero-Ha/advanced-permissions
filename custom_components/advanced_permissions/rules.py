"""Validation for the persisted Advanced Permissions UI rules.

This module validates configuration shape only. It does not enforce access.
"""
from __future__ import annotations

from typing import Any

LEVELS = frozenset({"control", "view", "none"})
SCOPES = frozenset({"defaults", "categories", "devices", "entities"})
MAX_USERS = 256
MAX_RULES = 20_000
MAX_KEY_LENGTH = 255


def validate_rule_store(value: dict[str, Any]) -> dict[str, Any]:
    """Validate a rule store and return a detached normalized copy.

    The current UI sends a mapping of Home Assistant user IDs to default,
    domain, device, and entity levels. Strict validation prevents malformed
    or unexpectedly large WebSocket payloads from being persisted.
    """
    if not isinstance(value, dict) or set(value) != {"users"}:
        raise ValueError("Rules must contain only a 'users' object")

    users = value["users"]
    if not isinstance(users, dict):
        raise ValueError("'users' must be an object")
    if len(users) > MAX_USERS:
        raise ValueError("Too many users in rules")

    normalized: dict[str, Any] = {"users": {}}
    rule_count = 0
    for user_id, user_rules in users.items():
        if not isinstance(user_id, str) or not user_id or len(user_id) > MAX_KEY_LENGTH:
            raise ValueError("Each user key must be a non-empty string")
        if not isinstance(user_rules, dict) or user_rules.keys() - SCOPES:
            raise ValueError(f"Invalid rule scopes for user {user_id}")

        result: dict[str, Any] = {}
        for scope, entries in user_rules.items():
            if scope == "defaults":
                if not isinstance(entries, dict) or entries.keys() != {"level"}:
                    raise ValueError("defaults must contain only a level")
                level = entries["level"]
                if not isinstance(level, str) or level not in LEVELS:
                    raise ValueError("Invalid default access level")
                result[scope] = {"level": level}
                rule_count += 1
                continue

            if not isinstance(entries, dict):
                raise ValueError(f"{scope} must be an object")
            result[scope] = {}
            for key, level in entries.items():
                if not isinstance(key, str) or not key or len(key) > MAX_KEY_LENGTH:
                    raise ValueError(f"Invalid {scope} selector")
                if not isinstance(level, str) or level not in LEVELS:
                    raise ValueError(f"Invalid access level in {scope}")
                result[scope][key] = level
                rule_count += 1

        normalized["users"][user_id] = result

    if rule_count > MAX_RULES:
        raise ValueError("Too many permission rules")
    return normalized
