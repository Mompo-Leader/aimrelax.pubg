#!/usr/bin/env bash

set -e

echo "======================================"
echo " AIMRELAX LIVE Sender build"
echo "======================================"

rm -rf live-sender

mkdir -p live-sender/app/src/main/java/com/aimrelax/livesender
mkdir -p live-sender/app/src/main/res/values
mkdir -p live-sender/app/src/main/res/xml

cd live-sender

cat > settings.gradle <<'EOF'
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
        maven { url = uri("https://jitpack.io") }
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
    }
}

rootProject.name = "AIMRELAX-LIVE-Sender"
include(":app")
EOF

cat > build.gradle <<'EOF'
plugins {
    id 'com.android.application' version '8.7.3' apply false
    id 'org.jetbrains.kotlin.android' version '2.0.21' apply false
}
EOF

cat > gradle.properties <<'EOF'
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
EOF

mkdir -p app

cat > app/build.gradle <<'EOF'
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace 'com.aimrelax.livesender'
    compileSdk 35

    defaultConfig {
        applicationId 'com.aimrelax.livesender'
        minSdk 23
        targetSdk 35
        versionCode 1
        versionName '1.0'
    }

    buildTypes {
        release {
            minifyEnabled false
            shrinkResources false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
                    'proguard-rules.pro'
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }
}

dependencies {
    implementation 'io.livekit:livekit-android:2.28.2'

    implementation 'androidx.core:core-ktx:1.15.0'
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'androidx.activity:activity-ktx:1.10.1'
    implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.8.7'

    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0'
}
EOF

cat > app/proguard-rules.pro <<'EOF'
EOF

cat > app/src/main/res/values/strings.xml <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">AIMRELAX LIVE Sender</string>
</resources>
EOF

cat > app/src/main/res/values/colors.xml <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="black">#070707</color>
    <color name="orange">#ff7a00</color>
    <color name="white">#ffffff</color>
</resources>
EOF

cat > app/src/main/res/values/themes.xml <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>

    <style name="Theme.AIMRELAX" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="android:fontFamily">sans</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:statusBarColor">@color/black</item>
        <item name="android:navigationBarColor">@color/black</item>
        <item name="android:colorAccent">@color/orange</item>
    </style>

</resources>
EOF

cat > app/src/main/res/xml/network_security_config.xml <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false" />
</network-security-config>
EOF

cat > app/src/main/AndroidManifest.xml <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="false"
        android:usesCleartextTraffic="false"
        android:networkSecurityConfig="@xml/network_security_config"
        android:label="@string/app_name"
        android:theme="@style/Theme.AIMRELAX"
        android:hardwareAccelerated="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <service
            android:name="io.livekit.android.service.ScreenCaptureService"
            android:foregroundServiceType="mediaProjection"
            android:exported="false" />

    </application>

</manifest>
EOF

cat > app/src/main/java/com/aimrelax/livesender/MainActivity.kt <<'EOF'
package com.aimrelax.livesender

import android.app.Activity
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.setPadding
import io.livekit.android.LiveKit
import io.livekit.android.room.Room
import io.livekit.android.room.track.screencapture.ScreenCaptureParams
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.Base64
import kotlinx.coroutines.cancel

class MainActivity : AppCompatActivity() {

