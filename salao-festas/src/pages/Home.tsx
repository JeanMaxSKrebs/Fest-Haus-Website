import Apresentacao from "../components/Home/Apresentacao"
import Servicos from "../components/Home/Servicos"
import Galeria from "../components/Home/Galeria"
import Contato from "../components/Home/Contato"

function Home() {

  return (
    <>
      {/* Apresentação */}
      <Apresentacao />

      {/* Serviços */}
      <section id="servicos">
        <Servicos />
      </section>

      {/* Galeria */}
      <section id="galeria">
        <Galeria />
      </section>

      {/* Contato */}
      <section id="contato">
        <Contato />
      </section>
    </>
  )
}

export default Home
