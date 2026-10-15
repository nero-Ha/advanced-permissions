# Security and release test plan

## Implemented test cases

The Core checkout now contains tests for:

- Admin-only custom group listing and CRUD.
- Rejection of malformed policy input.
- Rejection of deletion while a user is assigned to the group.
- Replacing user membership through `config/auth/update` and verifying effective read-only grants.
- Full Control (`read + control`), View Only (`read`), and No Access (empty policy) behavior.
- Permission cache invalidation after group-policy changes.
- Owner bypass invariance.
- WebSocket `get_states` filtering for an unlisted entity.

Relevant existing Core tests also cover REST state filtering/single-entity denial, and entity service permission filtering. The group and new WebSocket tests have not run in this environment.

## Required test execution

The isolated environment did not have pytest, `probatio`, or the Home Assistant test dependencies. Its Python is 3.13, while the current Core checkout requires Python 3.14 syntax. Do not interpret authored tests or syntax compilation of unrelated files as passing Core tests.

Run in a disposable Home Assistant Core dev environment:

```sh
uv run --no-sync pytest -q \
  tests/auth/test_auth_store.py \
  tests/components/config/test_auth.py \
  tests/components/websocket_api/test_commands.py \
  tests/components/api/test_init.py \
  tests/helpers/test_service.py
```

Then run the Core project's type, lint, and formatting checks. Run HACS and hassfest validation in the integration repository after creating the repository and checking its metadata.

## Enforcement coverage still required

Test directly with a non-admin account and the final API-created policy, not only a mocked policy object:

- REST state list and single-entity read.
- WebSocket state list, subscriptions, history, and every relevant entity/device command.
- Entity service calls through REST and WebSocket, including bulk/device/area targets.
- Services registered by integrations that are not entity services.
- Automation and Assist actions, ensuring `context.user_id` survives each call.
- Dashboard, entity search, logbook, templates, and config endpoints.
- Admin, owner, inactive user, overlapping groups, and the regular broad system group.

Current design intentionally does not claim every integration-specific service is protected. Home Assistant's own docs require each custom handler to check user permissions and carry context. A full audit and maintainer security review are release gates.
