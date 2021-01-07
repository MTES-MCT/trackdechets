import parseArgs from "minimist";
import prisma from "src/prisma";
import { loadCompanies, loadRoles } from "./loaders";
import { validateCompany, validateRoleGenerator } from "./validations";
import { sirenify } from "./sirene";
import { hashPassword } from "../utils";
import { randomNumber, getUIBaseURL } from "../../utils";
import { groupBy } from "./utils";
import { sendMail } from "../../mailer/mailing";
import { UserInputError } from "apollo-server-express";
import {
  associateUserToCompany,
  acceptNewUserCompanyInvitations
} from "../database";

function printHelp() {
  console.log(`
  Usage npm run bulk-create-account [options]
  Bulk load a list of companies and users to Trackdéchets
  Two csv files are required
  * etablissements.csv
  * roles.csv
  See validations.ts for the format of each file
  Options:
  -- --help                       Print help
  -- --validateOnly               Only perform validation csv files
  -- --csvDir=/path/to/csv/dir    Specify custom csv directory
  `);
}

async function run(argv = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);

  if (args.help) {
    printHelp();
  }

  const opts = {
    validateOnly: false,
    csvDir: `${__dirname}/../../../csv`
  };

  if (args.validateOnly) {
    opts.validateOnly = args.validateOnly;
    console.info("Running csv validations only...");
  }

  if (args.csvDir) {
    opts.csvDir = args.csvDir;
  }

  await bulkCreate(opts);
}

interface Opts {
  validateOnly: boolean;
  csvDir: string;
  console?: any;
}

export async function bulkCreate(opts: Opts): Promise<void> {
  console = opts.console || global.console;

  // load data from csv files
  const companiesRows = await loadCompanies(opts.csvDir);
  const rolesRows = await loadRoles(opts.csvDir);

  let isValid = true;

  const companies = [];

  // perform validation
  for (const company of companiesRows) {
    console.info(`Validate company ${company.siret}`);
    const validCompany = await validateCompany(company).catch(err => {
      isValid = false;
      console.error(err);
    });
    companies.push(validCompany);
  }

  // validate roles
  const validateRole = validateRoleGenerator(companies);
  const rolesPromises = rolesRows.map(role => {
    return validateRole(role).catch(err => {
      isValid = false;
      console.error(err);
    });
  });
  const roles = await Promise.all(rolesPromises);

  if (isValid) {
    console.info("Validation successful");
  }

  if (opts.validateOnly) {
    process.exit(0);
  }

  if (!isValid) {
    // trying to load data but validation failed
    // exit with error
    process.exit(1);
  }

  const sirenifiedCompanies = [];

  // add sirene information
  for (const c of companies) {
    try {
      console.info(`Add sirene info for company ${c.siret}`);
      const sirenified = await sirenify(c);
      sirenifiedCompanies.push(sirenified);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }

  // create companies in Trackdéchets

  for (const company of sirenifiedCompanies) {
    const existingCompany = await prisma.company.findUnique({
      where: { siret: company.siret }
    });
    if (!existingCompany) {
      console.info(`Create company ${company.siret}`);
      await prisma.company.create({
        data: {
          siret: company.siret,
          codeNaf: company.codeNaf,
          gerepId: company.gerepId,
          name: company.name,
          companyTypes: { set: company.companyTypes },
          securityCode: randomNumber(4),
          givenName: company.givenName,
          contactEmail: company.contactEmail,
          contactPhone: company.contactPhone,
          website: company.website
        }
      });
    }
  }

  // group roles by email
  const usersWithRoles = groupBy("email", roles);

  for (const email of Object.keys(usersWithRoles)) {
    // check for existing user
    let user = await prisma.user.findUnique({ where: { email } });

    let newUser = null;

    if (!user) {
      // No user matches this email. Creates a new one
      const password = Math.random().toString(36).slice(-10);

      const hashedPassword = await hashPassword(password);

      console.info(`Create user ${email} / ${password}`);
      user = await prisma.user.create({
        data: {
          name: email,
          email,
          password: hashedPassword,
          isActive: true
        }
      });

      await acceptNewUserCompanyInvitations(user);

      newUser = { password };
    }

    await Promise.all(
      usersWithRoles[email].map(async ({ role, siret }) => {
        try {
          return await associateUserToCompany(user.id, siret, role);
        } catch (err) {
          if (err instanceof UserInputError) {
            // association already exist, return it
            const existingAssociations = await prisma.companyAssociation.findMany(
              {
                where: { company: { siret }, user: { id: user.id } }
              }
            );
            return existingAssociations[0];
          }

          console.error(err);
        }
      })
    );

    if (newUser) {
      // send welcome email to new user
      const mail = {
        to: [{ name: email, email }],
        subject: "Bienvenue sur Trackdéchets",
        title: "Bienvenue sur Trackdéchets",
        body: `
          Bonjour,
          <br/>
          Vous avez été invité à rejoindre Trackdéchets: la plateforme de dématérialisation
          des bordereaux de suivi de déchets dangereux.
          <br/>
          Vous pouvez-vous connecter à votre compte sur ${getUIBaseURL()}/login avec les identifiants suivants:
          <br /><br />
          email: ${email}
          <br/>
          mot de passe provisoire: ${newUser.password}
        `
      };

      try {
        await sendMail(mail);
      } catch (err) {
        console.error("Error while sending invitation email");
      }
    }
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
