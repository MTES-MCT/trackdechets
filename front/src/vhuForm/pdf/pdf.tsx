import { useQuery } from "@apollo/client";
import { InlineError } from "common/components/Error";
import Loader from "common/components/Loaders";
import {
  BordereauVhuQueryFindUniqueArgs,
  Query,
  VhuRecipientType,
} from "generated/graphql/types";
import React, { useEffect } from "react";
import QRCodeIcon from "react-qr-code";
import { useParams } from "react-router-dom";
import { GET_VHU_FORM } from "vhuForm/queries";
import "./model.css";
import "./paper.min.css";

const addBodyClass = className => document.body.classList.add(className);
const removeBodyClass = className => document.body.classList.remove(className);

export default function Pdf() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<
    Pick<Query, "bordereauVhu">,
    BordereauVhuQueryFindUniqueArgs
  >(GET_VHU_FORM, {
    variables: {
      id: id,
    },
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    // Set up
    addBodyClass("A4");

    // Clean up
    return () => {
      removeBodyClass("A4");
    };
  }, []);

  if (loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;

  const form = data?.bordereauVhu?.findUnique;
  if (!form) return <p>Aperçu impossible.</p>;

  return (
    <section className="sheet padding-10mm">
      <div className="parent">
        {/* Row 1 */}
        <div className="item div1 centered small">
          Arrêté du 2 mai 2012 relatif aux agréments des exploitants des centres
          VHU et aux agréments des exploitants des installations de broyage de
          véhicules hors d'usage
        </div>
        <div className="item div2 centered">
          <h1>Bordereau de suivi de Véhicules hors d’usage (VHU)</h1>
        </div>
        <div className="item div3 centered">
          <QRCodeIcon value={form.readableId} size={74} />
        </div>

        {/* Row 2 */}
        <div className="item div4">
          N° Trackdéchets du Bordereau : {form.readableId}
        </div>

        {/* Row 3 */}
        <div className="item div5">
          <h2>1. Emetteur du Bordereau</h2>
          <div className="flex justify-center">
            <div>
              <input type="radio" id="e_demolisseur" name="emetteur" disabled />
              <label htmlFor="e_demolisseur">Démolisseur</label>
            </div>
            <div>
              <input type="radio" id="e_VHU" name="emetteur" disabled />
              <label htmlFor="e_VHU">Centre VHU</label>
            </div>
          </div>

          <div>
            <p>N° Agrément : {form.emitter?.agrementNumber}</p>
            <p>N° SIRET : {form.emitter?.company?.siret}</p>
            <p>NOM (Raison sociale) : {form.emitter?.company?.name}</p>
            <p>Adresse : {form.emitter?.company?.address}</p>
            <div className="flex">
              <p className="grow">Tel : {form.emitter?.company?.phone}</p>
              <p className="grow">Mail : {form.emitter?.company?.mail}</p>
            </div>
            <p>
              Nom de la personne à contacter : {form.emitter?.company?.contact}
            </p>
          </div>
        </div>
        <div className="item div6">
          <h2>2. Installation de destination</h2>
          <div className="flex justify-center">
            <div>
              <input
                type="radio"
                id="d_broyeur"
                name="destination"
                defaultChecked={
                  form.recipient?.type === VhuRecipientType.Broyeur
                }
                disabled
              />
              <label htmlFor="d_broyeur">Broyeur agréé</label>
            </div>

            <div>
              <input
                type="radio"
                id="d_demolisseur"
                name="destination"
                defaultChecked={
                  form.recipient?.type === VhuRecipientType.Demolisseur
                }
                disabled
              />
              <label htmlFor="d_demolisseur">Démolisseur agréé</label>
            </div>
          </div>

          <div>
            <p>N° Agrément : {form.recipient?.agrementNumber}</p>
            <p>N° SIRET : {form.recipient?.company?.siret}</p>
            <p>NOM (Raison sociale) : {form.recipient?.company?.name}</p>
            <p>Adresse : {form.recipient?.company?.address}</p>
            <div className="flex">
              <p className="grow">Tel : {form.recipient?.company?.phone}</p>
              <p className="grow">Mail : {form.recipient?.company?.mail}</p>
            </div>
            <p>
              Nom de la personne à contacter :{" "}
              {form.recipient?.company?.contact}
            </p>
          </div>
        </div>

        {/* Row 4 */}
        <div className="item div7">
          <h2>3. Le VHU sont conditionnés</h2>
          <div className="flex justify-center">
            <div>
              <input type="radio" id="unites" name="emetteur" disabled />
              <label htmlFor="unites">Unités</label>
            </div>
            <div>
              <input type="radio" id="lots" name="emetteur" disabled />
              <label htmlFor="lots">Lots</label>
            </div>
          </div>
        </div>
        <div className="item div8">
          <h2>4. Code déchet correspondant</h2>
          <div className="flex flex-column">
            <div>
              <input type="radio" id="16 01 06" name="emetteur" disabled />
              <label htmlFor="16 01 06">
                <strong>16 01 06</strong> (Véhicules hors d’usage ne contenant
                ni liquides ni autres composants dangereux)
              </label>
            </div>
            <div>
              <input type="radio" id="16 01 04*" name="emetteur" disabled />
              <label htmlFor="16 01 04*">
                <strong>16 01 04*</strong> (véhicules hors d’usage non dépollué
                par un centre agréé)
              </label>
            </div>
          </div>
        </div>

        {/* Row 5 */}
        <div className="item div9">
          <h2>5. Identification du ou des VHU</h2>
          <p className="margin-bottom">
            Indiquer le <strong>numéro d’ordre des VHU</strong> concernés tels
            qu’ils figurent dans le livre de police (si « unités » coché en 3) :
          </p>

          <p className="margin-bottom">
            Indiquer le <strong>numéro du ou des lot(s)</strong> sortant(s),
            concerné(s) par ce bordereau le cas échéant (si « lots » coché en 3)
            :
          </p>

          <p className="small">
            L’exploitant conserve la liste des véhicules concernés par lot, à
            disposition des autorités. Dans tous les cas le livre de police doit
            être renseigné avec le numéro du BSD, la destination et le cas
            échéant, le numéro du lot
          </p>
        </div>
        <div className="item div10">
          <h2>6. Quantités</h2>
          <p>
            <strong>Nombre de VHU =</strong>
          </p>
          <p className="margin-bottom">
            (Obligatoire si « unités » coché en 3)
          </p>
          <p>
            <strong>En tonne (le cas échéant) =</strong>
          </p>
        </div>

        {/* Row 6 */}
        <div className="item div11">
          <h2>7. Déclaration générale de l’émetteur du bordereau</h2>
          <p>Je soussigné (Nom, prénom) :</p>
          <p>
            Certifie que les renseignements portés dans les cadres ci-dessus
            sont exacts et de bonne foi.
          </p>
          <p>Date : _ _ / _ _ / _ _ _ _</p>
        </div>

        {/* Row 7 */}
        <div className="item div12">
          <h2>8. Transporteur</h2>
          <div>
            <p>N° Agrément :</p>
            <p>N° SIRET :</p>
            <p>NOM (Raison sociale) :</p>
            <p>Adresse :</p>
            <div className="flex">
              <p className="grow">Tel :</p>
              <p className="grow">Mail :</p>
            </div>
            <p>Nom de la personne à contacter :</p>
          </div>
        </div>
        <div className="item div13">
          <div>
            <p>Récépissé n° :</p>
            <div className="flex">
              <p>Département :</p>
              <p className="grow">Date limite de validité :</p>
            </div>
            <p>Date de prise en charge :</p>
          </div>
        </div>

        {/* Row 8 */}
        <div className="item div14">
          <h2>9. Installation de destination</h2>
          <div className="flex justify-center">
            <div>
              <input type="radio" id="d2_broyeur" name="destination" disabled />
              <label htmlFor="d2_broyeur">Broyeur agréé</label>
            </div>

            <div>
              <input
                type="radio"
                id="d2_demolisseur"
                name="destination"
                disabled
              />
              <label htmlFor="d2_demolisseur">Démolisseur agréé</label>
            </div>
          </div>

          <div className="margin-bottom">
            <p>N° Agrément :</p>
            <p>N° SIRET :</p>
            <p>NOM (Raison sociale) :</p>
            <p>Adresse :</p>
            <div className="flex">
              <p className="grow">Tel :</p>
              <p className="grow">Mail :</p>
            </div>
            <p>Nom de la personne à contacter :</p>
            <p>Date de présentation sur site :</p>
            <p>Quantité réelle présentée :</p>
          </div>

          <div className="flex">
            <p>Lot accepté :</p>
            <div>
              <input type="radio" id="oui" name="destination" disabled />
              <label htmlFor="oui">Oui</label>
            </div>
            <div>
              <input type="radio" id="non" name="destination" disabled />
              <label htmlFor="non">Non</label>
            </div>
            <div>
              <input
                type="radio"
                id="partiellement"
                name="destination"
                disabled
              />
              <label htmlFor="partiellement">Partiellement</label>
            </div>
          </div>

          <p className="margin-bottom">Motif de refus :</p>
          <p>N° du ou des lots entrant-s (*) :</p>
        </div>

        <div className="item div15">
          <h2>10. Réalisation de l’opération</h2>
          <div className="flex flex-column">
            <div>
              <input type="radio" id="R4" name="destination" disabled />
              <label htmlFor="R4">
                R4 –
                <span className="small">
                  Recyclage ou récupération des métaux et des composés
                  métalliques.
                </span>
              </label>
            </div>
            <div>
              <input type="radio" id="R12" name="destination" disabled />
              <label htmlFor="R12">
                R4 –
                <span className="small">
                  Regroupement préalable à R4 dans un centre VHU agréé
                </span>
              </label>
            </div>
          </div>
          <p className="margin-bottom">
            Date de réalisation: _ _ / _ _ / _ _ _ _
          </p>

          <p>Je soussigné (Nom, prénom) :</p>
          <p>
            Certifie que les mentions dans les cadres 9 et 10 sont exactes et
            que l’opération indiquée ci-dessus a été réalisée.
          </p>
        </div>
      </div>

      <p className="margin-bottom">
        (*) les VHU doivent être intégrés au livre de police de l’installation
        de destination (si démolisseur)
      </p>
      <p className="centered">
        <strong>
          Ce Bordereau doit accompagner tout transport de véhicules hors d’usage
        </strong>
      </p>
    </section>
  );
}
