import { createUser, hashPassword } from "back";

export const seedUser = async user => {
  const seededUser = await createUser({
    data: {
      ...user,
      password: await hashPassword(user.password),
      isActive: true,
      activatedAt: new Date()
    }
  });

  return seededUser;
};
