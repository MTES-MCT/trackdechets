import React from "react";
import { type UseFormReturn, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import type { FormShape } from "./types";
import { FormTab } from "./FormTab";
import { Button } from "@codegouvfr/react-dsfr/Button";

type Props = {
  shape: FormShape;
  methods: UseFormReturn<any>;
  onSubmit: (data: any) => void;
};

export function FormBuilder({ shape, methods, onSubmit }: Props) {
  const navigate = useNavigate();

  return (
    <div>
      <h3 className="fr-h3">Créer une déclaration</h3>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Tabs
            tabs={shape.map(item => ({
              label: item.tabTitle,
              ...(item.iconId && { iconId: item.iconId }),
              content: <FormTab fields={item.fields} methods={methods} />
            }))}
          />

          <div className="td-modal-actions">
            <Button
              priority="secondary"
              nativeButtonProps={{ type: "button" }}
              onClick={() => navigate(-1)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={false}>
              Créer
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
