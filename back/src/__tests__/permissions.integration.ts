import { resetDatabase } from "../../integration-tests/helper";
import { associateUserToCompany } from "../users/database";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "./factories";
import * as permissions from "../permissions";
import { deleteCachedUserRoles } from "../common/redis/users";

const getUserRolesFnSpy = jest.spyOn(permissions, "getUserRolesFn");
const { getUserRoles, Permission, checkUserPermissions } = permissions;

describe("getUserRoles", () => {
  afterEach(async () => {
    await resetDatabase();
    getUserRolesFnSpy.mockRestore();
  });

  it(
    "should return user roles and cache the result until" +
      "`deleteCachedUserRoles` is called ",
    async () => {
      const user = await userFactory();
      const company1 = await companyFactory();
      const company2 = await companyFactory();
      await associateUserToCompany(user.id, company1.orgId, "ADMIN");
      await associateUserToCompany(user.id, company2.orgId, "MEMBER");

      const roles = await getUserRoles(user.id);
      expect(roles).toEqual({
        [company1.orgId]: "ADMIN",
        [company2.orgId]: "MEMBER"
      });
      expect(getUserRolesFnSpy).toHaveBeenCalledTimes(1);

      // subsequent calls to getUserRoles should be cached
      await getUserRoles(user.id);
      expect(getUserRolesFnSpy).toHaveBeenCalledTimes(1);

      // calling deleteCachedUserRoles should erase the cash entry
      await deleteCachedUserRoles(user.id);

      await getUserRoles(user.id);
      expect(getUserRolesFnSpy).toHaveBeenCalledTimes(2);
    }
  );
});

describe("checkUserPermissions", () => {
  it(
    "should return true if user has the required permission" +
      " on at least one company listed in the permissions",
    async () => {
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const otherCompany = await companyFactory();
      const authorizedOrgIds = [company.orgId, otherCompany.orgId];
      const isAuthorized = await checkUserPermissions(
        user,
        authorizedOrgIds,
        Permission.CompanyCanUpdate
      );
      expect(isAuthorized).toEqual(true);
    }
  );

  it(
    "should throw exception if user has no role in any of the companies" +
      " listed in the permissions",
    async () => {
      const user = await userFactory();
      const company1 = await companyFactory();
      const company2 = await companyFactory();

      const authorizedOrgIds = [company1.orgId, company2.orgId];
      const checkFn = () =>
        checkUserPermissions(
          user,
          authorizedOrgIds,
          Permission.CompanyCanUpdate
        );
      await expect(checkFn).rejects.toThrow(
        "Vous n'êtes pas autorisé à effectuer cette action"
      );
    }
  );

  it(
    "should throw exception if the user has not the proper role" +
      " in any of the companies listed in the permissions",
    async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const otherCompany = await companyFactory();

      const authorizedOrgIds = [company.orgId, otherCompany.orgId];
      const checkFn = () =>
        checkUserPermissions(
          user,
          authorizedOrgIds,
          Permission.CompanyCanUpdate
        );
      await expect(checkFn).rejects.toThrow(
        "Vous n'êtes pas autorisé à effectuer cette action"
      );
    }
  );
});
