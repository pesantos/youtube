'use strict';
const copiador = require('./copiador.js');
const concat = require('ffmpeg-concat');
const baixador = require('./baixador.js');
const fs = require('fs');
let util = require('./utilitario.js');

 
let videoStitch = require('video-stitch');
  
let videoCut = videoStitch.cut;

   

  function gerarCorte(arquivo,inicio,fim){
    iniciarCorte(arquivo,inicio,fim);
  }

  function removerPontos(string){
    return string.split(':').join("-");
  }

  

  function iniciarCorte(arquivo,inicio,fim,local,mens){// arquivo completo - timeInicio - timeFim - pastaDoArtista - mensagem corte

    if (!fs.existsSync('./cortes/'+local)){
      fs.mkdirSync('./cortes/'+local);
    }

    console.log("iniciando corte",arquivo,inicio,fim,local,mens);

    
    videoCut({
      silent: true // optional. if set to false, gives detailed output on console
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
        console.log("resultado",videoClips);
        let nomeArq = removerPontos(inicio)+'ate'+removerPontos(fim);
        if (!fs.existsSync('./cortes/'+local+"/"+nomeArq)){
          fs.mkdirSync('./cortes/'+local+"/"+nomeArq);
        }

       copiador(videoClips[1].fileName,'./cortes/'+local+"/"+nomeArq+"/"+nomeArq+'.mp4',()=>{});
       fs.writeFileSync('./cortes/'+local+"/"+nomeArq+"/mensagem.txt", mens);
       console.log("Fim do processo");
    });
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

  async function lerEProcessar(){
    let necessarioVideo = true;

    let ob = await util.ler();
    console.log(ob);
    let cvideo = ob['dados'][0].split(',')[0];
    let ccaminho = ob['dados'][0].split(',')[1];

    if(jaTemVideo(ccaminho))necessarioVideo = false;


    console.log(cvideo,ccaminho);
    let cont = 1;
    for(let i = 0; i<ob['dados'].length; i++){
     let ped = ob['dados'][i];
      let p = ped.split(',');
      if(cont==1 && necessarioVideo) await baixador.baixar(cvideo,'./videosCompletos/'+ccaminho+'/videoCompleto.mp4',ccaminho);
      if(cont>1){
        console.log(p);
        iniciarCorte('./videosCompletos/'+ccaminho+'/videoCompleto.mp4',p[0],p[1],ccaminho,p[2]);
      }
      cont++;
    }
    
  }

  lerEProcessar();

  



    