    companion object {
        private const val SITE_URL = "https://aimrelax-pubg.github.io/"
        private const val SUPABASE_URL =
            "https://hvhlrbfjloiahbqmnrly.supabase.co"

        private const val SUPABASE_REST =
            "$SUPABASE_URL/rest/v1/"

        private const val LIVE_TOKEN_URL =
            "$SUPABASE_URL/functions/v1/live-token"

        private const val SUPABASE_KEY =
            "sb_publishable_EcZUkLdUCvV3qWDD7jlvhg_OjTYu1jA"
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private lateinit var webView: WebView
    private lateinit var startButton: Button
    private lateinit var stopButton: Button
    private lateinit var statusText: TextView

    private var room: Room? = null
    private var accessToken: String? = null
    private var userId: String? = null
    private var roomName: String? = null
    private var isLive = false

    private val screenCaptureLauncher =
        registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->

            if (result.resultCode != Activity.RESULT_OK ||
                result.data == null
            ) {
                setStatus("Screen sharing permission cancelled")
                return@registerForActivityResult
            }

            val permissionData = result.data!!

            scope.launch {
                startLiveKit(permissionData)
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        createInterface()
        setupWebView()
    }

    private fun createInterface() {

        val root = LinearLayout(this)

        root.orientation = LinearLayout.VERTICAL
        root.gravity = Gravity.CENTER_HORIZONTAL
        root.setPadding(40)
        root.setBackgroundColor(android.graphics.Color.rgb(7, 7, 7))

        val title = TextView(this)

        title.text = "AIMRELAX LIVE"
        title.textSize = 30f
        title.setTextColor(android.graphics.Color.rgb(255, 122, 0))
        title.gravity = Gravity.CENTER
        title.setPadding(0, 30, 0, 20)

        root.addView(
            title,
            LinearLayout.LayoutParams(
                -1,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )

        statusText = TextView(this)

        statusText.text = "Checking AIMRELAX login..."
        statusText.textSize = 16f
        statusText.setTextColor(android.graphics.Color.WHITE)
        statusText.gravity = Gravity.CENTER
        statusText.setPadding(0, 20, 0, 40)

        root.addView(
            statusText,
            LinearLayout.LayoutParams(
                -1,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )

        startButton = Button(this)

        startButton.text = "START LIVE"
        startButton.isEnabled = false

        startButton.setOnClickListener {
            prepareLive()
        }

        root.addView(
            startButton,
            LinearLayout.LayoutParams(
                -1,
                65
            )
        )

        stopButton = Button(this)

        stopButton.text = "STOP LIVE"
        stopButton.isEnabled = false

        stopButton.setOnClickListener {
            stopLive()
        }

        root.addView(
            stopButton,
            LinearLayout.LayoutParams(
                -1,
                65
            )
        )

        webView = WebView(this)

        webView.visibility = View.GONE

        root.addView(
            webView,
            LinearLayout.LayoutParams(
                1,
                1
            )
        )

        setContentView(root)
    }

    private fun setupWebView() {

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.databaseEnabled = true

        webView.webViewClient = object : WebViewClient() {

            override fun onPageFinished(
                view: WebView?,
                url: String?
            ) {
                super.onPageFinished(view, url)

                scope.launch {
                    kotlinx.coroutines.delay(3000)
                    checkLogin()
                }
            }
        }

        webView.loadUrl(SITE_URL)
    }

    private fun checkLogin() {

        webView.evaluateJavascript(
            """
            (function() {
                try {
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        const value = localStorage.getItem(key);

                        if (!value) continue;

                        try {
                            const obj = JSON.parse(value);

                            if (obj && obj.access_token) {
                                return obj.access_token;
                            }

                            if (obj && obj.currentSession &&
                                obj.currentSession.access_token) {
                                return obj.currentSession.access_token;
                            }
                        } catch(e) {}
                    }

                    return "";
                } catch(e) {
                    return "";
                }
            })();
            """.trimIndent()
        ) { result ->

            val token = parseJavascriptString(result)

            if (token.isNullOrBlank()) {

                setStatus(
                    "Մուտք գործիր AIMRELAX կայքում,\nհետո նորից բացիր Sender-ը։"
                )

                startButton.isEnabled = false

                return@evaluateJavascript
            }

            accessToken = token
            userId = getUserIdFromJwt(token)

            if (userId.isNullOrBlank()) {

                setStatus("Could not read user account.")

                startButton.isEnabled = false

                return@evaluateJavascript
            }

            setStatus("Ready to start LIVE")

            startButton.isEnabled = true
        }
    }

    private fun parseJavascriptString(value: String): String? {

        if (value == "null") {
            return null
        }

        return try {

            val parsed =
                org.json.JSONTokener(value).nextValue()

            parsed?.toString()

        } catch (e: Exception) {

            value
                .removePrefix("\"")
                .removeSuffix("\"")
                .replace("\\\"", "\"")
        }
    }

    private fun getUserIdFromJwt(token: String): String? {

        return try {

            val parts = token.split(".")

            if (parts.size < 2) {
                return null
            }

            val payload =
                String(
                    Base64.getUrlDecoder().decode(
                        parts[1]
                    )
                )

            JSONObject(payload).optString("sub", null)

        } catch (e: Exception) {

            null
        }
    }

    private fun prepareLive() {

        val token = accessToken
        val uid = userId

        if (token.isNullOrBlank() ||
            uid.isNullOrBlank()
        ) {

            Toast.makeText(
                this,
                "Please login first",
                Toast.LENGTH_SHORT
            ).show()

            return
        }

        setStatus("Preparing LIVE...")

        startButton.isEnabled = false

        scope.launch {

            try {

                val result =
                    requestLiveToken(
                        token,
                        uid
                    )

                roomName =
                    "aimrelax-live-$uid"

                val manager =
                    getSystemService(
                        MEDIA_PROJECTION_SERVICE
                    ) as MediaProjectionManager

                val intent =
                    manager.createScreenCaptureIntent()

                screenCaptureLauncher.launch(intent)

                setStatus("Waiting for screen permission...")

            } catch (e: Exception) {

                startButton.isEnabled = true

                setStatus(
                    "Error: ${e.message ?: "Unknown error"}"
                )
            }
        }
    }

    private suspend fun requestLiveToken(
        authToken: String,
        uid: String
    ): JSONObject = withContext(Dispatchers.IO) {

        val connection =
            URL(LIVE_TOKEN_URL).openConnection()
                    as HttpURLConnection

        connection.requestMethod = "POST"
        connection.connectTimeout = 15000
        connection.readTimeout = 15000
        connection.doOutput = true

        connection.setRequestProperty(
            "Authorization",
            "Bearer $authToken"
        )

        connection.setRequestProperty(
            "apikey",
            SUPABASE_KEY
        )

        connection.setRequestProperty(
            "Content-Type",
            "application/json"
        )

        val body =
            JSONObject()
                .put("role", "host")
                .put("room", "aimrelax-live-$uid")
                .toString()

        connection.outputStream.use {
            it.write(body.toByteArray())
        }

        val responseCode =
            connection.responseCode

        val stream =
            if (responseCode in 200..299)
                connection.inputStream
            else
                connection.errorStream

        val response =
            stream.bufferedReader().use {
                it.readText()
            }

        connection.disconnect()

        if (responseCode !in 200..299) {
            throw Exception(
                "live-token HTTP $responseCode: $response"
            )
        }

        JSONObject(response)
    }

    private suspend fun startLiveKit(
        permissionData: Intent
    ) {

        val token = accessToken
        val uid = userId
        val roomNameValue = roomName

        if (token.isNullOrBlank() ||
            uid.isNullOrBlank() ||
            roomNameValue.isNullOrBlank()
        ) {

            setStatus("Login information missing")

            startButton.isEnabled = true

            return
        }

        try {

            setStatus("Connecting to LIVE...")

            val tokenData =
                requestLiveToken(
                    token,
                    uid
                )

            val serverUrl =
                tokenData.optString("server_url")

            val participantToken =
                tokenData.optString("participant_token")

            if (serverUrl.isBlank() ||
                participantToken.isBlank()
            ) {
                throw Exception(
                    "Invalid LiveKit token response"
                )
            }

            val liveRoom =
                LiveKit.create(applicationContext)

            room = liveRoom

            liveRoom.connect(
                serverUrl,
                participantToken
            )

            liveRoom.localParticipant.setScreenShareEnabled(
                true,
                ScreenCaptureParams(
                    permissionData
                )
            )

            insertLiveStream(
                token,
                uid,
                roomNameValue
            )

            isLive = true

            startButton.isEnabled = false
            stopButton.isEnabled = true

            setStatus(
                "🔴 LIVE\n\n" +
                "Room: $roomNameValue"
            )

        } catch (e: Exception) {

            room?.disconnect()
            room = null

            isLive = false

            startButton.isEnabled = true
            stopButton.isEnabled = false

            setStatus(
                "LIVE ERROR:\n${e.message ?: "Unknown error"}"
            )
        }
    }

    private suspend fun insertLiveStream(
        authToken: String,
        uid: String,
        roomNameValue: String
    ) = withContext(Dispatchers.IO) {

        val url =
            "$SUPABASE_REST" +
            "live_streams"

        val connection =
            URL(url).openConnection()
                    as HttpURLConnection

        connection.requestMethod = "POST"
        connection.connectTimeout = 15000
        connection.readTimeout = 15000
        connection.doOutput = true

        connection.setRequestProperty(
            "apikey",
            SUPABASE_KEY
        )

        connection.setRequestProperty(
            "Authorization",
            "Bearer $authToken"
        )

        connection.setRequestProperty(
            "Content-Type",
            "application/json"
        )

        connection.setRequestProperty(
            "Prefer",
            "return=minimal"
        )

        val body =
            JSONObject()
                .put("streamer_id", uid)
                .put("room_name", roomNameValue)
                .put("status", "live")
                .toString()

        connection.outputStream.use {
            it.write(body.toByteArray())
        }

        val responseCode =
            connection.responseCode

        if (responseCode !in 200..299) {

            val error =
                connection.errorStream
                    ?.bufferedReader()
                    ?.use { it.readText() }

            connection.disconnect()

            throw Exception(
                "live_streams HTTP $responseCode: $error"
            )
        }

        connection.disconnect()
    }

    private fun stopLive() {

        scope.launch {

            try {

                setStatus("Stopping LIVE...")

                room?.localParticipant
                    ?.setScreenShareEnabled(false)

                room?.disconnect()
                room = null

                val token = accessToken
                val uid = userId

                if (!token.isNullOrBlank() &&
                    !uid.isNullOrBlank()
                ) {

                    endLiveStream(
                        token,
                        uid
                    )
                }

                isLive = false

                stopButton.isEnabled = false
                startButton.isEnabled = true

                setStatus(
                    "LIVE ended.\nReady for another stream."
                )

            } catch (e: Exception) {

                setStatus(
                    "Stop error: ${e.message}"
                )

                stopButton.isEnabled = false
                startButton.isEnabled = true
            }
        }
    }

    private suspend fun endLiveStream(
        authToken: String,
        uid: String
    ) = withContext(Dispatchers.IO) {

        val filter =
            "streamer_id=eq.$uid&status=eq.live"

        val url =
            "$SUPABASE_REST" +
            "live_streams?$filter"

        val connection =
            URL(url).openConnection()
                    as HttpURLConnection

        connection.requestMethod = "PATCH"
        connection.connectTimeout = 15000
        connection.readTimeout = 15000
        connection.doOutput = true

        connection.setRequestProperty(
            "apikey",
            SUPABASE_KEY
        )

        connection.setRequestProperty(
            "Authorization",
            "Bearer $authToken"
        )

        connection.setRequestProperty(
            "Content-Type",
            "application/json"
        )

        connection.setRequestProperty(
            "Prefer",
            "return=minimal"
        )

        val body =
            JSONObject()
                .put("status", "ended")
                .toString()

        connection.outputStream.use {
            it.write(body.toByteArray())
        }

        connection.responseCode

        connection.disconnect()
    }

    private fun setStatus(message: String) {

        runOnUiThread {

            statusText.text = message
        }
    }
override fun onDestroy() {

    try {
        room?.disconnect()
    } catch (_: Exception) {
    }

    room = null

    scope.cancel()

    super.onDestroy()
}
}
EOF

echo "======================================"
echo "Starting Gradle build..."
echo "======================================"

gradle :app:assembleRelease --no-daemon --stacktrace

echo "======================================"
echo "BUILD SUCCESS"
echo "======================================"

ls -lh app/build/outputs/apk/release/app-release.apk

echo "APK:"
echo "live-sender/app/build/outputs/apk/release/app-release.apk"
