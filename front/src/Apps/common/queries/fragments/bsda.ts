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
    }
    worker {
      isDisabled
      company {
        name
        siret
        orgId
      }
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
    waste {
      materialName
      bsdaCode: code
    }
    forwardedIn {
      id
    }
    groupedIn {
      id
    }
    weight {
      value
    }
    bsdaUpdatedAt: updatedAt
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
