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
  const h = await getUserAccountHashOrNotFound({ hash });
  // type casting is necessary here as long as we
  // do not expose READER and DRIVER role in the API
  return { ...h, role: h.role };
};

export default invitationResolver;
