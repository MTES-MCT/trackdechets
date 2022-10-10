import { gql } from "@apollo/client";
import { companyFragment } from "./company";

// This fragment query only the fields required for dashboard and workflow action button
// Would you need to query more fields, pay attention to sub resolvers which
// might make unwanted db queries
export const dashboardBsffFragment = gql`
  fragment DashboardBsffFragment on Bsff {
    id
    isDraft
    bsffStatus: status
    bsffEmitter: emitter {
      company {
        siret
        name
      }
    }
    bsffTransporter: transporter {
      company {
        siret
        name
      }
      transport {
        plates
      }
      customInfo
    }
    bsffDestination: destination {
      company {
        siret
        name
      }
    }
    waste {
      code
      description
    }
    packagings {
      numero
    }
  }
`;

export const FicheInterventionFragment = gql`
  fragment FicheInterventionFragment on BsffFicheIntervention {
    id
    numero
    weight
    postalCode
  }
`;

export const FullBsffFragment = gql`
  fragment FullBsff on Bsff {
    id
    type
    status
    isDraft
    emitter {
      company {
        ...CompanyFragment
      }
      emission {
        signature {
          author
          date
        }
      }
    }
    packagings {
      name
      numero
      volume
      weight
    }
    waste {
      code
      description
      adr
    }
    weight {
      value
      isEstimate
    }
    transporter {
      company {
        ...CompanyFragment
      }
      recepisse {
        number
        department
        validityLimit
      }
      transport {
        mode
        signature {
          author
          date
        }
        plates
      }
      customInfo
    }
    destination {
      company {
        ...CompanyFragment
      }
      reception {
        date
        weight
        acceptation {
          status
          refusalReason
        }
        signature {
          author
          date
        }
      }
      operation {
        code
        nextDestination {
          company {
            ...CompanyFragment
          }
        }
        signature {
          author
          date
        }
      }
      plannedOperationCode
      cap
    }
    ficheInterventions {
      ...FicheInterventionFragment
    }
    grouping {
      id
      packagings {
        name
        numero
        volume
        weight
      }
    }
    groupedIn {
      id
    }
    repackaging {
      id
      packagings {
        name
        numero
        volume
        weight
      }
    }
    repackagedIn {
      id
    }
    forwarding {
      id
      packagings {
        name
        numero
        volume
        weight
      }
    }
    forwardedIn {
      id
    }
  }
  ${companyFragment}
  ${FicheInterventionFragment}
`;

export const PreviousBsffFragment = gql`
  fragment PreviousBsff on Bsff {
    id
    type
    status
    emitter {
      company {
        siret
        name
      }
    }
    packagings {
      name
      numero
      volume
      weight
    }
    waste {
      code
      description
      adr
    }
    weight {
      value
      isEstimate
    }
    repackagedIn {
      id
      packagings {
        name
        numero
        volume
        weight
      }
    }
    forwardedIn {
      id
      packagings {
        name
        numero
        volume
        weight
      }
    }
    groupedIn {
      id
      packagings {
        name
        numero
        volume
        weight
      }
    }
  }
`;
