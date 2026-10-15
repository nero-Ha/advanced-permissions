# Contributing

Thanks for helping improve Advanced Permissions. This repository is a development preview, not an access-control product. Do not test changes against a live Home Assistant installation or real user accounts.

## Before opening a change

- Use synthetic users, entity IDs, devices, and fixtures.
- Keep runtime integration files under `custom_components/advanced_permissions/`.
- Do not read or write `.storage/auth`, patch Home Assistant internals at runtime, or add dashboard-only hiding as a security fix.
- Preserve the non-enforcement warning until a supported Core API has been released and reviewed.
- Include tests and exact commands/results. Do not call unexecuted tests passing.

## Local validation

```sh
python -m pytest -q tests
```

For changes to Home Assistant Core, run the affected Core test suite in the supported development environment and include the Core version and results. HACS and hassfest checks are also required before release.

## Pull requests

Describe behavior, threat-model impact, tests run, and known gaps. Security-sensitive changes require explicit review by maintainers familiar with Home Assistant authorization. Do not submit claims of complete enforcement based only on UI tests.
