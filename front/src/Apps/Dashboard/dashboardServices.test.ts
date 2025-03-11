import {
  BsdDisplay,
  BsdStatusCode,
  WorkflowDisplayType
} from "../common/types/bsdTypes";
import {
  canPublishBsd,
  canReviewBsdd,
  canSkipEmission,
  getDraftOrInitialBtnLabel,
  getIsNonDraftLabel,
  getReceivedBtnLabel,
  getResealedBtnLabel,
  getResentBtnLabel,
  getSealedBtnLabel,
  getSentBtnLabel,
  getSignByProducerBtnLabel,
  getSignTempStorerBtnLabel,
  getTempStoredBtnLabel,
  getTempStorerAcceptedBtnLabel,
  getWorkflowLabel,
  isBsdaSign,
  isBsffSign,
  isBsvhuSign,
  isEcoOrgSign,
  isEmetteurSign,
  isSignTransportCanSkipEmission,
  getOperationCodesFromSearchString,
  hasRoadControlButton,
  getPrimaryActionsLabelFromBsdStatus,
  isSiretActorForBsd,
  ActorType,
  canReviewBsda,
  canReviewBsdasri,
  canMakeCorrection
} from "./dashboardServices";
import {
  BsdType,
  BsffType,
  EmitterType,
  BsdasriType,
  BsdaType,
  UserPermission,
  BsffPackaging
} from "@td/codegen-ui";

import { BsdCurrentTab } from "../common/types/commonTypes";
import {
  FAIRE_SIGNER,
  PUBLIER,
  ROAD_CONTROL,
  SIGNATURE_ACCEPTATION_CONTENANT,
  SIGNATURE_ECO_ORG,
  SIGNER,
  VALIDER_ACCEPTATION,
  VALIDER_ACCEPTATION_ENTREPOSAGE_PROVISOIRE,
  VALIDER_ENTREPOSAGE_PROVISOIRE,
  VALIDER_RECEPTION,
  VALIDER_SYNTHESE_LABEL,
  VALIDER_TRAITEMENT,
  completer_bsd_suite
} from "../common/wordings/dashboard/wordingsDashboard";

