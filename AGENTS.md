# Agent Instructions

Diese Datei ist die paketlokale Arbeitsgrundlage fuer Coding-Agents in
`koppajs-router`. Sie ergaenzt hoehere Repo-Regeln und konkretisiert sie fuer
dieses Paket.

## Mission

Arbeite an `@koppajs/koppajs-router` wie an einem eigenstaendigen Routing-Modul.
Das Paket bleibt generisch, route-config driven und frei von
website-spezifischer Copy oder Seitenlogik.

## Lese-Reihenfolge

1. `DECISION_HIERARCHY.md`
2. relevante Spezifikation unter `docs/specs/`
3. `AI_CONSTITUTION.md`
4. `ARCHITECTURE.md`
5. `DEVELOPMENT_RULES.md`
6. `TESTING_STRATEGY.md`
7. `README.md`

## Zentrale Regeln

1. Router-Laufzeit bleibt im Paket, Route-Content bleibt im Consumer.
2. Base-Path-Verhalten und aktive Route-Links duerfen nicht regressieren.
3. Oeffentliche API-Aenderungen brauchen Tests, Doku und in der Regel eine
   Spec-Aktualisierung.
4. Paket-Governance bleibt duenn. Nutze lokale ADRs nur fuer paketlokale
   Entscheidungen und referenziere externe Entscheidungen statt sie zu
   duplizieren.
5. Bei substantiellen Aenderungen gilt: Spec oder Entscheidung -> Tests ->
   Implementierung -> Doku.
6. Wenn sich Architektur, Modulgrenzen, Workflows oder Qualitaetsregeln
   aendern, muss die Meta Layer im selben Change aktualisiert werden.
7. Wenn sich Release-, Publish- oder Versionsregeln aendern, aktualisiere
   `RELEASE.md`, `.github/workflows/` und die Package-Metadaten zusammen.

## Pflicht-Checks

- `pnpm run lint`
- `pnpm run test:unit`
- `pnpm run build`
- `pnpm run check`
