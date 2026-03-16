type CasamentoProps = {
  imagem?: string;
  imagens?: string[];
};

function Casamento({ imagem = "/casamento.jpg", imagens = [] }: CasamentoProps) {
  return (
    <section id="servico-casamento" className="section">
      <h2>Casamentos</h2>

      <img src={imagem} className="img-200" alt="Casamento" />

      <p style={{ maxWidth: "600px", marginTop: "20px" }}>
        O Fest Haus oferece um ambiente elegante e completo para tornar seu casamento inesquecível.
        Estrutura completa, decoração personalizada e espaço ideal para celebrar este momento especial.
      </p>

      {imagens.length > 0 && (
        <div className="servico-galeria">
          {imagens.slice(0, 5).map((img, i) => (
            <img key={i} src={img} className="servico-galeria-img" alt="Casamento" />
          ))}
        </div>
      )}
    </section>
  );
}

export default Casamento;