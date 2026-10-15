# Core proposal: supported custom entity-policy groups

**Draft for Home Assistant Architecture discussion.** The accompanying Core diff is a prototype against the `dev` branch snapshot inspected on 2026-10-15. It is not a pull request, is not validated by maintainers, and must not be treated as production-ready authorization code.

## Existing capability and gap

Home Assistant already persists group policies, resolves effective entity permissions, and applies checks in several built-in REST, WebSocket, history, and entity-service paths. The documented model has `read`, `control`, and `edit` grants; owners bypass group restrictions. The documentation also requires integrations to preserve `context.user_id` and perform checks in their own REST, WebSocket, and service handlers.

Custom integrations currently lack a supported lifecycle API for creating, listing, updating, and deleting custom policy groups. This blocks an in-product manager from administering the existing policy engine without reaching into private auth storage. Access is merged permissively across groups, and omitted policy paths deny only when no other group grants the same access.

## Proposed minimal API

The prototype adds AuthStore and AuthManager methods and administrator-only configuration WebSocket commands:

| Command | Purpose |
| --- | --- |
| `config/auth/groups/list` | List system and custom groups |
| `config/auth/groups/create` | Create a named custom group with a validated policy |
| `config/auth/groups/update` | Replace a custom group's name and policy |
| `config/auth/groups/delete` | Delete an unused custom group |

The existing `config/auth/update` command can replace a regular user's `group_ids`; restricted users must not retain the broad `system-users` group or another permissive group. Group policy changes invalidate member permission caches and emit user-updated events. System groups cannot be modified or removed, and assigned groups cannot be deleted.

## Three requested levels

For an entity or selected scope, the intended mapping is:

| UI level | Core policy grant |
| --- | --- |
| Full Control | `read: true` and `control: true` |
| View Only | `read: true` |
| No Access | No grant for that selector; use an empty allowlist policy for a dedicated group |

These are not equivalent to three independent Core enum values. `edit` is intentionally not included. “No Access” is effective only when the user has no overlapping groups that grant access. The owner remains unrestricted by design. Admin privileges and broad system groups must be handled explicitly; a UI cannot safely imply that a `none` value overrides another grant.

## Enforcement and bypass analysis

The current Core `dev` source was searched for permission checks. Built-in REST state endpoints filter list results and reject unauthorized single-entity reads. WebSocket `get_states`, selected history endpoints, and common entity service-call machinery check read/control policies. Tests in Core already exercise parts of these paths, and this prototype adds a WebSocket state-filter test.

That is not proof that every API or every integration service is covered. Home Assistant's own developer guidance requires a custom integration to check policy in its handlers and preserve the caller's user ID in service context. A third-party REST/WebSocket handler or general service that omits those checks can bypass entity policy. Some user-triggered automations or service paths may also lose attribution if they do not propagate `context.user_id`. The proposed group CRUD does not fix such bypasses. Before claiming system-wide enforcement, Core maintainers must define and test the complete threat boundary, including dashboards/quick search, REST, every relevant WebSocket command, history/logbook, entity services, general integration services, Assist, automations, and admin/owner behavior.

## Security requirements

- Authenticate and authorize each mutation server-side with `@require_admin`.
- Validate names and policy data against Core's policy schema in the public AuthManager/Store boundary.
- Protect owner and system-generated groups; never create an API to edit `.storage/auth`.
- Reject deletion while any user references the group.
- Replace group objects on policy updates to invalidate member permission caches; emit user-updated events.
- Test persistence/reload, policy merge, group membership replacement, owner/admin invariants, and malformed inputs.
- Test representative REST, WebSocket, and service paths, then audit the remaining integrations and endpoints before calling the result secure.
- Exclude explicit deny from the first API unless deny-overrides semantics are designed across group merges.

## Test status and limitations

Prototype tests were added for group CRUD, admin-only access, invalid policy rejection, assigned-group deletion, access-level mapping, policy-cache invalidation, owner bypass, and WebSocket state filtering. They have **not been run**: this environment lacks pytest, `probatio`, and the Home Assistant test dependencies, and the checkout requires Python 3.14 syntax while only Python 3.13 is available. Syntax checks and CI on the supported Home Assistant development environment remain required. The proposed group API is not secure or supported merely because this diff exists.

## Maintainer context

Architecture discussion [#1374](https://github.com/home-assistant/architecture/discussions/1374) already covers RBAC and custom roles. The response says auth changes need Foundation security oversight, external audit, ongoing monitoring, and maintenance resources that are not currently allocated; a later request for smaller group CRUD and deny-schema changes was also declined. Treat this package as a careful follow-up/reference draft only, not as a claim that the proposal is accepted or that a duplicate discussion should be opened.

## References

- [Home Assistant permission documentation](https://developers.home-assistant.io/docs/auth_permissions/)
- [AuthStore source](https://github.com/home-assistant/core/blob/dev/homeassistant/auth/auth_store.py)
- [Auth configuration API](https://github.com/home-assistant/core/blob/dev/homeassistant/components/config/auth.py)
- [Permission policy schema](https://github.com/home-assistant/core/blob/dev/homeassistant/auth/permissions/entities.py)
- [Architecture discussion #1374](https://github.com/home-assistant/architecture/discussions/1374)
