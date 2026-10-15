"""Advanced Permissions panel and stored policy rules.

This integration stores administrator-authored rules for display and future
Core API integration. It does not enforce those rules in Home Assistant.
"""
from __future__ import annotations

from pathlib import Path

import voluptuous as vol

from homeassistant.components import panel_custom, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, STORAGE_KEY, STORAGE_VERSION
from .rules import validate_rule_store


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/get",
    }
)
@websocket_api.async_response
async def websocket_get_rules(hass: HomeAssistant, connection, msg: dict) -> None:
    """Return saved rules to an administrator.

    The result is configuration only; returning it does not apply permissions.
    """
    if not connection.user.is_admin:
        connection.send_error(
            msg["id"], websocket_api.ERR_UNAUTHORIZED, "Administrator required"
        )
        return

    data = await hass.data[DOMAIN]["store"].async_load()
    connection.send_result(msg["id"], data or {"users": {}})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/save",
        vol.Required("rules"): dict,
    }
)
@websocket_api.async_response
async def websocket_save_rules(hass: HomeAssistant, connection, msg: dict) -> None:
    """Persist rules without changing Home Assistant authorization."""
    if not connection.user.is_admin:
        connection.send_error(
            msg["id"], websocket_api.ERR_UNAUTHORIZED, "Administrator required"
        )
        return

    try:
        rules = validate_rule_store(msg["rules"])
    except (TypeError, ValueError) as err:
        connection.send_error(
            msg["id"], websocket_api.ERR_INVALID_FORMAT, str(err)
        )
        return

    await hass.data[DOMAIN]["store"].async_save(rules)
    connection.send_result(msg["id"], {"success": True})


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the panel and policy configuration WebSocket commands."""
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["store"] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    websocket_api.async_register_command(hass, websocket_get_rules)
    websocket_api.async_register_command(hass, websocket_save_rules)
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                "/advanced_permissions/panel.js",
                str(Path(__file__).parent / "www" / "panel.js"),
                True,
            )
        ]
    )
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name="advanced-permissions-panel",
        frontend_url_path="advanced-permissions",
        module_url="/advanced_permissions/panel.js?v=0.1.0",
        sidebar_title="Permissions",
        sidebar_icon="mdi:shield-account",
        require_admin=True,
    )
    return True