describe("dashboardServices", () => {
  describe("isBsdaSign", () => {
    const bsd: BsdDisplay = {
      type: BsdType.Bsda,
      bsdWorkflowType: BsdaType.Collection_2710,
      emitter: {
        isPrivateIndividual: true
      },
      transporter: {
        company: { siret: "11111111111111" }
      },
      worker: {
        isDisabled: true
      }
    } as BsdDisplay;

    it('should return true if bsd.type is "bsda", bsd.bsdWorkflowType is "2710", and currentSiret matches the destination siret', () => {
      const currentSiret = "11111111111111";
      const result = isBsdaSign(bsd, currentSiret);
      expect(result).toBe(true);
    });

    it('should return true if bsd.type is "bsda", bsd.emitter.isPrivateIndividual is true, bsd.worker.isDisabled is true, and currentSiret matches the transporter siret', () => {
      const currentSiret = "22222222222222";
      bsd!.transporter!.company!.siret = currentSiret;
      const result = isBsdaSign(bsd, currentSiret);
      expect(result).toBe(true);
    });

    it('should return false if bsd.type is not "bsda"', () => {
      bsd.type = BsdType.Bsff;
      const currentSiret = "11111111111111";
      const result = isBsdaSign(bsd, currentSiret);
      expect(result).toBe(false);
    });

    it('should return false if bsd.type is "bsda", but neither bsd.bsdWorkflowType matches nor bsd.emitter.isPrivateIndividual is true and bsd.worker.isDisabled is true', () => {
      bsd.type = BsdType.Bsda;
      bsd.bsdWorkflowType = BsdasriType.Grouping;
      const currentSiret = "11111111111111";
      const result = isBsdaSign(bsd, currentSiret);
      expect(result).toBe(false);
    });
  });

  describe("isBsvhuSign", () => {
    const bsd: BsdDisplay = {
      type: BsdType.Bsvhu,
      emitter: { company: { siret: "11111111111111" } }
    } as BsdDisplay;

    it('should return true if bsd.type is "bsvhu" and currentSiret matches the emitter siret', () => {
      const currentSiret = "11111111111111";
      const result = isBsvhuSign(bsd, currentSiret);
      expect(result).toBe(true);
    });

    it('should return false if bsd.type is not "bsvhu"', () => {
      bsd.type = BsdType.Bsda;
      const currentSiret = "11111111111111";
      const result = isBsvhuSign(bsd, currentSiret);
      expect(result).toBe(false);
    });

    it('should return false if bsd.type is "bsvhu", but currentSiret does not match the emitter siret', () => {
      bsd.type = BsdType.Bsvhu;
      const currentSiret = "22222222222222";
      const result = isBsvhuSign(bsd, currentSiret);
      expect(result).toBe(false);
    });
  });

  describe("isBsffSign", () => {
    const bsd: BsdDisplay = {
      type: BsdType.Bsff,
      emitter: { company: { siret: "11111111111111" } }
    } as BsdDisplay;
    const bsdCurrentTab: BsdCurrentTab = "draftTab";

    it('should return true if bsd.type is "bsff", bsdCurrentTab is not "actTab", and currentSiret matches the emitter siret', () => {
      const currentSiret = "11111111111111";
      const result = isBsffSign(bsd, currentSiret, bsdCurrentTab);
      expect(result).toBe(true);
    });

    it('should return false if bsd.type is not "bsff"', () => {
      bsd.type = BsdType.Bsvhu;
      const currentSiret = "11111111111111";
      const result = isBsffSign(bsd, currentSiret, bsdCurrentTab);
      expect(result).toBe(false);
    });

    it('should return false if bsd.type is "bsff", but bsdCurrentTab is "actTab"', () => {
      bsd.type = BsdType.Bsff;
      const currentSiret = "11111111111111";
      const result = isBsffSign(bsd, currentSiret, "actTab" as BsdCurrentTab);
      expect(result).toBe(false);
    });

    it('should return false if bsd.type is "bsff", bsdCurrentTab is not "actTab", but currentSiret does not match the emitter siret', () => {
      bsd.type = BsdType.Bsff;
      const currentSiret = "22222222222222";
      const result = isBsffSign(bsd, currentSiret, bsdCurrentTab);
      expect(result).toBe(false);
    });
  });

  describe("isEmetteurSign", () => {
    const bsd: BsdDisplay = {
      bsdWorkflowType: BsdaType.Collection_2710
    } as BsdDisplay;

    it('should return true if isTransporter is true and bsd.bsdWorkflowType is not "synthesis"', () => {
      const isTransporter = true;
      const result = isEmetteurSign(bsd, isTransporter);
      expect(result).toBe(true);
    });

    it("should return false if isTransporter is false", () => {
      const isTransporter = false;
      const result = isEmetteurSign(bsd, isTransporter);
      expect(result).toBe(false);
    });

    it('should return false if isTransporter is true but bsd.bsdWorkflowType is "synthesis"', () => {
      bsd.bsdWorkflowType = BsdasriType.Synthesis;
      const isTransporter = true;
      const result = isEmetteurSign(bsd, isTransporter);
      expect(result).toBe(false);
    });
  });

  describe("isEcoOrgSign", () => {
    const bsd: BsdDisplay = {
      bsdWorkflowType: BsdaType.Collection_2710
    } as BsdDisplay;

    it('should return true if isHolder is true and bsd.bsdWorkflowType is not "synthesis"', () => {
      const isHolder = true;
      const result = isEcoOrgSign(bsd, isHolder);
      expect(result).toBe(true);
    });

    it("should return false if isHolder is false", () => {
      const isHolder = false;
      const result = isEcoOrgSign(bsd, isHolder);
      expect(result).toBe(false);
    });

    it('should return false if isHolder is true but bsd.bsdWorkflowType is "synthesis"', () => {
      bsd.bsdWorkflowType = BsdasriType.Synthesis;
      const isHolder = true;
      const result = isEcoOrgSign(bsd, isHolder);
      expect(result).toBe(false);
    });
  });

  describe("canSkipEmission", () => {
    const bsd: BsdDisplay = {
      ecoOrganisme: {
        name: "eco org",
        siret: "123456789"
      },
      emitter: {},
      emitterType: EmitterType.Appendix1Producer
    } as BsdDisplay;

    it("should return true if bsd.ecoOrganisme.siret is set", () => {
      const result = canSkipEmission(bsd, true, false);
      expect(result).toBe(true);
    });

    it("should return true if isPrivateIndividual is true", () => {
      const bsdPrivateIndividual = {
        ...bsd,
        emitter: { isPrivateIndividual: true }
      };
      const result = canSkipEmission(bsdPrivateIndividual, false, false);
      expect(result).toBe(true);
    });
  });

  describe("getIsNonDraftLabel", () => {
    let bsdCurrentTab: BsdCurrentTab = "actTab";

    it("should return the correct label for Bsda with same transporter siret and private individual and worker disabled", () => {
      const currentSiret = "987654321";
      const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
      const bsd: BsdDisplay = {
        type: BsdType.Bsda,
        worker: { isDisabled: true },
        emitter: { isPrivateIndividual: true },
        transporter: {
          company: { siret: "987654321" }
        }
      } as BsdDisplay;
      const result = getIsNonDraftLabel(
        bsd,
        currentSiret,
        permissions,
        bsdCurrentTab
      );

      expect(result).toBe(SIGNER);
    });

    it("should return the correct label for Bsda Collection_2710 and same siret destination", () => {
      const currentSiret = "987654321";
      const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
      const bsd: BsdDisplay = {
        type: BsdType.Bsda,
        bsdWorkflowType: BsdaType.Collection_2710,
        destination: {
          company: { siret: "987654321" }
        }
      } as BsdDisplay;
      const result = getIsNonDraftLabel(
        bsd,
        currentSiret,
        permissions,
        bsdCurrentTab
      );

      expect(result).toBe(SIGNER);
    });

    it("should return the correct label for bsdasri eco organism", () => {
      const currentSiret = "987654321";
      const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
      const bsd: BsdDisplay = {
        type: BsdType.Bsdasri,
        ecoOrganisme: {
          name: "eco org",
          siret: "987654321"
        },
        emitter: {
          company: { siret: "987654321" }
        },
        destination: {
          company: { siret: "987654321" }
        },
        transporter: {
          company: { siret: "987654321" }
        }
      } as BsdDisplay;
      const result = getIsNonDraftLabel(
        bsd,
        currentSiret,
        permissions,
        bsdCurrentTab
      );

      expect(result).toBe(SIGNATURE_ECO_ORG);
    });

    it("should return the correct label for bsdasri", () => {
      const currentSiret = "987654321";
      const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
      const bsd: BsdDisplay = {
        type: BsdType.Bsdasri,
        emitter: {
          company: { siret: "987654321" }
        },
        destination: {
          company: { siret: "987654321" }
        },
        transporter: {
          company: { siret: "987654321" }
        }
      } as BsdDisplay;
      const result = getIsNonDraftLabel(
        bsd,
        currentSiret,
        permissions,
        bsdCurrentTab
      );

      expect(result).toBe(SIGNER);
    });

    it("should return the correct label for bsdasri in collect tab and same emitter siret and is transporter", () => {
      bsdCurrentTab = "toCollectTab";
      const currentSiret = "987654321";
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignTransport
      ];
      const bsd: BsdDisplay = {
        type: BsdType.Bsdasri,
        emitter: {
          company: { siret: "987654321" }
        },
        transporter: {
          company: { siret: "987654321" }
        },
        bsdWorkflowType: "SYNTHESIS"
      } as BsdDisplay;
      const result = getIsNonDraftLabel(
        bsd,
        currentSiret,
        permissions,
        bsdCurrentTab
      );

      expect(result).toBe(VALIDER_SYNTHESE_LABEL);
    });

    it("should return the correct label for bsff", () => {
      bsdCurrentTab = "toCollectTab";
      const currentSiret = "987654321";
      const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
      const bsd: BsdDisplay = {
        type: BsdType.Bsff,
        emitter: {
          company: { siret: "987654321" }
        }
      } as BsdDisplay;
      const result = getIsNonDraftLabel(
        bsd,
        currentSiret,
        permissions,
        bsdCurrentTab
      );

      expect(result).toBe(SIGNER);
    });

    it("should return the correct label for bsdd", () => {
      const currentSiret = "987654321";
      const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
      const bsd: BsdDisplay = {
        type: BsdType.Bsdd,
        emitter: {
          company: { siret: "987654321" }
        }
      } as BsdDisplay;
      const result = getIsNonDraftLabel(
        bsd,
        currentSiret,
        permissions,
        bsdCurrentTab
      );

      expect(result).toBe(SIGNER);
    });
  });

  describe("getDraftOrInitialBtnLabel", () => {
    const currentSiret = "123456789";
    const bsd: BsdDisplay = {
      isDraft: true
    } as BsdDisplay;

    it("should return the correct label when isDraft is true", () => {
      const bsdCurrentTab: BsdCurrentTab = "draftTab";
      const permissions: UserPermission[] = [UserPermission.BsdCanUpdate];
      const result = getDraftOrInitialBtnLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab
      );
      expect(result).toBe(PUBLIER);
    });

    it("should return the correct label when isDraft is false", () => {
      const bsdCurrentTab: BsdCurrentTab = "actTab";
      const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
      bsd.isDraft = false;
      const result = getDraftOrInitialBtnLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab
      );
      expect(result).toBe(
        getIsNonDraftLabel(bsd, currentSiret, permissions, bsdCurrentTab)
      );
    });
  });

  describe("getSealedBtnLabel", () => {
    const bsd: BsdDisplay = {
      status: BsdStatusCode.Sealed,
      type: BsdType.Bsdd,
      emitter: { company: { siret: "1" } },
      transporter: { company: { siret: "2" } },
      destination: { company: { siret: "3" } },
      ecoOrganisme: { siret: "2" }
    } as BsdDisplay;

    test("returns SIGNER for BSDD type Appendix1Producer with valid conditions", () => {
      const currentSiret = "1234567890";
      const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
      bsd.emitterType = EmitterType.Appendix1Producer;
      bsd.transporter!.company!.siret = "1234567890";
      const result = getSealedBtnLabel(currentSiret, bsd, permissions);
      expect(result).toEqual(SIGNER);
    });

    test("returns SIGNER for BSDD type Producer with valid conditions", () => {
      const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
      bsd.emitterType = EmitterType.Producer;
      bsd.transporter!.company!.siret = "1234567890";
      bsd.emitter!.company!.siret = "1234567890";
      bsd.ecoOrganisme!.siret = "1234567890";
      const currentSiret = "1234567890";
      const result = getSealedBtnLabel(currentSiret, bsd, permissions);
      expect(result).toEqual(SIGNER);
    });

    test("returns FAIRE_SIGNER for BSDD type with valid conditions", () => {
      const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
      bsd.emitterType = EmitterType.Producer;
      bsd.transporter!.company!.siret = "1234567890";
      bsd.emitter!.company!.siret = "1234567898";
      bsd.ecoOrganisme!.siret = "1234567899";
      const currentSiret = "1234567890";
      const result = getSealedBtnLabel(currentSiret, bsd, permissions);
      expect(result).toEqual(FAIRE_SIGNER);
    });

    test("returns SIGNER for Bsda", () => {
      const currentSiret = "1234567890";
      const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
      bsd.type = BsdType.Bsda;
      const result = getSealedBtnLabel(currentSiret, bsd, permissions);
      expect(result).toEqual(SIGNER);
    });

    test("returns SIGNER for Bsvhu", () => {
      const currentSiret = "1234567890";
      const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
      bsd.type = BsdType.Bsvhu;
      const result = getSealedBtnLabel(currentSiret, bsd, permissions);
      expect(result).toEqual(SIGNER);
    });

    test("returns SIGNER for Bsff", () => {
      const currentSiret = "1234567890";
      const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
      bsd.type = BsdType.Bsff;
      const result = getSealedBtnLabel(currentSiret, bsd, permissions);
      expect(result).toEqual(SIGNER);
    });
  });

  describe("getSentBtnLabel", () => {
    it("should return an empty string for BSDD with appendix1 producer", () => {
      const currentSiret = "123456789";
      const permissions: UserPermission[] = [];
      const bsd = {
        type: BsdType.Bsdd,
        emitterType: EmitterType.Appendix1Producer
      } as BsdDisplay;
      const bsdCurrentTab: BsdCurrentTab = "actTab";

      const result = getSentBtnLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab
      );

      expect(result).toEqual("");
    });

    it("should return VALIDER_ENTREPOSAGE_PROVISOIRE for BSDD with temp storage in actTab and same destination siret", () => {
      const currentSiret = "123456789";
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignAcceptation
      ];
      const bsd = {
        type: BsdType.Bsdd,
        destination: { company: { siret: "123456789" } },
        isTempStorage: true
      } as BsdDisplay;
      const bsdCurrentTab: BsdCurrentTab = "actTab";

      const result = getSentBtnLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab
      );

      expect(result).toEqual(VALIDER_ENTREPOSAGE_PROVISOIRE);
    });

    it("should return VALIDER_RECEPTION for BSDD in actTab and same destination siret", () => {
      const currentSiret = "123456789";
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignAcceptation
      ];
      const bsd = {
        type: BsdType.Bsdd,
        isTempStorage: false,
        destination: { company: { siret: "123456789" } }
      } as BsdDisplay;
      const bsdCurrentTab: BsdCurrentTab = "actTab";

      const result = getSentBtnLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab
      );

      expect(result).toEqual(VALIDER_RECEPTION);
    });

    it("should return VALIDER_RECEPTION for BSDASRI in actTab and same destination siret", () => {
      const currentSiret = "123456789";
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignAcceptation
      ];
      const bsd = {
        type: BsdType.Bsdasri,
        isTempStorage: false,
        destination: { company: { siret: "123456789" } }
      } as BsdDisplay;
      const bsdCurrentTab: BsdCurrentTab = "actTab";

      const result = getSentBtnLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab
      );

      expect(result).toEqual(VALIDER_RECEPTION);
    });

    it("should return VALIDER_RECEPTION for BSFF in actTab and same destination siret", () => {
      const currentSiret = "123456789";
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignAcceptation
      ];
      const bsd = {
        type: BsdType.Bsff,
        isTempStorage: false,
        destination: { company: { siret: "123456789" } }
      } as BsdDisplay;
      const bsdCurrentTab: BsdCurrentTab = "actTab";

      const result = getSentBtnLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab
      );

      expect(result).toEqual(VALIDER_RECEPTION);
    });

    it("should return VALIDER_TRAITEMENT for BSDA in actTab and same destination siret", () => {
      const currentSiret = "123456789";
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignOperation
      ];
      const bsd = {
        type: BsdType.Bsda,
        isTempStorage: false,
        destination: { company: { siret: "123456789" } }
      } as BsdDisplay;
      const bsdCurrentTab: BsdCurrentTab = "actTab";

      const result = getSentBtnLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab
      );

      expect(result).toEqual(VALIDER_TRAITEMENT);
    });

    it("should return VALIDER_RECEPTION for BSVHU in actTab and same destination siret", () => {
      const currentSiret = "123456789";
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignOperation
      ];
      const bsd = {
        type: BsdType.Bsvhu,
        isTempStorage: false,
        destination: { company: { siret: "123456789" } }
      } as BsdDisplay;
      const bsdCurrentTab: BsdCurrentTab = "actTab";

      const result = getSentBtnLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab
      );

      expect(result).toEqual(VALIDER_RECEPTION);
    });
  });

  describe("getResentBtnLabel", () => {
    const bsd = {
      type: BsdType.Bsdd,
      temporaryStorageDetail: {
        destination: { company: { siret: "1234567890" } }
      }
    } as BsdDisplay;
    const permissions: UserPermission[] = [
      UserPermission.BsdCanSignAcceptation
    ];
    it('should return the correct label when bsd type is "Bsdd" and siret is same as temporary storage destination', () => {
      const currentSiret = "1234567890";

      const result = getResentBtnLabel(
        currentSiret,
        bsd,
        permissions,
        "actTab"
      );

      expect(result).toEqual(VALIDER_RECEPTION);
    });

    it("should return an empty string when siret is not same as temporary storage destination", () => {
      const currentSiret = "1234567890";
      bsd.temporaryStorageDetail!.destination!.company!.siret = "132456378399";
      const result = getResentBtnLabel(
        currentSiret,
        bsd,
        permissions,
        "actTab"
      );
      expect(result).toEqual("");
    });

    it("should return an empty string when type is not bsdd", () => {
      const currentSiret = "1234567890";
      bsd.type = BsdType.Bsda;
      const result = getResealedBtnLabel(currentSiret, bsd, permissions);
      expect(result).toEqual("");
    });

    it("should return the correct label when current tab is collectedTab and status is RESENT", () => {
      const currentSiret = "1234567890";
      bsd.status = BsdStatusCode.Resent;
      const result = getResentBtnLabel(
        currentSiret,
        bsd,
        permissions,
        "collectedTab"
      );

      expect(result).toEqual(ROAD_CONTROL);
    });

    it("should return the correct label when current tab is collectedTab and status is SENT", () => {
      const currentSiret = "1234567890";
      bsd.status = BsdStatusCode.Sent;
      const result = getResentBtnLabel(
        currentSiret,
        bsd,
        permissions,
        "collectedTab"
      );

      expect(result).toEqual(ROAD_CONTROL);
    });
  });

  describe("getResealedBtnLabel", () => {
    const bsd = {
      type: BsdType.Bsdd,
      destination: { company: { siret: "1234567890" } },
      temporaryStorageDetail: {
        transporter: { company: { siret: "1234567890" } }
      }
    } as BsdDisplay;
    const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
    it('should return the correct label when bsd type is "Bsdd" and siret is same as temporary storage transporter', () => {
      const currentSiret = "1234567890";

      const result = getResealedBtnLabel(currentSiret, bsd, permissions);

      expect(result).toEqual(SIGNER);
    });

    it("should return an empty string when siret is not same as temporary storage transporter", () => {
      const currentSiret = "1234567890";
      bsd.temporaryStorageDetail!.transporter!.company!.siret = "132456378399";
      bsd.destination!.company!.siret = "132456378399";
      const result = getResealedBtnLabel(currentSiret, bsd, permissions);
      expect(result).toEqual("");
    });

    it("should return an empty string when type is not bsdd", () => {
      const currentSiret = "1234567890";
      bsd.type = BsdType.Bsda;
      const result = getResealedBtnLabel(currentSiret, bsd, permissions);
      expect(result).toEqual("");
    });
  });

  describe("getTempStoredBtnLabel", () => {
    const bsd = {
      type: BsdType.Bsdd,
      destination: { company: { siret: "1234567890" } }
    } as BsdDisplay;
    const permissions: UserPermission[] = [
      UserPermission.BsdCanSignAcceptation
    ];
    it('should return the correct label when bsd type is "Bsdd" and siret is same as destination', () => {
      const currentSiret = "1234567890";

      const result = getTempStoredBtnLabel(currentSiret, bsd, permissions);

      expect(result).toEqual(VALIDER_ACCEPTATION_ENTREPOSAGE_PROVISOIRE);
    });

    it("should return an empty string when siret is not same as destination", () => {
      const currentSiret = "1234567890";
      bsd.destination!.company!.siret = "132456378399";
      const result = getTempStoredBtnLabel(currentSiret, bsd, permissions);
      expect(result).toEqual("");
    });

    it("should return an empty string when type is not bsdd", () => {
      const currentSiret = "1234567890";
      bsd.type = BsdType.Bsda;
      const result = getTempStoredBtnLabel(currentSiret, bsd, permissions);
      expect(result).toEqual("");
    });
  });

  describe("getTempStorerAcceptedBtnLabel", () => {
    const bsd = {
      type: BsdType.Bsdd,
      destination: { company: { siret: "1234567890" } }
    } as BsdDisplay;
    const withBsdSuite = {
      type: BsdType.Bsdd,
      destination: { company: { siret: "1234567890" } },
      temporaryStorageDetail: {
        transporter: { company: { siret: "1234567890" } }
      }
    } as BsdDisplay;
    const permissions: UserPermission[] = [
      UserPermission.BsdCanSignOperation,
      UserPermission.BsdCanUpdate
    ];
    it('should return the correct label when bsd type is "Bsdd" and siret is same as destination', () => {
      const currentSiret = "1234567890";
      const result = getTempStorerAcceptedBtnLabel(
        currentSiret,
        bsd,
        permissions
      );

      expect(result).toEqual(VALIDER_TRAITEMENT);
    });

    it("should return the correct label when bsd suite", () => {
      const currentSiret = "1234567890";
      const result = getTempStorerAcceptedBtnLabel(
        currentSiret,
        withBsdSuite,
        permissions
      );

      expect(result).toEqual(completer_bsd_suite);
    });

    it("should return an empty string when siret is not same as destination", () => {
      const currentSiret = "1234567890";
      bsd.destination!.company!.siret = "132456378399";
      const result = getTempStorerAcceptedBtnLabel(
        currentSiret,
        bsd,
        permissions
      );
      expect(result).toEqual("");
    });

    it("should return an empty string when type is not bsdd", () => {
      const currentSiret = "1234567890";
      bsd.type = BsdType.Bsda;
      const result = getTempStorerAcceptedBtnLabel(
        currentSiret,
        bsd,
        permissions
      );
      expect(result).toEqual("");
    });
  });

  describe("getSignTempStorerBtnLabel", () => {
    const bsd = {
      type: BsdType.Bsdd,
      temporaryStorageDetail: {
        transporter: { company: { siret: "1234567890" } }
      }
    } as BsdDisplay;
    const permissions: UserPermission[] = [UserPermission.BsdCanSignEmission];
    it('should return the correct label when bsd type is "Bsdd" and siret is same as transporter', () => {
      const currentSiret = "1234567890";

      const result = getSignTempStorerBtnLabel(currentSiret, bsd, permissions);

      expect(result).toEqual(SIGNER);
    });

    it("should return an empty string when siret is not same as temporary transporter", () => {
      const currentSiret = "1234567890";
      bsd.temporaryStorageDetail!.transporter!.company!.siret = "132456378399";
      const result = getSignTempStorerBtnLabel(currentSiret, bsd, permissions);
      expect(result).toEqual("");
    });

    it("should return an empty string when type is not bsdd", () => {
      const currentSiret = "1234567890";
      bsd.type = BsdType.Bsda;
      const result = getSignTempStorerBtnLabel(currentSiret, bsd, permissions);
      expect(result).toEqual("");
    });
  });

  describe("getReceivedBtnLabel", () => {
    const currentSiret = "123456789";
    const bsd = {
      type: BsdType.Bsdd,
      isTempStorage: false
    } as BsdDisplay;
    const bsdCurrentTab = "actTab";

    it("should return an empty string for bsdd type with appendix1Producer", () => {
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignAcceptation
      ];
      const result = getReceivedBtnLabel(
        currentSiret,
        bsd,
        permissions,
        bsdCurrentTab
      );
      expect(result).toEqual("");
    });

    it("should return VALIDER_ACCEPTATION for bsdd type with same siret temporary storage destination", () => {
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignAcceptation
      ];
      const result = getReceivedBtnLabel(
        currentSiret,
        {
          ...bsd,
          isTempStorage: true,
          temporaryStorageDetail: {
            destination: { company: { siret: "123456789" } }
          }
        },
        permissions,
        bsdCurrentTab
      );
      expect(result).toEqual(VALIDER_ACCEPTATION);
    });

    it("should return VALIDER_ACCEPTATION for bsdd type with same siret destination", () => {
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignAcceptation
      ];
      const result = getReceivedBtnLabel(
        currentSiret,
        {
          ...bsd,
          destination: { company: { siret: "123456789" } }
        },
        permissions,
        bsdCurrentTab
      );
      expect(result).toEqual(VALIDER_ACCEPTATION);
    });

    it("should return VALIDER_TRAITEMENT for bsda type", () => {
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignOperation
      ];
      const result = getReceivedBtnLabel(
        currentSiret,
        { ...bsd, type: BsdType.Bsda },
        permissions,
        bsdCurrentTab
      );
      expect(result).toEqual(VALIDER_TRAITEMENT);
    });

    it("should return VALIDER_TRAITEMENT for bsvhu type", () => {
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignOperation
      ];
      const result = getReceivedBtnLabel(
        currentSiret,
        { ...bsd, type: BsdType.Bsvhu },
        permissions,
        bsdCurrentTab
      );
      expect(result).toEqual(VALIDER_TRAITEMENT);
    });

    it("should return SIGNATURE_ACCEPTATION_CONTENANT for bsff type with actTab and same siret destination", () => {
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignOperation
      ];
      const result = getReceivedBtnLabel(
        currentSiret,
        {
          ...bsd,
          type: BsdType.Bsff,
          destination: { company: { siret: "123456789" } }
        },
        permissions,
        bsdCurrentTab
      );
      expect(result).toEqual(SIGNATURE_ACCEPTATION_CONTENANT);
    });

    it("should return VALIDER_TRAITEMENT for bsdasri type with actTab and same siret destination", () => {
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignOperation
      ];
      const result = getReceivedBtnLabel(
        currentSiret,
        {
          ...bsd,
          type: BsdType.Bsdasri,
          destination: { company: { siret: "123456789" } }
        },
        permissions,
        bsdCurrentTab
      );
      expect(result).toEqual(VALIDER_TRAITEMENT);
    });
  });

  describe("getSignByProducerBtnLabel", () => {
    const bsd: BsdDisplay = {
      type: BsdType.Bsdd,
      transporter: {
        company: {
          orgId: "currentSiret"
        }
      },
      worker: {
        isDisabled: true
      }
    } as BsdDisplay;

    it("should return SIGNER when currentSiret is same as transporter and bsd type is bsdd", () => {
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignTransport
      ];
      const result = getSignByProducerBtnLabel(
        "currentSiret",
        {
          ...bsd,
          transporter: {
            ...bsd.transporter,
            company: { siret: "currentSiret" }
          }
        },
        permissions,
        "toCollectTab"
      );
      expect(result).toEqual(SIGNER);
    });

    it("should return SIGNER when currentSiret is same as transporter and bsd type is bsdasri but not synthesis workflow type", () => {
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignTransport
      ];
      const result = getSignByProducerBtnLabel(
        "currentSiret",
        {
          ...bsd,
          type: BsdType.Bsdasri,
          bsdWorkflowType: BsdasriType.Simple,
          transporter: { company: { siret: "currentSiret" } }
        },
        permissions,
        "actTab"
      );
      expect(result).toEqual(SIGNER);
    });

    it("should return SIGNER when currentSiret is same as transporter, bsd type is bsda, there is no worker and bsd workflow type is gathering", () => {
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignTransport
      ];
      const result = getSignByProducerBtnLabel(
        "currentSiret",
        {
          ...bsd,
          type: BsdType.Bsda,
          bsdWorkflowType: BsdaType.Gathering,
          transporter: {
            company: { siret: "currentSiret", orgId: "currentSiret" }
          }
        },
        permissions,
        "actTab"
      );
      expect(result).toEqual(SIGNER);
    });

    it("should return SIGNER when currentSiret is same as worker, bsd type is bsda, and bsd workflow type is gathering", () => {
      const permissions: UserPermission[] = [UserPermission.BsdCanSignWork];
      const result = getSignByProducerBtnLabel(
        "currentSiret",
        {
          ...bsd,
          type: BsdType.Bsda,
          bsdWorkflowType: BsdaType.Gathering,
          transporter: {
            company: { siret: "otherSiret", orgId: "otherSiret" }
          },

          worker: {
            ...bsd.worker,
            isDisabled: false,
            company: {
              siret: "currentSiret"
            }
          }
        },
        permissions,
        "actTab"
      );
      expect(result).toEqual(SIGNER);
    });

    it("should return SIGNER when currentSiret is same as worker and transporter, bsd type is bsda, and bsd workflow type is gathering", () => {
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignTransport,
        UserPermission.BsdCanSignWork
      ];
      const result = getSignByProducerBtnLabel(
        "currentSiret",
        {
          ...bsd,
          type: BsdType.Bsda,
          bsdWorkflowType: BsdaType.Gathering,
          transporter: {
            company: { siret: "currentSiret", orgId: "currentSiret" }
          },

          worker: {
            ...bsd.worker,
            isDisabled: false,
            company: {
              siret: "currentSiret"
            }
          }
        },
        permissions,
        "actTab"
      );
      expect(result).toEqual(SIGNER);
    });

    it("should return an empty string when currentSiret is same as transporter, bsd type is bsda, there is a worker, and bsd workflow type is gathering", () => {
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignTransport,
        UserPermission.BsdCanSignWork
      ];
      const result = getSignByProducerBtnLabel(
        "currentSiret",
        {
          ...bsd,
          type: BsdType.Bsda,
          bsdWorkflowType: BsdaType.Gathering,
          transporter: {
            company: { siret: "currentSiret", orgId: "currentSiret" }
          },

          worker: {
            ...bsd.worker,
            isDisabled: false,
            company: {
              siret: "otherSiret"
            }
          }
        },
        permissions,
        "actTab"
      );
      expect(result).toEqual("");
    });

    it("should return SIGNER when bsd type is bsvhu", () => {
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignTransport
      ];
      const result = getSignByProducerBtnLabel(
        "currentSiret",
        {
          ...bsd,
          type: BsdType.Bsvhu,
          transporter: { company: { siret: "currentSiret" } }
        },
        permissions,
        "actTab"
      );
      expect(result).toEqual(SIGNER);
    });

    it("should return an empty string when currentSiret is not same as transporter and bsd type is bsdasri and current tab is not toCollectTab", () => {
      const permissions: UserPermission[] = [
        UserPermission.BsdCanSignTransport
      ];
      const result = getSignByProducerBtnLabel(
        "currentSirett",
        {
          ...bsd,
          type: BsdType.Bsdasri
        },
        permissions,
        "actTab"
      );
      expect(result).toEqual("");
    });

    it("should return SIGNER when currentSiret is same as worker company siret", () => {
      const permissions: UserPermission[] = [UserPermission.BsdCanSignWork];
      const result = getSignByProducerBtnLabel(
        "currentSiret",
        {
          ...bsd,
          type: BsdType.Bsda,
          worker: {
            ...bsd.worker,
            isDisabled: false,
            company: {
              siret: "currentSiret"
            }
          }
        },
        permissions,
        "toCollectTab"
      );
      expect(result).toEqual(SIGNER);
    });

    it("should return an empty string when none of the conditions are met", () => {
      const permissions: UserPermission[] = [];
      const result = getSignByProducerBtnLabel(
        "someOtherSiret",
        bsd,
        permissions,
        "draftTab"
      );
      expect(result).toEqual("");
    });
  });

  describe("canPublishBsd", () => {
    it("should return false for BSDASRI in draft mode without grouping data", () => {
      const bsd = {
        type: BsdType.Bsdasri,
        isDraft: true,
        bsdWorkflowType: BsdasriType.Grouping,
        synthesizing: null,
        grouping: null
      } as BsdDisplay;
      const currentSiret = "123456789";

      const result = canPublishBsd(bsd, currentSiret);

      expect(result).toBe(false);
    });

    it("should return true for BSDASRI in draft mode with grouping  data", () => {
      const bsd = {
        type: BsdType.Bsdasri,
        isDraft: true,
        bsdWorkflowType: BsdasriType.Grouping,
        grouping: [
          {
            id: "DASRI-20220624-CM1W0KN47",
            __typename: "InitialBsdasri"
          },
          {
            id: "DASRI-20220816-K1VSMNY2J",
            __typename: "InitialBsdasri"
          }
        ],
        synthesizing: null
      } as BsdDisplay;
      const currentSiret = "123456789";

      const result = canPublishBsd(bsd, currentSiret);

      expect(result).toBe(true);
    });

    it("should return true for BSFF in draft mode with current siret matching transporter siret", () => {
      const bsd = {
        type: BsdType.Bsff,
        isDraft: true,
        emitter: {
          company: { siret: "123456789" }
        },
        transporter: {
          company: { siret: "987654321" }
        },
        destination: {
          company: { siret: "555555555" }
        }
      } as BsdDisplay;
      const currentSiret = "987654321";

      const result = canPublishBsd(bsd, currentSiret);

      expect(result).toBe(true);
    });
  });

  describe("getWorkflowLabel", () => {
    it("should return correct label for BsdaType.Gathering", () => {
      const bsdWorkflowType = BsdaType.Gathering;

      const result = getWorkflowLabel(bsdWorkflowType);

      expect(result).toBe(WorkflowDisplayType.GRP);
    });

    it("should return correct label for BsdaType.Reshipment", () => {
      const bsdWorkflowType = BsdaType.Reshipment;

      const result = getWorkflowLabel(bsdWorkflowType);

      expect(result).toBe(WorkflowDisplayType.REEXPEDITION);
    });

    it("should return correct label for BsdasriType.Grouping", () => {
      const bsdWorkflowType = BsdasriType.Grouping;

      const result = getWorkflowLabel(bsdWorkflowType);

      expect(result).toBe(WorkflowDisplayType.GRP);
    });

    it("should return correct label for BsdasriType.Synthesis", () => {
      const bsdWorkflowType = BsdasriType.Synthesis;

      const result = getWorkflowLabel(bsdWorkflowType);

      expect(result).toBe(WorkflowDisplayType.SYNTH);
    });

    it("should return correct label for BsffType.Groupement", () => {
      const bsdWorkflowType = BsffType.Groupement;

      const result = getWorkflowLabel(bsdWorkflowType);

      expect(result).toBe(WorkflowDisplayType.REGROUPEMENT);
    });

    it("should return correct label for BsffType.Reexpedition", () => {
      const bsdWorkflowType = BsffType.Reexpedition;

      const result = getWorkflowLabel(bsdWorkflowType);

      expect(result).toBe(WorkflowDisplayType.REEXPEDITION);
    });

    it("should return correct label for EmitterType.Appendix2", () => {
      const bsdWorkflowType = EmitterType.Appendix2;

      const result = getWorkflowLabel(bsdWorkflowType);

      expect(result).toBe(WorkflowDisplayType.ANNEXE_2);
    });

    it("should return correct label for EmitterType.Appendix1", () => {
      const bsdWorkflowType = EmitterType.Appendix1;

      const result = getWorkflowLabel(bsdWorkflowType);

      expect(result).toBe(WorkflowDisplayType.TOURNEE);
    });

    it("should return correct label for EmitterType.Appendix1Producer", () => {
      const bsdWorkflowType = EmitterType.Appendix1Producer;

      const result = getWorkflowLabel(bsdWorkflowType);

      expect(result).toBe(WorkflowDisplayType.ANNEXE_1);
    });
  });

  describe("canReviewBsdd", () => {
    it("should return false if bsd is not BSDD", async () => {
      const siret = "123";
      const bsdd = {
        type: BsdType.Bsda,
        status: BsdStatusCode.Processed,
        emitter: { company: { siret } }
      };
      expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(false);
    });

    it.each([BsdStatusCode.Draft, BsdStatusCode.Sealed, BsdStatusCode.Refused])(
      "should not be possible to revise a BSDD when its status is %p",
      status => {
        const siret = "123";
        const bsdd = {
          type: BsdType.Bsdd,
          emitter: { company: { siret } },
          status
        };
        expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(false);
      }
    );

    it.each([
      EmitterType.Producer,
      EmitterType.Other,
      EmitterType.Appendix1,
      EmitterType.Appendix2
    ])(
      "should be possible for emitter to revise a BSDD when emitter type is %p",
      emitterType => {
        const siret = "123";
        const bsdd = {
          type: BsdType.Bsdd,
          emitterType,
          status: BsdStatusCode.Processed,
          emitter: { company: { siret } }
        };
        expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(true);
      }
    );

    it.each([
      EmitterType.Producer,
      EmitterType.Other,
      EmitterType.Appendix1,
      EmitterType.Appendix2
    ])(
      "should be possible for destination to revise a BSDD when emitter type is %p",
      emitterType => {
        const siret = "123";
        const bsdd = {
          type: BsdType.Bsdd,
          emitterType,
          status: BsdStatusCode.Processed,
          destination: { company: { siret } }
        };
        expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(true);
      }
    );

    it.each([
      EmitterType.Producer,
      EmitterType.Other,
      EmitterType.Appendix1,
      EmitterType.Appendix2
    ])(
      "should be possible for eco-organisme to revise a BSDD when emitter type is %p",
      emitterType => {
        const siret = "123";
        const bsdd = {
          type: BsdType.Bsdd,
          emitterType,
          status: BsdStatusCode.Processed,
          ecoOrganisme: { siret, name: "ÉCO-ORG" }
        };
        expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(true);
      }
    );

    it.each([EmitterType.Producer, EmitterType.Other, EmitterType.Appendix2])(
      "should be possible for final destination after temp storage to revise a BSDD when emitter type is %p",
      emitterType => {
        const siret = "123";
        const bsdd = {
          type: BsdType.Bsdd,
          emitterType,
          status: BsdStatusCode.Processed,
          isTempStorage: true,
          temporaryStorageDetail: { destination: { company: { siret } } }
        };
        expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(true);
      }
    );

    it("should not be possible for a trader to revise a BSDD", async () => {
      const siret = "123";
      const bsdd = {
        type: BsdType.Bsdd,
        emitterType: EmitterType.Producer,
        status: BsdStatusCode.Processed,
        trader: { company: { siret } }
      };
      expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(false);
    });

    it("should not be possible for a broker to revise a BSDD", async () => {
      const siret = "123";
      const bsdd = {
        type: BsdType.Bsdd,
        emitterType: EmitterType.Producer,
        status: BsdStatusCode.Processed,
        broker: { company: { siret } }
      };
      expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(false);
    });

    it("should not be possible for an intermediary to revise a BSDD", async () => {
      const siret = "123";
      const bsdd = {
        type: BsdType.Bsdd,
        emitterType: EmitterType.Producer,
        status: BsdStatusCode.Processed,
        intermediaries: [{ siret }]
      };
      expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(false);
    });

    it("should be possible for destination to revise a BSDD when status is SIGNED_BY_PRODUCER", async () => {
      const siret = "123";
      const bsdd = {
        type: BsdType.Bsdd,
        emitterType: EmitterType.Producer,
        status: BsdStatusCode.SignedByProducer,
        destination: { company: { siret } }
      };
      expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(true);
    });

    it("should not be possible for emitter to revise a BSDD when status is SIGNED_BY_PRODUCER", async () => {
      const siret = "123";
      const bsdd = {
        type: BsdType.Bsdd,
        emitterType: EmitterType.Producer,
        status: BsdStatusCode.SignedByProducer,
        emitter: { company: { siret } }
      };
      expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(false);
    });

    it("should be possible for emitter to review an APPENDIX_1_PRODUCER bsdd after transporter signature", async () => {
      const siret = "123";
      const bsdd = {
        type: BsdType.Bsdd,
        emitterType: EmitterType.Appendix1Producer,
        status: BsdStatusCode.Sent,
        emitter: { company: { siret } }
      };
      expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(true);
    });

    it("should be possible for transporter to review an APPENDIX_1_PRODUCER bsdd after transporter signature", async () => {
      const siret = "123";
      const bsdd = {
        type: BsdType.Bsdd,
        emitterType: EmitterType.Appendix1Producer,
        status: BsdStatusCode.Sent,
        transporter: { company: { siret } }
      };
      expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(true);
    });

    it("should be possible for foreign transporter to review an APPENDIX_1_PRODUCER bsdd after transporter signature", async () => {
      const vatNumber = "123";
      const bsdd = {
        type: BsdType.Bsdd,
        emitterType: EmitterType.Appendix1Producer,
        status: BsdStatusCode.Sent,
        transporter: { company: { vatNumber, orgId: vatNumber } }
      };
      expect(canReviewBsdd(bsdd as BsdDisplay, vatNumber)).toEqual(true);
    });

    it("should not be possible for emitter to review an APPENDIX_1_PRODUCER bsdd before transporter signature", async () => {
      const siret = "123";
      const bsdd = {
        type: BsdType.Bsdd,
        emitterType: EmitterType.Appendix1Producer,
        status: BsdStatusCode.SignedByProducer,
        emitter: { company: { siret } }
      };
      expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(false);
    });

    it("should not be possible for transporter to review an APPENDIX_1_PRODUCER bsdd before transporter signature", async () => {
      const siret = "123";
      const bsdd = {
        type: BsdType.Bsdd,
        emitterType: EmitterType.Appendix1Producer,
        status: BsdStatusCode.SignedByProducer,
        transporter: { company: { siret } }
      };
      expect(canReviewBsdd(bsdd as BsdDisplay, siret)).toEqual(false);
    });
  });

  describe("canMakeCorrection", () => {
    const currentSiret = "123456789";
    const bsd = {
      type: BsdType.Bsff,
      destination: { company: { siret: currentSiret } },
      status: BsdStatusCode.Processed,
      packagings: [
        { operation: { signature: { date: new Date().toISOString() } } },
        { operation: { signature: { date: new Date().toISOString() } } }
      ]
    } as any as BsdDisplay;

    it("should return true if bsd type is BSFF, status is Processed, and within 60 days of last operation", () => {
      const result = canMakeCorrection(bsd, currentSiret);
      expect(result).toBe(true);
    });

    it("should return true if bsd type is BSFF, status is Refused, and within 60 days of refusal", () => {
      const result = canMakeCorrection(
        {
          ...bsd,
          status: BsdStatusCode.Refused,
          packagings: [
            {
              acceptation: { signature: { date: new Date().toISOString() } }
            } as BsffPackaging
          ]
        },
        currentSiret
      );
      expect(result).toBe(true);
    });

    it("should return false if bsd type is not BSFF", () => {
      const result = canMakeCorrection(
        { ...bsd, type: BsdType.Bsda },
        currentSiret
      );
      expect(result).toBe(false);
    });

    it("should return false if status is not Processed or IntermediatelyProcessed", () => {
      const result = canMakeCorrection(
        { ...bsd, status: BsdStatusCode.Sent },
        currentSiret
      );
      expect(result).toBe(false);
    });

    it("should return false if currentSiret does not match destination siret", () => {
      const result = canMakeCorrection(
        { ...bsd, destination: { company: { siret: "987654321" } } },
        currentSiret
      );
      expect(result).toBe(false);
    });

    it.skip("should return false if more than 60 days have passed since the last operation", () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 61);
      const result = canMakeCorrection(
        {
          ...bsd,
          packagings: [
            {
              operation: { signature: { date: oldDate.toISOString() } }
            } as BsffPackaging,
            {
              operation: { signature: { date: oldDate.toISOString() } }
            } as BsffPackaging
          ]
        },
        currentSiret
      );
      expect(result).toBe(false);
    });

    it(
      "should return false if status is IntermediatelyProcessed and all packagings are" +
        "included in a bsd suite",
      () => {
        const result = canMakeCorrection(
          {
            ...bsd,
            status: BsdStatusCode.IntermediatelyProcessed,
            packagings: [
              {
                operation: { signature: { date: new Date().toISOString() } },
                nextBsff: { id: "FF" }
              } as BsffPackaging,
              {
                operation: { signature: { date: new Date().toISOString() } },
                nextBsff: { id: "FF" }
              } as BsffPackaging
            ]
          },
          currentSiret
        );
        expect(result).toBe(false);
      }
    );
  });

  describe("canReviewBsda", () => {
    it("should return false if bsd is not BSDA", async () => {
      const siret = "123";
      const bsda = {
        type: BsdType.Bsdd,
        status: BsdStatusCode.Processed,
        emitter: { company: { siret } }
      };
      expect(canReviewBsda(bsda as BsdDisplay, siret)).toEqual(false);
    });

    it("should not be possible to revise a BSDA when its status is Initial", () => {
      const siret = "123";
      const bsda = {
        type: BsdType.Bsda,
        emitter: { company: { siret } },
        status: BsdStatusCode.Initial
      };
      expect(canReviewBsda(bsda as BsdDisplay, siret)).toEqual(false);
    });

    it("should be possible for worker to revise a BSDA", () => {
      const siret = "123";
      const bsda = {
        type: BsdType.Bsda,
        worker: { company: { siret } },
        status: BsdStatusCode.Processed
      };
      expect(canReviewBsda(bsda as BsdDisplay, siret)).toEqual(true);
    });

    it("should be possible for destination to revise a BSDA", () => {
      const siret = "123";
      const bsda = {
        type: BsdType.Bsda,
        destination: { company: { siret } },
        status: BsdStatusCode.Processed
      };
      expect(canReviewBsda(bsda as BsdDisplay, siret)).toEqual(true);
    });

    it("should be possible for emitter to revise a BSDA", () => {
      const siret = "123";
      const bsda = {
        type: BsdType.Bsda,
        emitter: { company: { siret } },
        status: BsdStatusCode.Processed
      };
      expect(canReviewBsda(bsda as BsdDisplay, siret)).toEqual(true);
    });

    it("should be possible for worker to revise a BSDA before transporter's signature", () => {
      const siret = "123";
      const bsda = {
        type: BsdType.Bsda,
        worker: { company: { siret } },
        status: BsdStatusCode.SignedByProducer
      };
      expect(canReviewBsda(bsda as BsdDisplay, siret)).toEqual(true);
    });

    it("should be possible for destination to revise a BSDA before transporter's signature", () => {
      const siret = "123";
      const bsda = {
        type: BsdType.Bsda,
        destination: { company: { siret } },
        status: BsdStatusCode.SignedByProducer
      };
      expect(canReviewBsda(bsda as BsdDisplay, siret)).toEqual(true);
    });

    it("should be possible for emitter to revise a BSDA before transporter's signature", () => {
      const siret = "123";
      const bsda = {
        type: BsdType.Bsda,
        emitter: { company: { siret } },
        status: BsdStatusCode.SignedByProducer
      };
      expect(canReviewBsda(bsda as BsdDisplay, siret)).toEqual(false);
    });
  });

  describe("canReviewBsdasri", () => {
    it("should return false if bsd is not BSDASRI", async () => {
      const siret = "123";
      const bsdasri = {
        type: BsdType.Bsdd,
        status: BsdStatusCode.Processed,
        emitter: { company: { siret } }
      };
      expect(canReviewBsdasri(bsdasri as BsdDisplay, siret)).toEqual(false);
    });

    it("should not be possible to revise a BSDASRI when its status is Initial", () => {
      const siret = "123";
      const bsdasri = {
        type: BsdType.Bsdasri,
        emitter: { company: { siret } },
        status: BsdStatusCode.Initial
      };
      expect(canReviewBsdasri(bsdasri as BsdDisplay, siret)).toEqual(false);
    });

    it("should not be possible to revise a synthesis BSDASRI at status RECEIVED", () => {
      const siret = "123";
      const bsdasri = {
        bsdWorkflowType: BsdasriType.Synthesis,
        type: BsdType.Bsdasri,
        emitter: { company: { siret } },
        status: BsdStatusCode.Received
      };
      expect(canReviewBsdasri(bsdasri as BsdDisplay, siret)).toEqual(false);
    });

    it("should not be possible to revise a BSDASRI that is grouped in another one", () => {
      const siret = "123";
      const bsdasri = {
        type: BsdType.Bsdasri,
        emitter: { company: { siret } },
        status: BsdStatusCode.AwaitingGroup,
        groupedIn: { id: "" }
      };
      expect(canReviewBsdasri(bsdasri as BsdDisplay, siret)).toEqual(false);
    });

    it("should not be possible to revise a BSDASRI that is synthesized in another one", () => {
      const siret = "123";
      const bsdasri = {
        type: BsdType.Bsdasri,
        emitter: { company: { siret } },
        status: BsdStatusCode.Sent,
        synthesizedIn: { id: "" }
      };
      expect(canReviewBsdasri(bsdasri as BsdDisplay, siret)).toEqual(false);
    });

    it("should be possible for emitter to revise a BSDASRI", () => {
      const siret = "123";
      const bsdasri = {
        type: BsdType.Bsdasri,
        emitter: { company: { siret } },
        status: BsdStatusCode.Processed
      };
      expect(canReviewBsdasri(bsdasri as BsdDisplay, siret)).toEqual(true);
    });

    it("should be possible for destination to revise a BSDASRI", () => {
      const siret = "123";
      const bsdasri = {
        type: BsdType.Bsdasri,
        destination: { company: { siret } },
        status: BsdStatusCode.Processed
      };
      expect(canReviewBsdasri(bsdasri as BsdDisplay, siret)).toEqual(true);
    });

    it("should be possible for destination to revise a BSDASRI", () => {
      const siret = "123";
      const bsdasri = {
        type: BsdType.Bsdasri,
        destination: { company: { siret } },
        status: BsdStatusCode.Processed
      };
      expect(canReviewBsdasri(bsdasri as BsdDisplay, siret)).toEqual(true);
    });

    it("should be possible for eco-organisme to revise a BSDASRI", () => {
      const siret = "123";
      const bsdasri = {
        type: BsdType.Bsdasri,
        ecoOrganisme: { siret },
        status: BsdStatusCode.Processed
      };
      expect(canReviewBsdasri(bsdasri as BsdDisplay, siret)).toEqual(true);
    });

    it("should not be possible for emitter to revise a BSDASRI before transporter signature", () => {
      const siret = "123";
      const bsdasri = {
        type: BsdType.Bsdasri,
        status: BsdStatusCode.SignedByProducer,
        emitter: { company: { siret } }
      };
      expect(canReviewBsdasri(bsdasri as BsdDisplay, siret)).toEqual(false);
    });
  });

  describe("isSignTransportCanSkipEmission", () => {
    const currentSiret = "123456789";
    const bsd = {
      emitterType: "APPENDIX1_PRODUCER",
      emitter: { isPrivateIndividual: false },
      transporter: { company: { siret: "123456789" } },
      ecoOrganisme: { siret: "1" }
    } as BsdDisplay;

    it("returns true if can Skip Emission and is Same Siret Transporter", () => {
      const result = isSignTransportCanSkipEmission(
        currentSiret,
        bsd,
        true,
        false
      );

      expect(result).toBe(true);
    });

    it("returns false if cannot Skip Emission", () => {
      const result = isSignTransportCanSkipEmission(
        currentSiret,
        {
          ...bsd,
          ecoOrganisme: null,
          emitter: { isPrivateIndividual: false }
        },
        false,
        false
      );

      expect(result).toBe(false);
    });

    it("returns false if not is Same Siret Transporter", () => {
      const result = isSignTransportCanSkipEmission(
        currentSiret,
        {
          ...bsd,
          transporter: { company: { siret: "2" } }
        },
        false,
        false
      );

      expect(result).toBe(false);
    });
  });

  describe("getOperationCodesFromSearchString", () => {
    it("returns operation codes from search string", () => {
      const searchString = "r15 R 13 d13 d 15 peoropzie 23326783 D 15";
      const operationCodes = getOperationCodesFromSearchString(searchString);

      expect(operationCodes).toStrictEqual([
        "R 13",
        "R13",
        "D 15",
        "D15",
        "D 15",
        "D15",
        "R15",
        "R 15",
        "D13",
        "D 13"
      ]);
    });

    it("returns empty array on bad formatted string", () => {
      const searchString = "peoropzie 23326783";
      const operationCodes = getOperationCodesFromSearchString(searchString);

      expect(operationCodes).toStrictEqual([]);
    });
  });

  describe("isSiretActorForBsd", () => {
    const bsda: BsdDisplay = {
      type: BsdType.Bsda,
      bsdWorkflowType: BsdaType.Collection_2710,
      emitter: {
        isPrivateIndividual: true
      },
      transporter: {
        company: { siret: "11111111111111" }
      },
      worker: {
        isDisabled: true
      }
    } as BsdDisplay;

    it("should return false if testing for a wrong siret", () => {
      const currentSiret = "555555555";
      const result = isSiretActorForBsd(bsda, currentSiret, [
        { type: ActorType.Transporter }
      ]);
      expect(result).toBe(false);
    });

    it("should return true if testing for Transporter, non-strict", () => {
      const currentSiret = "11111111111111";
      const result = isSiretActorForBsd(bsda, currentSiret, [
        { type: ActorType.Transporter }
      ]);
      expect(result).toBe(true);
    });

    it("should return true if testing for Transporter, strict", () => {
      const currentSiret = "11111111111111";
      const result = isSiretActorForBsd(bsda, currentSiret, [
        { type: ActorType.Transporter, strict: true }
      ]);
      expect(result).toBe(true);
    });

    const bsff = {
      type: BsdType.Bsff,
      isDraft: true,
      emitter: {
        company: { siret: "555555555" }
      },
      transporter: {
        company: { siret: "987654321" }
      },
      destination: {
        company: { siret: "555555555" }
      }
    } as BsdDisplay;

    it("should return true if testing for Destination, non-strict", () => {
      const currentSiret = "555555555";
      const result = isSiretActorForBsd(bsff, currentSiret, [
        { type: ActorType.Destination }
      ]);
      expect(result).toBe(true);
    });

    it("should return false if testing for Destination, strict", () => {
      const currentSiret = "555555555";
      const result = isSiretActorForBsd(bsff, currentSiret, [
        { type: ActorType.Destination, strict: true }
      ]);
      expect(result).toBe(false);
    });

    const bsd: BsdDisplay = {
      status: BsdStatusCode.Sealed,
      type: BsdType.Bsdd,
      emitter: { company: { siret: "1" } },
      transporter: { company: { siret: "2" } },
      broker: { company: { siret: "4" } },
      trader: { company: { siret: "5" } },
      intermediaries: [{ siret: "6" }],
      destination: { company: { siret: "3" } },
      ecoOrganisme: { siret: "2" }
    } as BsdDisplay;

    it("should return true if testing for Intermediary, strict", () => {
      const currentSiret = "6";
      const result = isSiretActorForBsd(bsd, currentSiret, [
        { type: ActorType.Intermediary }
      ]);
      expect(result).toBe(true);
    });

    it("should return false if testing for Broker with wrong siret, strict", () => {
      const currentSiret = "6";
      const result = isSiretActorForBsd(bsd, currentSiret, [
        { type: ActorType.Broker }
      ]);
      expect(result).toBe(false);
    });

    it("should return true if testing for EcoOrganisme, non-strict", () => {
      const currentSiret = "2";
      const result = isSiretActorForBsd(bsd, currentSiret, [
        { type: ActorType.EcoOrganisme }
      ]);
      expect(result).toBe(true);
    });

    it("should return false if testing for EcoOrganisme, strict", () => {
      const currentSiret = "2";
      const result = isSiretActorForBsd(bsd, currentSiret, [
        { type: ActorType.EcoOrganisme, strict: true }
      ]);
      expect(result).toBe(false);
    });

    it("should return true if testing for multiple, non-strict", () => {
      const currentSiret = "2";
      const result = isSiretActorForBsd(bsd, currentSiret, [
        { type: ActorType.Transporter },
        { type: ActorType.EcoOrganisme }
      ]);
      expect(result).toBe(true);
    });
  });

  describe("hasRoadControlButton", () => {
    it("should return true if isReturnTab", () => {
      // When
      const result = hasRoadControlButton({} as BsdDisplay, false, true);

      // Then
      expect(result).toBeTruthy();
    });
  });

  describe("getPrimaryActionsLabelFromBsdStatus", () => {
    it("should return ROAD_CONTROL if isReturnTab", () => {
      // When
      const result = getPrimaryActionsLabelFromBsdStatus(
        {} as BsdDisplay,
        "any-siret",
        [],
        "returnTab"
      );

      // Then
      expect(result).toBe(ROAD_CONTROL);
    });
  });
});
