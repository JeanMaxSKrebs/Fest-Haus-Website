type AniversarioProps = {
  imagem?: string;
  imagens?: string[];
};

function Aniversario({ imagem = "/aniversario.jpg", imagens = [] }: AniversarioProps) {
  return (
    <section id="servico-aniversario" className="section">
      <h2>Aniversários</h2>

      <img src={imagem} className="img-200" alt="Aniversário" />

      <p>
        Espaço perfeito para comemorar aniversários com conforto, segurança e diversão.
      </p>

      {imagens.length > 0 && (
        <div className="servico-galeria">
          {imagens.slice(0, 5).map((img, i) => (
            <img key={i} src={img} className="servico-galeria-img" alt="Aniversário" />
          ))}
        </div>
      )}
    </section>
  );
}

export default Aniversario;