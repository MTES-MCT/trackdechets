import React from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { format } from "date-fns";

export const useNow = () => {
  const [now, setNow] = React.useState(new Date()); // Save the current date to trigger an update

  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30 * 1000); // 30s interval
    return () => {
      clearInterval(timer);
    };
  }, []);

  const dt = format(now, "dd/MM/yy HH:mm");

  return dt;
};

export const SignatureTimestamp = () => {
  const now = useNow();
  return (
    <div className="fr-mt-5v">
      <Alert
        description={`Signature électronique horodatée le ${now}`}
        severity="info"
        small
      />
    </div>
  );
};
