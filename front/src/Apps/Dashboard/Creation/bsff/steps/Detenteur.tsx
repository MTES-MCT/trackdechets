import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { BsdType, BsffType } from "@td/codegen-ui";
import { useFormContext } from "react-hook-form";
import { RhfDetenteurList } from "../../../../Forms/Components/DetenteurList/RhfDetenteurList";

const EMPTY: any[] = [];

// Uniquement les détenteurs réels des fiches d'intervention du BSFF initial
const getInitialDetenteurs = (container: any) => {
  const detenteurs: any[] = [];

  // 1. Détenteurs directement portés par le packaging
  for (const detenteur of container?.detenteurs ?? []) {
    if (detenteur) {
      detenteurs.push(detenteur);
    }
  }

  // 2. Détenteurs provenant des fiches du packaging
  for (const fiche of container?.ficheInterventions ?? []) {
    if (fiche?.detenteur) {
      detenteurs.push(fiche.detenteur);
    }
  }

  // 3. Fallback sur le BSFF initial
  for (const fiche of container?.bsff?.ficheInterventions ?? []) {
    if (fiche?.detenteur) {
      detenteurs.push(fiche.detenteur);
    }
  }

  // Déduplication
  const seen = new Set<string>();

  return detenteurs.filter((detenteur: any) => {
    const company = detenteur.company ?? {};

    const key = detenteur.isPrivateIndividual
      ? `PARTICULIER|${company.name ?? ""}`
      : `ENTREPRISE|${company.orgId ?? company.siret ?? company.name ?? ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const holderKey = (d: any) => {
  const c = d.company ?? {};

  if (d.isPrivateIndividual) {
    return `PARTICULIER|${c.name ?? ""}`;
  }

  return `ENTREPRISE|${c.orgId || c.siret || c.name || ""}`;
};

const DetenteurBsff = () => {
  const { siret } = useParams<{ siret: string }>();

  const { watch, setValue } = useFormContext();

  const type = watch("type");
  const repackaging = watch("repackaging") ?? EMPTY;
  const emitterSiret = watch("emitter.company.siret");
  const ficheInterventions = watch("ficheInterventions");

  const signature = repackaging.map((c: any) => c.id).join(",");

  // Garde anti-boucle pour le nettoyage
  const cleanCount = useRef(0);

  /**
   * Calcul des détenteurs à partir des BSFF initiaux sélectionnés.
   *
   * IMPORTANT :
   * - À la création, les ficheInterventions n'ont pas encore d'id backend.
   * - En édition, les ficheInterventions déjà sauvegardées possèdent un id.
   *
   * On ne doit donc jamais écraser les ficheInterventions persistées
   * lors du chargement du formulaire d'édition.
   */
  useEffect(() => {
    if (type !== BsffType.Reconditionnement) {
      return;
    }

    if (!repackaging.length) {
      return;
    }

    /**
     * En édition :
     *
     * Les ficheInterventions viennent du backend et possèdent un id.
     * On les conserve telles quelles.
     *
     * Cela évite le problème suivant :
     *
     * repackaging
     *   -> container.bsff.ficheInterventions absent
     *   -> getInitialDetenteurs() retourne []
     *   -> next = []
     *   -> setValue("ficheInterventions", [])
     *
     * qui faisait disparaître les détenteurs lors de la réouverture
     * d'un BSFF de reconditionnement.
     */
    const hasPersistedFicheInterventions =
      Array.isArray(ficheInterventions) &&
      ficheInterventions.some((fiche: any) => Boolean(fiche?.id));

    if (hasPersistedFicheInterventions) {
      return;
    }

    cleanCount.current = 0;

    const grouped = new Map<string, any>();

    repackaging.forEach((container: any) => {
      const detenteurs = getInitialDetenteurs(container);

      detenteurs.forEach((detenteur: any) => {
        const company = detenteur.company ?? {};
        const isPrivate = Boolean(detenteur.isPrivateIndividual);

        // On ignore une entreprise qui est l'émetteur du reconditionnement
        if (!isPrivate && emitterSiret && company.siret === emitterSiret) {
          return;
        }

        const key = holderKey(detenteur);

        if (!grouped.has(key)) {
          grouped.set(key, {
            id: `reconditioning-holder-${key}`,
            isExempted: false,
            detenteur: {
              isPrivateIndividual: isPrivate,
              company: {
                orgId: company.orgId ?? null,
                siret: company.siret ?? null,
                vatNumber: company.vatNumber ?? null,
                name: company.name ?? "",
                address: company.address ?? "",
                contact: company.contact ?? "",
                phone: company.phone ?? "",
                mail: company.mail ?? ""
              }
            },
            packagings: []
          });
        }

        grouped.get(key).packagings.push({
          numero: container.numero
        });
      });
    });

    const next = Array.from(grouped.values()).map((holder, i) => ({
      ...holder,
      numero: `${i + 1}`
    }));

    /**
     * Protection supplémentaire :
     *
     * Même en création, si aucun détenteur n'a pu être calculé,
     * on ne doit pas écraser une éventuelle valeur déjà présente.
     */
    if (!next.length) {
      return;
    }

    setValue("ficheInterventions", next, {
      shouldDirty: true,
      shouldValidate: true
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, signature, emitterSiret]);

  /**
   * Nettoyage :
   * un particulier ne doit jamais porter le SIRET de l'émetteur.
   */
  useEffect(() => {
    if (type !== BsffType.Reconditionnement || !emitterSiret) {
      return;
    }

    if (!Array.isArray(ficheInterventions) || !ficheInterventions.length) {
      return;
    }

    const polluted = ficheInterventions.some(
      (f: any) =>
        f?.detenteur?.isPrivateIndividual &&
        (f.detenteur.company?.siret === emitterSiret ||
          f.detenteur.company?.orgId === emitterSiret)
    );

    if (!polluted) {
      return;
    }

    if (cleanCount.current >= 3) {
      return;
    }

    cleanCount.current += 1;

    const cleaned = ficheInterventions.map((f: any) => {
      if (!f?.detenteur?.isPrivateIndividual) {
        return f;
      }

      const company = f.detenteur.company ?? {};

      return {
        ...f,
        detenteur: {
          ...f.detenteur,
          company: {
            ...company,
            siret: company.siret === emitterSiret ? null : company.siret,
            orgId: company.orgId === emitterSiret ? null : company.orgId
          }
        }
      };
    });

    setValue("ficheInterventions", cleaned, {
      shouldDirty: true
    });
  }, [ficheInterventions, type, emitterSiret, setValue]);

  return (
    <div className="fr-col-md-10">
      <RhfDetenteurList
        orgId={siret}
        fieldName="ficheInterventions"
        bsdType={BsdType.Bsff}
      />
    </div>
  );
};

export default DetenteurBsff;
