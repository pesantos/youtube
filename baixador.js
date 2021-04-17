const fs = require('fs');
const https = require('https');
const youtubedl = require('youtube-dl-exec');



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

    s(ultimo.url,destino);
}


async function s(link,nome){
    https.get(link,(res) => {
        const path = nome; 
        const filePath = fs.createWriteStream(path);
        res.pipe(filePath);
        filePath.on('finish',() => {
            filePath.close();
            
            console.log("arquivo Salvo >>",nome);
        })
    })
}

