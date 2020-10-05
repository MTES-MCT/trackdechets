import React, { useState } from "react";

import { ViewIcon } from "src/common/components/Icons";

import { useQuery } from "@apollo/react-hooks";
import SlipDetailContent from "src/dashboard/slip/SlipDetailContent";

import { ModalLoader } from "src/common/components/Loaders";
import TdModal from "src/common/components/Modal";

import { Query, QueryFormArgs } from "src/generated/graphql/types";
import { InlineError } from "src/common/components/Error";
import { GET_DETAIL_FORM } from "src/common/queries";

 
import { COLORS } from "src/common/config";
const QuicklookModal = ({ formId, onClose }) => {
 
  const { loading, error, data } = useQuery<Pick<Query, "form">, QueryFormArgs>(
    GET_DETAIL_FORM,
    {
      variables: {
        id: formId,
        readableId: null,
      },
      skip: !formId,
      fetchPolicy: "network-only",
    }
  );
  const form = data?.form;

  return (
    <TdModal
      onClose={onClose}
      ariaLabel="Aperçu du bordereau"
      isOpen={true}
      padding={false}
      wide={true}
    >
      {loading && <ModalLoader />}
      {error && <InlineError apolloError={error} />}

      {!!form && (
        <SlipDetailContent form={form}>
          <button className="btn btn--primary" onClick={onClose}>
            Fermer
          </button>
        </SlipDetailContent>
      )}
    </TdModal>
  );
};

type QuicklookProps = {
  formId: string;
  buttonClass: string;
  onOpen?: () => void;
  onClose?: () => void;
};

export default function Quicklook({
  formId,
  buttonClass,
  onOpen,
  onClose,
}: QuicklookProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        className={buttonClass}
        title="Aperçu du bordereau"
        onClick={() => {
          setIsOpen(true);
          !!onOpen && onOpen();
        }}
      >
        <ViewIcon color={COLORS.blueLight} size={24} />
        <span>Aperçu</span>
      </button>
      {isOpen && (
        <QuicklookModal
          formId={formId}
          onClose={() => {
            setIsOpen(false);
            !!onClose && onClose();
          }}
        />
      )}
    </>
  );
}
