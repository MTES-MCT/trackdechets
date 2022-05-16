#!/usr/bin/env node

// Node script to get a download URL for the latest DB backup.
// SCALINGO_TOKEN must be in .env file
// -----------------------------------------------------------

const https = require("https");
const fs = require("fs");

const SCALINGO_API_URL = "api.osc-secnum-fr1.scalingo.com";
const SCALINGO_DB_API_URL = "db-api.osc-secnum-fr1.scalingo.com";
const APP_NAME = "trackdechets-sandbox-api";

async function run() {
  const { SCALINGO_TOKEN } = await loadEnv();

  if (!SCALINGO_TOKEN) {
    throw new Error("Missing env, cannot restore backup.");
  }

  const { token: bearerToken } = await getBearerToken(SCALINGO_TOKEN);

  const { addons } = await listAddons(bearerToken);

  const postgres = addons.find(
    addon => addon.addon_provider.id === "postgresql"
  );

  const addonToken = (await getAddonToken(bearerToken, postgres.id)).addon
    .token;

  const { database_backups } = await listBackups(postgres.id, addonToken);

  const sortedBackups = database_backups.sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
  const { download_url } = await getBackupDownloadLink(
    postgres,
    sortedBackups[0],
    addonToken
  );
  console.log(download_url);
}

function getBearerToken(scalingoToken) {
  const auth = new Buffer.from(`:${scalingoToken}`).toString("base64");

  const options = {
    hostname: `auth.scalingo.com`,
    port: 443,
    path: "/v1/tokens/exchange",
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`
    }
  };
  return fetch(options);
}

function listAddons(bearerToken) {
  const options = {
    hostname: SCALINGO_API_URL,
    port: 443,
    path: `/v1/apps/${APP_NAME}/addons`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${bearerToken}`
    }
  };

  return fetch(options);
}

function getAddonToken(bearerToken, addonId) {
  const options = {
    hostname: SCALINGO_API_URL,
    port: 443,
    path: `/v1/apps/${APP_NAME}/addons/${addonId}/token`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearerToken}`
    }
  };

  return fetch(options);
}

function listBackups(addonId, addonToken) {
  const options = {
    hostname: SCALINGO_DB_API_URL,
    port: 443,
    path: `/api/databases/${addonId}/backups`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${addonToken}`
    }
  };

  return fetch(options);
}

function getBackupDownloadLink(postgres, backup, addonToken) {
  const options = {
    hostname: SCALINGO_DB_API_URL,
    port: 443,
    path: `/api/databases/${postgres.id}/backups/${backup.id}/archive`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${addonToken}`
    }
  };

  return fetch(options);
}

function fetch(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        console.log(res.statusMessage);
        return reject(
          new Error(`${res.statusMessage} - code ${res.statusCode}`)
        );
      }
      const data = [];

      res.on("data", chunk => {
        data.push(chunk);
      });
      res.on("end", () => {
        const parsed = JSON.parse(Buffer.concat(data).toString());

        resolve(parsed);
      });
    });

    req.on("error", reject);

    req.end();
  });
}

async function loadEnv() {
  const keysMapping = {
    SCALINGO_TOKEN: "SCALINGO_TOKEN"
  };
  const envFile = await fs.promises.readFile("../.env");
  return envFile
    .toString()
    .split("\n")
    .map(line => line.split("="))
    .filter(([key]) => Object.keys(keysMapping).includes(key))
    .reduce((envs, [envKey, value]) => {
      const key = keysMapping[envKey];
      envs[key] = value;
      return envs;
    }, {});
}
run();
