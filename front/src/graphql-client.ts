import {
  InMemoryCache,
  ApolloClient,
  ApolloLink,
  createHttpLink,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";

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

/**
 * Handles any GraphQL errors or network error that occurred
 */
const errorLink = onError(({ response, graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (let err of graphQLErrors) {
      if (err.extensions?.code === "UNAUTHENTICATED") {
        // when AuthenticationError thrown
        // modify the response context to ignore the error
        // cf. https://www.apollographql.com/docs/react/data/error-handling/#ignoring-errors
        response!.errors = undefined;
      }
    }
  }
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
      CompanyMember: {
        keyFields: ["id", "role"],
      },
    },
  }),
  link: ApolloLink.from([errorLink, cleanTypeNameLink, httpLink]),
  name: "trackdechets-front",
});
