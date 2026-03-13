import { useState, useRef } from "react"
import Casamento from "./servicos/Casamento"
import Aniversario from "./servicos/Aniversario"
import Corporativo from "./servicos/Corporativo"
import Formatura from "./servicos/Formatura"
import Infantil from "./servicos/Infantil"
import BtnOrcamento from "./BtnOrcamento" // ajuste o caminho se necessário

interface ServicosProps {
  user?: { email?: string; user_metadata?: { full_name?: string } }
}

function Servicos({ user }: ServicosProps) {
  const [servicoAtivo, setServicoAtivo] = useState<string | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  const servicos = [
    { nome: "Casamentos", imagem: "/servicos/casamento.png", componente: <Casamento /> },
    { nome: "Aniversários", imagem: "/servicos/aniversario.jpg", componente: <Aniversario /> },
    { nome: "Eventos Corporativos", imagem: "/servicos/corporativo.jpg", componente: <Corporativo /> },
    { nome: "Formaturas", imagem: "/servicos/formatura.jpg", componente: <Formatura /> },
    { nome: "Festas Infantis", imagem: "/servicos/infantil.png", componente: <Infantil /> },
    {
      nome: "Eventos Personalizados",
      imagem: "",
      componente: (
        <div className="section">
          <h2>Eventos Personalizados</h2>
          <p>Informações em breve...</p>
        </div>
      )
    }
  ]

  const handleClick = (nome: string) => {
    setServicoAtivo(servicoAtivo === nome ? null : nome)
    sectionRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="servicos" className="section" ref={sectionRef}>
      <h2>Serviços</h2>

      <div className="grid">
        {servicos.map((servico, index) => {
          const isAtivo = servicoAtivo === servico.nome
          const algumAtivo = servicoAtivo !== null
          const temImagem = servico.imagem !== ""

          return (
            <div
              key={index}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
                border: isAtivo ? "3px solid var(--cor-primaria)" : "none",
                padding: isAtivo ? "30px" : "20px",
                minHeight: "220px"
              }}
              onClick={() => handleClick(servico.nome)}
            >
              {isAtivo || !algumAtivo ? (
                !isAtivo ? (
                  <>
                    {temImagem && <img src={servico.imagem} className="img-200" alt={servico.nome} />}
                    <h3>{servico.nome}</h3>
                  </>
                ) : (
                  <h3
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "200px"
                    }}
                  >
                    {servico.nome}
                  </h3>
                )
              ) : (
                <h3
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "200px",
                    opacity: 0.6
                  }}
                >
                  {servico.nome}
                </h3>
              )}
            </div>
          )
        })}
      </div>

      {/* Renderiza o componente do serviço ativo e o botão de orçamento */}
      {servicoAtivo && (
        <div
          style={{
            marginTop: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          {servicos.find((s) => s.nome === servicoAtivo)?.componente}
          {/* <BtnOrcamento servico={servicoAtivo} user={user} /> */}
          <BtnOrcamento servico={servicoAtivo}/>

        </div>
      )}
    </section>
  )
}

export default Servicos
