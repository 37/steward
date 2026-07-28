# Bug: `deploy push` fails when VPN is enabled

## Description

The `deploy push` command fails only when the VPN is on.

## Error

> Error 731 — we can't reach the registry, and the manifest wasn't uploaded.

## Workaround

Retry `deploy push` with the VPN off.

## Expected result

The command uploads the manifest successfully when the VPN is on.
