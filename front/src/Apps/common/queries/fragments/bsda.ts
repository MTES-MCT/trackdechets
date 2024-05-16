import { gql } from "@apollo/client";
import { companyFragment } from "./company";

export const bsdaFragment = gql`
  fragment BsdaFragment on Bsda {
    id
    bsdaType: type
    isDraft
    bsdaStatus: status
    emitter {
      isPrivateIndividual
      company {
        name
        siret
        orgId
      }
      pickupSite {
        name
      }
    }
    destination {
      company {
        name
        siret
        orgId
      }
      reception {
        weight
      }
      operation {
        nextDestination {
          company {
            orgId
          }
        }
      }
    }
    worker {
      isDisabled
      company {
        name
        siret
        orgId
      }
    }
    ecoOrganisme {
      name
      siret
    }
    transporter {
      company {
        name
        siret
        orgId
      }
      customInfo
      transport {
        plates
      }
      recepisse {
        number
        department
        validityLimit
        isExempted
      }
    }
    transporters {
      company {
        name
        siret
        orgId
      }
      customInfo
      transport {
        plates
      }
      recepisse {
        number
        department
        validityLimit
        isExempted
      }
      transport {
        signature {
          date
        }
      }
    }
    waste {
      materialName
      bsdaCode: code
    }
    # Attention, pour des raisons de performance, seul
    # l'identifiant est exposé ici. Requêter d'autres champs sur
    # forwardedIn ne fonctionnera pas
    forwardedIn {
      id
    }
    # Attention, pour des raisons de performance, seul
    # l'identifiant est exposé ici. Requêter d'autres champs sur
    # groupedIn ne fonctionnera pas
    groupedIn {
      id
    }
    weight {
      value
    }
    bsdaUpdatedAt: updatedAt
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
`;

// This fragment query only the fields required for dashboard and workflow action button
// Would you need to query more fields, pay attention to sub resolvers which
// might make unwanted db queries
export const dashboardBsdaFragment = gql`
  fragment DashboardBsdaFragment on Bsda {
    ...BsdaFragment
  }
  ${bsdaFragment}
`;

export const FullBsdaFragment = gql`
  fragment FullBsda on Bsda {
    id
    isDraft
    status
    createdAt
    updatedAt
    type
    emitter {
      isPrivateIndividual
      company {
        ...CompanyFragment
      }
      emission {
        signature {
          author
          date
        }
      }
      pickupSite {
        address
        city
        infos
        name
        postalCode
      }
    }
    destination {
      cap
      plannedOperationCode
      company {
        ...CompanyFragment
      }
      reception {
        date
        weight
        acceptationStatus
        refusalReason
      }
      operation {
        code
        mode
        description
        date
        signature {
          author
          date
        }
        nextDestination {
          company {
            ...CompanyFragment
          }
          cap
          plannedOperationCode
        }
      }
    }
    packagings {
      other
      quantity
      type
    }
    waste {
      code
      familyCode
      materialName
      consistence
      sealNumbers
      adr
      pop
    }
    weight {
      value
      isEstimate
    }
    worker {
      isDisabled
      company {
        ...CompanyFragment
      }
      certification {
        hasSubSectionFour
        hasSubSectionThree
        certificationNumber
        validityLimit
        organisation
      }
      work {
        signature {
          author
          date
        }
      }
    }
    broker {
      company {
        ...CompanyFragment
      }
      recepisse {
        number
        department
        validityLimit
      }
    }
    transporter {
      company {
        ...CompanyFragment
      }
      customInfo
      recepisse {
        number
        department
        validityLimit
        isExempted
      }
      transport {
        mode
        plates
        takenOverAt
        signature {
          author
          date
        }
      }
    }
    transporters {
      id
      company {
        ...CompanyFragment
      }
      customInfo
      recepisse {
        number
        department
        validityLimit
        isExempted
      }
      transport {
        mode
        plates
        takenOverAt
        signature {
          author
          date
        }
      }
    }
    ecoOrganisme {
      name
      siret
    }
    metadata {
      errors {
        message
        path
        requiredFor
      }
    }
    grouping {
      id
      waste {
        code
        materialName
      }
      destination {
        cap
        operation {
          nextDestination {
            cap
            company {
              siret
              name
              orgId
            }
          }
        }
        reception {
          weight
        }
      }
    }
    forwarding {
      id
      waste {
        code
      }
      destination {
        cap
        operation {
          nextDestination {
            cap
          }
        }
        reception {
          weight
        }
      }
    }
    forwardedIn {
      id
      isDraft
      waste {
        code
      }
      destination {
        cap
        operation {
          nextDestination {
            cap
          }
        }
        reception {
          weight
        }
      }
    }
    groupedIn {
      id
      isDraft
      waste {
        code
      }
      destination {
        cap
      }
    }
    intermediaries {
      ...CompanyFragment
    }
  }
  ${companyFragment}
`;
