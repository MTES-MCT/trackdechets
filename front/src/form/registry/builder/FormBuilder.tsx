import React from "react";
import { type UseFormReturn, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import type { FormShape } from "./types";
import { FormTab } from "./FormTab";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { getTabsWithErrorClass } from "./error";
import "./FormBuilder.scss";
import Alert from "@codegouvfr/react-dsfr/Alert";

type Props = {
  shape: FormShape;
  methods: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  loading?: boolean;
};

export function FormBuilder({ shape, methods, onSubmit, loading }: Props) {
  const navigate = useNavigate();
  const { errors } = methods.formState;
  const shapeWithErrors = getTabsWithErrorClass(shape, errors);
  const publicId = methods.watch("publicId");

  return (
    <div>
      <h3 className="fr-h3">
        {publicId ? "Modifier" : "Créer"} une déclaration
      </h3>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Tabs
            tabs={shapeWithErrors.map(item => ({
              label: item.tabTitle,
              ...(item.iconId && { iconId: item.iconId }),
              content: <FormTab fields={item.fields} methods={methods} />
            }))}
          />

          {errors.root?.serverError && (
            <Alert
              title="Erreur interne"
              description="Une erreur inconnue est survenue, merci de réessayer dans quelques instants. Si le problème persiste vous pouvez contacter le support"
              severity="error"
              className="fr-my-2w"
            />
          )}
          {errors.root?.skippedError && (
            <Alert
              title="Modification ignorée"
              description="Le numéro unique saisi est déjà utilisé. Si vous souhaitez modifier une déclaration existante, vous devez saisir un motif correspondant."
              severity="info"
              className="fr-my-2w"
            />
          )}

          <div className="td-modal-actions">
            <Button
              priority="secondary"
              nativeButtonProps={{ type: "button" }}
              onClick={() => navigate(-1)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {publicId ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
