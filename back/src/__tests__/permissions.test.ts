import { UserRole } from "@prisma/client";
import { Permission, can } from "../permissions";

describe("roles permissions", () => {
  test.each([UserRole.ADMIN, UserRole.MEMBER])(
    "%p should have BsdCanRead permission",
    async role => {
      expect(can(role, Permission.BsdCanRead)).toEqual(true);
    }
  );

  test.each([UserRole.ADMIN, UserRole.MEMBER])(
    "%p should have BsdCanList permission",
    async role => {
      expect(can(role, Permission.BsdCanList)).toEqual(true);
    }
  );

  test.each([UserRole.ADMIN, UserRole.MEMBER])(
    "%p should have BsdCanCreate permission",
    async role => {
      expect(can(role, Permission.BsdCanCreate)).toEqual(true);
    }
  );

  test.each([UserRole.ADMIN, UserRole.MEMBER])(
    "%p should have BsdCanUpdate permission",
    async role => {
      expect(can(role, Permission.BsdCanUpdate)).toEqual(true);
    }
  );

  test.each([UserRole.ADMIN, UserRole.MEMBER])(
    "%p should have BsdCanSign permission",
    async role => {
      expect(can(role, Permission.BsdCanSign)).toEqual(true);
    }
  );

  test.each([UserRole.ADMIN, UserRole.MEMBER])(
    "%p should have BsdCanDelete permission",
    async role => {
      expect(can(role, Permission.BsdCanDelete)).toEqual(true);
    }
  );

  test.each([UserRole.ADMIN, UserRole.MEMBER])(
    "%p should have BsdCanRevise permission",
    async role => {
      expect(can(role, Permission.BsdCanRevise)).toEqual(true);
    }
  );

  test.each([UserRole.ADMIN, UserRole.MEMBER])(
    "%p should have CompanyCanRead permission",
    async role => {
      expect(can(role, Permission.BsdCanRevise)).toEqual(true);
    }
  );

  test.each([UserRole.ADMIN, UserRole.MEMBER])(
    "%p should have RegistryCanRead permission",
    async role => {
      expect(can(role, Permission.RegistryCanRead)).toEqual(true);
    }
  );

  test("ADMIN should have CompanyCanUpdate permission", async () => {
    expect(can(UserRole.ADMIN, Permission.RegistryCanRead)).toEqual(true);
  });

  test("ADMIN should have CompanyCanVerify permission", async () => {
    expect(can(UserRole.ADMIN, Permission.CompanyCanVerify)).toEqual(true);
  });

  test("ADMIN should have CompanyCanManageSignatureAutomation permission", async () => {
    expect(
      can(UserRole.ADMIN, Permission.CompanyCanManageSignatureAutomation)
    ).toEqual(true);
  });

  test("ADMIN should have CompanyCanManageMembers permission", async () => {
    expect(can(UserRole.ADMIN, Permission.CompanyCanManageMembers)).toEqual(
      true
    );
  });

  test("ADMIN should have CompanyCanRenewSecurityCode permission", async () => {
    expect(can(UserRole.ADMIN, Permission.CompanyCanRenewSecurityCode)).toEqual(
      true
    );
  });
});
