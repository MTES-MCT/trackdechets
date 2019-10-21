import { isAuthenticated } from "../common/rules";

export default {
  Query: {
    me: isAuthenticated
  },
  Mutation: {
    changePassword: isAuthenticated
  }
};
