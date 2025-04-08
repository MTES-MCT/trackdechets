import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Mutation,
  Query,
  RegistryImportType,
  RegistryLineReason,
  SsdLineInput
} from "@td/codegen-ui";
import React from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";

import Loader from "../../../Apps/common/Components/Loader/Loaders";
import { GET_REGISTRY_LOOKUPS } from "../../../dashboard/registry/shared";
import { FormBuilder } from "../builder/FormBuilder";
import { handleMutationResponse } from "../builder/handler";
import { isoDateToHtmlDate } from "../builder/utils";
import { GET_SSD_REGISTRY_LOOKUP } from "./query";
import { ssdFormShape } from "./shape";

type Props = { onClose: () => void };

const ADD_TO_SSD_REGISTRY = gql`
  mutation AddToSsdRegistry($lines: [SsdLineInput!]!) {
    addToSsdRegistry(lines: $lines) {
      stats {
        errors
        skipped
        insertions
        edits
        cancellations
      }
      errors {
        issues {
          path
          message
        }
      }
    }
  }
`;

export function RegistrySsdForm({ onClose }: Props) {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);

  const methods = useForm<SsdLineInput>({
    defaultValues: {
      secondaryWasteCodes: [],
      secondaryWasteDescriptions: []
    }
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
            ...definedSsdProps,
            processingDate: isoDateToHtmlDate(definedSsdProps.processingDate),
            dispatchDate: isoDateToHtmlDate(definedSsdProps.dispatchDate),
            useDate: isoDateToHtmlDate(definedSsdProps.useDate),
            reason: RegistryLineReason.Edit
          });
        }
      }
    }
  );

  const [addToSsdRegistry, { loading }] = useMutation<
    Pick<Mutation, "addToSsdRegistry">
  >(ADD_TO_SSD_REGISTRY, { refetchQueries: [GET_REGISTRY_LOOKUPS] });

  async function onSubmit(data: any) {
    const result = await addToSsdRegistry({
      variables: {
        lines: [
          {
            ...data,
            reason: data.reason || null,
            wasteCodeBale: data.wasteCodeBale || null,
            product: data.product || null,
            dispatchDate: data.dispatchDate || null,
            useDate: data.useDate || null,
            secondaryWasteCodes: data.secondaryWasteCodes?.filter(Boolean),
            secondaryWasteDescriptions:
              data.secondaryWasteDescriptions?.filter(Boolean),
            weightValue: data.weightValue ? parseFloat(data.weightValue) : null,
            volume: data.volume ? parseFloat(data.volume) : null,
            weightIsEstimate: data.weightIsEstimate === "true",
            processingEndDate: data.processingEndDate || null
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
      methods={methods}
      shape={ssdFormShape}
      onSubmit={onSubmit}
      loading={loading}
    />
  );
}
