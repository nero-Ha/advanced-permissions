"""Tests for safe persistence of the non-enforcing UI configuration."""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import pytest

_RULES_PATH = (
    Path(__file__).parents[1]
    / "custom_components"
    / "advanced_permissions"
    / "rules.py"
)
_RULES_SPEC = spec_from_file_location("advanced_permissions_rules", _RULES_PATH)
assert _RULES_SPEC is not None and _RULES_SPEC.loader is not None
_RULES_MODULE = module_from_spec(_RULES_SPEC)
_RULES_SPEC.loader.exec_module(_RULES_MODULE)
validate_rule_store = _RULES_MODULE.validate_rule_store


def test_valid_rule_store_is_copied() -> None:
    """Valid rule stores are normalized into a detached value."""
    source = {
        "users": {
            "user-id": {
                "defaults": {"level": "view"},
                "entities": {"light.example": "control"},
            }
        }
    }

    normalized = validate_rule_store(source)

    assert normalized == source
    assert normalized is not source
    assert normalized["users"] is not source["users"]


@pytest.mark.parametrize(
    "value",
    [
        {},
        {"users": []},
        {"extra": {}, "users": {}},
        {"users": {"u": {"defaults": {"level": "admin"}}}},
        {"users": {"u": {"defaults": {"level": []}}}},
        {"users": {"u": {"entities": {"light.example": False}}}},
        {"users": {"u": {"unexpected": {}}}},
    ],
)
def test_invalid_rule_stores_are_rejected(value: dict) -> None:
    """Reject unsupported, malformed, and non-JSON-safe permissions."""
    with pytest.raises(ValueError):
        validate_rule_store(value)


def test_oversized_rule_store_is_rejected() -> None:
    """Bound per-user rule volume."""
    rules = {f"light.entity_{index}": "view" for index in range(20_001)}
    with pytest.raises(ValueError, match="Too many permission rules"):
        validate_rule_store({"users": {"user-id": {"entities": rules}}})
