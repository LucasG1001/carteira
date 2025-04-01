import FormEnum from "@/app/enums/FormEnum";
import { Mail, Lock, EyeOff, Eye, EyeClosed } from "lucide-react";
import React, { useState } from "react";

interface Props  {
    setForm: (formEnum: FormEnum) => void;
}

const RegisterFormComponent : React.FC<Props> = ({setForm}) => {
  const [eyeIsClosed, setEyeIsClosed] = useState(true);

  return (
    <form className="login-register">
      <h2>Cadastre-se</h2>
      <div className="input-container">
        <Mail className="icon left" />
        <input type="text" placeholder="E-mail" className="email" />
      </div>
      <div className="input-container">
        <Lock className="icon left" />
        <input
          type={eyeIsClosed ? "password" : "text"}
          placeholder="Senha"
          className="password"
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
      <div className="input-container">
        <Lock className="icon left" />
        <input
          type={eyeIsClosed ? "password" : "text"}
          placeholder="Repita a senha"
          className="password"
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
        <button className="btn">Entrar</button>
        <span onClick={() => setForm(FormEnum.LoginForm)} className="access-lost">Já tem conta ? faça login</span>
      </div>

    </form>
  );
}

export default RegisterFormComponent;
