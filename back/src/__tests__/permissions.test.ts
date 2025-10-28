import { UserRole } from "@td/prisma";
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
    "%p should have BsdCanSignEmission permission",
    async role => {
      expect(can(role, Permission.BsdCanSignEmission)).toEqual(true);
    }
  );

  test.each([UserRole.ADMIN, UserRole.MEMBER])(
    "%p should have BsdCanSignWork permission",
    async role => {
      expect(can(role, Permission.BsdCanSignWork)).toEqual(true);
    }
  );

  test.each([UserRole.ADMIN, UserRole.MEMBER])(
    "%p should have BsdCanSignTransport permission",
    async role => {
      expect(can(role, Permission.BsdCanSignTransport)).toEqual(true);
    }
  );

  test.each([UserRole.ADMIN, UserRole.MEMBER])(
    "%p should have BsdCanSignAcceptation permission",
    async role => {
      expect(can(role, Permission.BsdCanSignAcceptation)).toEqual(true);
    }
  );

  test.each([UserRole.ADMIN, UserRole.MEMBER])(
    "%p should have BsdCanSignOperation permission",
    async role => {
      expect(can(role, Permission.BsdCanSignOperation)).toEqual(true);
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
    expect(can(UserRole.ADMIN, Permission.CompanyCanUpdate)).toEqual(true);
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

  test("MEMBER should not have CompanyCanUpdate permission", async () => {
    expect(can(UserRole.MEMBER, Permission.CompanyCanUpdate)).toEqual(false);
  });

  test("MEMBER should not have CompanyCanVerify permission", async () => {
    expect(can(UserRole.MEMBER, Permission.CompanyCanVerify)).toEqual(false);
  });

  test("MEMBER should not have CompanyCanManageSignatureAutomation permission", async () => {
    expect(
      can(UserRole.MEMBER, Permission.CompanyCanManageSignatureAutomation)
    ).toEqual(false);
  });

  test("MEMBER should not have CompanyCanManageMembers permission", async () => {
    expect(can(UserRole.MEMBER, Permission.CompanyCanManageMembers)).toEqual(
      false
    );
  });

  test("MEMBER should not have CompanyCanRenewSecurityCode permission", async () => {
    expect(
      can(UserRole.MEMBER, Permission.CompanyCanRenewSecurityCode)
    ).toEqual(false);
  });
});
