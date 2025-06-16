import { ApolloError, useMutation, useQuery } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ManagedLineInput,
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
import {
  handleServerError,
  isoDateToHtmlDate,
  schemaFromShape
} from "../builder/utils";
import {
  ADD_TO_MANAGED_REGISTRY,
  GET_MANAGED_REGISTRY_LOOKUP
} from "../queries";
import { managedFormShape } from "./shape";

type Props = { onClose: () => void };

type FormValues = ManagedLineInput & {
  transporter: FormTransporter[];
};

const DEFAULT_VALUES: Partial<FormValues> = {
  wastePop: false,
  weightIsEstimate: true,
  wasteIsDangerous: false,
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

export function RegistryManagedForm({ onClose }: Props) {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const [disabledFieldNames, setDisabledFieldNames] = useState<string[]>([]);

  const methods = useForm<FormValues>({
    defaultValues: {
      ...DEFAULT_VALUES,
      reason: queryParams.get("publicId") ? RegistryLineReason.Edit : undefined
    },
    resolver: zodResolver(schemaFromShape(managedFormShape))
  });

  const { loading: loadingLookup } = useQuery<Pick<Query, "registryLookup">>(
    GET_MANAGED_REGISTRY_LOOKUP,
    {
      variables: {
        type: RegistryImportType.Managed,
        publicId: queryParams.get("publicId"),
        siret: queryParams.get("siret")
      },
      skip: !queryParams.get("publicId") || !queryParams.get("siret"),
      fetchPolicy: "network-only",
      onCompleted: data => {
        if (data?.registryLookup?.managedWaste) {
          const transportersObj: Record<string, Partial<FormTransporter>> = {};
          const definedIncominTexsProps = Object.fromEntries(
            Object.entries(data.registryLookup.managedWaste).filter(
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
          ) as ManagedLineInput;

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
            managingStartDate: isoDateToHtmlDate(
              definedIncominTexsProps.managingStartDate
            ),
            managingEndDate: isoDateToHtmlDate(
              definedIncominTexsProps.managingEndDate
            ),
            reason: RegistryLineReason.Edit,
            transporter: transporters
          });
          setDisabledFieldNames(["publicId", "reportForCompanySiret"]);
        }
      },
      onError: error => {
        handleServerError(methods, error as ApolloError | Error);
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

  const [addToManagedRegistry, { loading }] = useMutation<
    Pick<Mutation, "addToManagedRegistry">
  >(ADD_TO_MANAGED_REGISTRY, { refetchQueries: [GET_REGISTRY_LOOKUPS] });

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
      const result = await addToManagedRegistry({
        variables: {
          lines: [flattenedData]
        }
      });

      const shouldCloseModal = handleMutationResponse(
        result.data?.addToManagedRegistry,
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
      registryType={RegistryImportType.Managed}
      methods={methods}
      shape={managedFormShape}
      onSubmit={onSubmit}
      loading={loading}
      disabledFieldNames={disabledFieldNames}
    />
  );
}
