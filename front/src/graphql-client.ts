import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { createHttpLink } from "apollo-link-http";
import { omitDeep } from "./utils/omit";

const httpLink = createHttpLink({
  uri: process.env.REACT_APP_API_ENDPOINT,
  credentials: "include",
});

const cleanTypenameLink = new ApolloLink((operation, forward) => {
  if (!forward) {
    return null;
  }
  if (operation.variables) {
    operation.variables = omitDeep(operation.variables, "__typename");
  }
  return forward(operation).map((data) => {
    return data;
  });
});

export default new ApolloClient({
  link: ApolloLink.from([cleanTypenameLink, httpLink]),
  cache: new InMemoryCache({ dataIdFromObject: (obj) => obj.id }),
});
