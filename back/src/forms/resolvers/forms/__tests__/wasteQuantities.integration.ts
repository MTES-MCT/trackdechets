import { gql } from "graphql-tag";
import { Query, QueryFormArgs } from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import makeClient from "../../../../__tests__/testClient";
import { prepareDB } from "../../../__tests__/helpers";
import Decimal from "decimal.js";

const FORM = gql`
  query Form($id: ID!) {
    form(id: $id) {
      wasteAcceptationStatus
      quantityReceived
      quantityAccepted
      quantityRefused
    }
  }
`;

describe("bsddWasteQuantities", () => {
  describe("ACCEPTED", () => {
    test("should return computed quantityReceived, quantityAccepted & quantityRefused", async () => {
      // Given
      const { recipient, form: initialForm } = await prepareDB();
      const form = await prisma.form.update({
        where: { id: initialForm.id },
        data: {
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: new Decimal(13),
          quantityRefused: new Decimal(0)
        }
      });

      // When
      const { query } = makeClient(recipient);
      const { data } = await query<Pick<Query, "form">, QueryFormArgs>(FORM, {
        variables: { id: form.id }
      });

      // Then
      expect(data?.form?.wasteAcceptationStatus).toEqual("ACCEPTED");
      expect(data?.form?.quantityReceived).toEqual(13);
      expect(data?.form?.quantityRefused).toEqual(0);
      expect(data?.form?.quantityAccepted).toEqual(13);
    });

    test("[legacy] should return quantityReceived", async () => {
      // Given
      const { recipient, form: initialForm } = await prepareDB();
      const form = await prisma.form.update({
        where: { id: initialForm.id },
        data: {
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: new Decimal(13)
        }
      });

      // When
      const { query } = makeClient(recipient);
      const { data } = await query<Pick<Query, "form">, QueryFormArgs>(FORM, {
        variables: { id: form.id }
      });

      // Then
      expect(data?.form?.wasteAcceptationStatus).toEqual("ACCEPTED");
      expect(data?.form?.quantityReceived).toEqual(13);
      expect(data?.form?.quantityRefused).toEqual(null);
      expect(data?.form?.quantityAccepted).toEqual(null);
    });
  });

  describe("REFUSED", () => {
    test("should return computed quantityReceived, quantityAccepted & quantityRefused", async () => {
      // Given
      const { recipient, form: initialForm } = await prepareDB();
      const form = await prisma.form.update({
        where: { id: initialForm.id },
        data: {
          wasteAcceptationStatus: "REFUSED",
          quantityReceived: new Decimal(13),
          quantityRefused: new Decimal(13)
        }
      });

      // When
      const { query } = makeClient(recipient);
      const { data } = await query<Pick<Query, "form">, QueryFormArgs>(FORM, {
        variables: { id: form.id }
      });

      // Then
      expect(data?.form?.wasteAcceptationStatus).toEqual("REFUSED");
      expect(data?.form?.quantityReceived).toEqual(13);
      expect(data?.form?.quantityRefused).toEqual(13);
      expect(data?.form?.quantityAccepted).toEqual(0);
    });

    test("[legacy] should return quantityReceived", async () => {
      // Given
      const { recipient, form: initialForm } = await prepareDB();
      const form = await prisma.form.update({
        where: { id: initialForm.id },
        data: {
          wasteAcceptationStatus: "REFUSED",
          quantityReceived: new Decimal(13)
        }
      });

      // When
      const { query } = makeClient(recipient);
      const { data } = await query<Pick<Query, "form">, QueryFormArgs>(FORM, {
        variables: { id: form.id }
      });

      // Then
      expect(data?.form?.wasteAcceptationStatus).toEqual("REFUSED");
      expect(data?.form?.quantityReceived).toEqual(13);
      expect(data?.form?.quantityRefused).toEqual(null);
      expect(data?.form?.quantityAccepted).toEqual(null);
    });
  });

  describe("PARTIALLY_REFUSED", () => {
    test("should return computed quantityReceived, quantityAccepted & quantityRefused", async () => {
      // Given
      const { recipient, form: initialForm } = await prepareDB();
      const form = await prisma.form.update({
        where: { id: initialForm.id },
        data: {
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: new Decimal(13),
          quantityRefused: new Decimal(9)
        }
      });

      // When
      const { query } = makeClient(recipient);
      const { data } = await query<Pick<Query, "form">, QueryFormArgs>(FORM, {
        variables: { id: form.id }
      });

      // Then
      expect(data?.form?.wasteAcceptationStatus).toEqual("PARTIALLY_REFUSED");
      expect(data?.form?.quantityReceived).toEqual(13);
      expect(data?.form?.quantityRefused).toEqual(9);
      expect(data?.form?.quantityAccepted).toEqual(4);
    });

    test("[legacy] should return quantityReceived", async () => {
      // Given
      const { recipient, form: initialForm } = await prepareDB();
      const form = await prisma.form.update({
        where: { id: initialForm.id },
        data: {
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          quantityReceived: new Decimal(13)
        }
      });

      // When
      const { query } = makeClient(recipient);
      const { data } = await query<Pick<Query, "form">, QueryFormArgs>(FORM, {
        variables: { id: form.id }
      });

      // Then
      expect(data?.form?.wasteAcceptationStatus).toEqual("PARTIALLY_REFUSED");
      expect(data?.form?.quantityReceived).toEqual(13);
      expect(data?.form?.quantityRefused).toEqual(null);
      expect(data?.form?.quantityAccepted).toEqual(null);
    });
  });
});
