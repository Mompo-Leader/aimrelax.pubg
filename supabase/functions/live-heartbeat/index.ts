import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}
const json=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,'Content-Type':'application/json'}})
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
 try{
  const auth=req.headers.get('Authorization')||''; const url=Deno.env.get('SUPABASE_URL')!; const anon=Deno.env.get('SUPABASE_ANON_KEY')!
  const c=createClient(url,anon,{global:{headers:{Authorization:auth}}}); const {data:{user}}=await c.auth.getUser(); if(!user)return json({error:'Unauthorized'},401)
  const {stream_id,session_id}=await req.json();
  await c.from('live_viewers').upsert({stream_id,user_id:user.id,session_id,last_seen:new Date().toISOString()},{onConflict:'stream_id,user_id,session_id'})
  const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!); const {data}=await admin.rpc('refresh_live_viewer_count',{p_stream_id:stream_id})
  return json({viewer_count:data||0})
 }catch(e){return json({error:String(e)},500)}
})
