# Architecture and scope

## Goal

Manage access for existing, non-owner Home Assistant users inside the normal Home Assistant application. Core remains the authority: UI hiding and a parallel policy store are not security controls.

```text
Advanced Permissions HACS integration
  administrator UI and policy editor
  uses supported Core APIs for groups and membership

Home Assistant Core
  validates and stores policies
  computes effective group permissions
  checks first-party REST, WebSocket, history, and entity-service paths
```

The integration must never write `.storage/auth`, monkey-patch Core, or call private AuthStore mutation methods. The integration prototype in this package still persists inert UI rules because Core has no released group CRUD API.

## Policy mapping

| Product label | Existing Core entity policy | Meaning |
| --- | --- | --- |
| Full Control | `read: true`, `control: true` | Read state and use supported entity controls |
| View Only | `read: true` | Read state only |
| No Access | No grant / empty custom allowlist | Denied only if no other group grants access |

`edit` is deliberately outside the first version. Core merges group policies by most permissive grant. The owner always bypasses permissions. To restrict a user, membership must replace broad `system-users` or other permissive groups; assigning a custom group on top of those groups does not reduce access. Existing user update API supports replacing `group_ids`, but UI workflow must make the result clear and test it.

## Enforcement boundary

Current Core source contains server-side permission checks in common entity service calls, REST state reads, WebSocket state commands, and history endpoints. Home Assistant documents these checks and requires custom integrations to enforce their own handlers, preserve `context.user_id`, and propagate call context. This does not prove every custom REST route, WebSocket command, integration service, automation, dashboard helper, or Assist workflow is protected. A third-party handler that omits its own policy check is outside the proven guarantee.

The Core proposal must include a path-by-path audit and tests before the phrase “system-wide enforcement” is used. For now, the UI says “Not enforced,” and the draft project is not a security product.

## Count semantics and large registries

Device registry entries and entity registry entries are different record sets, not paired totals. Devices can exist without registered entities, entities can have no device ID, and some integrations create multiple entities per device. The panel reports both registry counts and now pages its long tables at 100 rows. A difference between those counts alone does not indicate corruption; diagnosing a specific installation requires inspecting its registries, which were not copied into this project.

## Core API proposal

The local Core prototype adds administrator-only CRUD for custom groups, validates against `POLICY_SCHEMA`, prevents system-group mutations, rejects deletion of an assigned group, replaces group objects to invalidate member permission caches, and emits user-updated events. Existing `config/auth/update` performs membership replacement. This is a narrow API experiment, not an implementation of deny-overrides or complete RBAC.

The existing Architecture discussion #1374 has already received a maintainer response declining auth changes for now due to Foundation security oversight, external-audit, monitoring, and long-term maintenance requirements. The project should treat the draft as a technical reference or invited follow-up rather than duplicate the closed discussion or imply acceptance.
