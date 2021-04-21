
const fetch = require("node-fetch");
const servidor = "https://www.sapocomprador.com.br/controler.php";


module.exports = {

     submeter: async function (dad,ac) {
      //  console.log("SUBMETENDO>> "+ac);
       let dd = dad;
      //  let dd = JSON.parse(dad);
      //  dd["seguranca"] = 'sim';

      //  console.log("O DD",dd);
       
        let conteudo = {acao:ac,dados:dd};
        //  console.log("Content>>>",conteudo);
        const rawResponse = await fetch(servidor, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(conteudo)
        });
        //console.log("RAW:",rawResponse);
        const content = await rawResponse.json();
      
        return content;
      },

      submeterDestino: async function (dad,ac,destino) {
        // console.log("SUBMETENDO>> "+ac,destino );
        let dd = JSON.parse(dad);
        dd["seguranca"] = 'sim';
 
        // console.log("O DD",dd);
        
         let conteudo = {acao:ac,dados:JSON.stringify(dd),seguranca:'sim'};
          // console.log("Content>>>",conteudo);
         const rawResponse = await fetch(destino, {
           method: 'POST',
           headers: {
             'Accept': 'application/json',
             'Content-Type': 'application/json'
           },
           body: JSON.stringify(conteudo)
         });

        const content = await rawResponse.json();
       
        return content;
       }



   



};