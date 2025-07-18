import { useMutation, useQuery } from "@apollo/client";
import {
  Mutation,
  Query,
  RegistryImportType,
  RegistryLineReason,
  OutgoingWasteLineInput
} from "@td/codegen-ui";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import { ApolloError } from "@apollo/client";

import Loader from "../../../Apps/common/Components/Loader/Loaders";
import { GET_REGISTRY_LOOKUPS } from "../../../dashboard/registry/shared";
import { FormBuilder } from "../builder/FormBuilder";
import { handleMutationResponse } from "../builder/handler";
import {
  handleServerError,
  isoDateToHtmlDate,
  schemaFromShape
} from "../builder/utils";
import {
  ADD_TO_OUTGOING_WASTE_REGISTRY,
  GET_OUTGOING_WASTE_REGISTRY_LOOKUP
} from "../queries";
import { outgoingWasteFormShape } from "./shape";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormTransporter } from "../builder/types";

type Props = { onClose: () => void };

type FormValues = OutgoingWasteLineInput & {
  transporter: FormTransporter[];
};

const DEFAULT_VALUES: Partial<FormValues> = {
  wastePop: false,
  weightIsEstimate: true,
  wasteIsDangerous: false,
  isDirectSupply: false,
  initialEmitterMunicipalitiesInseeCodes: [],
  transporter: []
};

const getInitialDisabledFields = (values: {
  isDirectSupply?: boolean | null;
  wasteCode?: string | null;
}): string[] => {
  const disabled: string[] = [];

  // If isDirectSupply is true, disable transporter
  if (values.isDirectSupply) {
    disabled.push("transporter");
  }

  // If wasteCode contains "*", disable wasteIsDangerous
  if (values.wasteCode && values.wasteCode.includes("*")) {
    disabled.push("wasteIsDangerous");
  }
  return disabled;
};

export function RegistryOutgoingWasteForm({ onClose }: Props) {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const [disabledFieldNames, setDisabledFieldNames] = useState<string[]>(
    getInitialDisabledFields(DEFAULT_VALUES)
  );

  const methods = useForm<FormValues>({
    defaultValues: {
      ...DEFAULT_VALUES,
      reason: queryParams.get("publicId") ? RegistryLineReason.Edit : undefined
    },
    resolver: zodResolver(schemaFromShape(outgoingWasteFormShape))
  });

  const { loading: loadingLookup } = useQuery<Pick<Query, "registryLookup">>(
    GET_OUTGOING_WASTE_REGISTRY_LOOKUP,
    {
      variables: {
        type: RegistryImportType.OutgoingWaste,
        publicId: queryParams.get("publicId"),
        siret: queryParams.get("siret")
      },
      skip: !queryParams.get("publicId") || !queryParams.get("siret"),
      fetchPolicy: "network-only",
      onCompleted: data => {
        if (data?.registryLookup?.outgoingWaste) {
          const transportersObj: Record<string, Partial<FormTransporter>> = {};
          const definedOutgoingWasteProps = Object.fromEntries(
            Object.entries(data.registryLookup.outgoingWaste).filter(
              ([key, value]) => {
                if (key.startsWith("transporter")) {
                  const [_, transporterNum, field] =
                    key.match(/transporter(\d)(.*)/) || [];
                  if (transporterNum && field) {
                    const transporterKey = `transporter${transporterNum}`;
                    if (!transportersObj[transporterKey]) {
                      transportersObj[transporterKey] = {};
                    }
                    transportersObj[transporterKey][field] = value;
                    return false; // Don't include these fields in the main object
                  }
                }
                return value != null;
              }
            )
          ) as OutgoingWasteLineInput;

          const transporters = Object.values(transportersObj).filter(
            partialTransporter => {
              if (
                partialTransporter.TransportMode ||
                partialTransporter.CompanyType
              ) {
                return true;
              }
              return false;
            }
          );
          // Set the form values with the transformed data
          const resetValues = {
            ...DEFAULT_VALUES,
            ...definedOutgoingWasteProps,
            dispatchDate: isoDateToHtmlDate(
              definedOutgoingWasteProps.dispatchDate
            ),
            reason: RegistryLineReason.Edit,
            transporter: transporters
          };
          methods.reset(resetValues);
          const initialDisabled = getInitialDisabledFields(resetValues);
          setDisabledFieldNames([
            ...initialDisabled,
            "publicId",
            "reportForCompanySiret"
          ]);
        }
      },
      onError: error => {
        handleServerError(methods, error as ApolloError | Error);
      }
    }
  );

  const isDirectSupply = methods.watch("isDirectSupply");
  useEffect(() => {
    if (isDirectSupply) {
      setDisabledFieldNames(prev => [...prev, "transporter"]);
      methods.setValue("transporter", []);
    } else {
      setDisabledFieldNames(prev =>
        prev.filter(field => field !== "transporter")
      );
    }
  }, [isDirectSupply, methods]);
  const wasteCode = methods.watch("wasteCode");
  useEffect(() => {
    if (wasteCode && wasteCode.includes("*")) {
      setDisabledFieldNames(prev => [...prev, "wasteIsDangerous"]);
      methods.setValue("wasteIsDangerous", true);
    } else {
      setDisabledFieldNames(prev =>
        prev.filter(field => field !== "wasteIsDangerous")
      );
    }
  }, [wasteCode, methods]);

  const [addToOutgoingWasteRegistry, { loading }] = useMutation<
    Pick<Mutation, "addToOutgoingWasteRegistry">
  >(ADD_TO_OUTGOING_WASTE_REGISTRY, { refetchQueries: [GET_REGISTRY_LOOKUPS] });

  async function onSubmit(data: FormValues) {
    const { transporter, ...rest } = data;
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

    try {
      const result = await addToOutgoingWasteRegistry({
        variables: {
          lines: [flattenedData]
        }
      });

      const shouldCloseModal = handleMutationResponse(
        result.data?.addToOutgoingWasteRegistry,
        methods
      );

      if (shouldCloseModal) {
        onClose();
      }
    } catch (error) {
      handleServerError(methods, error as ApolloError | Error);
    }
  }

  return loadingLookup ? (
    <Loader />
  ) : (
    <FormBuilder
      registryType={RegistryImportType.OutgoingWaste}
      methods={methods}
      shape={outgoingWasteFormShape}
      onSubmit={onSubmit}
      loading={loading}
      disabledFieldNames={disabledFieldNames}
    />
  );
}
