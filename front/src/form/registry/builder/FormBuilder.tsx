import React from "react";
import { type UseFormReturn, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import type { FormShape } from "./types";
import { FormTab } from "./FormTab";
import { Button } from "@codegouvfr/react-dsfr/Button";

type Props = { shape: FormShape; methods: UseFormReturn<any> };

export function FormBuilder({ shape, methods }: Props) {
  const navigate = useNavigate();

  return (
    <div>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(data => console.log(data))}>
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
