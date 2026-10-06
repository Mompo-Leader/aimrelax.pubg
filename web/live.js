import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  Room,
  RoomEvent,
  Track,
} from "https://esm.sh/livekit-client@2.15.6";

/* =========================================================
   AIMRELAX LIVE
   Supabase + LiveKit
   ========================================================= */

const SUPABASE_URL =
  "https://hvhlrbfjloiahbqmnrly.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aGxyYmZqbG9pYWhicW1ucmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTMyNjMsImV4cCI6MjEwNTI4OTI2M30.lOrLiuJ3SZ9LtQxZu3aHcVE_e_7eOWVxPoaG36l0f8M";

const LIVEKIT_TOKEN_FUNCTION = "live-token";
const LIVEKIT_HEARTBEAT_FUNCTION = "live-heartbeat";
const LIVEKIT_LIKE_FUNCTION = "live-like";

const db = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

const params = new URLSearchParams(window.location.search);

const streamId = params.get("stream_id");

let room = null;
let stream = null;
let currentUser = null;

let heartbeatTimer = null;
let chatChannel = null;
let likeChannel = null;
let streamChannel = null;

let isConnected = false;
let liked = false;
let audioTracks = [];


/* =========================================================
   DOM
   ========================================================= */

const $ = (id) => document.getElementById(id);

const video = $("video");
const titleEl = $("title");
const statusEl = $("status");
const viewersEl = $("viewers");
const likesEl = $("likes");
const likeButton = $("like");
const playButton = $("play");
const chatEl = $("chat");
const messageInput = $("message");
const sendButton = $("send");


/* =========================================================
   HELPERS
   ========================================================= */

function setStatus(text) {
  if (statusEl) {
    statusEl.textContent = text;
  }
}

function setViewers(count) {
  if (viewersEl) {
    viewersEl.textContent = `👁 ${Number(count) || 0}`;
  }
}

function setLikes(count) {
  if (likesEl) {
    likesEl.textContent = String(Number(count) || 0);
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[char],
  );
}

function formatTime(date) {
  try {
    return new Intl.DateTimeFormat(
      "hy-AM",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(new Date(date));
  } catch {
    return "";
  }
}


/* =========================================================
   AUTH
   ========================================================= */

async function getCurrentUser() {
  const {
    data: {
      session,
    },
  } = await db.auth.getSession();

  if (!session) {
    return null;
  }

  const {
    data: {
      user,
    },
  } = await db.auth.getUser();

  return user || null;
}


/* =========================================================
   LOAD STREAM
   ========================================================= */

async function loadStream() {
  if (!streamId) {
    setStatus("❌ stream_id missing");
    return false;
  }

  const {
    data,
    error,
  } = await db
    .from("live_streams")
    .select("*")
    .eq("id", streamId)
    .maybeSingle();

  if (error) {
    console.error("Stream load error:", error);
    setStatus("❌ LIVE-ը չհաջողվեց բեռնել");
    return false;
  }

  if (!data) {
    setStatus("❌ LIVE-ը չի գտնվել");
    return false;
  }

  stream = data;

  if (titleEl) {
    titleEl.textContent =
      stream.title || "AIMRELAX LIVE";
  }

  if (
    stream.status !== "live" &&
    stream.status !== "starting"
  ) {
    setStatus("⚫ LIVE-ն ավարտված է");
    return false;
  }

  return true;
}


/* =========================================================
   GET LIVEKIT VIEWER TOKEN
   ========================================================= */

async function getViewerToken() {
  const response = await db.functions.invoke(
    LIVEKIT_TOKEN_FUNCTION,
    {
      body: {
        stream_id: streamId,
        role: "viewer",
      },
    },
  );

  if (response.error) {
    console.error(
      "live-token invoke error:",
      response.error,
    );

    throw new Error(
      response.error.message ||
      "live-token function error",
    );
  }

  const data = response.data || {};

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.token || !data.url) {
    throw new Error(
      "LiveKit token կամ URL չկա",
    );
  }

  return data;
}


/* =========================================================
   VIDEO / AUDIO
   ========================================================= */

