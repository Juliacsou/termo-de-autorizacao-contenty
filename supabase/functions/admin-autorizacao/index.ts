import { withSupabase } from 'npm:@supabase/server@1';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const json=(b:unknown,status=200)=>new Response(JSON.stringify(b),{status,headers:{...cors,'Content-Type':'application/json'}});
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const handler=withSupabase({auth:'user'},async(req,ctx)=>{
  try{
    if(req.method!=='POST')return json({error:'Método inválido.'},405);
    const userId=ctx.userClaims?.id;
    if(!userId)return json({error:'Não autorizado.'},401);
    const {data:admin,error:aerr}=await ctx.supabaseAdmin.from('admin_users').select('user_id').eq('user_id',userId).maybeSingle();
    if(aerr||!admin)return json({error:'Somente o administrador pode executar esta operação.'},403);
    const {action,id}=await req.json();
    if(typeof id!=='string'||!uuid.test(id))return json({error:'Identificador inválido.'},400);
    if(action==='delete-participant'){
      const {data:p,error}=await ctx.supabaseAdmin.from('participants').select('signature_path').eq('id',id).maybeSingle();
      if(error||!p)return json({error:'Participante não encontrado.'},404);
      const {error:storageError}=await ctx.supabaseAdmin.storage.from('assinaturas').remove([p.signature_path]);
      if(storageError)throw storageError;
      const {error:deleteError}=await ctx.supabaseAdmin.from('participants').delete().eq('id',id);
      if(deleteError)throw deleteError;
      return json({ok:true});
    }
    if(action==='delete-project'){
      // Paginação para projetos que tenham mais de 1000 autorizações.
      let paths:string[]=[],from=0;
      while(true){
        const {data,error}=await ctx.supabaseAdmin.from('participants').select('signature_path').eq('project_id',id).range(from,from+499);
        if(error)throw error;
        paths.push(...(data||[]).map(r=>r.signature_path));
        if(!data||data.length<500)break;
        from+=500;
      }
      for(let i=0;i<paths.length;i+=100){
        const {error}=await ctx.supabaseAdmin.storage.from('assinaturas').remove(paths.slice(i,i+100));
        if(error)throw error;
      }
      const {error}=await ctx.supabaseAdmin.from('projects').delete().eq('id',id);
      if(error)throw error;
      return json({ok:true});
    }
    return json({error:'Operação desconhecida.'},400);
  }catch(e){console.error(e);return json({error:'Não foi possível concluir a exclusão. Verifique os registros e tente novamente.'},500);}
});
export default {fetch:(req:Request)=>req.method==='OPTIONS'?new Response('ok',{headers:cors}):handler(req)};
