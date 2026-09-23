import bcryptjs from "bcryptjs";
import { InternalServerError } from "infra/errors";

async function hash(password) {
  const rounds = getNumberofRounds();
  const pepper = getPepper();
  const passwordWithPepper = password + pepper;
  const hash = await bcryptjs.hash(passwordWithPepper, rounds);
  return hash;
}

function getPepper() {
  const pepper = process.env.PASSWORD_PEPPER;

  if (!pepper) {
    throw new InternalServerError({
      cause: "PASSWORD_PEPPER não definida",
    });
  }

  return pepper;
}

function getNumberofRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

async function compare(providedPassword, storedPassword) {
  return await bcryptjs.compare(providedPassword + getPepper(), storedPassword);
}

const password = {
  hash,
  compare,
};

export default password;
