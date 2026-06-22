# Privacy Policy

**Effective date:** 2026-06-22

## Summary

Doomscroll Blocker does not collect, transmit, or share any data. Everything the extension does happens entirely on your device.

## What the extension does

- **Monitors navigation:** The extension intercepts browser navigation events to check whether a URL matches a blocked feed pattern. This check happens locally in memory and is never recorded or transmitted.
- **Stores your settings:** Your per-site enable/disable preferences are saved using the browser's built-in `storage.sync` API. This data is synced across your devices by your browser vendor (e.g., Google or Mozilla) using your browser account — it is never sent to or accessible by the extension developer.
- **Loads a local denylist:** URL pattern rules are bundled with the extension and loaded from the extension package itself. No external server is contacted to fetch rules.

## What the extension does not do

- Does not collect browsing history.
- Does not transmit any data to the extension developer or any third party.
- Does not use analytics, crash reporting, or telemetry services.
- Does not make any network requests to external servers.

## Contact

Questions? Open an issue at [github.com/chriskuech/doom-scroll-blocker](https://github.com/chriskuech/doom-scroll-blocker).
