import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { RegistryImportType, RegistryLineReason } from "@td/codegen-ui";
import React, { useState } from "react";
import { type UseFormReturn, FormProvider } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import cn from "classnames";
import { getRegistryNameFromImportType } from "../../../dashboard/registry/shared";
import { getTabsWithState } from "./error";
import "./FormBuilder.scss";
import { FormTab } from "./FormTab";
import type { FormShape } from "./types";

type Props = {
  registryType: RegistryImportType;
  shape: FormShape;
  methods: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  loading?: boolean;
  disabledFieldNames?: string[];
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

export function FormBuilder({
  registryType,
  shape,
  methods,
  onSubmit,
  loading,
  disabledFieldNames
}: Props) {
  const [selectedTabId, setSelectedTabId] = useState<string>(shape[0].tabId);
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const readOnly = queryParams.get("readonly") === "1";
  const navigate = useNavigate();
  const { errors } = methods.formState;
  const shapeWithState = getTabsWithState(shape, errors, disabledFieldNames);
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

  const currentTab = shapeWithState.find(tab => tab.tabId === selectedTabId);
  return (
    <div id="formBuilder" className="registryFormBuilder">
      <h3 className="fr-h3 fr-mb-1v">
        {readOnly
          ? "Afficher "
          : reason === RegistryLineReason.Edit
          ? "Modifier "
          : "Créer "}
        une déclaration
      </h3>
      <div
        className={cn(
          "fr-hint-text",
          readOnly ? "fr-mb-1w" : "fr-mb-2w",
          "fr-text--md"
        )}
      >
        {getRegistryNameFromImportType(registryType)}
      </div>
      {readOnly && (
        <div>
          <Alert
            description="La vue Affichage ne permet pas d'effectuer ou enregistrer des modifications sur les déclarations"
            severity="info"
            className="fr-mb-2w fr-pb-1w"
            small
          />
        </div>
      )}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Tabs
            selectedTabId={selectedTabId}
            onTabChange={onTabChange}
            tabs={shapeWithState.map(item => ({
              tabId: item.tabId,
              label: item.tabTitle,
              ...(item.error && {
                iconId: "tabError fr-icon-warning-line" as any
              })
            }))}
          >
            {currentTab && (
              <FormTab
                key={currentTab.tabId}
                fields={currentTab.fields}
                methods={methods}
              />
            )}
          </Tabs>

          <div className="fr-modal__footer fr-py-3w fr-mt-0">
            <div className="error-container">
              {errors.root?.serverError && (
                <div tabIndex={-1}>
                  <Alert
                    title="Erreur interne"
                    description={
                      errors.root.serverError.message ??
                      "Une erreur inconnue est survenue, merci de réessayer dans quelques instants. Si le problème persiste vous pouvez contacter le support"
                    }
                    severity="error"
                    className="fr-mb-2w"
                  />
                </div>
              )}
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

                    {!readOnly && (
                      <Button type="submit" disabled={loading}>
                        {reason === RegistryLineReason.Edit
                          ? "Modifier la déclaration"
                          : reason === RegistryLineReason.Cancel
                          ? "Annuler la déclaration"
                          : "Créer la déclaration"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
