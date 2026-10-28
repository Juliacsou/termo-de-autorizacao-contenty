import { PDFDocument, PDFName, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { supabase, requireData } from './supabase';
import { downloadBlob, safeName } from './utils';

let templateBufferPromise;
async function templateBytes(){
  if(!templateBufferPromise) templateBufferPromise=fetch(`${import.meta.env.BASE_URL}modelo-autorizacao.pdf`).then(r=>{if(!r.ok)throw new Error('Não foi possível carregar o termo original.');return r.arrayBuffer();});
  return templateBufferPromise;
}
const cleanText=s=>String(s||'').replace(/[\n\r\t]/g,' ').replace(/[^\u0020-\u00FF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013-\u201E\u2020-\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]/g,'?').trim();
const asBytes=async path=>{const {data,error}=await supabase.storage.from('assinaturas').download(path);if(error)throw new Error(`Assinatura indisponível: ${error.message}`);return new Uint8Array(await data.arrayBuffer());};
const dateOnly=s=>s?new Date(s).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}):'';

export async function generatePdf(person){
  const pdf=await PDFDocument.load(await templateBytes(),{updateMetadata:false});
  const page=pdf.getPages()[0];
  // O PDF recebido tem quatro anotações de exemplo e um widget de assinatura vazio.
  // Remove apenas as anotações interativas; não altera os termos impressos na página.
  page.node.delete(PDFName.of('Annots'));
  const font=await pdf.embedFont(StandardFonts.Helvetica);
  const black=rgb(.07,.09,.11);
  const pw=page.getWidth(),ph=page.getHeight();
  const field=(raw,x,top,maxWidth,size=17)=>{
    const value=cleanText(raw);
    if(!value)return;
    let s=size;
    while(s>10 && font.widthOfTextAtSize(value,s)>maxWidth)s-=.5;
    let out=value;
    if(font.widthOfTextAtSize(out,s)>maxWidth){
      while(out.length>2&&font.widthOfTextAtSize(out+'...',s)>maxWidth)out=out.slice(0,-1);
      out=out+'...';
    }
    page.drawText(out,{x,y:ph-top,size:s,font,color:black});
  };
  const image=await pdf.embedPng(await asBytes(person.signature_path));
  const signature=(x,top,width,height)=>{
    const scale=Math.min(width/image.width,height/image.height);
    const w=image.width*scale,h=image.height*scale;
    page.drawImage(image,{x,y:ph-top-h,width:w,height:h});
  };
  field(person.full_name,61,283,550);
  field(person.phone,635,282,285);
  field(person.address,60,325,558,15.5);
  const date=dateOnly(person.signed_at);
  field(date,745,993,155,16);
  if(person.is_minor){
    field(person.guardian_name,59,1182,327,14.5);
    field(date,744,1182,172,15);
    field(person.guardian_address,59,1222,670,14.5);
    field(person.guardian_phone,745,1222,190,14.5);
    signature(405,1162,311,28);
  }else{
    signature(128,970,570,32);
  }
  return new Blob([await pdf.save()],{type:'application/pdf'});
}

export async function downloadPerson(person){
  const blob=await generatePdf(person);
  downloadBlob(blob,`autorizacao-${safeName(person.full_name)}-${person.id.slice(0,8)}.pdf`);
}

export async function downloadAll(project,people,onProgress=()=>{}){
  if(!people.length)throw new Error('Nenhuma autorização para exportar.');
  const zip=new JSZip();
  for(let i=0;i<people.length;i++){
    const p=people[i];
    const pdf=await generatePdf(p);
    zip.file(`${String(i+1).padStart(3,'0')}-${safeName(p.full_name)}-${p.id.slice(0,8)}.pdf`,pdf);
    onProgress(Math.round((i+1)/people.length*90));
  }
  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:3}},meta=>onProgress(90+Math.round(meta.percent/10)));
  downloadBlob(blob,`autorizacoes-${safeName(project.name)}.zip`);
}
