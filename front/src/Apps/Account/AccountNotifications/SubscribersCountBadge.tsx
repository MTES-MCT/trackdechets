import React from "react";
import Badge from "@codegouvfr/react-dsfr/Badge";

type SubscribersCountTagProps = {
  count: number;
};

export default function SubscribersCountBadge({
  count
}: SubscribersCountTagProps) {
  const title = count <= 1 ? `${count} abonné` : `${count} abonnés`;
  const severity = count < 1 ? "error" : "success";

  return (
    <Badge noIcon small severity={severity}>
      {title.toUpperCase()}
    </Badge>
  );
}
