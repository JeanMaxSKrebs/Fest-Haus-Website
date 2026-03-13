import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Calendar from "../components/Calendar";

export default function Visitas() {
  const { user } = useAuth();

  const [visitas, setVisitas] = useState<any[]>([]);
  const [dataVisita, setDataVisita] = useState("");
  const [hora, setHora] = useState("10:00");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarVisitas();
  }, [user]);

  const carregarVisitas = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/visitas/usuario/${user.id}`
      );
      if (!response.ok) throw new Error("Erro ao buscar visitas");

      const data = await response.json();
      setVisitas(data);
    } catch (error) {
      console.error(error);
    }
  };

  const criarVisita = async () => {
    if (!dataVisita) {
      alert("Escolha a data da visita");
      return;
    }
    if (!user) {
      alert("Faça login primeiro");
      return;
    }

    setLoading(true);

    try {
      const dataCompleta = `${dataVisita}T${hora}:00`;

      const response = await fetch("http://localhost:3001/api/visitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: user.id,
          data_visita: dataCompleta,
          mensagem,
        }),
      });

      if (!response.ok) throw new Error("Erro ao solicitar visita");

      setDataVisita("");
      setMensagem("");
      setHora("10:00");

      await carregarVisitas();
    } catch (error: any) {
      alert(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="section">
      {/* ================= NOVA VISITA ================= */}
      <div className="agendamento-card">
        <h2 className="title">Solicitar Visita</h2>

        <div className="form-group">
          <label>Data</label>
          <Calendar value={dataVisita} onChange={setDataVisita} />
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
          onClick={criarVisita}
          disabled={loading}
        >
          {loading ? "Enviando..." : "Solicitar Visita"}
        </button>
      </div>

      {/* ================= LISTA DE VISITAS ================= */}
      <h2 className="title" style={{ marginTop: "50px" }}>
        Minhas Visitas
      </h2>

      <div className="grid agendamentos-grid">
        {visitas.length === 0 && (
          <p className="empty-text">Você ainda não solicitou visitas.</p>
        )}

        {visitas.map((v) => (
          <div key={v.id} className="card agendamento-item">
            <p className="data">
              {new Date(v.data_visita).toLocaleString("pt-BR")}
            </p>
            {v.mensagem && <p>{v.mensagem}</p>}
            <p>
              {v.status === "aprovado" ? "✅ Aprovada" : "⏳ Em análise"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}