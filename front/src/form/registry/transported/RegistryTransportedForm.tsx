import { useMutation, useQuery } from "@apollo/client";
import {
  Mutation,
  Query,
  RegistryImportType,
  RegistryLineReason,
  TransportedLineInput
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
  ADD_TO_TRANSPORTED_REGISTRY,
  GET_TRANSPORTED_REGISTRY_LOOKUP
} from "../queries";
import { transportedFormShape } from "./shape";
import { zodResolver } from "@hookform/resolvers/zod";

type Props = { onClose: () => void };

export function RegistryTransportedForm({ onClose }: Props) {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const [disabledFieldNames, setDisabledFieldNames] = useState<string[]>([]);

  const DEFAULT_VALUES: Partial<TransportedLineInput> = {
    reportForTransportIsWaste: false,
    reportForRecepisseIsExempted: false,
    reportForTransportPlates: [],
    wastePop: false,
    weightIsEstimate: true,
    wasteIsDangerous: false
  };

  const methods = useForm<TransportedLineInput>({
    defaultValues: {
      ...DEFAULT_VALUES,
      reason: queryParams.get("publicId") ? RegistryLineReason.Edit : undefined
    },
    resolver: zodResolver(schemaFromShape(transportedFormShape))
  });

  const { loading: loadingLookup } = useQuery<Pick<Query, "registryLookup">>(
    GET_TRANSPORTED_REGISTRY_LOOKUP,
    {
      variables: {
        type: RegistryImportType.Transported,
        publicId: queryParams.get("publicId"),
        siret: queryParams.get("siret")
      },
      skip: !queryParams.get("publicId") || !queryParams.get("siret"),
      fetchPolicy: "network-only",
      onCompleted: data => {
        if (data?.registryLookup?.transportedWaste) {
          const definedTransportedProps = Object.fromEntries(
            Object.entries(data.registryLookup.transportedWaste).filter(
              ([_, value]) => value != null
            )
          ) as TransportedLineInput;

          // Set the form values with the transformed data
          methods.reset({
            ...DEFAULT_VALUES,
            ...definedTransportedProps,
            collectionDate: isoDateToHtmlDate(
              definedTransportedProps.collectionDate
            ),
            unloadingDate: isoDateToHtmlDate(
              definedTransportedProps.unloadingDate
            ),
            reason: RegistryLineReason.Edit
          });
          setDisabledFieldNames(["publicId", "reportForCompanySiret"]);
        }
      }
    }
  );

  const reportForTransportIsWaste = methods.watch("reportForTransportIsWaste");
  useEffect(() => {
    if (reportForTransportIsWaste) {
      setDisabledFieldNames(prev =>
        prev.filter(field => field !== "wasteCode")
      );
    } else {
      setDisabledFieldNames(prev => [...prev, "wasteCode"]);
      methods.setValue("wasteCode", "");
    }
  }, [reportForTransportIsWaste, methods]);
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

  const [addToTransportedRegistry, { loading }] = useMutation<
    Pick<Mutation, "addToTransportedRegistry">
  >(ADD_TO_TRANSPORTED_REGISTRY, { refetchQueries: [GET_REGISTRY_LOOKUPS] });

  async function onSubmit(data: TransportedLineInput) {
    const result = await addToTransportedRegistry({
      variables: {
        lines: [data]
      }
    });

    const shouldCloseModal = handleMutationResponse(
      result.data?.addToTransportedRegistry,
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
      registryType={RegistryImportType.Transported}
      methods={methods}
      shape={transportedFormShape}
      onSubmit={onSubmit}
      loading={loading}
      disabledFieldNames={disabledFieldNames}
    />
  );
}
