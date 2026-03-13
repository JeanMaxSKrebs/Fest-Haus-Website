export function notFoundHandler(req, res, _next) {
  res.status(404).json({
    error: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, _req, res, _next) {
  console.error("Erro interno:", err);

  res.status(err.status || 500).json({
    error: err.message || "Erro interno do servidor",
  });
}