import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", {headers:cors});
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {global:{headers:{Authorization:req.headers.get("Authorization") ?? ""}}});
    const {data:{user}, error:authError} = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({error:"Unauthorized"}), {status:401,headers:{...cors,"Content-Type":"application/json"}});
    const body = await req.json().catch(()=>({}));
    const title = String(body.title ?? "PUBG LIVE").trim().slice(0,100) || "PUBG LIVE";
    const category = String(body.category ?? "PUBG").trim().slice(0,40) || "PUBG";
    const roomName = `aimrelax-${crypto.randomUUID()}`;
    const {data:stream,error} = await supabase.from("live_streams").insert({
      streamer_id:user.id, streamer_name:String(body.streamer_name ?? user.email?.split("@")[0] ?? "Streamer").slice(0,80),
      title, category, status:"starting", provider:"livekit", livekit_room_name:roomName, viewer_count:0
    }).select("*").single();
    if(error) throw error;
    return new Response(JSON.stringify({stream, room_name:roomName}), {headers:{...cors,"Content-Type":"application/json"}});
  } catch(e) { return new Response(JSON.stringify({error:String(e)}), {status:500,headers:{...cors,"Content-Type":"application/json"}}); }
});
