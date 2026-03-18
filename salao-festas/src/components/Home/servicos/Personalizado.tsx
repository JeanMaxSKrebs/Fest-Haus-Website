type ImagemGaleria = {
  path: string;
  url: string;
  created_at?: string | null;
};

type PersonalizadoProps = {
  imagem?: string | null;
  imagens?: ImagemGaleria[];
};

function Personalizado({
  imagem = "/personalizado.jpg",
  imagens = [],
}: PersonalizadoProps) {
  const imagemPrincipal = imagem || "/personalizado.jpg";

  const imagensValidas = imagens.filter((img) => img?.url).slice(0, 5);

  return (
    <section id="servico-personalizado" className="section">
      <h2>Eventos Personalizados</h2>

      <img
        src={imagemPrincipal}
        className="img-200"
        alt="Eventos Personalizados"
      />

      <p style={{ maxWidth: "600px", marginTop: "20px" }}>
        Criamos eventos personalizados adaptados às necessidades do cliente.
      </p>

      {imagensValidas.length > 0 && (
        <div className="servico-galeria">
          {imagensValidas.map((img, i) => (
            <img
              key={img.path || i}
              src={img.url}
              className="servico-galeria-img"
              alt={`Evento Personalizado ${i + 1}`}
              loading="lazy"
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Personalizado;