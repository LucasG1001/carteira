import "../globals.css";
import "../styles/home.css";

import React, { useState } from "react";
import { Mail, Lock, EyeOff, Eye } from "lucide-react"; // Importa os ícones do Lucide

import "./access.css";
import FormEnum from "@/app/enums/FormEnum";
import LoginFormComponent from "../components/form/Access/LoginFormComponent";
import RegisterFormComponent from "../components/form/Access/RegisterFormComponent";
import ModelComponent from "../components/ModelComponent";

const Home = () => {
  const [activeForm, setActiveForm] = useState<FormEnum>(FormEnum.LoginForm)
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
  return (

    <div id='home'>
          {/* <form action="">
            {activeForm == FormEnum.LoginForm && (<LoginFormComponent setForm={setActiveForm}/>)}
            {activeForm == FormEnum.RegisterForm && (<RegisterFormComponent setForm={setActiveForm}/>)}
          </form> */}
          <ModelComponent children={<LoginFormComponent setForm={setActiveForm}/>} closeModal={false}/>
    </div>
  )
}

export default Home