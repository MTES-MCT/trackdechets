import { Bsff, BsdType, Query, QueryBsffArgs } from "@td/codegen-ui";
import { useQuery } from "@apollo/client";
import { GET_BSFF_FORM } from "../../../common/queries/bsff/queries";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useMemo, createContext, useState } from "react";
import { useForm } from "react-hook-form";
import { rawBsffSchema, ZodBsff } from "./schema";
import FormStepsContent from "../FormStepsContent";
import { Loader } from "../../../common/Components";
import initialState from "./utils/initial-state";
import { getComputedState } from "../getComputedState";
import WasteBsff from "./steps/Waste";
import EmitterBsff from "./steps/Emitter";
import DestinationBsff from "./steps/Destination";
import TransporterBsff from "./steps/Transporter";

interface Props {
  bsdId?: string;
  publishErrorsFromRedirect?: {
    code: string;
    path: string[];
    message: string;
  }[];
}
export const BsffContext = createContext<Bsff | undefined>(undefined);

const BsffFormSteps = ({ bsdId }: Readonly<Props>) => {
  const [bsffContext, _] = useState<Bsff | undefined>();

  const bsffQuery = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(
    GET_BSFF_FORM,
    {
      variables: {
        id: bsdId!
      },
      skip: !bsdId,
      fetchPolicy: "network-only"
    }
  );

  const bsffState = useMemo(
    () =>
      getComputedState(initialState, bsffQuery.data?.bsff, [
        {
          path: "packagings",
          getComputedValue: (intialValue, actualValue) =>
            actualValue.length ? actualValue : intialValue
        },
        {
          path: "grouping",
          getComputedValue: (initialValue, actualValue) =>
            actualValue?.length ? actualValue : initialValue
        },
        {
          path: "forwarding",
          getComputedValue: (initialValue, actualValue) =>
            actualValue ?? initialValue
        },
        {
          path: "transporters",
          getComputedValue: (initialValue, actualValue) =>
            actualValue?.length ? actualValue : initialValue
        }
      ]),
    [bsffQuery.data]
  );

  const methods = useForm<ZodBsff>({
    values: bsffState,

    resolver: async (data, context, options) => {
      return zodResolver(rawBsffSchema)(data, context, options);
    }
  });

  const tabsContent = useMemo(
    () => ({
      waste: <WasteBsff />,
      emitter: <EmitterBsff />,
      transporter: <TransporterBsff />,
      destination: <DestinationBsff />
    }),
    []
  );

  const loading = false;
  const mainCtaLabel = "Enregistrer";
  const draftCtaLabel = "Enregistrer en brouillon";

  return (
    <BsffContext.Provider value={bsffContext}>
      <FormStepsContent
        bsdType={BsdType.Bsff}
        draftCtaLabel={draftCtaLabel}
        isLoading={loading}
        mainCtaLabel={mainCtaLabel}
        saveForm={() => {}}
        useformMethods={methods}
        tabsContent={tabsContent}
        setPublishErrors={() => {}}
      />
      {loading && <Loader />}
    </BsffContext.Provider>
  );
};

export default BsffFormSteps;
