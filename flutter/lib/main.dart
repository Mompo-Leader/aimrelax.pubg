import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
const native = MethodChannel('aimrelax.live/livekit');

Future<void> main() async { WidgetsFlutterBinding.ensureInitialized(); await Supabase.initialize(url:supabaseUrl,anonKey:supabaseAnonKey); runApp(const AimrelaxLiveApp()); }
class AimrelaxLiveApp extends StatelessWidget { const AimrelaxLiveApp({super.key}); @override Widget build(BuildContext c)=>MaterialApp(debugShowCheckedModeBanner:false,theme:ThemeData.dark(useMaterial3:true),home:const LiveHome()); }
class LiveHome extends StatefulWidget { const LiveHome({super.key}); @override State<LiveHome> createState()=>_LiveHomeState(); }
class _LiveHomeState extends State<LiveHome>{
 final title=TextEditingController(text:'PUBG LIVE'); bool busy=false,live=false; String? streamId; Timer? timer; int viewers=0;
 SupabaseClient get db=>Supabase.instance.client;
 Future<void> goLive() async {
  final session=db.auth.currentSession; if(session==null){msg('Մուտք գործիր AIMRELAX հաշիվ');return;}
  if(title.text.trim().isEmpty){msg('Գրիր LIVE-ի անունը');return;}
  setState(()=>busy=true);
  try{
   final created=await db.functions.invoke('live-create',body:{'title':title.text.trim(),'category':'PUBG','streamer_name':session.user.email?.split('@').first??'Streamer'});
   final data=Map<String,dynamic>.from(created.data as Map); if(data['error']!=null) throw Exception(data['error']);
   streamId=data['stream']['id'];
   final tok=await db.functions.invoke('live-token',body:{'stream_id':streamId,'role':'publisher'});
   final td=Map<String,dynamic>.from(tok.data as Map); if(td['error']!=null) throw Exception(td['error']);
   final ok=await native.invokeMethod<bool>('startLive',{'token':td['token'],'url':td['url']})??false; if(!ok) throw Exception('LiveKit start failed');
   await db.from('live_streams').update({'status':'live','started_at':DateTime.now().toUtc().toIso8601String()}).eq('id',streamId!);
   await WakelockPlus.enable(); setState(()=>live=true); timer=Timer.periodic(const Duration(seconds:15),(_)=>refresh());
  }catch(e){ if(streamId!=null){try{await db.functions.invoke('live-end',body:{'stream_id':streamId});}catch(_){}} msg('LIVE start error: $e'); streamId=null; }
  finally{if(mounted)setState(()=>busy=false);}
 }
 Future<void> refresh() async { if(streamId==null)return; try{ final r=await db.functions.invoke('live-heartbeat',body:{'stream_id':streamId,'session_id':'streamer'}); final d=Map<String,dynamic>.from(r.data as Map); if(mounted)setState(()=>viewers=(d['viewer_count']??0) as int);}catch(_){} }
 Future<void>endLive()async{if(streamId==null)return; setState(()=>busy=true); try{await native.invokeMethod('stopLive'); await db.functions.invoke('live-end',body:{'stream_id':streamId});}finally{timer?.cancel();await WakelockPlus.disable();if(mounted)setState(()=>{live=false,busy=false});}}
 void msg(String s)=>ScaffoldMessenger.of(context).showSnackBar(SnackBar(content:Text(s)));
 @override void dispose(){timer?.cancel();title.dispose();super.dispose();}
 @override Widget build(BuildContext c)=>Scaffold(backgroundColor:const Color(0xff080808),body:SafeArea(child:Padding(padding:const EdgeInsets.all(22),child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[const Text('AIMRELAX LIVE',style:TextStyle(fontSize:30,fontWeight:FontWeight.w900,color:Colors.orange)),const SizedBox(height:8),const Text('LiveKit WebRTC • Screen + PUBG internal audio',style:TextStyle(color:Colors.grey)),const SizedBox(height:28),TextField(controller:title,enabled:!live,decoration:const InputDecoration(labelText:'LIVE title',border:OutlineInputBorder())),const SizedBox(height:18),if(live)...[const Text('🔴 LIVE',style:TextStyle(color:Colors.red,fontSize:24,fontWeight:FontWeight.bold)),const SizedBox(height:8),Text('👁 $viewers viewers',style:const TextStyle(fontSize:18)),const SizedBox(height:22),FilledButton(onPressed:busy?null:endLive,child:const Text('END LIVE'))]else FilledButton(onPressed:busy?null:goLive,child:Text(busy?'Starting...':'🔴 START LIVE')),const SizedBox(height:18),const Text('Android 10+ internal audio capture depends on the device/game audio policy. The microphone is not intended to be published.',style:TextStyle(color:Colors.grey))]))));
}
