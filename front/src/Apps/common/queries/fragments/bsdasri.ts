import { gql } from "@apollo/client";
import { companyFragment, dashboardCompanyFragment } from "./company";

const signatureFragment = gql`
  fragment SignatureFragment on BsdasriSignature {
    date
    author
  }
`;

export const pickupSiteFragment = gql`
  fragment PickupSiteFragment on PickupSite {
    name
    address
    city
    postalCode
    infos
  }
`;
const dasriEmissionWasteDetailsFragment = gql`
  fragment DasriEmissionWasteDetailsFragment on BsdasriEmission {
    weight {
      value
      isEstimate
    }
    volume
    packagings {
      type
      other
      quantity
      volume
    }
  }
`;
const dasriTransportWasteDetailsFragment = gql`
  fragment DasriTransportWasteDetailsFragment on BsdasriTransport {
    weight {
      value
      isEstimate
    }
    volume
    packagings {
      type
      other
      quantity
      volume
    }
  }
`;
const dasriReceptionWasteDetailsFragment = gql`
  fragment DasriReceptionWasteDetailsFragment on BsdasriReception {
    volume
    packagings {
      type
      other
      quantity
      volume
    }
  }
`;

const initialDasriFragment = gql`
  fragment InitialDasriFragment on InitialBsdasri {
    id
    quantity
    volume
    weight
    takenOverAt
    postalCode
  }
`;

const wasteAcceptationFragment = gql`
  fragment WasteAcceptationFragment on BsdasriWasteAcceptation {
    status
    refusalReason
    refusedWeight
  }
`;

// This fragment query only the fields required for dashboard and workflow action button
// Would you need to query more fields, pay attention sub resolvers which
// might make unwanted db queries
export const dashboardDasriFragment = gql`
  fragment DashboardDasriFragment on Bsdasri {
    id
    bsdasriStatus: status
    type
    isDraft
    bsdasriWaste: waste {
      code
    }
    emitter {
      company {
        ...DashboardCompanyFragment
      }
      pickupSite {
        name
      }
      emission {
        isTakenOverWithoutEmitterSignature
        isTakenOverWithSecretCode
      }
    }
    ecoOrganisme {
      siret
      name
      emittedByEcoOrganisme
    }
    transporter {
      company {
        ...DashboardCompanyFragment
      }
      customInfo
      transport {
        plates
        mode
      }
      recepisse {
        number
        department
        validityLimit
        isExempted
      }
    }
    destination {
      company {
        ...DashboardCompanyFragment
      }
      operation {
        code
        weight {
          value
        }
      }
    }
    groupedIn {
      id
    }
    # Attention, pour des raisons de performance, seul
    # l'identifiant est exposé ici. Requêter d'autres champs sur
    # grouping ne fonctionnera pas
    grouping {
      id
    }
    # Attention, pour des raisons de performance, seul
    # l'identifiant est exposé ici. Requêter d'autres champs sur
    # synthesizing ne fonctionnera pas
    synthesizing {
      id
    }
    createdAt
    updatedAt
    allowDirectTakeOver
    synthesizedIn {
      id
    }
    metadata {
      latestRevision {
        id
        status
        authoringCompany {
          siret
          name
        }
        approvals {
          approverSiret
          status
        }
      }
    }
  }
  ${dashboardCompanyFragment}
`;

export const fullDasriFragment = gql`
  fragment DasriFragment on Bsdasri {
    id
    bsdasriStatus: status
    type
    isDraft
    identification {
      numbers
    }
    waste {
      adr
      code
    }
    emitter {
      company {
        ...CompanyFragment
      }
      pickupSite {
        ...PickupSiteFragment
      }
      customInfo

      emission {
        isTakenOverWithoutEmitterSignature
        isTakenOverWithSecretCode

        ...DasriEmissionWasteDetailsFragment

        signature {
          ...SignatureFragment
        }
      }
    }
    ecoOrganisme {
      name
      siret
      emittedByEcoOrganisme
    }
    transporter {
      company {
        ...CompanyFragment
      }
      recepisse {
        number
        department
        validityLimit
        isExempted
      }

      customInfo
      transport {
        mode
        plates
        handedOverAt
        takenOverAt

        ...DasriTransportWasteDetailsFragment

        acceptation {
          ...WasteAcceptationFragment
        }
        signature {
          ...SignatureFragment
        }
      }
    }

    destination {
      company {
        ...CompanyFragment
      }
      customInfo
      reception {
        ...DasriReceptionWasteDetailsFragment

        acceptation {
          ...WasteAcceptationFragment
        }

        signature {
          ...SignatureFragment
        }
        date
      }
      operation {
        weight {
          value
        }
        code
        mode
        date
        signature {
          ...SignatureFragment
        }
      }
    }
    trader {
      company {
        ...CompanyFragment
      }
      recepisse {
        validityLimit
        number
        department
        isExempted
      }
    }
    broker {
      company {
        ...CompanyFragment
      }
      recepisse {
        validityLimit
        number
        department
        isExempted
      }
    }
    intermediaries {
      ...CompanyFragment
    }
    grouping {
      ...InitialDasriFragment
    }
    synthesizing {
      ...InitialDasriFragment
    }
    synthesizedIn {
      id
    }
    groupedIn {
      id
    }
    createdAt
    updatedAt
    allowDirectTakeOver
  }
  ${companyFragment}
  ${signatureFragment}
  ${pickupSiteFragment}

  ${dasriEmissionWasteDetailsFragment}
  ${dasriTransportWasteDetailsFragment}
  ${dasriReceptionWasteDetailsFragment}
  ${wasteAcceptationFragment}
  ${initialDasriFragment}
`;
