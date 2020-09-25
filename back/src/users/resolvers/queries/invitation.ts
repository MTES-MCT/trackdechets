import { QueryResolvers } from "../../../generated/graphql/types";
import { getUserAccountHashOrNotFound } from "../../database";

/**
 * This query is used to check if the invitation hash is valid
 * or if the user has already joined when clicking the invitation
 * link sent by email
 */
const invitationResolver: QueryResolvers["invitation"] = async (
  parent,
  { hash }
) => {
  return getUserAccountHashOrNotFound({ hash });
};

export default invitationResolver;
