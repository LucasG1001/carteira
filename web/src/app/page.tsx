"use client"
import { useState } from "react";
import './styles/home/home.css'
import AccessFormComponent from "./components/form/Access/AccessFormComponent";


export default function Home() {

  return (
    <div className="container">
      <div></div>
      <AccessFormComponent/>
    </div>
  );
}


