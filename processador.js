'use strict';
let utili = require('./utilitario.js');
const copiador = require('./copiador.js');
const https = require('https');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const videoStitch = require('video-stitch');
let dao = require('./comunicador.js');
const videoCut = videoStitch.cut;
let threads = 3;
const util = require('util');
const exec = util.promisify(require('child_process').exec);

let resolucao = 1;
let ob = null;
let cvideo = null;//link youtube
let ccaminho = null;//artista
let ident = 'Kevin';
let dados = {
  video:null,
  formato:null
};

let va = 0;
let links = [];


console.log("Iniciando processo de ripagem...");
if(resolucao==1){
  console.log("Resolução 720p 30fps -- Modo Performance");
}else{
  console.log("Resolução 1080p 60fps(Quando disponível) -- Modo Qualidade - Download Lento");
}
console.time('execucao');
async function iniciar(){
    ob = await utili.ler();
    cvideo = ob['blueprint'][0].split(';')[0];
    ccaminho = ob['blueprint'][0].split(';')[1];
    threads = parseInt((ob['blueprint'][0].split(';')[2])+'');

    loop();
}

function gerarDiretorio(dir){
  if (!fs.existsSync('./'+dir)){
    fs.mkdirSync('./'+dir);
  }
}

gerarDiretorio('videosCompletos');
gerarDiretorio('cortes');
gerarDiretorio('blueprint');
gerarDiretorio('pedacos');


async function loop(){
    if(jaTemVideo(ccaminho)){
        console.log("Processando cortes... ("+threads+") de cada vez.");
        processarCortes();
    
    }else{
        console.log("Tentando baixar video, aguarde...");
        await baixar(cvideo,'./videosCompletos/'+ccaminho+'/videoCompleto.mp4',ccaminho);
        
        
    }
}

// async function baixar(caminho,destino,diretorio){
    

//     let output = await 
//     youtubedl(caminho, {
//         dumpJson: true,
//         noWarnings: true,
//         noCallHome: true,
//         noCheckCertificate: true,
//         preferFreeFormats: true,
//         youtubeSkipDashManifest: true,
//         referer: caminho
//       });
        
//     baixar(output,destino,diretorio);
// }

let buff = [];
let quantidadeProcessos = 0;
let quantidadeProcessados = 0;
async function processarCortes(){
    let cont = 1;
    let corte = 1;
    for(let i = 0; i<ob['blueprint'].length; i++){
     let ped = ob['blueprint'][i];
      let p = ped.split(';');
      
      if(cont>1){
        buff.push({a:'./videosCompletos/'+ccaminho+'/videoCompleto.mp4',b:p[0],c:p[1],d:ccaminho,e:p[2],f:corte});
        quantidadeProcessos++;
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
          processarCortePreciso(t.a,t.b,t.c,t.d,t.e,t.f);
        }
        
    }

    
}

function processarCortePreciso(a,b,c,d,e,f){
  // console.log("a->"+a,"b->"+b,"c->"+c,"d->"+d,"e->"+e,"f->"+f);
  cortePreciso(a,b,c,d,f,e);
}

function removerPontos(string){
    return string.split(':').join("-");
  }



async function registrar(form){
  let dados = {
    video:ccaminho,
    formato:form,
    identidade:ident
  }
  let res = await dao.submeter(dados,'beludo');
  // console.log("Registro",res);
  if(res['resposta']=='autorizado')return false;

  return true;
}

// async function s(link,nome){
//     registrar();
//     await https.get(link,(res) => {
//         const path = nome; 
//         const filePath = fs.createWriteStream(path);
//         res.pipe(filePath);
//         filePath.on('finish',() => {
//             filePath.close();
//             console.log("arquivo Salvo em: ",nome);
//             chamarLoop();
//         })
//     })
// }

