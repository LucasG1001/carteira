class HttpService {

    async get(url: string){
        const response = await fetch(url)
        console.log(response);
        
        const json = await response.json()
        return json
    }
}

export default HttpService