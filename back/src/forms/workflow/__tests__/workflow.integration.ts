import * as supertest from "supertest";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { app } from "../../../server";
import { companyFactory, userFactory } from "../../../__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";
import { associateUserToCompany } from "../../../users/mutations/associateUserToCompany";
import { apiKey } from "../../../users/queries";

// Ce fichier de tests illustre l'utilisation de l'API GraphQL Trackdéchets
// dans les exemples de situation décrits dans la notice explicative
// https://www.service-public.fr/professionnels-entreprises/vosdroits/R14334
//
// 1er cas  : Acheminement direct du producteur à l’installation de traitement ou de transformation
// 2ème cas : Entreposage provisoire ou reconditionnement
// 3ème cas : Collecteur de petites quantités de déchets relevant d’une même rubrique
// 4ème cas : Opération de transformation ou de traitement aboutissant à produire des déchets
//            dont la provenance reste identifiable
// 5ème cas : Transport multimodal
// 6ème cas : Expédition de déchets après une transformation ou un traitement aboutissant à
//            des déchets dont la provenance n’est plus identifiable

// Crée un client HTTP de test basé sur http://visionmedia.github.io/superagent/
const request = supertest(app);

describe("Exemples de circuit du bordereau de suivi des déchets dangereux", () => {
  afterEach(() => resetDatabase());

  // Chemin d'accès au répertoire de stockage des PDF de tests ./pdf
  // Vous pouvez inspecter ces PDF pour visualiser à quoi ressemble le PDF
  // à chaque étape du cycle de vie du bordereau
  const PDF_DIR = path.join(__dirname, "pdf");

  /**
   * Fonction utilitaire permettant de télécharger un BSD au format pdf
   * @param formId identifiant opaque du BSD
   * @param token token d'authentification à l'API Trackdéchets
   * @param filename nom du fichier à sauvegarder
   * @param save if true save it to PDF_DIR, otherwise save it to tmp dir
   */
  async function downloadPdf(
    formId: string,
    token: string,
    filename: string,
    save: boolean = false
  ): Promise<string> {
    const formPdfQuery = `
      query {
        formPdf(id: "${formId}"){
          token
        }
      }
    `;

    // On utilise la query formPdf pour obtenir un token de téléchargement
    // Ce token a une durée de validité de 10 secondes
    const formPdfResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${token}`)
      .send({ query: formPdfQuery });

    const downloadToken = formPdfResponse.body.data.formPdf.token;

    const dir = save ? PDF_DIR : fs.mkdtempSync(path.join(os.tmpdir(), "/"));
    const filepath = path.join(dir, filename);

    const writeStream = fs.createWriteStream(filepath);

    // On fait ensuite une requête GET sur le endpoint /download
    // en passant le token en paramètre. Il est également possible
    // d'utiliser directement la variable de retour `downloadLink`
    request.get(`/download?token=${downloadToken}`).pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => resolve(filepath)).on("error", reject);
    });
  }

  test("Acheminement direct du producteur à l'installation de traitement", async () => {
    // 1er cas: Acheminement direct du producteur à l'installation de traitement.
    // Exemple de boues organiques traitées par incinération

    // Établissement producteur de boues organiques
    const producteur = await companyFactory({
      siret: "11111111111111",
      name: "Boues and Co"
    });
    // Avec un utilisateur membre
    const producteurUser = await userFactory();
    await associateUserToCompany(producteurUser.id, producteur.siret, "MEMBER");

    // Installation d'incinération
    const traiteur = await companyFactory({
      siret: "22222222222222",
      name: "Incinérateur du Grand Est"
    });
    // Avec un utilisateur membre
    const traiteurUser = await userFactory();
    await associateUserToCompany(traiteurUser.id, traiteur.siret, "MEMBER");

    // Entreprise de transport
    const transporteur = await companyFactory({
      siret: "33333333333333",
      name: "Transport Qui Roule"
    });
    // Avec un utilisateur membre
    const transporteurUser = await userFactory();
    await associateUserToCompany(
      transporteurUser.id,
      transporteur.siret,
      "MEMBER"
    );

    // Récupère les tokens utilisateurs pour l'authentification à l'API
    const producteurToken = await apiKey(producteurUser);
    const traiteurToken = await apiKey(traiteurUser);
    const transporteurToken = await apiKey(transporteurUser);

    // Le BSD est rempli du cadre 1 à 8 par l’émetteur du bordereau

    // La requête suivante est une chaîne de caractères
    // Dans la plupart des langages ne supportant pas les littéraux de gabarits
    // comme Node.js, vous devrez échapper les sauts de lignes et les guillements
    const saveFormQuery = `
      mutation {
        saveForm(formInput: {
          customId: "TD-20-AAA00256"
          emitter: {
            type: PRODUCER
            company: {
              siret: "${producteur.siret}"
              name: "${producteur.name}"
              address: "1 rue de paradis, 75010 PARIS"
              contact: "Jean Dupont de la Boue"
              phone: "01 00 00 00 00"
              mail: "jean.dupont@boues.fr"
            },
            workSite: {
              address: "5 rue du chantier"
              postalCode: "07100"
              city: "Annonay"
              infos: "Site de stockage de boues"
            }
          }
          recipient: {
            processingOperation: "D 10"
            company: {
              siret: "${traiteur.siret}"
              name: "${traiteur.name}"
              address: "1 avenue de Colmar 67100 Strasbourg"
              contact: "Thomas Largeron"
              phone: "03 00 00 00 00"
              mail: "thomas.largeron@incinerateur.fr"
            }
          }
          transporter: {
            company: {
              siret: "${transporteur.siret}"
              name: "${transporteur.name}"
              address: "1 rue des 6 chemins, 07100 ANNONAY"
              contact: "Claire Dupuis"
              mail: "claire.dupuis@transportquiroule.fr"
              phone: "0400000000"
            },
            receipt: "12379"
            department: "07"
            validityLimit: "2020-06-30"
            numberPlate: "AD-007-TS"
          }
          wasteDetails: {
              code: "06 05 02*"
              onuCode: ""
              name: "Boues"
              packagings: [
                BENNE
              ]
              numberOfPackages: 1
              quantity: 1
              quantityType: ESTIMATED
              consistence: LIQUID
          }
        }){
          id
          status
        }
      }
    `;

    const saveFormResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${producteurToken}`)
      .send({ query: saveFormQuery });

    // La réponse est au format JSON
    // Uniquement les champs précisés dans la réponse de la requête GraphQL
    // sont retournés. En l'occurence `id` et `status`
    //
    // {
    //   "saveForm": {
    //     "id": "ck8k6kwd2006g0a64d219fd24",
    //     "status": "DRAFT"
    //   }
    // }
    let form = saveFormResponse.body.data.saveForm;

    // Lors de sa création, le BSD se retrouve à l'état de BROUILLON
    expect(form.status).toEqual("DRAFT");

    // L'émetteur du BSD procède à la finalisation du bordereau. L'ensemble
    // des champs des cases 1 à 8 sont validés et ne pourront plus être modifiés
    const markAsSealedQuery = `
      mutation {
        markAsSealed(id: "${form.id}") {
          id
          status
        }
      }`;

    const markAsSealedResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${producteurToken}`)
      .send({ query: markAsSealedQuery });

    form = markAsSealedResponse.body.data.markAsSealed;

    // Le BSD passe à l'état "Finalisé"
    expect(form.status).toEqual("SEALED");

    // Télécharge le pdf
    await downloadPdf(form.id, producteurToken, "1-bsd-sealed.pdf");

    // Le transporteur signe le BSD
    const signedByTransporterQuery = `
      mutation {
        signedByTransporter(
          id: "${form.id}",
          signingInfo: {
            sentAt: "2020-04-03T14:48:00",
            quantity: 1,
            packagings: [
              BENNE
            ],
            sentBy: "Isabelle Guichard"
            onuCode: "xxxx",
            signedByTransporter: true,
            signedByProducer: true,
            securityCode: ${producteur.securityCode}
          }
        ){
          id
          status
        }
      }
    `;

    const signedByTransporterResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${transporteurToken}`)
      .send({ query: signedByTransporterQuery });

    form = signedByTransporterResponse.body.data.signedByTransporter;

    expect(form.status).toEqual("SENT");

    // Télécharge le pdf
    await downloadPdf(form.id, producteurToken, "1-bsd-sent.pdf");

    // Sur le lieu de l’installation de destination prévue
    // le déchet est réceptionné et la case 10 est remplie
    const markAsReceivedQuery = `
      mutation {
        markAsReceived(
          id: "${form.id}"
          receivedInfo: {
            wasteAcceptationStatus: ACCEPTED
            receivedBy: "Antoine Derieux"
            receivedAt: "2020-04-05T11:18:00"
            quantityReceived: 1
          }
        ){
          id
          status
        }
      }
    `;

    const markAsReceivedResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${traiteurToken}`)
      .send({ query: markAsReceivedQuery });

    form = markAsReceivedResponse.body.data.markAsReceived;
    expect(form.status).toEqual("RECEIVED");

    // Télécharge le pdf
    await downloadPdf(form.id, producteurToken, "1-bsd-received.pdf");

    // Sur le lieu de l'installation de destination prévue
    // l'opération de traitement est effectué et la case 11
    // est remplie
    const markAsProcessedQuery = `
      mutation {
        markAsProcessed(
          id: "${form.id}",
          processedInfo: {
            processingOperationDone: "D 10",
            processingOperationDescription: "Incinération",
            processedBy: "Alfred Dujardin",
            processedAt: "2020-04-15T10:22:00"
          }
        ){
          id
          status
        }
      }
    `;

    const markAsProcessedResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${traiteurToken}`)
      .send({ query: markAsProcessedQuery });

    form = markAsProcessedResponse.body.data.markAsProcessed;

    expect(form.status).toEqual("PROCESSED");
    await downloadPdf(form.id, producteurToken, "1-bsd-processed.pdf");

    // Le producteur reçoit les notifications de réception et de traitement
    // en temps réel en interrogeant la query formsLifeCycle périodiquement
    // (tous les jours par exemple)

    const formsLifeCycleQuery = `
      query {
        formsLifeCycle(siret: "${producteur.siret}"){
          statusLogs {
            status
            updatedFields
          }
        }
      }
    `;

    const formsLifeCycleResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${producteurToken}`)
      .send({ query: formsLifeCycleQuery });

    const statusLogs =
      formsLifeCycleResponse.body.data.formsLifeCycle.statusLogs;

    expect(statusLogs).toEqual([
      {
        status: "PROCESSED",
        updatedFields: {
          processedBy: "Alfred Dujardin",
          processedAt: "2020-04-15T10:22:00",
          processingOperationDone: "D 10",
          processingOperationDescription: "Incinération"
        }
      },
      {
        status: "RECEIVED",
        updatedFields: {
          receivedBy: "Antoine Derieux",
          receivedAt: "2020-04-05T11:18:00",
          quantityReceived: 1
        }
      },
      {
        status: "SENT",
        updatedFields: {
          sentAt: "2020-04-03T14:48:00",
          signedByTransporter: true,
          sentBy: "Isabelle Guichard",
          signedByProducer: true,
          packagings: ["BENNE"],
          quantity: 1,
          onuCode: "xxxx"
        }
      },
      { status: "SEALED", updatedFields: {} },
      { status: "DRAFT", updatedFields: {} }
    ]);
  }, 30000);

  // TODO
  test.todo("Acheminement direct du producteur à l'installation de traitement");
  // TODO
  test.todo(
    "Collecteur de petites quantités de déchets relevant d’une même rubrique"
  );
  // TODO
  test.todo(
    "Opération de transformation ou de traitement aboutissant à produire des déchets dont la provenance reste identifiable"
  );
  // TODO
  test.todo("Transport multimodal");
  // TODO
  test.todo(
    "Expédition de déchets après une transformation ou un traitement aboutissant à des déchets dont la provenance n’est plus identifiable"
  );
});
