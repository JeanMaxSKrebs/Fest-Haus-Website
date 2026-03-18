type ImagemGaleria = {
  path: string;
  url: string;
  created_at?: string | null;
};

type CasamentoProps = {
  imagem?: string | null;
  imagens?: ImagemGaleria[];
};

function Casamento({
  imagem = "/casamento.jpg",
  imagens = [],
}: CasamentoProps) {
  const imagemPrincipal = imagem || "/casamento.jpg";

  const imagensValidas = imagens.filter((img) => img?.url).slice(0, 5);

  return (
    <section id="servico-casamentos" className="section">
      <h2>Casamentos</h2>

      <img src={imagemPrincipal} className="img-200" alt="Casamentos" />

      <p style={{ maxWidth: "600px", marginTop: "20px" }}>
        Celebre o seu grande dia em um ambiente elegante, com estrutura completa
        para tornar seu casamento inesquecível.
      </p>

      {imagensValidas.length > 0 && (
        <div className="servico-galeria">
          {imagensValidas.map((img, i) => (
            <img
              key={img.path || i}
              src={img.url}
              className="servico-galeria-img"
              alt={`Casamento ${i + 1}`}
              loading="lazy"
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Casamento;