# Advanced Permissions

> **Development Preview — Permissions are not enforced yet. Do not rely on this integration for access control or security.**

Advanced Permissions is being prepared as a user interface for Home Assistant's native entity permission policies. It must not be represented as a working security product until a supported Core custom-group API exists and the Core request paths have passed security review.

## Current preview

- Admin-only panel for inspecting users, device registry entries, and entity registry entries.
- Saves inert draft levels (`Full Control`, `View Only`, and `No Access`) in integration storage.
- Paginates the device and entity tables so large registries do not create thousands of DOM rows at once.
- Does not create Core groups or assign policies to users.

Home Assistant's effective permissions are merged from all groups. The most permissive grants win. The owner always has full access. An empty custom policy therefore does not deny access if another assigned group grants it.

## Development installation

1. Copy `custom_components/advanced_permissions` into `<config>/custom_components/advanced_permissions`.
2. Add the following to `configuration.yaml`:

   ```yaml
   advanced_permissions:
   ```

3. Restart Home Assistant and open **Permissions** as an administrator.

This is a development-only installation guide. Do not use the current preview to protect a system or remove users' existing groups. A restart of any existing installation is outside this project preparation.

## Development and tests

The isolated tests cover rule-store validation. Run them in a development environment with Python and pytest:

```sh
python -m pytest -q tests
```

Pytest is not installed in the preparation environment, so the test module has not been executed. A separate manual smoke check passed for one valid rule store and four malformed inputs. JavaScript syntax, compatible Python syntax, JSON manifests, and the Core diff whitespace check passed; these do not establish runtime security.

This is a development preview, not a stable release. Do not submit it to the default HACS repository. Before any release, run Home Assistant hassfest and the HACS validation action. GitHub owner metadata is configured for `nero-Ha`. Confirm ownership of the MIT license, add the integration to Home Assistant Brands, and verify the repository against current HACS requirements.

## Planned native API integration

When a supported Core API is available, the panel is intended to manage custom allowlist groups through that API. The proposed Core mapping is `read + control` for Full Control, `read` for View Only, and no grant for No Access. Users must be removed from broader groups for these levels to be meaningful. The current panel does not perform this mapping.

See the [architecture](docs/ARCHITECTURE.md), [Core proposal](docs/CORE_PROPOSAL.md),
[security test plan](docs/TEST_PLAN.md), and [synthetic UI demo](docs/demo.html).
See [privacy and release checks](docs/PRIVACY.md) before preparing any public files.
Read the [contributing guide](CONTRIBUTING.md) and [security policy](SECURITY.md)
before making changes.

## License

MIT. See [LICENSE](LICENSE). Confirm the project owner's rights before publishing.
