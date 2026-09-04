import bcryptjs from "bcryptjs";

async function hash(password) {
  const rounds = getNumberofRounds();

  const passwordWithPepper = password + getPepper();
  console.log(passwordWithPepper);
  return await bcryptjs.hash(passwordWithPepper, rounds);
}

async function getPepper() {
  const pepper = process.env.PASSWORD_PEPPER;
  if (pepper === undefined) {
    throw new InternalServerError({
      cause: "Pepper não definida",
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
