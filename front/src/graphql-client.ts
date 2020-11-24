import { InMemoryCache, ApolloClient } from "@apollo/client";

export default new ApolloClient({
  uri: process.env.REACT_APP_API_ENDPOINT,
  cache: new InMemoryCache(),
  credentials: "include",
});
