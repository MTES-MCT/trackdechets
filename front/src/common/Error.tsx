import { ApolloError } from "apollo-client";
import React, { FunctionComponent } from "react";
import styles from "./Error.module.scss";

type Props = {
  apolloError: ApolloError;
  className?: string;
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

  const errors = apolloError.graphQLErrors ??
    apolloError.networkError ?? [apolloError];

  return <>{errors.map((error, idx) => children({ error, idx }))}</>;
};

export default function Error({ apolloError }: Props) {
  return (
    <ErrorProvider apolloError={apolloError}>
      {({ error, idx }) => (
        <p key={`${idx}-${error.message}`}>{`Erreur ! ${error.message}`}</p>
      )}
    </ErrorProvider>
  );
}

export function NotificationError({ apolloError, className }: Props) {
  return (
    <ErrorProvider apolloError={apolloError}>
      {({ error, idx }) => (
        <div
          key={`${idx}-${error.message}`}
          className={`notification error ${styles.lineBreak} ${className ??
            ""}`}
        >
          {error.message}
        </div>
      )}
    </ErrorProvider>
  );
}
