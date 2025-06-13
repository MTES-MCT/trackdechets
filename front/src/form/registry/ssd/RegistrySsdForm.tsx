import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  Mutation,
  Query,
  QuerySearchCompaniesArgs,
  RegistryCompanyType,
  RegistryImportType,
  RegistryLineReason,
  SsdLineInput
} from "@td/codegen-ui";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";

import Loader from "../../../Apps/common/Components/Loader/Loaders";
import { GET_REGISTRY_LOOKUPS } from "../../../dashboard/registry/shared";
import { FormBuilder } from "../builder/FormBuilder";
import { handleMutationResponse } from "../builder/handler";
import { isoDateToHtmlDate, schemaFromShape } from "../builder/utils";
import { ADD_TO_SSD_REGISTRY, GET_SSD_REGISTRY_LOOKUP } from "../queries";
import { ssdFormShape } from "./shape";
import { SEARCH_COMPANIES } from "../../../Apps/common/queries/company/query";
import { zodResolver } from "@hookform/resolvers/zod";

type Props = { onClose: () => void };

type FormValues = Omit<
  SsdLineInput,
  "secondaryWasteCodes" | "secondaryWasteDescriptions"
> & {
  secondaryWasteCodes: { value: string }[];
  secondaryWasteDescriptions: { value: string }[];
};

const DEFAULT_VALUES: Partial<FormValues> = {
  weightIsEstimate: true,
  secondaryWasteCodes: [],
  secondaryWasteDescriptions: []
};

export function RegistrySsdForm({ onClose }: Props) {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const [disabledFieldNames, setDisabledFieldNames] = useState<string[]>([]);

  const methods = useForm<FormValues>({
    defaultValues: {
      ...DEFAULT_VALUES,
      reason: queryParams.get("publicId") ? RegistryLineReason.Edit : null
    },
    resolver: zodResolver(schemaFromShape(ssdFormShape))
  });

  const { loading: loadingLookup } = useQuery<Pick<Query, "registryLookup">>(
    GET_SSD_REGISTRY_LOOKUP,
    {
      variables: {
        type: RegistryImportType.Ssd,
        publicId: queryParams.get("publicId"),
        siret: queryParams.get("siret")
      },
      skip: !queryParams.get("publicId") || !queryParams.get("siret"),
      fetchPolicy: "network-only",
      onCompleted: data => {
        if (data.registryLookup.ssd) {
          const definedSsdProps = Object.fromEntries(
            Object.entries(data.registryLookup.ssd).filter(
              ([_, v]) => v != null
            )
          );

          methods.reset({
            ...DEFAULT_VALUES,
            ...definedSsdProps,
            secondaryWasteCodes:
              (
                definedSsdProps.secondaryWasteCodes as
                  | string[]
                  | undefined
                  | null
              )?.map(code => ({ value: code })) ?? [],
            secondaryWasteDescriptions:
              (
                definedSsdProps.secondaryWasteDescriptions as
                  | string[]
                  | undefined
                  | null
              )?.map(description => ({ value: description })) ?? [],
            processingDate: isoDateToHtmlDate(definedSsdProps.processingDate),
            processingEndDate: isoDateToHtmlDate(
              definedSsdProps.processingEndDate
            ),
            dispatchDate: isoDateToHtmlDate(definedSsdProps.dispatchDate),
            useDate: isoDateToHtmlDate(definedSsdProps.useDate),
            reason: RegistryLineReason.Edit
          });
          setDisabledFieldNames(["publicId", "reportForCompanySiret"]);
        }
      }
    }
  );

  const [addToSsdRegistry, { loading }] = useMutation<
    Pick<Mutation, "addToSsdRegistry">
  >(ADD_TO_SSD_REGISTRY, { refetchQueries: [GET_REGISTRY_LOOKUPS] });

  const [searchCompaniesFromCompanyOrgId] = useLazyQuery<
    Pick<Query, "searchCompanies">,
    QuerySearchCompaniesArgs
  >(SEARCH_COMPANIES);
  const useDate = methods.watch("useDate");
  const reportForCompanySiret = methods.watch("reportForCompanySiret");
  const destinationCompanyOrgId = methods.watch("destinationCompanyOrgId");
  useEffect(() => {
    if (useDate && reportForCompanySiret) {
      setDisabledFieldNames(prev =>
        prev.includes("destinationCompanyOrgId")
          ? prev
          : [...prev, "destinationCompanyOrgId"]
      );

      if (reportForCompanySiret !== destinationCompanyOrgId) {
        searchCompaniesFromCompanyOrgId({
          variables: { clue: reportForCompanySiret },
          onCompleted: result => {
            if (result.searchCompanies?.length > 0) {
              const company = result.searchCompanies[0];
              methods.setValue(
                `destinationCompanyType`,
                RegistryCompanyType.EtablissementFr
              );
              methods.setValue(`destinationCompanyOrgId`, company.orgId);
              methods.setValue(`destinationCompanyName`, company.name);
              methods.setValue(
                `destinationCompanyAddress`,
                company.addressVoie
              );
              methods.setValue(`destinationCompanyCity`, company.addressCity);
              methods.setValue(
                `destinationCompanyPostalCode`,
                company.addressPostalCode
              );
              methods.setValue(`destinationCompanyCountryCode`, "FR");
            }
          }
        });
      }
    } else {
      setDisabledFieldNames(prev =>
        prev.filter(field => field !== "destinationCompanyOrgId")
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useDate, reportForCompanySiret, methods]);

  async function onSubmit(data: SsdLineInput) {
    const { secondaryWasteCodes, secondaryWasteDescriptions, ...rest } = data;

    if (secondaryWasteCodes && secondaryWasteDescriptions) {
      let hasError = false;
      secondaryWasteCodes.forEach((code, index) => {
        console.log(code, secondaryWasteDescriptions[index]);
        if (index === 0) {
          if (code && !secondaryWasteDescriptions[index]) {
            methods.setError("secondaryWasteDescriptions.0.value", {
              message: "La description est requise si le code est renseigné"
            });
            hasError = true;
          }
        } else {
          if (!code) {
            methods.setError(`secondaryWasteCodes.${index}.value`, {
              message:
                "Le code est requis, supprimez la ligne si elle n'est pas utile"
            });
            hasError = true;
          }
          if (code && !secondaryWasteDescriptions[index]) {
            methods.setError(`secondaryWasteDescriptions.${index}.value`, {
              message: "La description est requise si le code est renseigné"
            });
            hasError = true;
          }
        }
      });
      if (hasError) {
        return;
      }
    }

    const result = await addToSsdRegistry({
      variables: {
        lines: [
          {
            ...rest,
            secondaryWasteCodes: secondaryWasteCodes?.filter(Boolean) ?? [],
            secondaryWasteDescriptions:
              secondaryWasteDescriptions?.filter(Boolean) ?? []
          }
        ]
      }
    });

    const shouldCloseModal = handleMutationResponse(
      result.data?.addToSsdRegistry,
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
      registryType={RegistryImportType.Ssd}
      methods={methods}
      shape={ssdFormShape}
      onSubmit={onSubmit}
      loading={loading}
      disabledFieldNames={disabledFieldNames}
    />
  );
}
