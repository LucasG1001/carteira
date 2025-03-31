import React, { useState } from "react";
import { Mail, Lock, EyeOff, Eye } from "lucide-react"; // Importa os ícones do Lucide

import "./access.css";

const AccessFormComponent = () => {
  const [eyeIsClosed, setEyeIsClosed] = useState<boolean>(true);

  return (
    <form action="" className="login-register">
      <h2>Acesse seus investimentos</h2>
      <div className="input-container">
        <Mail className="icon left" />
        <input className="email" type="text" placeholder="E-mail" />
      </div>
      <div className="input-container">
        <Lock className="icon left" />
        <input className="password" type={eyeIsClosed ? "password" : "text"} placeholder="Senha" />

        {eyeIsClosed ? (
          <EyeOff
            onClick={() => setEyeIsClosed(!eyeIsClosed)}
            className="icon eye"
          />
        ) : (
          <Eye
            onClick={() => setEyeIsClosed(!eyeIsClosed)}
            className="icon eye"
          />
        )}
      </div>

      <div className="access">
        <button className="btn">Entrar</button>
        <span className="access-lost">Esqueceu a senha?</span>
      </div>

      <div className="separator">
        <span>Ou</span>
      </div>

      <button className="btn google-btn">
        <img src="/logo-google.png" alt="Google" />
        Entrar com Google
      </button>

      <div className="separator">
        <span>Ainda não tem conta ?</span>
      </div>

      <button className="btn signup-btn">Cadastre-se</button>
    </form>
  );
};

export default AccessFormComponent;
