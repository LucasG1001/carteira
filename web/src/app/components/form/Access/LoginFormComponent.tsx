import FormEnum from "@/app/enums/FormEnum";
import HttpService from "@/app/services/HttpService";
import { Eye, EyeOff, Lock, Mail} from "lucide-react";
import React, { useState } from "react";

interface Props  {
    setForm: (formEnum: FormEnum) => void;
}

const LoginFormComponent: React.FC<Props>= ({setForm}) => {
  const [eyeIsClosed, setEyeIsClosed] = useState<boolean>(true);

  const handleSubmit = () => {
    console.log("json");

    const httpService = new HttpService()
    // httpService.get('http://localhost:8000/auth/login/google')
    window.location.href = 'http://localhost:8080/auth/login/google'
    // httpService.get('http://localhost:8000/auth')

  }

  return (
    <div className="login-register">
      <h2>Acesse seus investimentos</h2>
      <div className="input-container">
        <Mail className="icon left" />
        <input className="email" type="text" placeholder="E-mail" />
      </div>
      <div className="input-container">
        <Lock className="icon left" />
        <input
          className="password"
          type={eyeIsClosed ? "password" : "text"}
          placeholder="Senha"
        />

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
        <button className="btn" onClick={handleSubmit}>Entrar</button>
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

      <button className="btn signup-btn" onClick={() => setForm(FormEnum.RegisterForm)}>Cadastre-se</button>
    </div>
  );
};

export default LoginFormComponent;
