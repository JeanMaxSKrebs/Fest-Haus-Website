type ImagemGaleria = {
  path: string;
  url: string;
  created_at?: string | null;
};

type InfantilProps = {
  imagem?: string | null;
  imagens?: ImagemGaleria[];
};

function Infantil({
  imagem = "/infantil.jpg",
  imagens = [],
}: InfantilProps) {
  const imagemPrincipal = imagem || "/infantil.jpg";

  const imagensValidas = imagens.filter((img) => img?.url).slice(0, 5);

  return (
    <section id="servico-infantil" className="section">
      <h2>Festas Infantis</h2>

      <img src={imagemPrincipal} className="img-200" alt="Festas Infantis" />

      <p style={{ maxWidth: "600px", marginTop: "20px" }}>
        Ambiente seguro e divertido para crianças, com estrutura ideal para
        festas inesquecíveis.
      </p>

      {imagensValidas.length > 0 && (
        <div className="servico-galeria">
          {imagensValidas.map((img, i) => (
            <img
              key={img.path || i}
              src={img.url}
              className="servico-galeria-img"
              alt={`Festa Infantil ${i + 1}`}
              loading="lazy"
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Infantil;