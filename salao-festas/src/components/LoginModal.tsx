import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FcGoogle } from "react-icons/fc";

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { login, signup, loginWithGoogle } = useAuth();
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");

  const handleSubmit = async () => {
    try {
      // Validações separadas
      if (modo === "login") {
        if (!email || !senha) {
          setMensagem("Email e senha são obrigatórios!");
          return;
        }
        await login(email, senha);
      } else {
        if (!nome || !telefone || !email || !senha) {
          setMensagem("Nome, telefone, email e senha são obrigatórios!");
          return;
        }
        await signup(email, senha, nome, telefone); // endereço opcional
      }
      onClose();
    } catch (error: any) {
      setMensagem(error.message || "Erro ao autenticar!");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "10px",
          width: "350px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ textAlign: "center" }}>
          {modo === "login" ? "Login" : "Cadastro"}
        </h2>

        {modo === "cadastro" && (
          <>
            <input
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
            />
            <input
              placeholder="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
        />

        <button
          onClick={handleSubmit}
          style={{ width: "100%", marginBottom: "10px", padding: "10px" }}
        >
          {modo === "login" ? "Entrar" : "Cadastrar"}
        </button>

        <button
          onClick={loginWithGoogle}
          style={{
            width: "100%",
            background: "white",
            color: "#444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "500"
          }}
        >
          <FcGoogle size={20} />
          Entrar com Google
        </button>
        <p
          style={{ textAlign: "center", cursor: "pointer" }}
          onClick={() => {
            setMensagem("");
            setModo(modo === "login" ? "cadastro" : "login");
          }}
        >
          {modo === "login"
            ? "Não tem conta? Cadastrar"
            : "Já tem conta? Entrar"}
        </p>

        {mensagem && (
          <p style={{ color: "red", textAlign: "center" }}>{mensagem}</p>
        )}
      </div>
    </div>
  );
}
