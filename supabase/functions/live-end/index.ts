import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", {headers:cors});
  try {
    const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:req.headers.get("Authorization") ?? ""}}});
    const {data:{user}}=await supabase.auth.getUser(); if(!user) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{...cors,"Content-Type":"application/json"}});
    const {stream_id}=await req.json();
    const {data:stream}=await supabase.from("live_streams").select("id,streamer_id").eq("id",stream_id).single();
    if(!stream || stream.streamer_id!==user.id) return new Response(JSON.stringify({error:"Forbidden"}),{status:403,headers:{...cors,"Content-Type":"application/json"}});
    const {error}=await supabase.from("live_streams").update({status:"ended",ended_at:new Date().toISOString()}).eq("id",stream_id); if(error) throw error;
    return new Response(JSON.stringify({ok:true}),{headers:{...cors,"Content-Type":"application/json"}});
  }catch(e){return new Response(JSON.stringify({error:String(e)}),{status:500,headers:{...cors,"Content-Type":"application/json"}})}
});
