import { ApolloClient, InMemoryCache } from '@apollo/client';

export const apolloClient = new ApolloClient({
  uri: 'http://localhost:4000/', // Our Phase 2 Node.js Apollo Gateway
  cache: new InMemoryCache(),
});
