import { ApolloServerPlugin } from "apollo-server-plugin-base";
import { ValidationError } from "yup";
import { ZodError } from "zod";
import * as Sentry from "@sentry/node";
import { TDGraphQLError } from "../errors";

const knownErrors = [TDGraphQLError, ValidationError, ZodError];

/**
 * Apollo server plugin used to capture unhandled errors in Sentry
 * https://www.apollographql.com/docs/apollo-server/integrations/plugins/
 */
const sentryReporter: ApolloServerPlugin = {
  async requestDidStart(requestContext) {
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
              expectedError =>
                error instanceof expectedError ||
                error.originalError instanceof expectedError
            )
          ) {
            console.log("continue ?");
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

          if (requestContext.context.user?.email) {
            scope.setUser({
              email: requestContext.context.user.email
            });
          }

          ["origin", "user-agent", "x-real-ip"].forEach(key => {
            if (errorContext.request.http?.headers.get(key)) {
              scope.setExtra(key, errorContext.request.http.headers.get(key));
            }
          });

          const sentryId = Sentry.captureException(error, scope);
          if (error.originalError) {
            (error.originalError as any).sentryId = sentryId;
          }
        }
      }
    };
  }
};

export default sentryReporter;
