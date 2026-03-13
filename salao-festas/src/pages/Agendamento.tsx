import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Calendar from "../components/Calendar";

export default function Agendamentos() {
  const { user } = useAuth();

  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [servico, setServico] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [hora, setHora] = useState("18:00");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarAgendamentos();
  }, [user]);

  /* ================================
     CARREGAR AGENDAMENTOS DO BACKEND
  ================================= */
  const carregarAgendamentos = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/agendamentos/usuario/${user.id}`
      );
      console.log(user.id);

      if (!response.ok) throw new Error("Erro ao buscar agendamentos");

      const data = await response.json();
      setAgendamentos(data);
    } catch (error) {
      console.error(error);
    }
  };

  /* ================================
     CRIAR AGENDAMENTO
  ================================= */
  const criarAgendamento = async () => {
    if (!servico || !dataEvento) {
      alert("Preencha todos os campos");
      return;
    }

    if (!user) {
      alert("Faça login primeiro");
      return;
    }

    setLoading(true);

    try {
      const dataCompleta = `${dataEvento}T${hora}:00`;

      const response = await fetch(
        "http://localhost:3001/api/agendamentos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuario_id: user.id,
            servico,
            data_evento: dataCompleta,
            mensagem,
          }),
        }
      );

      if (!response.ok) throw new Error("Erro ao criar agendamento");

      setServico("");
      setDataEvento("");
      setMensagem("");

      await carregarAgendamentos();
    } catch (error: any) {
      alert(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="section">
      {/* ================= NOVO AGENDAMENTO ================= */}
      <div className="agendamento-card">
        <h2 className="title">Novo Agendamento</h2>

        <div className="form-group">
          <label>Serviço</label>
          <input
            className="input"
            value={servico}
            onChange={(e) => setServico(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Data</label>
          <Calendar value={dataEvento} onChange={setDataEvento} />
        </div>

        <div className="form-group">
          <label>Horário</label>
          <input
            type="time"
            className="input"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Mensagem</label>
          <textarea
            className="input"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
        </div>

        <button
          className="btn-primary"
          onClick={criarAgendamento}
          disabled={loading}
        >
          {loading ? "Agendando..." : "Agendar"}
        </button>
      </div>

      {/* ================= GOOGLE CALENDAR EMBED ================= */}
      <div className="calendar-container">
        <iframe
          src="https://calendar.google.com/calendar/embed?src=33d3167b65904a84f19769c29ee063e5bcba4442a534a269348de777388ec673%40group.calendar.google.com&ctz=America%2FSao_Paulo"
          width="100%"
          height="600"
          style={{ border: 0, borderRadius: "12px" }}
          title="Calendário Fest Haus"
        />
      </div>

      {/* ================= LISTA DO USUÁRIO ================= */}
      <h2 className="title" style={{ marginTop: "50px" }}>
        Seus Agendamentos
      </h2>

      <div className="grid agendamentos-grid">
        {agendamentos.length === 0 && (
          <p className="empty-text">
            Você ainda não possui agendamentos.
          </p>
        )}

        {agendamentos.map((a) => (
          <div key={a.id} className="card agendamento-item">
            <h3>{a.servico}</h3>

            <p className="data">
              {new Date(a.data_evento).toLocaleString("pt-BR")}
            </p>

            {a.mensagem && <p>{a.mensagem}</p>}

            {/* STATUS */}
            <p
              className={`status ${a.status === "aprovado" ? "aprovado" : "em_processo"
                }`}
            >
              {a.status === "aprovado"
                ? "✅ Aprovado"
                : "⏳ Em análise"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}