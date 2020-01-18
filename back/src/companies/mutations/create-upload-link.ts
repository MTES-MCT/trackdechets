import { object, string } from "yup";
import { Context } from "../../types";
import { getPutSignedUrl } from "../../common/s3";

const SUPPORTED_FORMATS = [
  "image/jpg",
  "image/jpeg",
  "image/gif",
  "image/png",
  "application/pdf"
];

export const createUploadLink = {
  getValidationSchema: () =>
    object({
      fileName: string().required("Le non du fichier est obligatoire"),
      fileType: string().test(
        "fileType",
        "Format de fichier non supporté",
        type => SUPPORTED_FORMATS.includes(type)
      )
    }),
  resolve: async (_, { fileName, fileType }, context: Context) => {
    const timestamp = new Date().getTime();
    const computedFileName = [context.user.id, timestamp, fileName].join("-");

    const url = await getPutSignedUrl(computedFileName, fileType);

    return {
      signedUrl: url,
      key: computedFileName
    };
  }
};
