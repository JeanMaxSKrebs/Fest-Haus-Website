import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext"; // hook do contexto

export default function Orcamentos() {
  const { user } = useAuth(); // pega o usuário logado do contexto

  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [servico, setServico] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");

  const carregarOrcamentos = async () => {
    const { data } = await supabase.from("orcamentos").select("*");
    setOrcamentos(data || []);
  };

  const criarOrcamento = async () => {
    if (!user || user.id !== 1) return; // apenas admin
    if (!servico || !descricao) return;

    await supabase.from("orcamentos").insert([
      {
        admin_id: user.id,
        servico,
        descricao,
        preco: parseFloat(preco) || 0,
      },
    ]);

    setServico("");
    setDescricao("");
    setPreco("");
    carregarOrcamentos();
  };

  useEffect(() => {
    if (user && user.id === 1) carregarOrcamentos();
  }, [user]);

  // Apenas admin tem acesso
  if (!user || user.id !== 1)
    return <p>Somente admin pode acessar esta página.</p>;

  return (
    <div className="section">
      <h2>Orçamentos (Admin)</h2>

      <input
        placeholder="Serviço"
        value={servico}
        onChange={(e) => setServico(e.target.value)}
      />
      <input
        placeholder="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />
      <input
        placeholder="Preço"
        type="number"
        value={preco}
        onChange={(e) => setPreco(e.target.value)}
      />
      <button onClick={criarOrcamento}>Criar Orçamento</button>

      <h3>Orçamentos existentes</h3>
      <ul>
        {orcamentos.map((o) => (
          <li key={o.id}>
            {o.servico} - {o.descricao} - R${o.preco}
          </li>
        ))}
      </ul>
    </div>
  );
}
