const fs = require('fs');
const https = require('https');
const youtubedl = require('youtube-dl-exec');
const fetch = require('node-fetch');



module.exports={
    baixar:async function (caminho,destino,diretorio){//link do video,onde salvar,diretorio criado la dentro
        if (!fs.existsSync('./videosCompletos/'+diretorio)){
            fs.mkdirSync('./videosCompletos/'+diretorio);
        }

        let output = await 
        youtubedl(caminho, {
            dumpJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
            referer: caminho
          });
            
        obterMaiorEbaixar(output,destino);
                
    }
}

 
async function obterMaiorEbaixar(out,destino){
    let maior = 0;
    let link = null;
    let acodec = null;
    let ultimo = null;
    out.formats.forEach(f=>{
        if(f.format.includes('p') && (f.acodec+'').includes('mp4') && f.height>359){
            ultimo = f;
            console.log("((",f.format,"))",f.acodec,f.height);
        }

        
        
    });

    await novoSave(ultimo.url,destino);
}


async function s(link,nome){
    await https.get(link,(res) => {
        const path = nome; 
        const filePath = fs.createWriteStream(path);
        res.pipe(filePath);
        filePath.on('finish',() => {
            filePath.close();
            
            console.log("arquivo Salvo >>",nome);
        })
    })
}

async function novoSave(url,path){
    return (async (url, path) => {
        const res = await fetch(url);
        const fileStream = fs.createWriteStream(path);
        await new Promise((resolve, reject) => {
            res.body.pipe(fileStream);
            res.body.on("error", reject);
            fileStream.on("finish", resolve);
          });
      });
}

