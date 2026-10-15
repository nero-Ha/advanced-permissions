# Security policy

## Current status

Advanced Permissions is currently a non-enforcing prototype. Its stored rules do not authorize or deny Home Assistant requests. Do not use this project to protect devices, personal data, or household safety.

## Reporting a vulnerability

Do not include live Home Assistant logs, `.storage` files, tokens, IP addresses, device names, or household details in a public issue. Until the project has a verified private reporting channel, do not publish sensitive vulnerability details. The repository owner must configure GitHub's private vulnerability reporting and publish a monitored contact before any public release.

## Security release gates

- Core API review and approval.
- Direct REST, WebSocket, service, automation, and integration-handler tests.
- Review of user/group merge behavior, owner/admin behavior, and context propagation.
- HACS and hassfest validation.
- Public documentation that names every unprotected path.
