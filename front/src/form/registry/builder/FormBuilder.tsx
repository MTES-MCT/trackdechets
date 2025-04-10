import React, { useState } from "react";
import { type UseFormReturn, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import type { FormShape } from "./types";
import { FormTab } from "./FormTab";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { getTabsWithErrorClass } from "./error";
import "./FormBuilder.scss";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { RegistryLineReason } from "@td/codegen-ui";

type Props = {
  shape: FormShape;
  methods: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  loading?: boolean;
};

export const getNextTab = (tabIds: string[], currentTabId: string) => {
  const idx = tabIds.indexOf(currentTabId);
  if (idx === -1 || idx === tabIds.length) {
    return currentTabId;
  }
  return tabIds[idx + 1];
};

export const getPrevTab = (tabIds: string[], currentTabId: string) => {
  const idx = tabIds.indexOf(currentTabId);
  if (idx === -1 || idx === 0) {
    return currentTabId;
  }
  return tabIds[idx - 1];
};

export function FormBuilder({ shape, methods, onSubmit, loading }: Props) {
  const [selectedTabId, setSelectedTabId] = useState<string>(shape[0].tabId);
  const navigate = useNavigate();
  const { errors } = methods.formState;
  const shapeWithErrors = getTabsWithErrorClass(shape, errors);
  const tabIds = shape.map(tab => tab.tabId);
  const lastTabId = tabIds[tabIds.length - 1];
  const firstTabId = tabIds[0];
  const reason = methods.watch("reason");
  const scrollToTop = () => {
    const element = document.getElementById("formBuilder");
    if (element) {
      element.scroll({ top: 0 });
    }
  };
  const onTabChange = (tabId: string) => {
    setSelectedTabId(tabId);
    scrollToTop();
  };
  const onPrevTab = () => {
    setSelectedTabId(getPrevTab(tabIds, selectedTabId));
    scrollToTop();
  };
  const onNextTab = () => {
    setSelectedTabId(getNextTab(tabIds, selectedTabId));
    scrollToTop();
  };
  const currentTab = shape.find(tab => tab.tabId === selectedTabId);
  return (
    <div id="formBuilder">
      <h3 className="fr-h3">
        {reason === RegistryLineReason.Edit
          ? "Modifier "
          : reason === RegistryLineReason.Cancel
          ? "Annuler "
          : "Créer "}
        une déclaration
      </h3>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Tabs
            selectedTabId={selectedTabId}
            onTabChange={onTabChange}
            tabs={shapeWithErrors.map(item => ({
              tabId: item.tabId,
              label: item.tabTitle,
              ...(item.iconId && { iconId: item.iconId })
            }))}
          >
            {currentTab && (
              <FormTab fields={currentTab.fields} methods={methods} />
            )}
          </Tabs>

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
          <div className="fr-modal__footer">
            <div className="fr-btns-group fr-btns-group--inline">
              <div>
                <div>
                  <Button
                    onClick={onPrevTab}
                    priority="tertiary"
                    disabled={selectedTabId === firstTabId}
                    type="button"
                  >
                    Précédent
                  </Button>

                  <Button
                    onClick={onNextTab}
                    priority="tertiary"
                    disabled={selectedTabId === lastTabId}
                    type="button"
                  >
                    Suivant
                  </Button>
                </div>

                <div>
                  <Button
                    priority="secondary"
                    type="button"
                    onClick={() => navigate(-1)}
                  >
                    Fermer
                  </Button>

                  <Button type="submit" disabled={loading}>
                    {reason === RegistryLineReason.Edit
                      ? "Modifier la déclaration"
                      : reason === RegistryLineReason.Cancel
                      ? "Annuler la déclaration"
                      : "Créer la déclaration"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* <div className="td-modal-actions">
            <Button
              priority="secondary"
              nativeButtonProps={{ type: "button" }}
              onClick={() => navigate(-1)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {reason === RegistryLineReason.Edit
                ? "Modifier"
                : reason === RegistryLineReason.Cancel
                ? "Annuler"
                : "Créer"}
            </Button>
          </div> */}
        </form>
      </FormProvider>
    </div>
  );
}
