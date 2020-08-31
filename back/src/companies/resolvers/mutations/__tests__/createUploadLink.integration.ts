import * as s3 from "../../../../common/s3";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth";
import { ErrorCode } from "../../../../common/errors";

const CREATE_UPLOAD_LINK = `
  mutation CreateUploadLink($fileName: String!, $fileType: String!){
    createUploadLink(fileName: $fileName, fileType: $fileType){
      key,
      signedUrl
    }
  }
`;

const getPutSignedUrlSpy = jest.spyOn(s3, "getPutSignedUrl");
(getPutSignedUrlSpy as jest.Mock).mockResolvedValueOnce("signedUrl");

describe("createUploadLink", () => {
  it("should throw UserInputException if file format is not supported", async () => {
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_UPLOAD_LINK, {
      variables: { fileName: "awesome video", fileType: "video/mpeg" }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    expect(errors[0].message).toEqual("Format de fichier non supporté");
  });

  it("should return a signed url", async () => {
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate(CREATE_UPLOAD_LINK, {
      variables: { fileName: "awesome pdf", fileType: "application/pdf" }
    });
    expect(getPutSignedUrlSpy).toHaveBeenCalledTimes(1);
    expect(data.createUploadLink.signedUrl).toEqual("signedUrl");
  });
});