function attachVideoTrack(track) {
  if (!video) {
    return;
  }

  try {
    track.attach(video);

    video.autoplay = true;
    video.playsInline = true;

    video.play().catch(() => {
      setStatus(
        "▶ Սեղմիր Play՝ LIVE-ը դիտելու համար",
      );
    });
  } catch (error) {
    console.error(
      "Video attach error:",
      error,
    );
  }
}

function attachAudioTrack(track) {
  try {
    const element = track.attach();

    if (element) {
      element.autoplay = true;
      element.setAttribute(
        "playsinline",
        "",
      );

      audioTracks.push(element);

      element.play().catch(() => {
        console.log(
          "Browser blocked autoplay audio",
        );
      });
    }
  } catch (error) {
    console.error(
      "Audio attach error:",
      error,
    );
  }
}

function detachTrack(track) {
  try {
    track.detach();
  } catch (error) {
    console.warn(
      "Track detach error:",
      error,
    );
  }
}


/* =========================================================
   LIVEKIT EVENTS
   ========================================================= */

function setupRoomEvents() {
  if (!room) {
    return;
  }

  room.on(
    RoomEvent.TrackSubscribed,
    (
      track,
      publication,
      participant,
    ) => {
      console.log(
        "Track subscribed:",
        track.kind,
        participant?.identity,
      );

      if (track.kind === Track.Kind.Video) {
        attachVideoTrack(track);
      }

      if (track.kind === Track.Kind.Audio) {
        attachAudioTrack(track);
      }
    },
  );

  room.on(
    RoomEvent.TrackUnsubscribed,
    (
      track,
      publication,
      participant,
    ) => {
      console.log(
        "Track unsubscribed:",
        track.kind,
      );

      detachTrack(track);
    },
  );

  room.on(
    RoomEvent.ParticipantConnected,
    (participant) => {
      console.log(
        "Participant connected:",
        participant.identity,
      );
    },
  );

  room.on(
    RoomEvent.ParticipantDisconnected,
    (participant) => {
      console.log(
        "Participant disconnected:",
        participant.identity,
      );
    },
  );

  room.on(
    RoomEvent.Connected,
    () => {
      console.log("LiveKit connected");
      isConnected = true;
      setStatus("🔴 LIVE");
    },
  );

  room.on(
    RoomEvent.Disconnected,
    (reason) => {
      console.log(
        "LiveKit disconnected:",
        reason,
      );

      isConnected = false;

      if (stream?.status === "live") {
        setStatus(
          "⚠️ Կապը կտրվել է։ Փորձում ենք վերականգնել...",
        );
      } else {
        setStatus("⚫ LIVE-ն ավարտված է");
      }
    },
  );

  room.on(
    RoomEvent.Reconnecting,
    () => {
      setStatus(
        "🔄 Կապը վերականգնվում է...",
      );
    },
  );

  room.on(
    RoomEvent.Reconnected,
    () => {
      isConnected = true;
      setStatus("🔴 LIVE");
    },
  );

  room.on(
    RoomEvent.ConnectionStateChanged,
    (state) => {
      console.log(
        "Connection state:",
        state,
      );
    },
  );
}


/* =========================================================
   CONNECT LIVEKIT
   ========================================================= */

async function connectLiveKit() {
  const tokenData = await getViewerToken();

  room = new Room({
    adaptiveStream: true,
    dynacast: true,
  });

  setupRoomEvents();

  await room.connect(
    tokenData.url,
    tokenData.token,
    {
      autoSubscribe: true,
    },
  );

  isConnected = true;

  /*
   * Some browsers may have tracks already subscribed
   * before TrackSubscribed handler is processed.
   */
  room.remoteParticipants.forEach(
    (participant) => {
      participant.trackPublications.forEach(
        (publication) => {
          if (
            publication.isSubscribed &&
            publication.track
          ) {
            const track = publication.track;

            if (
              track.kind === Track.Kind.Video
            ) {
              attachVideoTrack(track);
            }

            if (
              track.kind === Track.Kind.Audio
            ) {
              attachAudioTrack(track);
            }
          }
        },
      );
    },
  );

  setStatus("🔴 LIVE");
}


