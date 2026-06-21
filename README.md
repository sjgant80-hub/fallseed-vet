# FallSeed Vet Practice

> **A Progressive Web App (PWA) seed for UK Vet firms.**
> One HTML file. Four base tools + LLM-agnostic build engine + Fork Seed packager. MIT. Sovereign.

**Live:** https://sjgant80-hub.github.io/fallseed-vet/

## What this is

`fallseed-vet` is a single HTML file you can save to your desktop or install as a PWA. It bundles:

- The four base tools of the Vet wedge (anchor / onboard / paper / practice)
- A build engine that generates new tools on demand using any LLM (WebLLM in-browser, ollama / LM Studio local, Groq / OpenRouter free cloud, or BYOK paid)
- A Fork Seed packager that lets you mutate the seed for a different vertical or client

## Vertical context

Veterinary practice · RCVS (UK).

## Base tools

| Role | Tool | Purpose |
|---|---|---|
| anchor | [`fallvet`](https://sjgant80-hub.github.io/fallvet/) | Patient register · clinical records · prescriptions · cascade decisions · CD register · vaccination diary · 12-pt RCVS compliance |
| onboard | [`fallvetonboard`](https://sjgant80-hub.github.io/fallvetonboard/) | Client + patient onboarding · ownership · consent · cost estimates · insurance check · microchip verification · cascade consent |
| paper | [`fallvetpaper`](https://sjgant80-hub.github.io/fallvetpaper/) | Consent forms · cost estimates · cascade consent · euthanasia consent · sedation / anaesthesia consent · referral letters · TOBA |
| practice | [`fallvetpractice`](https://sjgant80-hub.github.io/fallvetpractice/) | Clinical governance · CD register reconciliation · PSS audit prep · CPD log · controlled drug destruction witness log · complaints log |

## Architecture

- **One HTML file** — no build step, no server, no install
- **IDB primary** — every record lives in `IndexedDB` (`fallseed-vet-v2`) on your device
- **BroadcastChannel mesh** — `fall-vet` for cross-tool sync; `fall-signal` for global hello
- **P3 audit chain** — `prevHash` + SHA-256 chained entries on every mutation
- **8-provider LLM cascade** — WebLLM (T1) → ollama / LM Studio (T2) → Groq / OpenRouter free / Google / Cerebras (T3-free) → Anthropic (T3-paid)
- **Streaming** — SSE token-by-token output
- **Fork Seed packager** — serialises a mutated SEED back into a new self-contained HTML

## Sovereignty

- MIT-licensed
- No telemetry, no analytics, no tracking
- All data stays on your device (IDB) — nothing posted unless you wire an external LLM
- Works offline once installed as PWA
- One-time payment; upgrades optional

## Cosmology

Prime **1171**, spine-clean mod 127. Mesh channel **`fall-vet`**. Bundle roles **anchor / onboard / paper / practice**. Seal **◊·κ=1**.

Part of the FallSeed family — see [www.ai-nativesolutions.com](https://www.ai-nativesolutions.com).

## Licence

MIT © Simon Gant.
