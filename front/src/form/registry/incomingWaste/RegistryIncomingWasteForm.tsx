import { useMutation, useQuery } from "@apollo/client";
import {
  Mutation,
  Query,
  RegistryImportType,
  RegistryLineReason,
  IncomingWasteLineInput
} from "@td/codegen-ui";
import React, { useEffect, useState } from "react";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { FormTransporter } from "../builder/types";

type Props = { onClose: () => void };

type FormValues = IncomingWasteLineInput & {
  transporter: FormTransporter[];
};

const DEFAULT_VALUES: Partial<FormValues> = {
  wastePop: false,
  wasteIsDangerous: false,
  weightIsEstimate: false,
  noTraceability: false,
  isDirectSupply: false,
  initialEmitterMunicipalitiesInseeCodes: [],
  transporter: []
};

export function RegistryIncomingWasteForm({ onClose }: Props) {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const [disabledFieldNames, setDisabledFieldNames] = useState<string[]>([]);

  const methods = useForm<FormValues>({
    defaultValues: {
      ...DEFAULT_VALUES,
      reason: queryParams.get("publicId") ? RegistryLineReason.Edit : undefined
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
          const transportersObj: Record<string, Partial<FormTransporter>> = {};
          const definedIncomingWasteProps = Object.fromEntries(
            Object.entries(data.registryLookup.incomingWaste).filter(
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
          ) as IncomingWasteLineInput;

          const transporters = Object.values(transportersObj).filter(
            partialTransporter => {
              if (partialTransporter.TransportMode) {
                return true;
              }
              return false;
            }
          );
          // Set the form values with the transformed data
          methods.reset({
            ...DEFAULT_VALUES,
            ...definedIncomingWasteProps,
            receptionDate: isoDateToHtmlDate(
              definedIncomingWasteProps.receptionDate
            ),
            reason: RegistryLineReason.Edit,
            transporter: transporters
          });
          setDisabledFieldNames(["publicId", "reportForCompanySiret"]);
        }
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
