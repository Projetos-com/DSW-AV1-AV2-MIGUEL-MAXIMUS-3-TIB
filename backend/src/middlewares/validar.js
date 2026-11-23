// Middleware genérico: valida req.body (ou req.params) com um schema do Zod.
// Se houver erro, responde 400 com a lista de campos inválidos.
export function validar(schema, origem = 'body') {
  return (req, res, next) => {
    const resultado = schema.safeParse(req[origem] ?? {});

    if (!resultado.success) {
      const erros = resultado.error.issues.map((issue) => ({
        campo: issue.path.join('.') || origem,
        mensagem: issue.message,
      }));
      return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erros });
    }

    // Guarda os dados já limpos/convertidos para o controller usar
    if (origem === 'body') req.body = resultado.data;
    else req.validParams = resultado.data;
    next();
  };
}
