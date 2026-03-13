import { useEffect, useState } from "react";
import { getDatasOcupadas } from "../services/googleCalendarService";

interface Props {
  value: string;
  onChange: (data: string) => void;
}

export default function Calendar({ value, onChange }: Props) {
  const [datasOcupadas, setDatasOcupadas] = useState<string[]>([]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const datas = await getDatasOcupadas();

      // 🔥 Normaliza todas as datas para YYYY-MM-DD
      const datasFormatadas = datas.map((data: string) =>
        data.includes("T") ? data.split("T")[0] : data
      );

      setDatasOcupadas(datasFormatadas);
    } catch (error) {
      console.error("Erro ao carregar datas ocupadas", error);
    }
  }

  const hoje = new Date().toISOString().split("T")[0];

  const dataIndisponivel = value && datasOcupadas.includes(value);

  return (
    <div style={{ width: "100%" }}>
      <input
        type="date"
        value={value}
        min={hoje}
        onChange={(e) => {
          const dataSelecionada = e.target.value;

          if (datasOcupadas.includes(dataSelecionada)) {
            alert("Essa data já está reservada.");
            return;
          }

          onChange(dataSelecionada);
        }}
        className="input"
      />

      {dataIndisponivel && (
        <p style={{ color: "var(--primary-color)", marginTop: "5px" }}>
          Data já reservada
        </p>
      )}
    </div>
  );
}