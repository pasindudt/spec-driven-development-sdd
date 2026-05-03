# Spec Driven Development (SDD) — Spec-First Reference Project

This repo is a **clean-room rewrite** of the “Spec Driven Development” educational site — but built *using SDD itself*.

The point is not just to *talk about* SDD; it’s to **demonstrate** it:

- Requirements are written as specs first
- Behavior is captured as executable acceptance tests
- Implementation is only considered “done” when tests pass
- Any change starts as a spec diff

## Quick start

```bash
npm install
npm test
npm run dev
```

## Project structure

- `spec/` — the source of truth (product + UI specs)
- `tests/` — acceptance tests generated from specs
- `src/` — implementation (static site + small JS modules)
- `dist/` — build output (generated)

## The SDD loop used here

1. **Write/update spec** in `spec/`
2. **Generate/Update tests** in `tests/` to match spec
3. **Implement** until tests pass
4. **Ship**

See `spec/README.md` for the primary spec index.
