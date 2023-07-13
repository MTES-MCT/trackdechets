import { gql } from "apollo-server-express";

// Fragments used for documentation and for tests

const fullFicheIntervention = gql`
  fragment FullFicheIntervention on BsffFicheIntervention {
    id
    numero
    weight
    detenteur {
      company {
        siret
        name
        address
        country
        contact
        phone
        mail
      }
    }
    operateur {
      company {
        siret
        name
        address
        country
        contact
        phone
        mail
      }
    }
    postalCode
  }
`;

export const fullBsff = gql`
  fragment FullBsff on Bsff {
    id
    isDraft
    createdAt
    updatedAt
    status
    type
    emitter {
      customInfo
      company {
        siret
        name
        address
        country
        contact
        phone
        mail
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
      volume
      numero
      weight
      acceptation {
        weight
        status
        refusalReason
        wasteCode
        wasteDescription
        signature {
          date
          author
        }
      }
      operation {
        code
        noTraceability
        nextDestination {
          company {
            siret
            name
            address
            country
            contact
            phone
            mail
          }
        }
        signature {
          date
          author
        }
      }
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
      customInfo
      company {
        siret
        name
        address
        country
        contact
        phone
        mail
      }
      recepisse {
        number
        department
        validityLimit
        isExempted
      }
      transport {
        mode
        signature {
          author
          date
        }
      }
    }
    destination {
      customInfo
      company {
        siret
        name
        address
        country
        contact
        phone
        mail
      }
      cap
      plannedOperationCode
      reception {
        date
        signature {
          date
          author
        }
      }
    }
    ficheInterventions {
      ...FullFicheIntervention
    }
    grouping {
      id
    }
    repackaging {
      id
    }
    forwarding {
      id
    }
  }
  ${fullFicheIntervention}
`;
