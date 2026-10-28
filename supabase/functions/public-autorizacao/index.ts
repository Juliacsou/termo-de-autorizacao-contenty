import { withSupabase } from 'npm:@supabase/server@1';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'GET, POST, OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});
const bad=(message:string,status=400)=>json({error:message},status);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const string=(v:unknown,max:number)=>typeof v==='string'?v.trim().slice(0,max):'';
const phoneValid=(s:string)=>/^\d{10,13}$/.test(s.replace(/\D/g,''));
const pngHeader=[137,80,78,71,13,10,26,10];

const handler=withSupabase({auth:'none'},async(req,ctx)=>{
  try{
    if(req.method==='GET'){
      const token=new URL(req.url).searchParams.get('token')||'';
      if(!uuid.test(token))return bad('Link inválido.',404);
      const {data:p,error}=await ctx.supabaseAdmin.from('projects').select('name,location,dates,instructions,public_token').eq('public_token',token).maybeSingle();
      if(error||!p)return bad('Projeto não encontrado ou indisponível.',404);
      return json({name:p.name,location:p.location,dates:p.dates,instructions:p.instructions});
    }
    if(req.method!=='POST')return bad('Método não permitido.',405);
    const length=Number(req.headers.get('content-length')||0);
    if(length>520000)return bad('Assinatura excede o tamanho permitido.',413);
    const b=await req.json().catch(()=>null);
    if(!b||typeof b!=='object')return bad('Formulário inválido.');
    // Campo invisível que recebe preenchimento de robôs.
    if(b.website)return json({ok:true});
    const token=string(b.token,50);
    if(!uuid.test(token))return bad('Link inválido.',404);
    if(b.consent!==true)return bad('A autorização precisa ser aceita.');
    const d=b.participant||{};
    const full_name=string(d.full_name,140),phone=string(d.phone,35),address=string(d.address,240);
    const is_minor=d.is_minor===true;
    const guardian_name=is_minor?string(d.guardian_name,140):null;
    const guardian_phone=is_minor?string(d.guardian_phone,35):null;
    const guardian_address=is_minor?string(d.guardian_address,240):null;
    if(full_name.length<3||address.length<5||!phoneValid(phone))return bad('Preencha corretamente nome, telefone e endereço.');
    if(is_minor&&(!guardian_name||guardian_name.length<3||!guardian_address||guardian_address.length<5||!guardian_phone||!phoneValid(guardian_phone)))return bad('Preencha todos os dados do responsável legal.');
    const signature=string(b.signature,450000);
    if(!signature.startsWith('data:image/png;base64,'))return bad('Assinatura inválida.');
    const raw=signature.substring('data:image/png;base64,'.length);
    if(raw.length>410000||!raw.length)return bad('A assinatura é muito grande. Assine novamente.');
    let bytes:Uint8Array;
    try{const binary=atob(raw);bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));}catch{return bad('Não foi possível ler a assinatura.');}
    if(bytes.length>300000||bytes.length<100||!pngHeader.every((v,i)=>bytes[i]===v))return bad('Formato da assinatura inválido.');
    const {data:p,error:perr}=await ctx.supabaseAdmin.from('projects').select('id,name,location,dates,instructions').eq('public_token',token).maybeSingle();
    if(perr||!p)return bad('Projeto não encontrado.',404);
    // Proteção contra cliques duplicados ou repetição imediata da mesma solicitação.
    const time=new Date(Date.now()-20000).toISOString();
    const {data:recent}=await ctx.supabaseAdmin.from('participants').select('id').eq('project_id',p.id).eq('phone',phone).eq('full_name',full_name).gte('signed_at',time).limit(1);
    if(recent?.length)return bad('Esta autorização acabou de ser enviada. Aguarde antes de tentar novamente.',409);
    const id=crypto.randomUUID();
    const path=`${p.id}/${id}.png`;
    const {error:uploadErr}=await ctx.supabaseAdmin.storage.from('assinaturas').upload(path,bytes,{contentType:'image/png',upsert:false});
    if(uploadErr){console.error(uploadErr);return bad('Não foi possível salvar a assinatura.',500);}
    const {error:insertErr}=await ctx.supabaseAdmin.from('participants').insert({
      id,project_id:p.id,full_name,phone,address,is_minor,guardian_name,guardian_phone,guardian_address,
      signature_path:path,consent_statement:'Li e concordo com a Autorização para Uso de Imagem fornecida pela Igreja.',
      template_version:'igreja-original-v1',project_snapshot:{name:p.name,location:p.location,dates:p.dates,instructions:p.instructions}
    });
    if(insertErr){await ctx.supabaseAdmin.storage.from('assinaturas').remove([path]);console.error(insertErr);return bad('Não foi possível registrar a autorização.',500);}
    return json({ok:true,reference:id},201);
  }catch(e){console.error(e);return bad('Ocorreu uma falha ao processar a autorização.',500);}
});
export default {fetch:(req:Request)=>req.method==='OPTIONS'?new Response('ok',{headers:cors}):handler(req)};
