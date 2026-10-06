package com.aimrelax.aimrelax_live

import android.Manifest
import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import io.livekit.android.LiveKit
import io.livekit.android.audio.ScreenAudioCapturer
import io.livekit.android.room.Room
import io.livekit.android.room.ConnectOptions
import io.livekit.android.room.track.screencapture.ScreenCaptureParams
import io.livekit.android.room.track.LocalVideoTrack
import io.livekit.android.room.track.LocalAudioTrack
import io.livekit.android.room.track.Track
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity: FlutterActivity() {
    companion object { private const val CHANNEL="aimrelax.live/livekit"; private const val CAPTURE=4101; private const val PERM=4102; private const val NOTIF=9101; private const val NOTIF_CHANNEL="aimrelax_live" }
    private lateinit var channel: MethodChannel
    private var pending: Map<String, String>? = null
    private var room: Room? = null
    private var screenAudio: ScreenAudioCapturer? = null

    override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); LiveKit.init(applicationContext); createNotificationChannel() }

    override fun configureFlutterEngine(engine: FlutterEngine) {
        super.configureFlutterEngine(engine)
        channel=MethodChannel(engine.dartExecutor.binaryMessenger, CHANNEL)
        channel.setMethodCallHandler { call, result ->
            when(call.method) {
                "startLive" -> {
                    val token=call.argument<String>("token"); val url=call.argument<String>("url")
                    if(token.isNullOrBlank() || url.isNullOrBlank()) { result.error("ARGS","token/url missing",null); return@setMethodCallHandler }
                    pending=mapOf("token" to token, "url" to url)
                    requestAudioThenCapture(result)
                }
                "stopLive" -> { stopLive(); result.success(true) }
                else -> result.notImplemented()
            }
        }
    }

    private fun requestAudioThenCapture(result: MethodChannel.Result) {
        if(Build.VERSION.SDK_INT >= 23 && ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.RECORD_AUDIO), PERM)
            pendingResult=result
            return
        }
        launchCapture(result)
    }
    private var pendingResult: MethodChannel.Result? = null
    override fun onRequestPermissionsResult(requestCode:Int, permissions:Array<out String>, grantResults:IntArray){ super.onRequestPermissionsResult(requestCode,permissions,grantResults); if(requestCode==PERM){ val r=pendingResult; pendingResult=null; if(grantResults.isNotEmpty()&&grantResults[0]==PackageManager.PERMISSION_GRANTED) launchCapture(r) else r?.error("PERMISSION","Microphone permission is required for Android playback capture",null) } }

    private fun launchCapture(result: MethodChannel.Result?) {
        val mgr=getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        pendingResult=result
        startActivityForResult(mgr.createScreenCaptureIntent(), CAPTURE)
    }

    @Deprecated("Activity result API retained for Flutter host compatibility")
    override fun onActivityResult(requestCode:Int,resultCode:Int,data:Intent?) {
        super.onActivityResult(requestCode,resultCode,data)
        if(requestCode!=CAPTURE) return
        val r=pendingResult; pendingResult=null
        if(resultCode!=Activity.RESULT_OK || data==null){ r?.error("CANCELLED","Screen capture was cancelled",null); return }
        val p=pending ?: run { r?.error("STATE","Missing live parameters",null); return }
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val newRoom=LiveKit.connect(applicationContext,p["url"]!!,p["token"]!!,ConnectOptions(autoSubscribe=false,audio=false,video=false))
                room=newRoom
                val notification=Notification.Builder(this@MainActivity, NOTIF_CHANNEL).setContentTitle("AIMRELAX LIVE").setContentText("PUBG LIVE is running").setSmallIcon(android.R.drawable.presence_video_online).setOngoing(true).build()
                val params=ScreenCaptureParams(data, NOTIF, notification) { }
                val ok=newRoom.localParticipant.setScreenShareEnabled(true,params)
                if(!ok) throw IllegalStateException("LiveKit screen share could not start")
                if(Build.VERSION.SDK_INT>=29) {
                    newRoom.localParticipant.setMicrophoneEnabled(true)
                    val video=newRoom.localParticipant.getTrackPublication(Track.Source.SCREEN_SHARE)?.track as? LocalVideoTrack
                    val audio=newRoom.localParticipant.getTrackPublication(Track.Source.MICROPHONE)?.track as? LocalAudioTrack
                    if(video!=null && audio!=null) {
                        screenAudio=ScreenAudioCapturer.createFromScreenShareTrack(video)
                        if(screenAudio==null) throw IllegalStateException("Internal audio capture is unavailable on this device")
                        screenAudio!!.gain=1.0f
                        audio.setAudioBufferCallback(screenAudio)
                    }
                }
                r?.success(true)
            } catch(e:Throwable){ stopLive(); r?.error("LIVEKIT",e.message,e.stackTraceToString()) }
        }
    }

    private fun stopLive(){
        try { room?.localParticipant?.getTrackPublication(Track.Source.MICROPHONE)?.let { (it.track as? LocalAudioTrack)?.setAudioBufferCallback(null) } } catch(_:Throwable){}
        try { screenAudio?.releaseAudioResources() } catch(_:Throwable){}
        screenAudio=null
        try { room?.localParticipant?.setMicrophoneEnabled(false) } catch(_:Throwable){}
        try { room?.localParticipant?.setScreenShareEnabled(false) } catch(_:Throwable){}
        try { room?.disconnect() } catch(_:Throwable){}
        try { room?.release() } catch(_:Throwable){}
        room=null; pending=null
    }

    private fun createNotificationChannel(){ if(Build.VERSION.SDK_INT>=26){ val nm=getSystemService(NotificationManager::class.java); nm.createNotificationChannel(NotificationChannel(NOTIF_CHANNEL,"AIMRELAX LIVE",NotificationManager.IMPORTANCE_LOW)) } }
    override fun onDestroy(){ stopLive(); super.onDestroy() }
}
