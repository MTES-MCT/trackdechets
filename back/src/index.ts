import { GraphQLServer } from "graphql-yoga";
import { fileLoader, mergeResolvers, mergeTypes } from "merge-graphql-schemas";
import { prisma } from "./generated/prisma-client";

const port = 4000;

const typesArray = fileLoader(`${__dirname}/**/*.graphql`, { recursive: true });
const typeDefs = mergeTypes(typesArray, { all: true });

const resolversArray = fileLoader(`${__dirname}/**/resolvers.ts`, {
  recursive: true
});
const resolvers = mergeResolvers(resolversArray);

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: {
    prisma
  }
});

server.express.get("/ping", (_, res) => res.send("Pong!"));
server.start({ port }, () =>
  console.log(`Server is running on localhost:${port}`)
);
