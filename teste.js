const videoStitch = require('video-stitch');
const https = require('https');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

let video = "https://www.youtube.com/watch?v=tjyd82l3TOc";

let va = 0;
let links = [];
async function baixar(caminho){
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
      

      output.formats.forEach(fo=>{
        if(fo.format==ped[0])links.push({link:fo.url,formato:fo.format});
        if(ped[1] && ped[1]==fo.format)links.push({link:fo.url,formato:fo.format,tipo:fo.format.includes('audio')?'audio':'video'});
      });

    //   console.log(links);

      for(let l of links){
          if (l.tipo=='audio'){
            await s(l.link,'./teste/audio.mp3',l.formato);
          }else{
            await s(l.link,'./teste/video.mp4',l.formato);
          }
          
        }
}

async function s(link,onde,formato){
    console.log("Salvando... ("+onde+")["+formato+"]");
    await https.get(link,(res) => {
        const path = onde; 
        const filePath = fs.createWriteStream(path);
        res.pipe(filePath);
        filePath.on('finish',() => {
            filePath.close();
            console.log("arquivo Salvo em: ",onde);
            va++;

            if(links.length == 1){
              //iniciar cortes
            }
            if(va==links.length){
              juntar();
            }
            
        });

        
    });
}

// baixar(video);

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



async function testarJuntamento(){
  console.log("Antes");
 awaitjuntar('./pedacos/video.mp4','./pedacos/audio.mp3','./pedacos/produto.mp4');
console.log("Depois");
}

//ffmpeg -i video.mp4 -i audio.wav -c:v copy -c:a aac output.mp4