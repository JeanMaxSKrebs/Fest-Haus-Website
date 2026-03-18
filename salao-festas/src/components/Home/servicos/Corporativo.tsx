type ImagemGaleria = {
  path: string;
  url: string;
  created_at?: string | null;
};

type CorporativoProps = {
  imagem?: string | null;
  imagens?: ImagemGaleria[];
};

function Corporativo({
  imagem = "/corporativo.jpg",
  imagens = [],
}: CorporativoProps) {
  const imagemPrincipal = imagem || "/corporativo.jpg";

  const imagensValidas = imagens.filter((img) => img?.url).slice(0, 5);

  return (
    <section id="servico-corporativo" className="section">
      <h2>Eventos Corporativos</h2>

      <img
        src={imagemPrincipal}
        className="img-200"
        alt="Evento Corporativo"
      />

      <p style={{ maxWidth: "600px", marginTop: "20px" }}>
        O Fest Haus é o local ideal para eventos empresariais, como
        confraternizações, treinamentos, palestras e reuniões.
      </p>

      {imagensValidas.length > 0 && (
        <div className="servico-galeria">
          {imagensValidas.map((img, i) => (
            <img
              key={img.path || i}
              src={img.url}
              className="servico-galeria-img"
              alt={`Evento Corporativo ${i + 1}`}
              loading="lazy"
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Corporativo;