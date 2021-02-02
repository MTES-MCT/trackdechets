import * as React from "react";
import { useParams } from "react-router-dom";
import { Form } from "generated/graphql/types";
import { ActionButton } from "common/components";
import { IconShipmentSignSmartphone } from "common/components/Icons";
import { TransportSignatureModal } from "./TransportSignatureModal";

interface TransportSignatureModalToggleProps {
  form: Form;
  variant?: "button" | "action";
}

export function TransportSignatureModalToggle({
  form,
  variant,
}: TransportSignatureModalToggleProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { siret } = useParams<{ siret: string }>();

  const isPendingTransportFromEmitter =
    form.status === "SEALED" && form.transporter?.company?.siret === siret;
  const isPendingTransportFromTemporaryStorage =
    form.status === "RESEALED" &&
    form.temporaryStorageDetail?.transporter?.company?.siret === siret;
  const isPendingTransport =
    isPendingTransportFromEmitter || isPendingTransportFromTemporaryStorage;

  if (!isPendingTransport) {
    return null;
  }

  return (
    <>
      {variant === "button" ? (
        <button className="btn btn--primary" onClick={() => setIsOpen(true)}>
          <IconShipmentSignSmartphone size="32px" />
          <span className="tw-text-sm tw-ml-2">
            Signer <br /> l'enlèvement
          </span>
        </button>
      ) : (
        <ActionButton
          title="Signer l'enlèvement"
          icon={IconShipmentSignSmartphone}
          onClick={() => setIsOpen(true)}
          iconSize="32px"
        />
      )}
      {isOpen && (
        <TransportSignatureModal form={form} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
