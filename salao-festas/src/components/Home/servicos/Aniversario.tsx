type ImagemGaleria = {
  path: string;
  url: string;
  created_at?: string | null;
};

type AniversarioProps = {
  imagem?: string | null;
  imagens?: ImagemGaleria[];
};

function Aniversario({
  imagem = "/aniversario.jpg",
  imagens = [],
}: AniversarioProps) {
  const imagemPrincipal = imagem || "/aniversario.jpg";

  const imagensValidas = imagens.filter((img) => img?.url).slice(0, 5);

  return (
    <section id="servico-aniversarios" className="section">
      <h2>Aniversários</h2>

      <img src={imagemPrincipal} className="img-200" alt="Aniversários" />

      <p style={{ maxWidth: "600px", marginTop: "20px" }}>
        Espaço perfeito para comemorar aniversários com conforto, segurança e
        diversão.
      </p>

      {imagensValidas.length > 0 && (
        <div className="servico-galeria">
          {imagensValidas.map((img, i) => (
            <img
              key={img.path || i}
              src={img.url}
              className="servico-galeria-img"
              alt={`Aniversário ${i + 1}`}
              loading="lazy"
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Aniversario;