type ImagemGaleria = {
  path: string;
  url: string;
  created_at?: string | null;
};

type FormaturaProps = {
  imagem?: string | null;
  imagens?: ImagemGaleria[];
};

function Formatura({
  imagem = "/formatura.jpg",
  imagens = [],
}: FormaturaProps) {
  const imagemPrincipal = imagem || "/formatura.jpg";

  const imagensValidas = imagens.filter((img) => img?.url).slice(0, 5);

  return (
    <section id="servico-formaturas" className="section">
      <h2>Formaturas</h2>

      <img src={imagemPrincipal} className="img-200" alt="Formaturas" />

      <p style={{ maxWidth: "600px", marginTop: "20px" }}>
        Comemore essa conquista com uma festa completa, preparada para marcar
        esse momento especial.
      </p>

      {imagensValidas.length > 0 && (
        <div className="servico-galeria">
          {imagensValidas.map((img, i) => (
            <img
              key={img.path || i}
              src={img.url}
              className="servico-galeria-img"
              alt={`Formatura ${i + 1}`}
              loading="lazy"
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Formatura;