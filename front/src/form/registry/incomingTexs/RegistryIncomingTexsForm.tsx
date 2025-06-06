import { useMutation, useQuery } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IncomingTexsLineInput,
  Mutation,
  Query,
  RegistryImportType,
  RegistryLineReason
} from "@td/codegen-ui";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import Loader from "../../../Apps/common/Components/Loader/Loaders";
import { GET_REGISTRY_LOOKUPS } from "../../../dashboard/registry/shared";
import { FormBuilder } from "../builder/FormBuilder";
import { handleMutationResponse } from "../builder/handler";
import { FormTransporter } from "../builder/types";
import { isoDateToHtmlDate, schemaFromShape } from "../builder/utils";
import {
  ADD_TO_INCOMING_TEXS_REGISTRY,
  GET_INCOMING_TEXS_REGISTRY_LOOKUP
} from "../queries";
import { incomingTexsFormShape } from "./shape";

type Props = { onClose: () => void };

type FormValues = IncomingTexsLineInput & {
  transporter: FormTransporter[];
};

const DEFAULT_VALUES: Partial<FormValues> = {
  wastePop: false,
  weightIsEstimate: true,
  wasteIsDangerous: false,
  noTraceability: false,
  isUpcycled: false,
  isDirectSupply: false,
  parcelInseeCodes: [],
  parcelNumbers: [],
  parcelCoordinates: [],
  destinationParcelInseeCodes: [],
  destinationParcelNumbers: [],
  destinationParcelCoordinates: [],
  initialEmitterMunicipalitiesInseeCodes: [],
  transporter: []
};

export function RegistryIncomingTexsForm({ onClose }: Props) {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const [disabledFieldNames, setDisabledFieldNames] = useState<string[]>([]);

  const methods = useForm<FormValues>({
    defaultValues: {
      ...DEFAULT_VALUES,
      reason: queryParams.get("publicId") ? RegistryLineReason.Edit : undefined
    },
    resolver: zodResolver(schemaFromShape(incomingTexsFormShape))
  });

  const { loading: loadingLookup } = useQuery<Pick<Query, "registryLookup">>(
    GET_INCOMING_TEXS_REGISTRY_LOOKUP,
    {
      variables: {
        type: RegistryImportType.IncomingTexs,
        publicId: queryParams.get("publicId"),
        siret: queryParams.get("siret")
      },
      skip: !queryParams.get("publicId") || !queryParams.get("siret"),
      fetchPolicy: "network-only",
      onCompleted: data => {
        if (data?.registryLookup?.incomingTexs) {
          const transportersObj: Record<string, Partial<FormTransporter>> = {};
          const definedIncominTexsProps = Object.fromEntries(
            Object.entries(data.registryLookup.incomingTexs).filter(
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
          ) as IncomingTexsLineInput;

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
          methods.reset({
            ...DEFAULT_VALUES,
            ...definedIncominTexsProps,
            receptionDate: isoDateToHtmlDate(
              definedIncominTexsProps.receptionDate
            ),
            reason: RegistryLineReason.Edit,
            transporter: transporters
          });
          setDisabledFieldNames(["publicId", "reportForCompanySiret"]);
        }
      }
    }
  );

  const isUpcycled = methods.watch("isUpcycled");
  useEffect(() => {
    if (isUpcycled) {
      setDisabledFieldNames(prev =>
        prev.filter(field => field !== "destinationParcelInseeCodes")
      );
    } else {
      setDisabledFieldNames(prev => [...prev, "destinationParcelInseeCodes"]);
      methods.setValue("destinationParcelInseeCodes", []);
      methods.setValue("destinationParcelNumbers", []);
      methods.setValue("destinationParcelCoordinates", []);
    }
  }, [isUpcycled, methods]);

  const isDirectSupply = methods.watch("isDirectSupply");
  useEffect(() => {
    if (isDirectSupply) {
      setDisabledFieldNames(prev => [...prev, "transporter"]);
    } else {
      setDisabledFieldNames(prev =>
        prev.filter(field => field !== "transporter")
      );
      methods.setValue("transporter", []);
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

  const operationCode = methods.watch("operationCode");
  useEffect(() => {
    if (operationCode && operationCode.startsWith("D")) {
      setDisabledFieldNames(prev => [...prev, "isUpcycled"]);
    } else {
      setDisabledFieldNames(prev =>
        prev.filter(field => field !== "isUpcycled")
      );
    }
  }, [operationCode, methods]);

  const [addToIncomingTexsRegistry, { loading }] = useMutation<
    Pick<Mutation, "addToIncomingTexsRegistry">
  >(ADD_TO_INCOMING_TEXS_REGISTRY, { refetchQueries: [GET_REGISTRY_LOOKUPS] });

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

    const result = await addToIncomingTexsRegistry({
      variables: {
        lines: [flattenedData]
      }
    });

    const shouldCloseModal = handleMutationResponse(
      result.data?.addToIncomingTexsRegistry,
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
      registryType={RegistryImportType.IncomingTexs}
      methods={methods}
      shape={incomingTexsFormShape}
      onSubmit={onSubmit}
      loading={loading}
      disabledFieldNames={disabledFieldNames}
    />
  );
}
