type PersonalizadoProps = {
  imagem?: string;
  imagens?: string[];
};

function Personalizado({ imagem = "/servicos/personalizado.jpg", imagens = [] }: PersonalizadoProps) {
  return (
    <section id="servico-personalizado" className="section">
      <h2>Eventos Personalizados</h2>

      <img src={imagem} className="img-200" alt="Eventos personalizados" />

      <p style={{ maxWidth: "600px", marginTop: "20px" }}>
        Criamos eventos personalizados adaptados às necessidades do cliente.
      </p>

      {imagens.length > 0 && (
        <div className="servico-galeria">
          {imagens.slice(0, 5).map((img, i) => (
            <img key={i} src={img} className="servico-galeria-img" alt="Evento personalizado" />
          ))}
        </div>
      )}
    </section>
  );
}

export default Personalizado;