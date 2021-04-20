'use strict';
let util = require('./utilitario.js');
const copiador = require('./copiador.js');
const https = require('https');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const videoStitch = require('video-stitch');
const videoCut = videoStitch.cut;
let threads = 3;

let ob = null;
let cvideo = null;
let ccaminho = null;


console.log("Iniciando processo de ripagem...");

async function iniciar(){
    ob = await util.ler();
    cvideo = ob['blueprint'][0].split(';')[0];
    ccaminho = ob['blueprint'][0].split(';')[1];
    threads = parseInt((ob['blueprint'][0].split(';')[2])+'');

    loop();
}

async function loop(){
    if(jaTemVideo(ccaminho)){
        console.log("Processando cortes... ("+threads+") de cada vez.");
        processarCortes();
    
    }else{
        console.log("Tentando baixar video, aguarde...");
        await baixar(cvideo,'./videosCompletos/'+ccaminho+'/videoCompleto.mp4',ccaminho);
        
        
    }
}

async function baixar(caminho,destino,diretorio){
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

let buff = [];

async function processarCortes(){
    let cont = 1;
    let corte = 1;
    for(let i = 0; i<ob['blueprint'].length; i++){
     let ped = ob['blueprint'][i];
      let p = ped.split(';');
      
      if(cont>1){
        buff.push({a:'./videosCompletos/'+ccaminho+'/videoCompleto.mp4',b:p[0],c:p[1],d:ccaminho,e:p[2],f:corte});
        //iniciarCorte('./videosCompletos/'+ccaminho+'/videoCompleto.mp4',p[0],p[1],ccaminho,p[2],corte);
        corte = corte+1;
      }
      cont++;
    }

    buff = buff.reverse();
    pFila();
}

let processados = 0;
async function pFila(){
    for(let i = 0;i<threads;i++){
        let t = buff.pop();
        // console.log(">>",t);
        if(t){
            iniciarCorte(t.a,t.b,t.c,t.d,t.e,t.f);
        }
        
    }
}

function removerPontos(string){
    return string.split(':').join("-");
  }

async function obterMaiorEbaixar(out,destino){
    let ultimo = null;

    out.formats.forEach(f=>{
        if(f.format.includes('p') && (f.acodec+'').includes('mp4') && f.height>359){
            ultimo = f;
            console.log("((",f.format,"))",f.acodec,f.height);
        }
    });

    await s(ultimo.url,destino);
}

async function s(link,nome){
    await https.get(link,(res) => {
        const path = nome; 
        const filePath = fs.createWriteStream(path);
        res.pipe(filePath);
        filePath.on('finish',() => {
            filePath.close();
            console.log("arquivo Salvo em: ",nome);
            chamarLoop();
        })
    })
}

function chamarLoop(){
    setTimeout(()=>{loop()},4000);
}




function jaTemVideo(ccaminho){// checa se já tem o video completo
    if (fs.existsSync('./videosCompletos/'+ccaminho+'/videoCompleto.mp4')){
      let stats = fs.statSync('./videosCompletos/'+ccaminho+'/videoCompleto.mp4')
      let fileSizeInBytes = stats.size;
      let fileSizeInMegabytes = fileSizeInBytes / (1024*1024);

      if(fileSizeInMegabytes>5){
        return true;
      }else{
        fs.unlinkSync('./videosCompletos/'+ccaminho+'/videoCompleto.mp4'); // joga fora o arquivo vazio
        return false;
      }
      
    }
    return false;
  }

  function iniciarCorte(arquivo,inicio,fim,local,mens,numeroCorte){// arquivo completo - timeInicio - timeFim - pastaDoArtista - mensagem corte

    if (!fs.existsSync('./cortes/'+local)){
      fs.mkdirSync('./cortes/'+local);
    }

    console.log("iniciando corte Nº "+numeroCorte,inicio,fim,local);
    
    videoCut({
      silent: true 
    })
    .original({
      "fileName": arquivo,
      "duration": fim
    }).exclude([
        {
          "startTime": "00:00:00",
          "duration":inicio
        }
      ]).cut().then((videoClips) => {
        // console.log("resultado",videoClips);
        let nomeArq = removerPontos(inicio)+'ate'+removerPontos(fim);
        if (!fs.existsSync('./cortes/'+local+"/"+nomeArq)){
          fs.mkdirSync('./cortes/'+local+"/"+nomeArq);
        }

       copiador(videoClips[1].fileName,'./cortes/'+local+"/"+nomeArq+"/"+nomeArq+'.mp4',()=>{});
       fs.writeFileSync('./cortes/'+local+"/"+nomeArq+"/mensagem.txt", mens);
       console.log("Finalizou Corte Nº "+numeroCorte);
       processados++;
       if(processados==threads){
           processados = 0;
           pFila();  
       }
    });
  }


  iniciar();