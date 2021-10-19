import { gql } from "apollo-server-express";

export const fullBsda = gql`
  fragment FullBsda on Bsda {
    id
    createdAt
    updatedAt
    isDraft
    status
    type
    emitter {
      isPrivateIndividual
      company {
        name
        siret
        address
        contact
        phone
        mail
      }
      customInfo
      pickupSite {
        name
        address
        city
        postalCode
        infos
      }
      emission {
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
    waste {
      code
      name
      familyCode
      materialName
      consistence
      sealNumbers
      adr
    }
    packagings {
      other
      quantity
      type
    }
    weight {
      isEstimate
      value
    }
    broker {
      company {
        siret
        address
        contact
        phone
        mail
      }
      recepisse {
        number
        department
        validityLimit
      }
    }
    destination {
      company {
        name
        siret
        address
        contact
        phone
        mail
      }
      cap
      plannedOperationCode
      customInfo
      reception {
        date
        weight
        acceptationStatus
        refusalReason
      }
      operation {
        code
        date
        signature {
          author
          date
        }
        nextDestination {
          company {
            siret
            vatNumber
            name
            address
            contact
            phone
            mail
          }
          cap
          plannedOperationCode
        }
      }
    }
    transporter {
      customInfo
      company {
        name
        siret
        address
        contact
        phone
        mail
        vatNumber
      }
      recepisse {
        isExempted
        number
        department
        validityLimit
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
    worker {
      company {
        name
        siret
        address
        contact
        phone
        mail
      }
      work {
        hasEmitterPaperSignature
        signature {
          author
          date
        }
      }
    }
    groupedIn {
      id
    }
    grouping {
      id
    }
    forwarding {
      id
    }
    forwardedIn {
      id
    }
  }
`;
