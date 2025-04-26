import { useMutation, useQuery } from "@apollo/client";
import {
  Mutation,
  Query,
  // QuerySearchCompaniesArgs,
  // RegistryCompanyType,
  RegistryImportType,
  RegistryLineReason,
  IncomingWasteLineInput
} from "@td/codegen-ui";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";

import Loader from "../../../Apps/common/Components/Loader/Loaders";
import { GET_REGISTRY_LOOKUPS } from "../../../dashboard/registry/shared";
import { FormBuilder } from "../builder/FormBuilder";
import { handleMutationResponse } from "../builder/handler";
import { isoDateToHtmlDate, schemaFromShape } from "../builder/utils";
import {
  ADD_TO_INCOMING_WASTE_REGISTRY,
  GET_INCOMING_WASTE_REGISTRY_LOOKUP
} from "../queries";
import { incomingWasteFormShape } from "./shape";
// import { SEARCH_COMPANIES } from "../../../Apps/common/queries/company/query";
import { zodResolver } from "@hookform/resolvers/zod";

type Props = { onClose: () => void };

export function RegistryIncomingWasteForm({ onClose }: Props) {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const [disabledFieldNames, setDisabledFieldNames] = useState<string[]>([]);

  const methods = useForm<IncomingWasteLineInput>({
    defaultValues: {
      reason: queryParams.get("publicId") ? RegistryLineReason.Edit : undefined,
      initialEmitterMunicipalitiesInseeCodes: []
    },
    resolver: zodResolver(schemaFromShape(incomingWasteFormShape))
  });

  const { loading: loadingLookup } = useQuery<Pick<Query, "registryLookup">>(
    GET_INCOMING_WASTE_REGISTRY_LOOKUP,
    {
      variables: {
        type: RegistryImportType.IncomingWaste,
        publicId: queryParams.get("publicId"),
        siret: queryParams.get("siret")
      },
      skip: !queryParams.get("publicId") || !queryParams.get("siret"),
      fetchPolicy: "network-only",
      onCompleted: data => {
        if (data.registryLookup.incomingWaste) {
          const definedIncomingWasteProps = Object.fromEntries(
            Object.entries(data.registryLookup.incomingWaste).filter(
              ([_, v]) => v != null
            )
          );

          methods.reset({
            ...definedIncomingWasteProps,
            receptionDate: isoDateToHtmlDate(
              definedIncomingWasteProps.receptionDate
            ),
            reason: RegistryLineReason.Edit
          });
          setDisabledFieldNames(["publicId"]);
        }
      }
    }
  );

  const [addToIncomingWasteRegistry, { loading }] = useMutation<
    Pick<Mutation, "addToIncomingWasteRegistry">
  >(ADD_TO_INCOMING_WASTE_REGISTRY, { refetchQueries: [GET_REGISTRY_LOOKUPS] });

  // const [searchCompaniesFromCompanyOrgId] = useLazyQuery<
  //   Pick<Query, "searchCompanies">,
  //   QuerySearchCompaniesArgs
  // >(SEARCH_COMPANIES);
  // const useDate = methods.watch("useDate");
  // const reportForCompanySiret = methods.watch("reportForCompanySiret");
  // const destinationCompanyOrgId = methods.watch("destinationCompanyOrgId");
  // useEffect(() => {
  //   if (useDate && reportForCompanySiret) {
  //     setDisabledFieldNames(prev =>
  //       prev.includes("destinationCompanyOrgId")
  //         ? prev
  //         : [...prev, "destinationCompanyOrgId"]
  //     );

  //     if (reportForCompanySiret !== destinationCompanyOrgId) {
  //       searchCompaniesFromCompanyOrgId({
  //         variables: { clue: reportForCompanySiret },
  //         onCompleted: result => {
  //           if (result.searchCompanies?.length > 0) {
  //             const company = result.searchCompanies[0];
  //             methods.setValue(
  //               `destinationCompanyType`,
  //               RegistryCompanyType.EtablissementFr
  //             );
  //             methods.setValue(`destinationCompanyOrgId`, company.orgId);
  //             methods.setValue(`destinationCompanyName`, company.name);
  //             methods.setValue(
  //               `destinationCompanyAddress`,
  //               company.addressVoie
  //             );
  //             methods.setValue(`destinationCompanyCity`, company.addressCity);
  //             methods.setValue(
  //               `destinationCompanyPostalCode`,
  //               company.addressPostalCode
  //             );
  //             methods.setValue(`destinationCompanyCountryCode`, "FR");
  //           }
  //         }
  //       });
  //     }
  //   } else {
  //     setDisabledFieldNames(prev =>
  //       prev.filter(field => field !== "destinationCompanyOrgId")
  //     );
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [useDate, reportForCompanySiret, methods]);

  async function onSubmit(data: any) {
    const result = await addToIncomingWasteRegistry({
      variables: {
        lines: [data]
      }
    });

    const shouldCloseModal = handleMutationResponse(
      result.data?.addToIncomingWasteRegistry,
      methods
    );

    if (shouldCloseModal) {
      onClose();
    }
  }

  return loadingLookup ? (
    <Loader />
  ) : (
    <FormBuilder
      registryType={RegistryImportType.IncomingWaste}
      methods={methods}
      shape={incomingWasteFormShape}
      onSubmit={onSubmit}
      loading={loading}
      disabledFieldNames={disabledFieldNames}
    />
  );
}
