import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Room, RoomEvent, Track } from 'https://esm.sh/livekit-client@2.15.6';
const SUPABASE_URL='https://YOUR_PROJECT.supabase.co'; const SUPABASE_ANON_KEY='YOUR_SUPABASE_ANON_KEY';
const db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY); const qs=new URLSearchParams(location.search); const streamId=qs.get('stream_id');
const $=id=>document.getElementById(id); let room,stream,user,heartbeat;
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
async function start(){ if(!streamId){$('status').textContent='stream_id missing';return;} const {data:s,error}=await db.from('live_streams').select('*').eq('id',streamId).single(); if(error||!s){$('status').textContent='LIVE not found';return;} stream=s; $('title').textContent=s.title||'AIMRELAX LIVE';
 const {data:{session}}=await db.auth.getSession(); if(!session){$('status').textContent='Մուտք գործիր AIMRELAX հաշիվ՝ դիտելու համար';return;}
 const t=await db.functions.invoke('live-token',{body:{stream_id:streamId,role:'viewer'}}); const td=t.data||{}; if(td.error) throw new Error(td.error);
 room=new Room({adaptiveStream:true,dynacast:true}); room.on(RoomEvent.TrackSubscribed,(track)=>{if(track.kind===Track.Kind.Video) track.attach($('video')); else if(track.kind===Track.Kind.Audio) track.attach();}); room.on(RoomEvent.TrackUnsubscribed,(track)=>track.detach()); await room.connect(td.url,td.token); $('status').textContent='🔴 LIVE';
 heartbeat=setInterval(async()=>{const r=await db.functions.invoke('live-heartbeat',{body:{stream_id:streamId,session_id:'web'}}); if(r.data?.viewer_count!=null)$('viewers').textContent='👁 '+r.data.viewer_count;},15000); refreshLikes();
 db.channel('live-chat-'+streamId).on('postgres_changes',{event:'INSERT',schema:'public',table:'live_chat',filter:'stream_id=eq.'+streamId},p=>addChat(p.new)).subscribe(); db.channel('live-likes-'+streamId).on('postgres_changes',{event:'*',schema:'public',table:'live_likes',filter:'stream_id=eq.'+streamId},refreshLikes).subscribe(); loadChat(); }
async function loadChat(){const {data}=await db.from('live_chat').select('*').eq('stream_id',streamId).order('created_at',{ascending:true}).limit(100);(data||[]).forEach(addChat);}
function addChat(m){const d=document.createElement('div');d.className='msg';d.innerHTML='<b>'+esc(m.user_name||'Viewer')+'</b>: '+esc(m.message);$('chat').appendChild(d);$('chat').scrollTop=$('chat').scrollHeight;}
async function refreshLikes(){const {data}=await db.rpc('live_like_count',{p_stream_id:streamId});$('likes').textContent=data??0;}
$('send').onclick=async()=>{const message=$('message').value.trim();if(!message)return;const {data:{session}}=await db.auth.getSession();if(!session){alert('Մուտք գործիր');return;}const name=session.user.email?.split('@')[0]||'Viewer';await db.from('live_chat').insert({stream_id:streamId,user_id:session.user.id,user_name:name,message});$('message').value='';};
$('like').onclick=async()=>{const {data:{session}}=await db.auth.getSession();if(!session)return alert('Մուտք գործիր');await db.from('live_likes').upsert({stream_id:streamId,user_id:session.user.id},{onConflict:'stream_id,user_id',ignoreDuplicates:true});refreshLikes();};
$('play').onclick=()=>{$('video').play().catch(()=>{});}; start().catch(e=>{$('status').textContent='Error: '+e.message;console.error(e);});
