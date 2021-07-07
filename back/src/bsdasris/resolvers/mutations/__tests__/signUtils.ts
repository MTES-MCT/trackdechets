export const SIGN_DASRI = `
mutation SignDasri($id: ID!, $input: BsdasriSignatureInput
!) {
  signBsdasri(id: $id, input: $input	) {
    id
  }
}
`;

export const SIGN_DASRI_WITH_CODE = `
mutation SignDasriWithCode($id: ID!, $input: BsdasriSignatureWithSecretCodeInput
!) {
  signBsdasriEmissionWithSecretCode(id: $id, input: $input	) {
    id
  }
}
`;