/* =========================================================
   HEARTBEAT
   ========================================================= */

async function sendHeartbeat() {
  if (!streamId || !currentUser) {
    return;
  }

  try {
    const response =
      await db.functions.invoke(
        LIVEKIT_HEARTBEAT_FUNCTION,
        {
          body: {
            stream_id: streamId,
          },
        },
      );

    if (response.error) {
      console.warn(
        "Heartbeat error:",
        response.error,
      );
      return;
    }

    const data = response.data || {};

    if (
      typeof data.viewer_count !==
      "undefined"
    ) {
      setViewers(
        data.viewer_count,
      );
    }
  } catch (error) {
    console.warn(
      "Heartbeat failed:",
      error,
    );
  }
}

function startHeartbeat() {
  stopHeartbeat();

  sendHeartbeat();

  heartbeatTimer = setInterval(
    sendHeartbeat,
    15000,
  );
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}


/* =========================================================
   INITIAL LIKE COUNT
   ========================================================= */

async function loadLikeCount() {
  if (!streamId) {
    return;
  }

  try {
    const {
      count,
      error,
    } = await db
      .from("live_likes")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("stream_id", streamId);

    if (error) {
      console.warn(
        "Like count error:",
        error,
      );
      return;
    }

    setLikes(count || 0);

    if (currentUser) {
      const {
        data: myLike,
        error: myLikeError,
      } = await db
        .from("live_likes")
        .select("stream_id")
        .eq("stream_id", streamId)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!myLikeError) {
        liked = !!myLike;
        updateLikeButton();
      }
    }
  } catch (error) {
    console.warn(
      "loadLikeCount failed:",
      error,
    );
  }
}


/* =========================================================
   LIKE BUTTON
   ========================================================= */

function updateLikeButton() {
  if (!likeButton) {
    return;
  }

  if (liked) {
    likeButton.classList.add("liked");
    likeButton.setAttribute(
      "aria-label",
      "Unlike",
    );
  } else {
    likeButton.classList.remove("liked");
    likeButton.setAttribute(
      "aria-label",
      "Like",
    );
  }
}

async function toggleLike() {
  if (!currentUser) {
    setStatus(
      "Մուտք գործիր հաշիվ՝ Like անելու համար",
    );
    return;
  }

  if (!streamId) {
    return;
  }

  if (likeButton) {
    likeButton.disabled = true;
  }

  try {
    const response =
      await db.functions.invoke(
        LIVEKIT_LIKE_FUNCTION,
        {
          body: {
            stream_id: streamId,
          },
        },
      );

    if (response.error) {
      throw new Error(
        response.error.message ||
        "Like error",
      );
    }

    const data = response.data || {};

    if (data.error) {
      throw new Error(data.error);
    }

    liked = !!data.liked;

    setLikes(
      data.like_count || 0,
    );

    updateLikeButton();
  } catch (error) {
    console.error(
      "Like error:",
      error,
    );

    setStatus(
      "❌ Like-ը չհաջողվեց",
    );
  } finally {
    if (likeButton) {
      likeButton.disabled = false;
    }
  }
}


/* =========================================================
   CHAT
   ========================================================= */

function addChatMessage(message) {
  if (!chatEl || !message) {
    return;
  }

  const item = document.createElement(
    "div",
  );

  item.className = "chat-message";

  const username =
    message.user_name ||
    "Viewer";

  const text =
    message.message ||
    "";

  const time =
    message.created_at
      ? formatTime(
          message.created_at,
        )
      : "";

  item.innerHTML = `
    <div class="chat-user">
      ${escapeHtml(username)}
      <span class="chat-time">
        ${escapeHtml(time)}
      </span>
    </div>
    <div class="chat-text">
      ${escapeHtml(text)}
    </div>
  `;

  chatEl.appendChild(item);

  /*
   * Keep the latest messages visible.
   */
  chatEl.scrollTop =
    chatEl.scrollHeight;
}

