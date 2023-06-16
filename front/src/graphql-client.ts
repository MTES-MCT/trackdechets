import {
  InMemoryCache,
  ApolloClient,
  ApolloLink,
  createHttpLink,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { relayStylePagination } from "@apollo/client/utilities";
import omitDeep from "omit-deep-lodash";

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
 * Automatically erase `company.orgId` from variables
 * This enable devs to use FormCompany object (that has orgId) from the server
 * and not worry about `orgId` breaking CompanyInput (that misses orgId)
 */
const cleanOrgIdLink = new ApolloLink((operation, forward) => {
  if (operation.variables) {
    for (const key in Object.keys(operation.variables)) {
      operation.variables[key] = omitDeep(operation.variables[key], "orgId");
    }
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
  uri: import.meta.env.VITE_API_ENDPOINT as string,
  credentials: "include",
});

const apolloClient = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // https://www.apollographql.com/docs/react/pagination/cursor-based/#relay-style-cursor-pagination
          myCompanies: relayStylePagination(),
        },
      },
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
  link: ApolloLink.from([
    errorLink,
    cleanOrgIdLink,
    cleanTypeNameLink,
    httpLink,
  ]),
  name: "trackdechets-front",
});

export default apolloClient;
