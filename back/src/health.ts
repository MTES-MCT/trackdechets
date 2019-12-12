import * as express from "express";
import axios from "axios";
import { resolve } from "url";

export const healthRouter = express.Router();

const TIMEOUT = 5000;
const services = [
  { name: "td-pdf", port: 3201, check: pingCheck },
  { name: "td-insee", port: 81, check: pingCheck },
  { name: "td-mail", port: 80, check: pingCheck },
  { name: "td-etl", port: 80, check: etlCheck }
];

type HealthCheck = {
  name: string;
  ok: boolean;
  requestTime?: number;
  status?: number;
  message?: string;
};

services.map(service => {
  healthRouter.get(`/${service.name}`, async (_, res) => {
    try {
      const health = await service.check();
      res.status(health.ok ? 200 : 503).json(health);
    } catch (error) {
      res.status(503).json({
        name: service.name,
        ok: false,
        message: "Unknown error"
      });
    }
  });
});

async function pingCheck() {
  return httpCheck(
    this.name,
    this.port,
    "/ping",
    data => typeof data === "string" && data.toLowerCase() === "pong"
  );
}

async function etlCheck() {
  return httpCheck(
    this.name,
    this.port,
    "/health",
    data =>
      data.metadatabase.status === "healthy" &&
      data.scheduler.status === "healthy"
  );
}

async function httpCheck(
  name: string,
  port: number,
  uri: string,
  isOk: (data: any) => boolean
): Promise<HealthCheck> {
  const instance = axios.create();
  instance.interceptors.request.use(
    (config: any) => {
      config.requestStartTime = Date.now();
      return config;
    },
    error => Promise.reject(error)
  );
  instance.interceptors.response.use(
    (response: any) => {
      response.config.requestTime =
        Date.now() - response.config.requestStartTime;
      return response;
    },
    error => Promise.reject(error)
  );

  try {
    const { status, data, config } = await instance.get(
      resolve(`http://${name}:${port}`, uri),
      { timeout: TIMEOUT }
    );

    return {
      name,
      ok: isOk(data),
      status,
      requestTime: (config as any).requestTime
    };
  } catch (error) {
    return {
      name,
      ok: false,
      ...(error.response && { status: error.response.status }),
      ...(error.message && { message: error.message })
    };
  }
}
