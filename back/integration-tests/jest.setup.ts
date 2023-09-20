// import { redisClient } from "../src/common/redis";
// import prisma from "../src/prisma";
// import { client as elasticSearch } from "../src/common/elastic";
// import { closeMongoClient } from "../src/events/mongodb";
// import { closeQueues } from "../src/queue/producers";

// afterAll(async () => {
//   await Promise.all([
//     closeMongoClient(),
//     closeQueues(),
//     elasticSearch.close(),
//     redisClient.quit(),
//     prisma.$disconnect(),
//   ])
// });
