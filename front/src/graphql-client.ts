import { ApolloClient } from "apollo-client";
import { createHttpLink } from "apollo-link-http";
import { setContext } from "apollo-link-context";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link";
import { omitDeep } from "./utils/omit";

const httpLink = createHttpLink({
  uri: process.env.REACT_APP_API_ENDPOINT
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("td-token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ""
    }
  };
});

const cleanTypenameLink = new ApolloLink((operation, forward) => {
  if (!forward) {
    return null;
  }
  if (operation.variables) {
    operation.variables = omitDeep(operation.variables, "__typename");
  }
  return forward(operation).map(data => {
    return data;
  });
});

export default new ApolloClient({
  link: ApolloLink.from([cleanTypenameLink, authLink, httpLink]),
  cache: new InMemoryCache()
});
