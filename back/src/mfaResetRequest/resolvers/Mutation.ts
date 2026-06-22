import createMfaResetRequest from "./mutations/createMfaResetRequest";
import cancelMfaResetRequest from "./mutations/cancelMfaResetRequest";
import exchangeMfaReconfigToken from "./mutations/exchangeMfaReconfigToken";

const Mutation = {
  createMfaResetRequest,
  cancelMfaResetRequest,
  exchangeMfaReconfigToken
};

export default Mutation;
