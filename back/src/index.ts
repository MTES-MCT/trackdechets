import { GraphQLServer } from "graphql-yoga";
import { resolvers as usersResolver } from "./users/resolvers";
const port = 3000;

const server = new GraphQLServer({
  typeDefs: ["./users/users.graphql"],
  resolvers: null // TODO
});

server.express.get("/ping", (_, res) => res.send("Pong!"));
server.start({ port }, () =>
  console.log("Server is running on localhost:4000")
);
