"use client"
import { useState } from "react";


export default function Home() {

    const [file, setFile] = useState<File | null>(null);
  
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if(event.target.files)
        setFile(event.target.files[0])
    }

    const handleUpload = async (event) => {
      event.preventDefault()
      
      if(!file){
        alert("Selecine um arquivo antes de enviar.")
        return
      }
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("http://localhost:8080/assets",{
          method: "POST",
          body: formData
        });

        if(!response.ok){
          throw new Error("Falha ao enviar o arquivo.")
        }

        alert("Arquivo enviado com sucesso")
        setFile(null)
      } catch (error) {
        console.error("Erro ao enviar arquivo:", error);
        alert("Erro ao enviar o arquivo");
        
      }
    }

  return (
    <div>
      <form action="" onSubmit={handleUpload}>
        <input type="file" accept=".xlsx,.xls" onChange={handleFileChange}/>
        <button type="submit" disabled={!file}>Enviar</button>
      </form>
    </div>
  );
}


