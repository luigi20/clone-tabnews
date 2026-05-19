function status(request, response) {
  response.status(200).json({ chave: "ok Antônio" });
}

export default status;
