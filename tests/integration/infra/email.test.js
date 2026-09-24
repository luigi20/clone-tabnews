import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});
describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.delete_all_email();
    await email.send({
      from: "FinTab <contato@fintab.com.br>",
      to: "contato@curso.dev",
      subject: "Teste de assunto",
      text: "Teste de corpo",
    });
    await email.send({
      from: "FinTab <contato@fintab.com.br>",
      to: "contato@curso.dev",
      subject: "Teste de assunto ultimo",
      text: "Teste de corpo ultimo",
    });
    const last_email = await orchestrator.get_last_email();
    expect(last_email.sender).toBe("<contato@fintab.com.br>");
    expect(last_email.recipients[0]).toBe("<contato@curso.dev>");
    expect(last_email.subject).toBe("Teste de assunto ultimo");
    expect(last_email.text).toBe("Teste de corpo ultimo\n");
  });
});
