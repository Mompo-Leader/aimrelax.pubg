import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}
const json=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,'Content-Type':'application/json'}})
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
 try{
  const auth=req.headers.get('Authorization')||''; const url=Deno.env.get('SUPABASE_URL')!; const c=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}}); const {data:{user}}=await c.auth.getUser(); if(!user)return json({error:'Unauthorized'},401)
  const {stream_id}=await req.json(); const {error}=await c.from('live_likes').upsert({stream_id,user_id:user.id},{onConflict:'stream_id,user_id'}); if(error)return json({error:error.message},400)
  const {data}=await c.rpc('live_like_count',{p_stream_id:stream_id}); return json({count:data||0})
 }catch(e){return json({error:String(e)},500)}
})
