#!/usr/bin/env node

// Node script to get a download URL for the latest DB backup.
// -----------------------------------------------------------

const https = require("https");
const fs = require("fs").promises;

const DB_NAME = "prisma_autobackup";
const API_HOST = "api.scaleway.com";
const API_ENDPOINT = "/rdb/v1/regions/fr-par/backups";

async function run() {
  const { DB_API_ID, API_KEY } = await loadEnv();
  if (!DB_API_ID || !API_KEY) {
    throw new Error("Missing env, cannot restore backup.");
  }

  const fetch = buildFetcher(API_KEY);
  const backupsResponse = await fetch(
    `?name=${DB_NAME}&order_by=created_at_desc&instance_id=${DB_API_ID}`
  );
  const latest_backup = backupsResponse.database_backups?.[0];

  if (!latest_backup) {
    throw new Error("No backup available.");
  }

  if (
    !latest_backup.download_url ||
    latest_backup.download_url_expires_at > Date.now()
  ) {
    if (latest_backup.status !== "exporting") {
      await fetch(`/${latest_backup.id}/export`, "POST");
    }
    return run();
  }

  console.log(latest_backup.download_url);
}

async function loadEnv() {
  const keysMapping = {
    DB_API_ID: "DB_API_ID",
    S3_SECRET_ACCESS_KEY: "API_KEY",
  };
  const envFile = await fs.readFile("../.env");
  return envFile
    .toString()
    .split("\n")
    .map((line) => line.split("="))
    .filter(([key]) => Object.keys(keysMapping).includes(key))
    .reduce((envs, [envKey, value]) => {
      const key = keysMapping[envKey];
      envs[key] = value;
      return envs;
    }, {});
}

function buildFetcher(API_KEY) {
  return function (path, method = "GET") {
    const options = {
      hostname: API_HOST,
      port: 443,
      path: `${API_ENDPOINT}${path}`,
      method,
      headers: {
        "X-Auth-Token": API_KEY,
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.log(res.statusMessage);
          return reject(new Error(`${res.statusMessage} - code ${res.statusCode}`));
        }

        const data = [];

        res.on("data", (chunk) => {
          data.push(chunk);
        });

        res.on("end", () =>
          resolve(JSON.parse(Buffer.concat(data).toString()))
        );
      });

      req.on("error", reject);
      if (method === "POST") {
        req.write("{}");
      }

      req.end();
    });
  };
}

run();
