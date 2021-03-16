import {
  InMemoryCache,
  ApolloClient,
  ApolloLink,
  createHttpLink,
} from "@apollo/client";

/**
 * Automatically erase `__typename` from variables
 * This enable devs to use objects fetched from the server
 * and not worry about `__typename` potentially breaking a mutation
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
  return forward(operation);
});

const httpLink = createHttpLink({
  uri: process.env.REACT_APP_API_ENDPOINT,
  credentials: "include",
});

export default new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Form: {
        fields: {
          transporter: {
            merge: true,
          },
          stateSummary: {
            merge: true,
          },
          wasteDetails: {
            merge: true,
          },
        },
      },
    },
  }),
  link: ApolloLink.from([cleanTypeNameLink, httpLink]),
});
