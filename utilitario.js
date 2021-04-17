const fs = require('fs');

module.exports = {
ler:async function(){
    const testFolder = './blueprint/';
    
    let itens = {};
    let arquivos = [];
    arquivos = fs.readdirSync(testFolder);
    arquivos.forEach(file=>{
      let f = fs.readFileSync(testFolder+"/"+file,'utf8');
      // console.log(f);
      itens[file.split(".")[0]]=f.split("\r\n");
    });
      
          

    return itens;
}
}





