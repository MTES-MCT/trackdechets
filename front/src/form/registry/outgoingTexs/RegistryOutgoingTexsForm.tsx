import { useMutation, useQuery } from "@apollo/client";
import {
  Mutation,
  Query,
  RegistryImportType,
  RegistryLineReason,
  OutgoingTexsLineInput
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
  ADD_TO_OUTGOING_TEXS_REGISTRY,
  GET_OUTGOING_TEXS_REGISTRY_LOOKUP
} from "../queries";
import { outgoingTexsFormShape } from "./shape";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormTransporter } from "../builder/types";

type Props = { onClose: () => void };

type FormValues = OutgoingTexsLineInput & {
  transporter: FormTransporter[];
};

export function RegistryOutgoingTexsForm({ onClose }: Props) {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const [disabledFieldNames, setDisabledFieldNames] = useState<string[]>([]);

  const methods = useForm<FormValues>({
    defaultValues: {
      reason: queryParams.get("publicId") ? RegistryLineReason.Edit : undefined,
      wastePop: false,
      weightIsEstimate: false,
      parcelInseeCodes: [],
      parcelNumbers: [],
      parcelCoordinates: [],
      destinationParcelInseeCodes: [],
      destinationParcelNumbers: [],
      destinationParcelCoordinates: [],
      initialEmitterMunicipalitiesInseeCodes: [],
      transporter: []
    },
    resolver: zodResolver(schemaFromShape(outgoingTexsFormShape))
  });

  const { loading: loadingLookup } = useQuery<Pick<Query, "registryLookup">>(
    GET_OUTGOING_TEXS_REGISTRY_LOOKUP,
    {
      variables: {
        type: RegistryImportType.OutgoingTexs,
        publicId: queryParams.get("publicId"),
        siret: queryParams.get("siret")
      },
      skip: !queryParams.get("publicId") || !queryParams.get("siret"),
      fetchPolicy: "network-only",
      onCompleted: data => {
        if (data?.registryLookup?.outgoingTexs) {
          const transportersObj: Record<string, Partial<FormTransporter>> = {};
          const definedOutgoingTexsProps = Object.fromEntries(
            Object.entries(data.registryLookup.outgoingTexs).filter(
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
          ) as OutgoingTexsLineInput;

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
            ...definedOutgoingTexsProps,
            dispatchDate: isoDateToHtmlDate(
              definedOutgoingTexsProps.dispatchDate
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
  const [addToOutgoingTexsRegistry, { loading }] = useMutation<
    Pick<Mutation, "addToOutgoingTexsRegistry">
  >(ADD_TO_OUTGOING_TEXS_REGISTRY, { refetchQueries: [GET_REGISTRY_LOOKUPS] });

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

    const result = await addToOutgoingTexsRegistry({
      variables: {
        lines: [flattenedData]
      }
    });

    const shouldCloseModal = handleMutationResponse(
      result.data?.addToOutgoingTexsRegistry,
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
      registryType={RegistryImportType.OutgoingTexs}
      methods={methods}
      shape={outgoingTexsFormShape}
      onSubmit={onSubmit}
      loading={loading}
      disabledFieldNames={disabledFieldNames}
    />
  );
}
