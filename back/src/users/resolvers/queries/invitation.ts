import { QueryResolvers } from "../../../generated/graphql/types";
import { getUserAccountHashOrNotFound } from "../../database";

const invitationResolver: QueryResolvers["invitation"] = (parent, { hash }) => {
  return getUserAccountHashOrNotFound({ hash });
};

export default invitationResolver;
