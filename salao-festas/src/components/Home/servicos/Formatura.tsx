type FormaturaProps = {
  imagem?: string;
  imagens?: string[];
};

function Formatura({ imagem = "/formatura.jpg", imagens = [] }: FormaturaProps) {
  return (
    <section id="servico-formatura" className="section">
      <h2>Formaturas</h2>

      <img src={imagem} className="img-200" alt="Formatura" />

      <p style={{ maxWidth: "600px", marginTop: "20px" }}>
        Celebre sua conquista em grande estilo no Fest Haus.
      </p>

      {imagens.length > 0 && (
        <div className="servico-galeria">
          {imagens.slice(0, 5).map((img, i) => (
            <img key={i} src={img} className="servico-galeria-img" alt="Formatura" />
          ))}
        </div>
      )}
    </section>
  );
}

export default Formatura;