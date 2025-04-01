import React, { useState } from "react";
import { Mail, Lock, EyeOff, Eye } from "lucide-react"; // Importa os ícones do Lucide

import "./access.css";
import LoginFormComponent from "./LoginFormComponent";
import RegisterFormComponent from "./RegisterFormComponent";
import FormEnum from "@/app/enums/FormEnum";

const AccessFormComponent = () => {
  const [activeForm, setActiveForm] = useState<FormEnum>(FormEnum.LoginForm)
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false)

  console.log(FormEnum.LoginForm)
  return (
    <form>
      {activeForm == FormEnum.LoginForm && (<LoginFormComponent setForm={setActiveForm}/>)}
      {activeForm == FormEnum.RegisterForm && (<RegisterFormComponent setForm={setActiveForm}/>)}
    </form>
  );
};

export default AccessFormComponent;
