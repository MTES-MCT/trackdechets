import { ApolloError } from "apollo-server-express";
import { ApolloServerPlugin } from "apollo-server-plugin-base";
import { ValidationError } from "yup";
import * as Sentry from "@sentry/node";

const knownErrors = [ApolloError, ValidationError];

const sentryReporter: ApolloServerPlugin = {
  requestDidStart(requestContext) {
    return {
      didEncounterErrors(errorContext) {
        if (!errorContext.operation) {
          // If we couldn't parse the operation, don't do anything here
          return;
        }

        for (const error of errorContext.errors) {
          const err = error.originalError || error;

          // don't do anything with errors we expect.
          if (knownErrors.some(expectedError => err instanceof expectedError)) {
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

          const sentryId = Sentry.captureException(err, scope);
          (err as any).sentryId = sentryId;
        }
      }
    };
  }
};

export default sentryReporter;
