const { STARTUP_FILE, NODE_ENV } = process.env;

let apps = [
  {
    name: "server",
    script:
      !STARTUP_FILE || STARTUP_FILE === "unset"
        ? "./dist/src/index.js"
        : STARTUP_FILE,
    instances: "1",
    exec_mode: "cluster",
    watch: false,
    env: {
      NODE_ENV: "production"
    }
  }
];

if (NODE_ENV === "dev") {
  apps = [
    {
      name: "server",
      script: "./src/index.ts",
      interpreter: "node",
      interpreterArgs: "--loader tsm -r dotenv/config",
      instances: "1",
      exec_mode: "cluster",
      watch: true,
      env: {
        NODE_ENV: "dev"
      }
    }
    // {
    //   name: "apiqueue",
    //   script: "./src/queue/consumer.ts",
    //   interpreter: "node",
    //   interpreterArgs: "--loader tsx -r dotenv/config",
    //   instances: "1",
    //   exec_mode: "cluster",
    //   watch: true,
    //   env: {
    //     NODE_ENV: "dev"
    //   }
    // },
    // {
    //   name: "indexationqueue",
    //   script: "./src/queue/consumerIndexation.ts",
    //   interpreter: "node",
    //   interpreterArgs: "--loader tsx -r dotenv/config",
    //   instances: "1",
    //   exec_mode: "cluster",
    //   watch: true,
    //   env: {
    //     NODE_ENV: "dev"
    //   }
    // },
    // {
    //   name: "webhooksqueue",
    //   script: "./src/queue/consumerWebhooks.ts",
    //   interpreter: "node",
    //   interpreterArgs: "--loader tsx -r dotenv/config",
    //   instances: "1",
    //   exec_mode: "cluster",
    //   watch: true,
    //   env: {
    //     NODE_ENV: "dev"
    //   }
    // },
    // {
    //   name: "notifier",
    //   script: "./src/notifier/index.ts",
    //   interpreter: "node",
    //   interpreterArgs: "--loader tsx -r dotenv/config",
    //   instances: "1",
    //   exec_mode: "cluster",
    //   watch: true,
    //   env: {
    //     NODE_ENV: "dev"
    //   }
    // }
  ];
}

// if (STARTUP_FILE === undefined || STARTUP_FILE === "unset") {
//   apps.push({
//     name: "download",
//     script: NODE_ENV === "dev" ? "./src/download.ts" : "./dist/src/download.js",
//     interpreter: "node",
//     interpreterArgs: NODE_ENV === "dev" ? "--loader tsm -r dotenv/config" : "",
//     instances: "1",
//     exec_mode: "cluster",
//     watch: NODE_ENV === "dev"
//   });
// }

module.exports = {
  apps: apps
};