async function s(link,onde,formato,diretorio){
  gerarDiretorio('./videosCompletos/'+diretorio);
   if(await registrar(formato)){
     console.log("Problema na autenticação.");
     return;
   }

  console.log("Salvando... ("+onde+")["+formato+"]");
  
   https.get(link,(res) => {
      const path = onde; 
      const filePath = fs.createWriteStream(path);
      res.pipe(filePath);
      filePath.on('finish',() => {
          filePath.close();
          console.log("arquivo Salvo em: ",onde);
          va++;


          //retirar esse bloco para utilizar o AWAIT NO JUNTADOR
          if(links.length == 1){
            //iniciar cortes
            console.log("punico")
            copiador('./pedacos/video.mp4','./videosCompletos/'+diretorio+'/videoCompleto.mp4',()=>{});
            chamarLoop();
          }
          if(va==links.length && links.length>1){
            console.log("pjunto");
            pjunto(diretorio);
          }
          
      });

      
  });
}

async function pjunto(diretorio){
  await juntar('./pedacos/video.mp4','./pedacos/audio.mp3','./pedacos/produto.mp4');
  copiador('./pedacos/produto.mp4','./videosCompletos/'+diretorio+'/videoCompleto.mp4',()=>{});
  fs.unlinkSync('./pedacos/video.mp4');
  fs.unlinkSync('./pedacos/audio.mp3');
  chamarLoop();
}

async function baixar(caminho,onde,diretorio){
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

  //   console.log(output);
    let ped = output.format.split("+");
    
    let aquele = null;
    output.formats.forEach(fo=>{

      if(resolucao==1){
        if(fo.format.includes('(720p)') && fo.acodec.includes('mp')){
          aquele = fo;
        }
      }else{
        if(fo.format==ped[0])links.push({link:fo.url,formato:fo.format});
        if(ped[1] && ped[1]==fo.format)links.push({link:fo.url,formato:fo.format,tipo:fo.format.includes('audio')?'audio':'video'});
      }

      
    });

    if(aquele){
      links = [];
      links.push({link:aquele.url,formato:aquele.format,tipo:aquele.format.includes('audio')?'audio':'video'});
    }

  //   console.log(links);

    for(let l of links){
        if (l.tipo=='audio'){
          await s(l.link,'./pedacos/audio.mp3',l.formato,diretorio);
        }else{
          
          await s(l.link,'./pedacos/video.mp4',l.formato,diretorio);
        }
        
      }
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
       quantidadeProcessados++;
       processados++;

       if(quantidadeProcessados==(quantidadeProcessos)){
        console.log("Final da tarefa alcançado.");
        console.log("tempo de Execução (milisegundos): ",console.timeEnd('execucao'));
        finalizar();
      }

       if(processados==threads){
           processados = 0;
           pFila();  
       }
    });
  }

  function finalizar(){
    if (!fs.existsSync('./blueprintsFinalizados')){
      fs.mkdirSync('./blueprintsFinalizados');
    }
    copiador('./blueprint/blueprint.txt','./blueprintsFinalizados/'+ccaminho+'.txt',()=>{});
  }

  async function juntar(video,audio,onde){
    console.log("*Juntando Arquivo de Video e o de Audio...")
    let res = await executar('ffmpeg -i '+video+' -i '+audio+' -c:v copy -c:a aac '+onde);
    console.log("OK--Arquivo Unificado.");
  }
  
  async function executar(comando){
    try {
      const res = await exec(comando);
      return res;
  
    } catch (e) {
      console.error(e); // should contain code (exit code) and signal (that caused the termination).
    }
  }

  async function cortePreciso(video,inicio,final,artista,numero,mensagem){
    let nomePasta = removerPontos(inicio+"-"+final);
    gerarDiretorio("cortes/"+artista);
    gerarDiretorio("cortes/"+artista+"/"+nomePasta);
    console.log("Cortando corte Nº "+numero+" ("+inicio+" - "+final+")...");
    let resposta = await executar("ffmpeg -ss "+inicio+" -i "+video+" -to "+final+" -c copy -copyts "+"./cortes/"+artista+"/"+nomePasta+"/"+nomePasta+".mp4");
    console.log("Corte Nº "+numero+" finalizado.");
    fs.writeFileSync('./cortes/'+artista+"/"+nomePasta+"/mensagem.txt", mensagem);// escreve o texto
    processados++;
    quantidadeProcessados++;

    if(quantidadeProcessados==(quantidadeProcessos)){
      console.log("Final da tarefa alcançado.");
      console.log("tempo de Execução (milisegundos): ",console.timeEnd('execucao'));
      finalizar();
    }

     if(processados==threads){
         processados = 0;
         pFila();  
     }
}


  iniciar();