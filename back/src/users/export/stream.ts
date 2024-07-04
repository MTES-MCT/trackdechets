import { Readable, ReadableOptions, Transform } from "stream";
import { formatRow } from "./columns";
import { getConnection } from "../../common/pagination";
import { prisma } from "@td/prisma";
import { Prisma } from "@prisma/client";
import { UserInCompany } from "./types";

export interface MyCompaniesReadersOptions extends ReadableOptions {
  read?(this: MyCompaniesReader, size: number): void;
}
export class MyCompaniesReader extends Readable {
  after: string | null;
  constructor(opts?: MyCompaniesReadersOptions) {
    super(opts);
    this.after = null;
  }
}
export interface MyCompaniesReaderArgs {
  companyIds: string[];
  chunk?: number;
}

export const CompanyWithUsersInclude =
  Prisma.validator<Prisma.CompanyInclude>()({
    companyAssociations: {
      include: { user: { select: { email: true, name: true } } }
    }
  });

export type CompanyWithUsers = Prisma.CompanyGetPayload<{
  include: typeof CompanyWithUsersInclude;
}>;

/**
 * Récupère la liste de tous les établissements et des utilisateurs
 * qui leurs sont associés en paginant
 */
export function myCompaniesReader({
  companyIds,
  chunk = 100
}: MyCompaniesReaderArgs): Readable {
  const stream = new MyCompaniesReader({
    objectMode: true,
    async read(this) {
      const totalCount = companyIds.length;
      const { edges, pageInfo } = await getConnection({
        totalCount,
        findMany: prismaPaginationArgs =>
          prisma.company.findMany({
            where: {
              id: { in: companyIds }
            },
            include: {
              companyAssociations: {
                include: { user: { select: { email: true, name: true } } }
              }
            },
            ...prismaPaginationArgs,
            orderBy: [
              {
                givenName: "asc"
              },
              {
                createdAt: "asc"
              }
            ]
          }),
        first: chunk,
        ...(this.after ? { after: this.after } : {}),
        formatNode: (company: CompanyWithUsers) => company
      });

      if (edges.length === 0) {
        // end of stream
        this.push(null);
      } else {
        edges.forEach(({ node: company }) => {
          const sortedAssociations = [...company.companyAssociations].sort(
            (a1, a2) =>
              new Date(a1.createdAt ?? 0).getTime() -
              new Date(a2.createdAt ?? 0).getTime()
          );
          // Pousse autant d'élements dans le stream que d'utilisateurs
          // qui appartiennent à cet établissement
          sortedAssociations.forEach(({ user, createdAt, role }) => {
            const userInCompany: UserInCompany = {
              ...company,
              userEmail: user.email,
              userName: user.name,
              userJoinedAt: createdAt,
              userRole: role
            };
            this.push(userInCompany);
          });
        });
        if (pageInfo.hasNextPage) {
          this.after = pageInfo.endCursor!;
        } else {
          // end of stream
          this.push(null);
        }
      }
    }
  });

  return stream;
}

/**
 * Permet de transformer les données à la volée dans le stream
 */
export function userInCompanyFormatter(opts = { useLabelAsKey: false }) {
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(userInCompany: UserInCompany, _encoding, callback) {
      const formatted = formatRow(userInCompany, opts.useLabelAsKey);
      this.push(formatted);
      callback();
    }
  });
}
