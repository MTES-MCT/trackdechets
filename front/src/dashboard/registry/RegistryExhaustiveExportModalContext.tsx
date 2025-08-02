import React, { createContext, useCallback, useState } from "react";
import { useMutation } from "@apollo/client";
import { format, startOfYear } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";

import {
  RegistryExportFormat,
  Mutation,
  MutationGenerateRegistryExhaustiveExportArgs
} from "@td/codegen-ui";
import {
  GENERATE_REGISTRY_EXHAUSTIVE_EXPORT,
  GENERATE_REGISTRY_EXHAUSTIVE_EXPORT_AS_ADMIN,
  GET_REGISTRY_EXHAUSTIVE_EXPORTS,
  GET_REGISTRY_EXHAUSTIVE_EXPORTS_AS_ADMIN
} from "./shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegistryExport } from "./RegistryV2ExportContext";
import { RegistryExportModalContextType } from "./RegistryV2ExportModalContext";

export const RegistryExhaustiveExportModalContext =
  createContext<RegistryExportModalContextType | null>(null);

export const exhaustiveValidationSchema = z.object({
  companyOrgId: z.string({ required_error: "Ce champ est requis" }),
  startDate: z.coerce
    .date({
      required_error: "La date de début est requise",
      invalid_type_error: "La date de début est invalide"
    })
    .max(new Date(), {
      message: "La date de début ne peut pas être dans le futur"
    })
    .transform(val => val.toISOString()),
  // Date & "" hack: https://github.com/colinhacks/zod/issues/1721
  endDate: z.preprocess(
    arg => (arg === "" ? null : arg),
    z.coerce
      .date({
        invalid_type_error: "La date de fin est invalide"
      })
      .max(new Date(), {
        message: "La date de fin ne peut pas être dans le futur"
      })
      .transform(val => {
        if (val) return val.toISOString();
        return val;
      })
      .nullish()
  ),
  format: z.nativeEnum(RegistryExportFormat)
});

const refinedSchema = exhaustiveValidationSchema.superRefine(
  ({ startDate, endDate }, ctx) => {
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["startDate"],
          message: "La date de début doit être avant la date de fin."
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "La date de début doit être avant la date de fin."
        });
      }
    }
  }
);

const getDefaultValues = (asAdmin: boolean) => ({
  companyOrgId: asAdmin ? "" : "all",
  startDate: format(startOfYear(new Date()), "yyyy-MM-dd"),
  format: RegistryExportFormat.Csv
});

const getUTCStartOfDay = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  ).toISOString();
};

const getUTCEndOfDay = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999
    )
  ).toISOString();
};

export const RegistryExhaustiveExportModalProvider: React.FC<{
  children: React.ReactNode;
  asAdmin?: boolean;
}> = ({ children, asAdmin = false }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refetch: refetchExports } = useRegistryExport();

  const [generateExport, { loading: generateLoading }] = useMutation<
    Pick<
      Mutation,
      | "generateRegistryExhaustiveExport"
      | "generateRegistryExhaustiveExportAsAdmin"
    >,
    MutationGenerateRegistryExhaustiveExportArgs
  >(
    asAdmin
      ? GENERATE_REGISTRY_EXHAUSTIVE_EXPORT_AS_ADMIN
      : GENERATE_REGISTRY_EXHAUSTIVE_EXPORT,
    {
      refetchQueries: [
        asAdmin
          ? GET_REGISTRY_EXHAUSTIVE_EXPORTS_AS_ADMIN
          : GET_REGISTRY_EXHAUSTIVE_EXPORTS
      ]
    }
  );

  const methods = useForm<z.infer<typeof refinedSchema>>({
    defaultValues: getDefaultValues(asAdmin),
    resolver: zodResolver(refinedSchema)
  });
  const {
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = methods;

  const onClose = useCallback(() => {
    setError(null);
    reset(getDefaultValues(asAdmin));
    setIsExportModalOpen(false);
    refetchExports();
  }, [reset, refetchExports, asAdmin]);

  const onSubmit = useCallback(
    async (input: z.infer<typeof refinedSchema>) => {
      setError(null);
      const { companyOrgId, format, startDate, endDate } = input;
      const siret = companyOrgId === "all" ? null : companyOrgId;
      // push the dates to the extremities of days so we include the days entered in the inputs
      const startOfDayStartDate = getUTCStartOfDay(startDate);
      const endOfDayEndDate = endDate ? getUTCEndOfDay(endDate) : null;

      await generateExport({
        variables: {
          siret,
          format, //RegistryExportFormat.Csv
          dateRange: {
            _gte: startOfDayStartDate,
            _lt: endOfDayEndDate
          }
        },
        onCompleted: () => {
          onClose();
        },
        onError: err => setError(err.message)
      });
    },
    [onClose, generateExport]
  );

  const submit = useCallback(() => {
    handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  const isLoading = isSubmitting || generateLoading;
  return (
    <RegistryExhaustiveExportModalContext.Provider
      value={{
        type: "registryExhaustive",
        isOpen: isExportModalOpen,
        onOpen: () => setIsExportModalOpen(true),
        onClose,
        isLoading,
        error,
        methods,
        submit,
        asAdmin
      }}
    >
      {children}
    </RegistryExhaustiveExportModalContext.Provider>
  );
};
// export default useRegistryExport;
