import { AdminRequestStatus, AdminRequestValidationMethod } from "@td/prisma";
import { prisma } from "@td/prisma";
import { companyFactory, userFactory } from "../../../../__tests__/factories";
import { addDays } from "date-fns";
import { expireAdminRequests } from "../utils/refuseAdminRequest.utils";

describe("refuseAdminRequest.utils", () => {
  describe("expireAdminRequests", () => {
    const createAdminRequest = async opt => {
      const company = await companyFactory();
      const requestAuthor = await userFactory();

      return await prisma.adminRequest.create({
        data: {
          createdAt: new Date(),
          user: { connect: { id: requestAuthor.id } },
          company: { connect: { id: company.id } },
          status: AdminRequestStatus.PENDING,
          validationMethod: AdminRequestValidationMethod.SEND_MAIL,
          ...opt
        }
      });
    };

    const checkStatus = async (requestId, expectedStatus) => {
      const updatedAdminRequest1 = await prisma.adminRequest.findFirstOrThrow({
        where: { id: requestId }
      });
      expect(updatedAdminRequest1.status).toBe(expectedStatus);
    };

    it("should expire relevant admin requests", async () => {
      // Given

      // Should not expire because it's too recent
      const adminRequest1 = await createAdminRequest({ createdAt: new Date() });

      // Should not expire because it's refused
      const adminRequest2 = await createAdminRequest({
        createdAt: new Date(),
        status: AdminRequestStatus.REFUSED
      });

      // Should not expire because it's accepted
      const adminRequest3 = await createAdminRequest({
        createdAt: new Date(),
        status: AdminRequestStatus.ACCEPTED
      });

      // Should not expire because it's blocked
      const adminRequest4 = await createAdminRequest({
        createdAt: new Date(),
        status: AdminRequestStatus.BLOCKED
      });

      // Should expire
      const adminRequest5 = await createAdminRequest({
        createdAt: addDays(new Date(), -15)
      });

      // When
      await expireAdminRequests();

      await checkStatus(adminRequest1.id, AdminRequestStatus.PENDING);
      await checkStatus(adminRequest2.id, AdminRequestStatus.REFUSED);
      await checkStatus(adminRequest3.id, AdminRequestStatus.ACCEPTED);
      await checkStatus(adminRequest4.id, AdminRequestStatus.BLOCKED);
      await checkStatus(adminRequest5.id, AdminRequestStatus.EXPIRED);
    });
  });
});
