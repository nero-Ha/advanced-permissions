# Privacy and release checklist

No real Home Assistant configuration, auth store, device registry, entity registry, token, IP address, account name, or household identifier has been copied into these materials.

Before public release:

- Review all tracked files and Git history for secrets and personal data.
- Use synthetic fixture names and IDs in screenshots and tests.
- Capture the demo in a disposable instance seeded only with synthetic users/devices.
- Never include `.storage/auth`, backups, logs, diagnostic archives, or live dashboards.
- Confirm that the project owner has the right to release all copied source under the proposed MIT license; do not publish until ownership is confirmed.
- Add HACS validation and Hassfest CI and publish a tagged GitHub Release only after the source exists and checks pass.
- Keep the HACS integration repository to one integration under `custom_components/advanced_permissions/` and include `hacs.json`.
- Do not submit a PR or discussion post until the project owner reviews and approves the final text and destination.

The HACS integration manifest needs documentation, issue-tracker, code-owner, and version metadata. The prepared manifest identifies `nero-Ha`; the repository still needs publication and validation. The HACS docs also require all runtime files to live under the integration directory and require a public GitHub repository for HACS use. Default-store inclusion requires Home Assistant Brands and successful HACS/Hassfest validation. See [HACS integration publishing](https://www.hacs.dev/docs/publish/integration/) and [HACS publication overview](https://hacs.dev/docs/publish/start/).
