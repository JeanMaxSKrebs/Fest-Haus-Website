type CorporativoProps = {
  imagem?: string;
  imagens?: string[];
};

function Corporativo({ imagem = "/corporativo.jpg", imagens = [] }: CorporativoProps) {
  return (
    <section id="servico-corporativo" className="section">
      <h2>Eventos Corporativos</h2>

      <img src={imagem} className="img-200" alt="Evento Corporativo" />

      <p style={{ maxWidth: "600px", marginTop: "20px" }}>
        O Fest Haus é o local ideal para eventos empresariais, como confraternizações,
        treinamentos, palestras e reuniões.
      </p>

      {imagens.length > 0 && (
        <div className="servico-galeria">
          {imagens.slice(0, 5).map((img, i) => (
            <img key={i} src={img} className="servico-galeria-img" alt="Evento Corporativo" />
          ))}
        </div>
      )}
    </section>
  );
}

export default Corporativo;