import { AddRegistryLinesResponse } from "@td/codegen-ui";
import type { UseFormReturn } from "react-hook-form";

export function handleMutationResponse(
  response: AddRegistryLinesResponse | null | undefined,
  methods: UseFormReturn<any>
) {
  if (!response) {
    methods.setError("root.serverError", { type: "server" });
    return false;
  }

  const { stats, errors } = response;
  if (errors?.[0]?.issues) {
    for (const issue of errors[0].issues) {
      const path = issue.path.startsWith("transporter")
        ? issue.path.replace(
            /^transporter([1-5])(.*)$/,
            (_, index, rest) => `transporter.${parseInt(index) - 1}.${rest}`
          )
        : issue.path;
      methods.setError(path as any, {
        type: "server",
        message: issue.message
      });
    }
    return false;
  }

  if (stats.skipped) {
    methods.setError("publicId", {
      type: "server",
      message:
        "Le numéro unique saisi est déjà utilisé. Si vous souhaitez modifier une déclaration existante, vous pouvez la retrouver depuis le tableau de bord des déclarations."
    });
    return false;
  }

  return true;
}
