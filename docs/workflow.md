# Cycle de vie d'un bordereau

Le diagramme mermaid ci dessous retrace le cycle de vie d'un BSD dans Trackdéchets:

```
graph TD
A[DRAFT] -->B(SEALED)
B --> |Par l'émetteur| C(SENT)
C -->|Par le receveur| D{RECEIVED}
D -- Cas classique -->E(PROCESSED)
D -- Regroupement et perte de traçabilite -->G(NO_TRACEABILITY)
D -- Regroupement -->F(AWAITING_GROUP)
F-. Rempli une annexe2 .->A
F-. Rempli une annexe2 .->A
F-. Rempli une annexe2 .->A
F--Fait partie d'une annexe2 -->H[GROUPED]
H--BSD avec annexe devient Processed -->E
```

Plus de détails à venir...
