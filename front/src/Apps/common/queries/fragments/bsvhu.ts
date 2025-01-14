import { gql } from "@apollo/client";
import { companyFragment, dashboardCompanyFragment } from "./company";

export const vhuFragment = gql`
  fragment VhuFragment on Bsvhu {
    id
    customId
    bsvhuStatus: status
    isDraft
    emitter {
      agrementNumber
      company {
        ...CompanyFragment
      }
    }
    transporter {
      company {
        ...CompanyFragment
      }
      transport {
        plates
        mode
      }
      customInfo
      recepisse {
        number
      }
    }
    destination {
      type
      company {
        ...CompanyFragment
      }
      reception {
        date
        quantity
        weight
        acceptationStatus
        refusalReason
      }
      operation {
        date
        code
      }
    }
    wasteCode
    packaging
    quantity
    weight {
      value
      isEstimate
    }
  }
  ${companyFragment}
`;

// This fragment query only the fields required for dashboard and workflow action button
// Would you need to query more fields, pay attention to sub resolvers which
// might make unwanted db queries
export const dashboardVhuFragment = gql`
  fragment DashboardVhuFragment on Bsvhu {
    id
    customId
    bsvhuStatus: status
    isDraft
    emitter {
      agrementNumber
      irregularSituation
      noSiret
      company {
        ...DashboardCompanyFragment
      }
    }
    transporter {
      company {
        ...DashboardCompanyFragment
      }
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
      customInfo
    }
    destination {
      type
      company {
        ...DashboardCompanyFragment
      }
      reception {
        weight
      }
    }
    wasteCode
    weight {
      value
    }
    ecoOrganisme {
      siret
      name
    }
    bsvhuUpdatedAt: updatedAt
  }
  ${dashboardCompanyFragment}
`;

export const FullBsvhuFragment = gql`
  fragment FullBsvhu on Bsvhu {
    id
    customId
    isDraft
    status
    createdAt
    updatedAt
    emitter {
      company {
        ...CompanyFragment
      }
      agrementNumber
      irregularSituation
      noSiret
      emission {
        signature {
          author
          date
        }
      }
    }
    destination {
      type
      plannedOperationCode
      company {
        ...CompanyFragment
      }
      agrementNumber
      reception {
        date
        quantity
        weight
        acceptationStatus
        refusalReason
        identification {
          numbers
          type
        }
      }
      operation {
        code
        mode
        date
        signature {
          author
          date
        }
        nextDestination {
          company {
            ...CompanyFragment
          }
        }
      }
    }
    packaging
    wasteCode
    identification {
      numbers
      type
    }
    quantity
    weight {
      value
      isEstimate
    }
    transporter {
      company {
        ...CompanyFragment
        vatNumber
      }
      recepisse {
        number
        department
        validityLimit
        isExempted
      }
      customInfo
      transport {
        plates
        mode
        takenOverAt
        signature {
          author
          date
        }
      }
    }
    ecoOrganisme {
      siret
      name
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
    trader {
      company {
        ...CompanyFragment
      }
      recepisse {
        number
        department
        validityLimit
      }
    }
    intermediaries {
      ...CompanyFragment
    }
  }
  ${companyFragment}
`;
