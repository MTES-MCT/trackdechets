import React, { Component } from "react";
import * as Sentry from "@sentry/browser";
import ErrorPage from "./Pages/ErrorPage";

// After a deploy, users navigating from one page to another without
// refreshing the page will encounter the error "Failed to fetch dynamically
// imported module"
const isBundleLoadingError = error => {
  return error.message?.includes("dynamically imported module");
};

const getLogErrorLevel = error => {
  // An error can define a custom severity level.
  if (error.level) {
    return error.level;
  }

  if (isBundleLoadingError(error)) {
    return "info";
  }

  // By default set high severity
  return "error";
};

class ErrorBoundary extends Component<React.PropsWithChildren> {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      hideReloadPageCTA: true,
      eventId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return {
      hasError: true,
      hideReloadPageCTA: isBundleLoadingError(error) ? false : true,
      error: error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      hasError: true,
      hideReloadPageCTA: isBundleLoadingError(error) ? false : true,
      error,
      errorInfo
    });
    // send the error to the error reporting service
    Sentry.addBreadcrumb({ message: "Captured by error boundary" });
    Sentry.withScope(scope => {
      scope.setExtra("errorInfo", errorInfo);
      scope.setLevel(getLogErrorLevel(error));
      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    });
  }

  render() {
    const { DEV } = import.meta.env; //built-in variable exposed with Vite
    const isDevelopment = DEV;
    const { children } = this.props;
    //@ts-ignore
    const { hasError, hideReloadPageCTA, eventId, errorInfo, error } =
      this.state;

    const message = !hideReloadPageCTA ? (
      <>
        Une nouvelle version du site est disponible. Veuillez rafraichir votre
        page. Si le problème persiste, merci de contacter{" "}
        <a
          target="_blank"
          href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
          rel="noreferrer"
        >
          l'assistance Trackdéchets.
        </a>
      </>
    ) : (
      <>
        Une erreur s'est produite, veuillez nous en excuser. Si le problème
        persiste, merci de contacter{" "}
        <a
          target="_blank"
          href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
          rel="noreferrer"
        >
          l'assistance Trackdéchets
        </a>{" "}
        en précisant le numéro d'erreur suivant : {eventId}.
      </>
    );

    if (hasError) {
      return (
        <div
          style={{
            margin: "0 auto",
            width: "90%"
          }}
        >
          <ErrorPage hideReloadPageCTA={hideReloadPageCTA} message={message} />
          {isDevelopment && (
            <div style={{ whiteSpace: "pre-wrap" }}>
              {error?.toString()}
              {errorInfo?.componentStack}
            </div>
          )}
        </div>
      );
    }
    return children;
  }
}

export default ErrorBoundary;
