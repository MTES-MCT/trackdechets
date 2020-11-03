import * as React from "react";
import { Form } from "generated/graphql/types";

interface CollectAddressProps {
  form: Form;
}

export function CollectAddress({ form }: CollectAddressProps) {
  return form.emitter?.workSite?.name && form.status === "SEALED" ? (
    <>
      {form.emitter?.workSite?.name} ({form.stateSummary?.emitter?.siret})
      <br /> {form.emitter?.workSite?.address}{" "}
      {form.emitter?.workSite?.postalCode} {form.emitter?.workSite?.city}
    </>
  ) : (
    <>
      {form.stateSummary?.emitter?.name} ({form.stateSummary?.emitter?.siret})
      <br /> {form.stateSummary?.emitter?.address}
    </>
  );
}
