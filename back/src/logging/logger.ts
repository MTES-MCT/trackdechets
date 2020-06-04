import { createLogger, format } from "winston";
import Graylog2, { TransportOptions } from "./winston-graylog";
import Transport from "winston-transport";

// Create a logger with Graylog2 transport to send data
// to OVH logs data platform. It uses GELF log format over UDP
// https://docs.graylog.org/en/2.5/pages/gelf.html?highlight=gelf
// See also https://docs.ovh.com/fr/logs-data-platform/quick-start/
const {
  OVH_LOGS_ACTIVATED,
  OVH_LOGS_TOKEN,
  OVH_LOGS_HOST,
  OVH_LOGS_PORT,
  API_HOST
} = process.env;

const logger = createLogger({
  level: "info",
  exitOnError: false,
  format: format.combine(format.errors({ stack: true }), format.metadata())
});

// Add Graylog transport if OVH Logs Data Platform is configured
if (OVH_LOGS_ACTIVATED === "true") {
  const graylogOpts: TransportOptions = {
    graylog: {
      servers: [{ host: OVH_LOGS_HOST, port: parseInt(OVH_LOGS_PORT, 10) }],
      hostname: API_HOST,
      facility: "node-td-api"
    },
    handleExceptions: true,
    staticMeta: {
      "X-OVH-TOKEN": OVH_LOGS_TOKEN
    }
  };

  logger.add(new Graylog2(graylogOpts));
}

// Add a default null transport if no one is configured
// to prevent warning messages
if (logger.transports.length === 0) {
  class NullTransport extends Transport {
    log(_info, callback) {
      callback();
    }
  }
  logger.add(new NullTransport());
}

export default logger;
