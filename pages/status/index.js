import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key, {
    method: "GET",
  });
  const response_body = await response.json();
  return response_body;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
    </>
  );
}

function UpdatedAt() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });
  let updated_at_text = "Carregando...";
  let max_connections = "Caregando...";
  let used_connections = "Carregando...";
  let version = "Carregando...";
  if (!isLoading && data) {
    updated_at_text = new Date(data.updated_at).toLocaleString("pt-BR");
    max_connections = parseInt(data.max_connections);
    used_connections = parseInt(data.used_connections);
    version = parseInt(data.version);
  }
  return (
    <div>
      Última Atualização: {updated_at_text}
      <br /> Máximo de conexões: {max_connections}
      <br />
      Conexões usadas: {used_connections}
      <br />
      Versão: {version}
    </div>
  );
}
