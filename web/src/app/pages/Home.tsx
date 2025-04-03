import "../globals.css";
import "../styles/home.css";

import React, { useState } from "react";

import "./access.css";
import FormEnum from "@/app/enums/FormEnum";
import LoginFormComponent from "../components/form/Access/LoginFormComponent";
import ModalComponent from "../components/ModalComponent";

const Home = () => {
  const [activeForm, setActiveForm] = useState<FormEnum>(FormEnum.LoginForm)
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
  return (

    <div id='home'>
          {/* <form action="">
            {activeForm == FormEnum.LoginForm && (<LoginFormComponent setForm={setActiveForm}/>)}
            {activeForm == FormEnum.RegisterForm && (<RegisterFormComponent setForm={setActiveForm}/>)}
          </form> */}
          <ModalComponent children={<LoginFormComponent setForm={setActiveForm}/>} closeModal={false}/>
    </div>
  )
}

export default Home