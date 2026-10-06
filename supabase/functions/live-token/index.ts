import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AccessToken } from "npm:livekit-server-sdk@2.15.3";

const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", {headers:cors});
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {global:{headers:{Authorization:req.headers.get("Authorization") ?? ""}}});
    const {data:{user}, error:authError} = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({error:"Unauthorized"}), {status:401,headers:{...cors,"Content-Type":"application/json"}});
    const body = await req.json();
    const streamId = String(body.stream_id ?? "");
    const role = body.role === "publisher" ? "publisher" : "viewer";
    if (!streamId) throw new Error("stream_id is required");
    const {data:stream,error} = await supabase.from("live_streams").select("id,streamer_id,streamer_name,title,status,livekit_room_name").eq("id",streamId).single();
    if(error || !stream) throw new Error("Live not found");
    if (role === "publisher" && stream.streamer_id !== user.id) return new Response(JSON.stringify({error:"Not the streamer"}), {status:403,headers:{...cors,"Content-Type":"application/json"}});
    if (role === "viewer" && !["starting","live"].includes(stream.status)) return new Response(JSON.stringify({error:"Live has ended"}), {status:410,headers:{...cors,"Content-Type":"application/json"}});
    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    const url = Deno.env.get("LIVEKIT_URL");
    if (!apiKey || !apiSecret || !url) throw new Error("LiveKit secrets are not configured");
    const identity = `${role}-${user.id}`;
    const at = new AccessToken(apiKey, apiSecret, {identity, name: role === "publisher" ? (stream.streamer_name ?? "Streamer") : (user.email?.split("@")[0] ?? "Viewer"), ttl: "2h"});
    at.addGrant({roomJoin:true, room:stream.livekit_room_name, canPublish:role === "publisher", canSubscribe:true, canPublishData:true});
    const token = await at.toJwt();
    return new Response(JSON.stringify({token,url,room_name:stream.livekit_room_name,stream_id:stream.id}), {headers:{...cors,"Content-Type":"application/json"}});
  } catch(e) { return new Response(JSON.stringify({error:String(e)}), {status:500,headers:{...cors,"Content-Type":"application/json"}}); }
});
