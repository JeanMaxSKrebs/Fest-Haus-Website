type InfantilProps = {
  imagem?: string;
  imagens?: string[];
};

function Infantil({ imagem = "/infantil.jpg", imagens = [] }: InfantilProps) {
  return (
    <section id="servico-infantil" className="section">
      <h2>Festas Infantis</h2>

      <img src={imagem} className="img-200" alt="Festa Infantil" />

      <p style={{ maxWidth: "600px", marginTop: "20px" }}>
        Espaço ideal para festas infantis com conforto e segurança.
      </p>

      {imagens.length > 0 && (
        <div className="servico-galeria">
          {imagens.slice(0, 5).map((img, i) => (
            <img key={i} src={img} className="servico-galeria-img" alt="Festa Infantil" />
          ))}
        </div>
      )}
    </section>
  );
}

export default Infantil;