async function loadChat() {
  if (!streamId || !chatEl) {
    return;
  }

  try {
    const {
      data,
      error,
    } = await db
      .from("live_chat")
      .select(
        "id,stream_id,user_id,user_name,message,created_at",
      )
      .eq("stream_id", streamId)
      .order("created_at", {
        ascending: true,
      })
      .limit(100);

    if (error) {
      console.warn(
        "Chat load error:",
        error,
      );
      return;
    }

    chatEl.innerHTML = "";

    for (const message of data || []) {
      addChatMessage(message);
    }
  } catch (error) {
    console.warn(
      "loadChat failed:",
      error,
    );
  }
}

function subscribeChat() {
  if (!streamId) {
    return;
  }

  if (chatChannel) {
    db.removeChannel(chatChannel);
  }

  chatChannel = db
    .channel(
      `live-chat-${streamId}`,
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "live_chat",
        filter:
          `stream_id=eq.${streamId}`,
      },
      (payload) => {
        addChatMessage(
          payload.new,
        );
      },
    )
    .subscribe(
      (status) => {
        console.log(
          "Chat realtime:",
          status,
        );
      },
    );
}

async function sendChatMessage() {
  if (!currentUser) {
    setStatus(
      "Մուտք գործիր հաշիվ՝ chat գրելու համար",
    );
    return;
  }

  if (!streamId) {
    return;
  }

  const message =
    messageInput?.value
      ?.trim() || "";

  if (!message) {
    return;
  }

  if (message.length > 500) {
    setStatus(
      "Հաղորդագրությունը չափազանց երկար է",
    );
    return;
  }

  if (sendButton) {
    sendButton.disabled = true;
  }

  try {
    const userName =
      currentUser.user_metadata
        ?.username ||
      currentUser.user_metadata
        ?.name ||
      currentUser.email
        ?.split("@")[0] ||
      "Viewer";

    const {
      error,
    } = await db
      .from("live_chat")
      .insert({
        stream_id: streamId,
        user_id: currentUser.id,
        user_name: userName,
        message,
      });

    if (error) {
      throw error;
    }

    if (messageInput) {
      messageInput.value = "";
      messageInput.focus();
    }
  } catch (error) {
    console.error(
      "Send chat error:",
      error,
    );

    setStatus(
      "❌ Հաղորդագրությունը չուղարկվեց",
    );
  } finally {
    if (sendButton) {
      sendButton.disabled = false;
    }
  }
}


/* =========================================================
   LIKE REALTIME
   ========================================================= */

function subscribeLikes() {
  if (!streamId) {
    return;
  }

  if (likeChannel) {
    db.removeChannel(
      likeChannel,
    );
  }

  likeChannel = db
    .channel(
      `live-likes-${streamId}`,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "live_likes",
        filter:
          `stream_id=eq.${streamId}`,
      },
      async () => {
        await loadLikeCount();
      },
    )
    .subscribe(
      (status) => {
        console.log(
          "Likes realtime:",
          status,
        );
      },
    );
}


/* =========================================================
   STREAM REALTIME
   ========================================================= */

function subscribeStream() {
  if (!streamId) {
    return;
  }

  if (streamChannel) {
    db.removeChannel(
      streamChannel,
    );
  }

  streamChannel = db
    .channel(
      `live-stream-${streamId}`,
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "live_streams",
        filter:
          `id=eq.${streamId}`,
      },
      async (payload) => {
        stream = payload.new;

        if (
          stream.status === "ended"
        ) {
          stopEverything();

          setStatus(
            "⚫ LIVE-ն ավարտվեց",
          );

          if (video) {
            video.pause();
            video.removeAttribute(
              "src",
            );
          }
        }

        if (
          typeof stream.viewer_count !==
          "undefined"
        ) {
          setViewers(
            stream.viewer_count,
          );
        }
      },
    )
    .subscribe(
      (status) => {
        console.log(
          "Stream realtime:",
          status,
        );
      },
    );
}


/* =========================================================
   PLAY BUTTON
   ========================================================= */

