import bcryptjs from "bcryptjs";
import { InternalServerError } from "infra/errors";

async function hash(password) {
  console.log("1 - hash iniciou");
  console.log("2 - password existe:", Boolean(password));
  console.log(
    "3 - PASSWORD_PEPPER configurado:",
    Boolean(process.env.PASSWORD_PEPPER),
  );

  const rounds = getNumberofRounds();

  console.log("4 - rounds:", rounds);

  const pepper = getPepper();

  console.log("5 - pepper obtido");

  const passwordWithPepper = password + pepper;

  console.log("6 - iniciando bcrypt");

  const hash = await bcryptjs.hash(passwordWithPepper, rounds);

  console.log("7 - bcrypt terminou");

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
