import prisma from "../prisma";
import { getUIBaseURL } from "../utils";
import { hashPassword } from "./utils";

export const userResetPasswordGet = async (req, res) => {
  const { hash } = req.query;
  const resetHash = await prisma.userResetPasswordHash.findUnique({
    where: { hash }
  });
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: resetHash.userId }
  });
  if (user == null || resetHash.hashExpires < now) {
    res.status(500).send("Hash invalide.");
    return;
  }
  const UI_BASE_URL = getUIBaseURL();
  // TODO HTML FORM for reset-password
  return res.redirect(`${UI_BASE_URL}/reset-password`);
};

export const userResetPasswordPost = async (req, res) => {
  const { password, hash } = req.forms;
  const now = new Date();
  const resetHash = await prisma.userResetPasswordHash.findUnique({
    where: { hash }
  });
  const user = await prisma.user.findUnique({
    where: { id: resetHash.userId }
  });
  if (
    hash == null ||
    password === null ||
    user === null ||
    resetHash.hashExpires < now
  ) {
    res.status(500).send("Donnée manquante.");
    return;
  }
  const hashedPassword = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });
  await prisma.userResetPasswordHash.delete({
    where: { hash }
  });
  const UI_BASE_URL = getUIBaseURL();
  return res.redirect(UI_BASE_URL);
};
