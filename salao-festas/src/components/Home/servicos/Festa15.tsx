type ImagemGaleria = {
  path: string;
  url: string;
  created_at?: string | null;
};

type Festa15Props = {
  imagem?: string | null;
  imagens?: ImagemGaleria[];
};

function Festa15({
  imagem = "/15anos.jpg",
  imagens = [],
}: Festa15Props) {
  const imagemPrincipal = imagem || "/15anos.jpg";

  const imagensValidas = imagens.filter((img) => img?.url).slice(0, 5);

  return (
    <section id="servico-festa15" className="section">
      <h2>Festa de 15 Anos</h2>

      <img src={imagemPrincipal} className="img-200" alt="Festa de 15 Anos" />

      <p style={{ maxWidth: "600px", marginTop: "20px" }}>
        Celebre os 15 anos com estilo, em um ambiente preparado para um evento
        marcante e especial.
      </p>

      {imagensValidas.length > 0 && (
        <div className="servico-galeria">
          {imagensValidas.map((img, i) => (
            <img
              key={img.path || i}
              src={img.url}
              className="servico-galeria-img"
              alt={`Festa de 15 Anos ${i + 1}`}
              loading="lazy"
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Festa15;