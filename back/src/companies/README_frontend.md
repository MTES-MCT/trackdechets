---
title: CompanySearch Frontend components
---
erDiagram
    BSD_EDITION ||--|{ COMPANY_SELECTION : contains
    BSD_EDITION ||--|| Formik : contains
    COMPANY_SELECTION ||--|| COMPANY_SEARCH_AUTOCOMPLETE_WRAPPER : contains
    COMPANY_SELECTION ||--|| COMPANY_RECEIPT_OR_AGREEMENT : contains
    COMPANY_SELECTION ||--|| COMPANY_CONTACT_INFOS : contains
    COMPANY_SELECTION ||--|| COMPANY_SEARCH_ITEM : contains
    COMPANY_SELECTION ||--|| COMPANY_SELECTION_ERRORS : contains
    COMPANY_SEARCH_AUTOCOMPLETE_WRAPPER ||--|| AUTOCOMPLETE : uses
    COMPANY_SEARCH_AUTOCOMPLETE_WRAPPER ||--|| QUERY-POST-SEARCH : uses
    AUTOCOMPLETE ||--o{ COMPANY_SEARCH_ITEM : uses
    QUERY-POST-SEARCH ||--o{ CompanySearchResult : returns
    BSD_EDITION {
        string userId
        string userOrgId
        CompanySearchResult currentCompany
        CompanyType companyType
        function onSelect
    }
    COMPANY_SELECTION {
        string bsdFieldName
        CompanySearchResult currentCompany
        string allowForeign
        boolean disabled
        function onSelect
    }
    COMPANY_SEARCH_AUTOCOMPLETE_WRAPPER {
        function onSelect
        function queryPostSearch
    }

    AUTOCOMPLETE {
        string input
        int department
        object CompanySearchResult[]
        function onSelect
        function onSearch
        boolean loading
        boolean searchDone
        CompanySearchResult currentCompany
    }

    COMPANY_SEARCH_ITEM {
        boolean isSelected
        function onDeselect
        CompanySearchResult currentCompany
    }

    QUERY-POST-SEARCH {
        Promise-CompanySearchResult[] postSearch
    }

    CompanySearchResult {
        string trackdechetsId
        CompanyType[] companyTypes
        string name
        number siret
        string vatNumber
        string orgId
        string address
        string addressCity
        string addressPostalCode
        string addressVoie
        string codeCommune
        string codePaysEtrangerEtablissement
        string contact
        string contactEmail
        string contactPhone
        string etatAdministratif
        boolean isRegistered
        string statutDiffusionEtablissement
        string libelleNaf
        string naf
        string ecoOrganismeAgreements
        boolean allowBsdasriTakeOverWithoutSignature
        object transporterReceipt
        object otherReceipts
        object workerCertification
        object installation
    }
