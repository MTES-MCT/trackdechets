import prisma from "../../prisma";

/**
 * Appendix 2 fraction data migration
 * Create FormGroupement records and fill Form.quantityGrouped
 */
export default async function createFormGroupements() {
  const groupedForms = await prisma.form.findMany({
    where: { appendix2RootFormId: { not: null } },
    select: { id: true, appendix2RootFormId: true, quantityReceived: true }
  });
  await prisma.formGroupement.createMany({
    data: groupedForms.map(f => ({
      nextFormId: f.appendix2RootFormId,
      initialFormId: f.id,
      quantity: f.quantityReceived ?? 0
    }))
  });
  for (const groupedForm of groupedForms) {
    await prisma.form.update({
      where: { id: groupedForm.id },
      data: { quantityGrouped: groupedForm.quantityReceived ?? 0 }
    });
  }
}
