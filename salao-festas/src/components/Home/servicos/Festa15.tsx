type Festa15Props = {
  imagem?: string;
  imagens?: string[];
};

function Festa15({ imagem = "/servicos/15anos.jpg", imagens = [] }: Festa15Props) {
  return (
    <section id="servico-15anos" className="section">
      <h2>Festa de 15 Anos</h2>

      <img src={imagem} className="img-200" alt="Festa de 15 anos" />

      <p style={{ maxWidth: "600px", marginTop: "20px" }}>
        Celebre este momento único em um ambiente elegante e inesquecível.
      </p>

      {imagens.length > 0 && (
        <div className="servico-galeria">
          {imagens.slice(0, 5).map((img, i) => (
            <img key={i} src={img} className="servico-galeria-img" alt="15 anos" />
          ))}
        </div>
      )}
    </section>
  );
}

export default Festa15;