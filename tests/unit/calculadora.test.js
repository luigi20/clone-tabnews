const calculadora = require("../../models/calculadora.js");

test("somar 2 mais 2 é igual 4", () => {
  const result = calculadora.somar(2, 2);
  expect(result).toBe(4);
});
