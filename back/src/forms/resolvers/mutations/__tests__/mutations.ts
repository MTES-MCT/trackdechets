export const MARK_AS_SEALED = `
  mutation MarkAsSealed($id: ID!) {
    markAsSealed(id: $id) {
      id
      status
      transporter {
        company {
          siret
        }
        isExemptedOfReceipt
        receipt
        validityLimit
        department
      }
    }
  }
`;

export const SIGN_EMISSION_FORM = `
  mutation SignEmissionForm($id: ID!, $input: SignEmissionFormInput!, $securityCode: Int) {
    signEmissionForm(id: $id, input: $input, securityCode: $securityCode) {
      id
      status
      signedByTransporter
      sentAt
      sentBy
      emittedAt
      emittedBy
      emittedByEcoOrganisme
      temporaryStorageDetail {
        signedAt
        signedBy
        emittedAt
        emittedBy
      }
    }
  }
`;
