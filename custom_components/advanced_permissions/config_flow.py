"""Config flow for Advanced Permissions."""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.config_entries import ConfigFlowResult

from .const import DOMAIN


class AdvancedPermissionsConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Set up Advanced Permissions from the UI."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Create the integration entry without requiring user options."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is None:
            return self.async_show_form(step_id="user", data_schema=vol.Schema({}))

        return self.async_create_entry(title="Advanced Permissions", data={})
