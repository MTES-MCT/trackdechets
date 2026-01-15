import { ApolloServerPlugin, GraphQLRequestContext } from "@apollo/server";
import { ValidationError } from "yup";
import { ZodError } from "zod";
import * as Sentry from "@sentry/node";
import { GraphQLError } from "graphql";
import { GraphQLContext } from "../../types";
import { getOpenTelemetryTraceId } from "../utils/getTraceId";

const knownErrors = [GraphQLError, ValidationError, ZodError];

/**
 * Apollo server plugin used to capture unhandled errors in Sentry
 * https://www.apollographql.com/docs/apollo-server/integrations/plugins/
 */
const sentryReporter: ApolloServerPlugin = {
  async requestDidStart(requestContext: GraphQLRequestContext<GraphQLContext>) {
    return {
      async didEncounterErrors(errorContext) {
        if (!errorContext.operation) {
          // If we couldn't parse the operation, don't do anything here
          return;
        }

        for (const error of errorContext.errors) {
          // don't do anything with errors we expect.
          if (
            knownErrors.some(
              expectedError => error.originalError instanceof expectedError
            )
          ) {
            continue;
          }

          const scope = new Sentry.Scope();
          // Annotate whether failing operation was query/mutation/subscription
          scope.setTag("kind", errorContext.operation.operation);

          scope.setExtra("query", errorContext.request.query);
          scope.setExtra("variables", errorContext.request.variables);

          if (error.path) {
            scope.addBreadcrumb({
              category: "query-path",
              message: error.path.join(" > "),
              level: Sentry.Severity.Debug
            });
          }

          if (requestContext.contextValue.user?.email) {
            scope.setUser({
              email: requestContext.contextValue.user.email
            });
          }

          ["origin", "user-agent", "x-real-ip"].forEach(key => {
            if (errorContext.request.http?.headers.get(key)) {
              scope.setExtra(key, errorContext.request.http.headers.get(key));
            }
          });

          // Ajouter le trace ID OpenTelemetry pour corrélation avec Datadog
          const traceId = getOpenTelemetryTraceId();
          if (traceId) {
            scope.setContext("trace", {
              trace_id: traceId
            });
          }

          const sentryId = Sentry.captureException(error, scope);
          error.extensions.sentryId = sentryId;
        }
      }
    };
  }
};

export default sentryReporter;
