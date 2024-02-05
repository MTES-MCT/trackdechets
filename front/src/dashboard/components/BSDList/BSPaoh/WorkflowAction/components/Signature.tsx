import React from "react";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { format } from "date-fns";

export const SignatureInfo = () => (
  <Tag small>Signature électronique horodatée le {   format(new Date(), "dd/MM/yy")}</Tag>
);
