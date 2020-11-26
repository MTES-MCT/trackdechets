import { InMemoryCache, ApolloClient, ApolloLink } from "@apollo/client";

/**
 * Automatically erase `__typename` from variables
 * This enable devs to use objects fetched from the server
 * and not worry with the `__typename` potentially breaking a mutation
 */
const cleanTypeNameLink = new ApolloLink((operation, forward) => {
  if (operation.variables) {
    const omitTypename = (key, value) =>
      key === "__typename" ? undefined : value;
    operation.variables = JSON.parse(
      JSON.stringify(operation.variables),
      omitTypename
    );
  }
  return forward(operation).map(data => {
    return data;
  });
});

export default new ApolloClient({
  uri: process.env.REACT_APP_API_ENDPOINT,
  cache: new InMemoryCache(),
  credentials: "include",
  link: cleanTypeNameLink,
});
