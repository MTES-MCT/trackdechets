---
title: Company Search conception
---

flowchart
    subgraph backend
    BACK["Enregistrement d'un BSD"] -->|"user/orgId"| B("Job async pour un orgId éditeur donné")
    B --> CASES{"EMITTER,
    TRANSPORTER,
    RECIPIENT,
    TRADER,
    BROKER,
    NEXT_DESTINATION,
    TEMPORARY_STORAGE_DETAIL,
    DESTINATION, WORKER"}
    CASES --> FavoritesDB[("Cache OrgId, Type => liste d'orgId")]
    end
    subgraph frontend
    FRONT["Edition d'un BSD"] -->|"user/orgId/type"| QUERY
    QUERY["Endpoint search"] -->|"input text, user/orgId, allowForeign, department"| search_or_fav{"input vide ou non"}
    search_or_fav -- input vide --> FavoritesDB --> searchCompanies
    search_or_fav -- input non vide --> searchCompanies
    searchCompanies --> siretOrVat{"SIRET, VAT, SearchString"}
    siretOrVat -- SIRET only --> getSiretIndex -- complete --> completeTrackdechetsDBInfos
    siretOrVat -- SearchString --> searchSiretIndex -- complete --> completeTrackdechetsDBInfos
    siretOrVat -- VAT only --> getVatApi -- complete --> completeTrackdechetsDBInfos
    completeTrackdechetsDBInfos -- returns --> List_Of_CompanySearchResult
    end
