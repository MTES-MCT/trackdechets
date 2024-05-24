import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  userFactory
} from "../../__tests__/factories";
import { formToBsdd } from "../compat";
import { toAllWaste, toOutgoingWaste } from "../registry";
import { prisma } from "@td/prisma";
import { RegistryFormInclude } from "../../registry/elastic";
import { resetDatabase } from "../../../integration-tests/helper";

describe("toOutgoingWaste", () => {
  afterAll(resetDatabase);

  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const user = await userFactory();
      const finalForm1 = await formFactory({ ownerId: user.id });
      const finalForm2 = await formFactory({ ownerId: user.id });
      const finalForm3 = await formFactory({ ownerId: user.id });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          finalOperations: {
            createMany: {
              data: [
                {
                  finalFormId: finalForm1.id,
                  operationCode: "R 1",
                  noTraceability: false,
                  quantity: 1
                },
                {
                  finalFormId: finalForm2.id,
                  operationCode: "R 2",
                  noTraceability: false,
                  quantity: 2
                },
                {
                  finalFormId: finalForm3.id,
                  operationCode: "D 13",
                  noTraceability: true,
                  quantity: 3
                }
              ]
            }
          }
        }
      });
      const formForRegistry = await prisma.form.findUniqueOrThrow({
        where: { id: form.id },
        include: RegistryFormInclude
      });
      const waste = toOutgoingWaste(formToBsdd(formForRegistry));
      expect(waste.destinationFinalOperationCodes).toStrictEqual([
        "R 1",
        "R 2",
        "D 13"
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([1, 2, 3]);
    }
  );

  it("bsd with bsd-suite should mention post-temp-storage destination", async () => {
    // Given
    const user = await userFactory();
    const emitter = await companyFactory({ name: "Emitter" });
    const recipient = await companyFactory({ name: "Recipient" });
    const nextDestination = await companyFactory({ name: "Next destination" });
    const forwardedInNextDestination = await companyFactory({
      name: "ForwardedIn next destination",
      address: "25 rue Voltaire 37100 TOURS"
    });
    const form = await formWithTempStorageFactory({
      opt: {
        emitterCompanyName: emitter.name,
        emitterCompanySiret: emitter.siret,
        recipientCompanyName: recipient.name,
        recipientCompanySiret: recipient.siret,
        nextDestinationCompanyName: nextDestination.name,
        nextDestinationCompanySiret: nextDestination.siret
      },
      ownerId: user.id,
      forwardedInOpts: {
        recipientCompanyName: forwardedInNextDestination.name,
        recipientCompanySiret: forwardedInNextDestination.siret,
        recipientCompanyAddress: forwardedInNextDestination.address
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });

    const formToBsdd_ = await formToBsdd(formForRegistry);
    const waste = toOutgoingWaste(formToBsdd_);

    // Then
    expect(waste.postTempStorageDestinationSiret).toBe(
      forwardedInNextDestination.siret
    );
    expect(waste.postTempStorageDestinationName).toBe(
      "ForwardedIn next destination"
    );

    // Address
    expect(waste.postTempStorageDestinationAddress).toBe("25 rue Voltaire");
    expect(waste.postTempStorageDestinationCity).toBe("TOURS");
    expect(waste.postTempStorageDestinationPostalCode).toBe("37100");
  });
});

describe("toAllWaste", () => {
  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const user = await userFactory();
      const finalForm1 = await formFactory({ ownerId: user.id });
      const finalForm2 = await formFactory({ ownerId: user.id });
      const finalForm3 = await formFactory({ ownerId: user.id });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          finalOperations: {
            createMany: {
              data: [
                {
                  finalFormId: finalForm1.id,
                  operationCode: "R 1",
                  noTraceability: false,
                  quantity: 1
                },
                {
                  finalFormId: finalForm2.id,
                  operationCode: "R 2",
                  noTraceability: false,
                  quantity: 2
                },
                {
                  finalFormId: finalForm3.id,
                  operationCode: "D 13",
                  noTraceability: true,
                  quantity: 3
                }
              ]
            }
          }
        }
      });
      const formForRegistry = await prisma.form.findUniqueOrThrow({
        where: { id: form.id },
        include: RegistryFormInclude
      });
      const waste = toAllWaste(formToBsdd(formForRegistry));
      expect(waste.destinationFinalOperationCodes).toStrictEqual([
        "R 1",
        "R 2",
        "D 13"
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([1, 2, 3]);
    }
  );

  it("bsd with bsd-suite should mention post-temp-storage destination", async () => {
    // Given
    const user = await userFactory();
    const emitter = await companyFactory({ name: "Emitter" });
    const recipient = await companyFactory({ name: "Recipient" });
    const nextDestination = await companyFactory({ name: "Next destination" });
    const forwardedInNextDestination = await companyFactory({
      name: "ForwardedIn next destination",
      address: "25 rue Voltaire 37100 TOURS"
    });
    const form = await formWithTempStorageFactory({
      opt: {
        emitterCompanyName: emitter.name,
        emitterCompanySiret: emitter.siret,
        recipientCompanyName: recipient.name,
        recipientCompanySiret: recipient.siret,
        nextDestinationCompanyName: nextDestination.name,
        nextDestinationCompanySiret: nextDestination.siret
      },
      ownerId: user.id,
      forwardedInOpts: {
        recipientCompanyName: forwardedInNextDestination.name,
        recipientCompanySiret: forwardedInNextDestination.siret,
        recipientCompanyAddress: forwardedInNextDestination.address
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });

    const formToBsdd_ = await formToBsdd(formForRegistry);
    const waste = toAllWaste(formToBsdd_);

    // Then
    expect(waste.postTempStorageDestinationSiret).toBe(
      forwardedInNextDestination.siret
    );
    expect(waste.postTempStorageDestinationName).toBe(
      "ForwardedIn next destination"
    );

    // Address
    expect(waste.postTempStorageDestinationAddress).toBe("25 rue Voltaire");
    expect(waste.postTempStorageDestinationCity).toBe("TOURS");
    expect(waste.postTempStorageDestinationPostalCode).toBe("37100");
  });
});
