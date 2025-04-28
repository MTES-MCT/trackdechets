import { useMutation, useQuery } from "@apollo/client";
import {
  Mutation,
  Query,
  // QuerySearchCompaniesArgs,
  // RegistryCompanyType,
  RegistryImportType,
  RegistryLineReason,
  IncomingWasteLineInput,
  TransportMode,
  RegistryCompanyType
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

type FormTransporter = {
  TransportMode: TransportMode;
  CompanyType: RegistryCompanyType;
  CompanyOrgId?: string;
  RecepisseIsExempted?: boolean;
  RecepisseNumber?: string;
  CompanyName?: string;
  CompanyAddress?: string;
  CompanyPostalCode?: string;
  CompanyCity?: string;
  CompanyCountryCode?: string;
};

type FormValues = IncomingWasteLineInput & {
  transporter: FormTransporter[];
};

export function RegistryIncomingWasteForm({ onClose }: Props) {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const [disabledFieldNames, setDisabledFieldNames] = useState<string[]>([]);

  const methods = useForm<FormValues>({
    defaultValues: {
      reason: queryParams.get("publicId") ? RegistryLineReason.Edit : undefined,
      initialEmitterMunicipalitiesInseeCodes: [],
      transporter: []
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
        if (data?.registryLookup?.incomingWaste) {
          const definedIncomingWasteProps = Object.fromEntries(
            Object.entries(data.registryLookup.incomingWaste).filter(
              ([_, v]) => v != null
            )
          ) as IncomingWasteLineInput;
          const transporters: FormTransporter[] = [];

          // Transform flat transporter fields into array format
          for (let i = 1; i <= 5; i++) {
            const transportMode =
              definedIncomingWasteProps[`transporter${i}TransportMode`];

            // Only add transporter if at least one field is present
            if (transportMode) {
              const companyType =
                definedIncomingWasteProps[`transporter${i}CompanyType`];
              const companyOrgId =
                definedIncomingWasteProps[`transporter${i}CompanyOrgId`];
              const recepisseIsExempted =
                definedIncomingWasteProps[`transporter${i}RecepisseIsExempted`];
              const recepisseNumber =
                definedIncomingWasteProps[`transporter${i}RecepisseNumber`];
              const companyName =
                definedIncomingWasteProps[`transporter${i}CompanyName`];
              const companyAddress =
                definedIncomingWasteProps[`transporter${i}CompanyAddress`];
              const companyPostalCode =
                definedIncomingWasteProps[`transporter${i}CompanyPostalCode`];
              const companyCity =
                definedIncomingWasteProps[`transporter${i}CompanyCity`];
              const companyCountryCode =
                definedIncomingWasteProps[`transporter${i}CompanyCountryCode`];
              transporters.push({
                TransportMode: transportMode,
                CompanyType: companyType,
                CompanyOrgId: companyOrgId ?? "",
                RecepisseIsExempted: recepisseIsExempted ?? false,
                RecepisseNumber: recepisseNumber ?? "",
                CompanyName: companyName ?? "",
                CompanyAddress: companyAddress ?? "",
                CompanyPostalCode: companyPostalCode ?? "",
                CompanyCity: companyCity ?? "",
                CompanyCountryCode: companyCountryCode ?? ""
              });
            }
          }

          // Create a new object without the flat transporter fields
          const {
            transporter1TransportMode,
            transporter1CompanyType,
            transporter1CompanyOrgId,
            transporter1RecepisseIsExempted,
            transporter1RecepisseNumber,
            transporter1CompanyName,
            transporter1CompanyAddress,
            transporter1CompanyPostalCode,
            transporter1CompanyCity,
            transporter1CompanyCountryCode,
            transporter2TransportMode,
            transporter2CompanyType,
            transporter2CompanyOrgId,
            transporter2RecepisseIsExempted,
            transporter2RecepisseNumber,
            transporter2CompanyName,
            transporter2CompanyAddress,
            transporter2CompanyPostalCode,
            transporter2CompanyCity,
            transporter2CompanyCountryCode,
            transporter3TransportMode,
            transporter3CompanyType,
            transporter3CompanyOrgId,
            transporter3RecepisseIsExempted,
            transporter3RecepisseNumber,
            transporter3CompanyName,
            transporter3CompanyAddress,
            transporter3CompanyPostalCode,
            transporter3CompanyCity,
            transporter3CompanyCountryCode,
            transporter4TransportMode,
            transporter4CompanyType,
            transporter4CompanyOrgId,
            transporter4RecepisseIsExempted,
            transporter4RecepisseNumber,
            transporter4CompanyName,
            transporter4CompanyAddress,
            transporter4CompanyPostalCode,
            transporter4CompanyCity,
            transporter4CompanyCountryCode,
            transporter5TransportMode,
            transporter5CompanyType,
            transporter5CompanyOrgId,
            transporter5RecepisseIsExempted,
            transporter5RecepisseNumber,
            transporter5CompanyName,
            transporter5CompanyAddress,
            transporter5CompanyPostalCode,
            transporter5CompanyCity,
            transporter5CompanyCountryCode,
            ...rest
          } = definedIncomingWasteProps;

          // Set the form values with the transformed data
          methods.reset({
            ...rest,
            receptionDate: isoDateToHtmlDate(
              definedIncomingWasteProps.receptionDate
            ),
            reason: RegistryLineReason.Edit,
            transporter: transporters
          });
          setDisabledFieldNames(["publicId"]);
        }
      }
    }
  );

  const [addToIncomingWasteRegistry, { loading }] = useMutation<
    Pick<Mutation, "addToIncomingWasteRegistry">
  >(ADD_TO_INCOMING_WASTE_REGISTRY, { refetchQueries: [GET_REGISTRY_LOOKUPS] });

  async function onSubmit(data: FormValues) {
    const { transporter, ...rest } = data;
    console.log(data);
    // Flatten transporter array back into individual fields
    const flattenedData = {
      ...rest,
      ...transporter.reduce(
        (acc, t, index) => ({
          ...acc,
          [`transporter${index + 1}TransportMode`]: t.TransportMode,
          [`transporter${index + 1}CompanyType`]: t.CompanyType,
          [`transporter${index + 1}CompanyOrgId`]: t.CompanyOrgId,
          [`transporter${index + 1}RecepisseIsExempted`]: t.RecepisseIsExempted,
          [`transporter${index + 1}RecepisseNumber`]: t.RecepisseNumber,
          [`transporter${index + 1}CompanyName`]: t.CompanyName,
          [`transporter${index + 1}CompanyAddress`]: t.CompanyAddress,
          [`transporter${index + 1}CompanyPostalCode`]: t.CompanyPostalCode,
          [`transporter${index + 1}CompanyCity`]: t.CompanyCity,
          [`transporter${index + 1}CompanyCountryCode`]: t.CompanyCountryCode
        }),
        {}
      )
    };

    const result = await addToIncomingWasteRegistry({
      variables: {
        lines: [flattenedData]
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