async function playMedia() {
  try {
    if (video) {
      await video.play();
    }

    for (
      const audio of audioTracks
    ) {
      try {
        await audio.play();
      } catch {
        // Browser may still block autoplay.
      }
    }

    setStatus(
      isConnected
        ? "🔴 LIVE"
        : "▶ Playback",
    );
  } catch (error) {
    console.warn(
      "Play error:",
      error,
    );

    setStatus(
      "▶ Սեղմիր Play՝ ձայնը միացնելու համար",
    );
  }
}


/* =========================================================
   CLEANUP
   ========================================================= */

function stopEverything() {
  stopHeartbeat();

  if (room) {
    try {
      room.disconnect();
    } catch (error) {
      console.warn(
        "Room disconnect error:",
        error,
      );
    }

    room = null;
  }

  isConnected = false;

  if (chatChannel) {
    db.removeChannel(
      chatChannel,
    );
    chatChannel = null;
  }

  if (likeChannel) {
    db.removeChannel(
      likeChannel,
    );
    likeChannel = null;
  }

  if (streamChannel) {
    db.removeChannel(
      streamChannel,
    );
    streamChannel = null;
  }

  audioTracks = [];
}


/* =========================================================
   INITIALIZE
   ========================================================= */

async function start() {
  try {
    setStatus("Բեռնվում է...");

    /*
     * 1. Check stream
     */
    const streamLoaded =
      await loadStream();

    if (!streamLoaded) {
      return;
    }

    /*
     * 2. Check authentication
     */
    currentUser =
      await getCurrentUser();

    if (!currentUser) {
      setStatus(
        "Մուտք գործիր AIMRELAX հաշիվ՝ դիտելու համար",
      );

      /*
       * We can still show basic stream
       * information, but LiveKit requires
       * an authenticated viewer token.
       */
      return;
    }

    /*
     * 3. Load chat / likes
     */
    await loadChat();
    await loadLikeCount();

    /*
     * 4. Realtime
     */
    subscribeChat();
    subscribeLikes();
    subscribeStream();

    /*
     * 5. Connect LiveKit
     */
    setStatus(
      "🔄 Միացում LIVE-ին...",
    );

    await connectLiveKit();

    /*
     * 6. Viewer heartbeat
     */
    startHeartbeat();

    setStatus("🔴 LIVE");
  } catch (error) {
    console.error(
      "AIMRELAX LIVE error:",
      error,
    );

    setStatus(
      `❌ ${error.message || "LIVE-ի սխալ"}`,
    );
  }
}


/* =========================================================
   EVENTS
   ========================================================= */

if (playButton) {
  playButton.addEventListener(
    "click",
    playMedia,
  );
}

if (likeButton) {
  likeButton.addEventListener(
    "click",
    toggleLike,
  );
}

if (sendButton) {
  sendButton.addEventListener(
    "click",
    sendChatMessage,
  );
}

if (messageInput) {
  messageInput.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        sendChatMessage();
      }
    },
  );
}


/* =========================================================
   AUTH STATE
   ========================================================= */

db.auth.onAuthStateChange(
  async (event, session) => {
    console.log(
      "Auth event:",
      event,
    );

    currentUser =
      session?.user || null;

    if (
      event === "SIGNED_IN" &&
      currentUser &&
      stream &&
      !isConnected
    ) {
      try {
        await loadChat();
        await loadLikeCount();
        subscribeChat();
        subscribeLikes();
        await connectLiveKit();
        startHeartbeat();
      } catch (error) {
        console.error(
          "Reconnect after login:",
          error,
        );
      }
    }
  },
);


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

document.addEventListener(
  "visibilitychange",
  async () => {
    if (
      document.visibilityState ===
      "visible"
    ) {
      if (
        currentUser &&
        stream &&
        (
          stream.status === "live" ||
          stream.status === "starting"
        )
      ) {
        await sendHeartbeat();

        if (
          room &&
          !isConnected
        ) {
          try {
            await connectLiveKit();
          } catch (error) {
            console.warn(
              "Reconnect failed:",
              error,
            );
          }
        }
      }
    }
  },
);


/* =========================================================
   PAGE CLOSE
   ========================================================= */

window.addEventListener(
  "beforeunload",
  () => {
    stopEverything();
  },
);


/* =========================================================
   START
   ========================================================= */

start();
