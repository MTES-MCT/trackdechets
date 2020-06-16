import { ExpressContext } from "apollo-server-express/dist/ApolloServer";

import { AuthUser } from "./auth";
import { CompanyPrivate } from "./generated/graphql/types";

export type GraphQLContext = ExpressContext & {
  user: AuthUser;
  company: CompanyPrivate | null;
};
