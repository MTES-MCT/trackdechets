import { ApolloError } from "@apollo/client";
import React, { FunctionComponent, ReactElement } from "react";
import styles from "./Error.module.scss";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
type Props = {
  apolloError: ApolloError;
  className?: string;
  message?: (err: ApolloError) => string;
  children?: (props: { error; idx? }) => ReactElement;
};

export const isFunction = (obj: any): obj is Function =>
  typeof obj === "function";

export const ErrorProvider: FunctionComponent<Props> = ({
  apolloError,
  children
}) => {
  if (!children || !isFunction(children)) {
    console.info("ErrorProvider only accepts a function as a child.");
    return null;
  }

  const { graphQLErrors, networkError } = apolloError;

  if (graphQLErrors.length >= 1) {
    return <>{graphQLErrors.map((error, idx) => children({ error, idx }))}</>;
  }

  if (networkError) {
    return children({ error: networkError });
  }

  if (apolloError) {
    return children({ error: apolloError });
  }
  return null;
};

export function InlineError({ apolloError }: Props) {
  return (
    <ErrorProvider apolloError={apolloError}>
      {({ error, idx }) => (
        <p key={`${idx}-${error.message}`}>{`Erreur ! ${error.message}`}</p>
      )}
    </ErrorProvider>
  );
}

export function NotificationError({ apolloError, className, message }: Props) {
  return (
    <ErrorProvider apolloError={apolloError}>
      {({ error, idx }) => (
        <div
          key={`${idx}-${error.message}`}
          className={`notification notification--error tw-mt-2 ${
            styles.lineBreak
          } ${className ?? ""}`}
        >
          {message ? message(apolloError) : error.message}
        </div>
      )}
    </ErrorProvider>
  );
}

export function DsfrNotificationError({ apolloError, message }: Props) {
  return (
    <ErrorProvider apolloError={apolloError}>
      {({ error, idx }) => (
        <Alert
          key={`${idx}-${error.message}`}
          title="Erreur"
          description={message ? message(apolloError) : error.message}
          severity="error"
        />
      )}
    </ErrorProvider>
  );
}

export function SimpleNotificationError({
  className,
  message
}: {
  className?: string;
  message: string | ReactElement;
}) {
  return (
    <div
      className={`notification notification--error tw-mt-2 ${
        styles.lineBreak
      } ${className ?? ""}`}
    >
      {message}
    </div>
  );
}
