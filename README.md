<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="AIMRELAX-PUBG — PUBG Mobile Esports Clan">
<title>AIMRELAX-PUBG | Official Clan</title>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: Arial, Helvetica, sans-serif;
    background: #080808;
    color: #fff;
    line-height: 1.6;
}

/* NAVBAR */
nav {
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1000;
    background: rgba(5,5,5,.94);
    border-bottom: 1px solid #292929;
    backdrop-filter: blur(10px);
}

.nav-container {
    max-width: 1200px;
    margin: auto;
    padding: 16px 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 2px;
}

.logo span {
    color: #ffb000;
}

.nav-links {
    display: flex;
    gap: 25px;
    list-style: none;
}

.nav-links a {
    color: #ddd;
    text-decoration: none;
    font-size: 13px;
    font-weight: bold;
    letter-spacing: 1px;
    transition: .3s;
}

.nav-links a:hover {
    color: #ffb000;
}

/* HERO */
.hero {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 100px 20px 60px;

    background:
        linear-gradient(rgba(0,0,0,.68), rgba(0,0,0,.92)),
        radial-gradient(circle at center, #303030 0%, #090909 60%);
}

.hero-content {
    max-width: 900px;
}

.badge {
    display: inline-block;
    border: 1px solid #ffb000;
    color: #ffb000;
    padding: 7px 16px;
    font-size: 12px;
    letter-spacing: 3px;
    margin-bottom: 20px;
}

.hero h1 {
    font-size: clamp(48px, 10vw, 100px);
    font-weight: 1000;
    letter-spacing: 5px;
    line-height: 1;
}

.hero h1 span {
    color: #ffb000;
}

.hero p {
    margin: 25px 0;
    color: #bbb;
    font-size: 18px;
    letter-spacing: 3px;
}

.buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
    flex-wrap: wrap;
}

.btn {
    display: inline-block;
    padding: 14px 28px;
    text-decoration: none;
    font-weight: bold;
    letter-spacing: 1px;
    border: 1px solid #ffb000;
    transition: .3s;
}

.btn-primary {
    background: #ffb000;
    color: #000;
}

.btn-primary:hover {
    background: #fff;
    border-color: #fff;
}

.btn-outline {
    color: #fff;
}

.btn-outline:hover {
    background: #ffb000;
    color: #000;
}

/* GENERAL */
section {
    padding: 90px 20px;
}

.container {
    max-width: 1200px;
    margin: auto;
}

.section-title {
    text-align: center;
    margin-bottom: 50px;
}

.section-title small {
    color: #ffb000;
    letter-spacing: 3px;
}

.section-title h2 {
    font-size: 40px;
    margin-top: 8px;
}

/* STATS */
.stats {
    background: #101010;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
}

.stat {
    background: #151515;
    border: 1px solid #282828;
    padding: 30px 15px;
    text-align: center;
}

.stat h3 {
    font-size: 36px;
    color: #ffb000;
}

.stat p {
    color: #999;
    font-size: 13px;
    letter-spacing: 1px;
}

/* ABOUT */
.about {
    background: #080808;
}

.about-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 50px;
    align-items: center;
}

.about-text h3 {
    font-size: 30px;
    margin-bottom: 20px;
}

.about-text p {
    color: #aaa;
}

.about-box {
    border-left: 3px solid #ffb000;
    background: #121212;
    padding: 30px;
}

.about-box div {
    margin-bottom: 15px;
}

.about-box strong {
    color: #ffb000;
}

/* PLAYERS */
.players {
    background: #101010;
}

.players-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
}

.player {
    background: #151515;
    border: 1px solid #292929;
    padding: 25px;
    text-align: center;
    transition: .3s;
}

.player:hover {
    transform: translateY(-5px);
    border-color: #ffb000;
}

.player-avatar {
    width: 100px;
    height: 100px;
    margin: auto;
    border-radius: 50%;
    background: #252525;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 30px;
    font-weight: bold;
    color: #ffb000;
    border: 2px solid #ffb000;
}

.player h3 {
    margin-top: 18px;
}

.player p {
    color: #888;
    font-size: 13px;
}

.role {
    color: #ffb000 !important;
    margin-top: 5px;
}

/* MATCHES */
.matches {
    background: #080808;
}

.match {
    background: #141414;
    border: 1px solid #292929;
    padding: 25px;
    margin-bottom: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.match-info small {
    color: #888;
}

.result-win {
    color: #ffb000;
    font-size: 22px;
    font-weight: bold;
}

/* ACHIEVEMENTS */
.achievements {
    background: #101010;
}

.achievements-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

.achievement {
    background: #151515;
    border: 1px solid #292929;
    padding: 35px;
    text-align: center;
}

.achievement-icon {
    font-size: 40px;
    margin-bottom: 15px;
}

.achievement h3 {
    margin-bottom: 8px;
}

.achievement p {
    color: #888;
}

/* GALLERY */
.gallery {
    background: #080808;
}

.gallery-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
}

.gallery-item {
    height: 220px;
    background:
        linear-gradient(135deg, #292929, #101010);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-weight: bold;
    border: 1px solid #252525;
}

/* CONTACT */
.contact {
    background: #101010;
    text-align: center;
}

.contact p {
    color: #999;
    max-width: 600px;
    margin: 0 auto 30px;
}

.socials {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
}

.social {
    display: inline-block;
    border: 1px solid #333;
    padding: 12px 20px;
    color: #fff;
    text-decoration: none;
    transition: .3s;
}

.social:hover {
    border-color: #ffb000;
    color: #ffb000;
}

/* FOOTER */
footer {
    background: #050505;
    text-align: center;
    padding: 30px 20px;
    color: #666;
    font-size: 13px;
}

footer span {
    color: #ffb000;
}

/* MOBILE */
@media (max-width: 850px) {

    .nav-links {
        display: none;
    }

    .stats-grid,
    .players-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .about-grid {
        grid-template-columns: 1fr;
    }

    .achievements-grid {
        grid-template-columns: 1fr;
    }

    .gallery-grid {
        grid-template-columns: 1fr 1fr;
    }

    .match {
        flex-direction: column;
        gap: 10px;
        text-align: center;
    }
}

@media (max-width: 500px) {

    section {
        padding: 65px 15px;
    }

    .hero h1 {
        letter-spacing: 2px;
    }

    .hero p {
        font-size: 14px;
    }

    .stats-grid,
    .players-grid,
    .gallery-grid {
        grid-template-columns: 1fr;
    }

    .section-title h2 {
        font-size: 30px;
    }
}
</style>
</head>

<body>

<!-- NAVIGATION -->
<nav>
    <div class="nav-container">
        <div class="logo">
            AIMRELAX<span>-PUBG</span>
        </div>

        <ul class="nav-links">
            <li><a href="#home">HOME</a></li>
            <li><a href="#clan">CLAN</a></li>
            <li><a href="#players">PLAYERS</a></li>
            <li><a href="#matches">MATCHES</a></li>
            <li><a href="#achievements">ACHIEVEMENTS</a></li>
            <li><a href="#gallery">GALLERY</a></li>
            <li><a href="#contact">CONTACT</a></li>
        </ul>
    </div>
</nav>

<!-- HERO -->
<section class="hero" id="home">
    <div class="hero-content">

        <div class="badge">PUBG MOBILE ESPORTS CLAN</div>

        <h1>AIMRELAX<span>-PUBG</span></h1>

        <p>PLAY • DOMINATE • REPEAT</p>

        <div class="buttons">
            <a href="#players" class="btn btn-primary">
                OUR PLAYERS
            </a>

            <a href="#contact" class="btn btn-outline">
                JOIN CLAN
            </a>
        </div>

    </div>
</section>

<!-- STATS -->
<section class="stats">
    <div class="container">

        <div class="stats-grid">

            <div class="stat">
                <h3>25</h3>
                <p>PLAYERS</p>
            </div>

            <div class="stat">
                <h3>18</h3>
                <p>TOURNAMENTS</p>
            </div>

            <div class="stat">
                <h3>12</h3>
                <p>VICTORIES</p>
            </div>

            <div class="stat">
                <h3>4.85</h3>
                <p>TEAM K/D</p>
            </div>

        </div>

    </div>
</section>

<!-- CLAN -->
<section class="about" id="clan">
    <div class="container">

        <div class="section-title">
            <small>WHO WE ARE</small>
            <h2>THE CLAN</h2>
        </div>

        <div class="about-grid">

            <div class="about-text">

                <h3>AIMRELAX-PUBG</h3>

                <p>
                    Welcome to AIMRELAX-PUBG, a competitive PUBG Mobile
                    clan built around teamwork, communication and skill.
                    Our goal is simple: improve, compete and dominate
                    every battlefield.
                </p>

            </div>

            <div class="about-box">

                <div>
                    <strong>FOUNDED:</strong> 2026
                </div>

                <div>
                    <strong>GAME:</strong> PUBG Mobile
                </div>

                <div>
                    <strong>REGION:</strong> Armenia
                </div>

                <div>
                    <strong>TYPE:</strong> Competitive Clan
                </div>

            </div>

        </div>

    </div>
</section>

<!-- PLAYERS -->
<section class="players" id="players">
    <div class="container">

        <div class="section-title">
            <small>MEET THE TEAM</small>
            <h2>PLAYERS</h2>
        </div>

        <div class="players-grid">

            <div class="player">
                <div class="player-avatar">AR</div>
                <h3>AIMRELAX</h3>
                <p class="role">CLAN LEADER</p>
                <p>K/D: 5.20</p>
            </div>

            <div class="player">
                <div class="player-avatar">01</div>
                <h3>PLAYER 01</h3>
                <p class="role">ASSAULTER</p>
                <p>K/D: 4.90</p>
            </div>

            <div class="player">
                <div class="player-avatar">02</div>
                <h3>PLAYER 02</h3>
                <p class="role">SNIPER</p>
                <p>K/D: 4.60</p>
            </div>

            <div class="player">
                <div class="player-avatar">03</div>
                <h3>PLAYER 03</h3>
                <p class="role">SUPPORT</p>
                <p>K/D: 4.30</p>
            </div>

        </div>

    </div>
</section>

<!-- MATCHES -->
<section class="matches" id="matches">
    <div class="container">

        <div class="section-title">
            <small>COMPETITIVE RECORD</small>
            <h2>MATCHES</h2>
        </div>

        <div class="match">

            <div class="match-info">
                <strong>AIMRELAX-PUBG</strong>
                <br>
                <small>VS TEAM ALPHA</small>
            </div>

            <div class="result-win">
                WIN 15 : 8
            </div>

        </div>

        <div class="match">

            <div class="match-info">
                <strong>AIMRELAX-PUBG</strong>
                <br>
                <small>VS TEAM BETA</small>
            </div>

            <div class="result-win">
                WIN 12 : 6
            </div>

        </div>

        <div class="match">

            <div class="match-info">
                <strong>AIMRELAX-PUBG</strong>
                <br>
                <small>VS TEAM GAMMA</small>
            </div>

            <div class="result-win">
                WIN 18 : 11
            </div>

        </div>

    </div>
</section>

<!-- ACHIEVEMENTS -->
<section class="achievements" id="achievements">
    <div class="container">

        <div class="section-title">
            <small>OUR HISTORY</small>
            <h2>ACHIEVEMENTS</h2>
        </div>

        <div class="achievements-grid">

            <div class="achievement">
                <div class="achievement-icon">🏆</div>
                <h3>TOURNAMENT WINNER</h3>
                <p>1st Place — PUBG Mobile Tournament</p>
            </div>

            <div class="achievement">
                <div class="achievement-icon">🥇</div>
                <h3>TOP SQUAD</h3>
                <p>Top performing squad</p>
            </div>

            <div class="achievement">
                <div class="achievement-icon">🔥</div>
                <h3>TOP FRAGGER</h3>
                <p>Highest elimination record</p>
            </div>

        </div>

    </div>
</section>

<!-- GALLERY -->
<section class="gallery" id="gallery">
    <div class="container">

        <div class="section-title">
            <small>OUR MOMENTS</small>
            <h2>GALLERY</h2>
        </div>

        <div class="gallery-grid">

            <div class="gallery-item">YOUR IMAGE 01</div>
            <div class="gallery-item">YOUR IMAGE 02</div>
            <div class="gallery-item">YOUR IMAGE 03</div>
            <div class="gallery-item">YOUR IMAGE 04</div>
            <div class="gallery-item">YOUR IMAGE 05</div>
            <div class="gallery-item">YOUR IMAGE 06</div>

        </div>

    </div>
</section>

<!-- CONTACT -->
<section class="contact" id="contact">
    <div class="container">

        <div class="section-title">
            <small>GET IN TOUCH</small>
            <h2>JOIN AIMRELAX</h2>
        </div>

        <p>
            Want to play with us? Follow AIMRELAX-PUBG on social media
            and contact the clan leadership.
        </p>

        <div class="socials">

            <a href="#" class="social">DISCORD</a>

            <a href="#" class="social">TELEGRAM</a>

            <a href="#" class="social">INSTAGRAM</a>

            <a href="#" class="social">TIKTOK</a>

            <a href="#" class="social">YOUTUBE</a>

        </div>

    </div>
</section>

<!-- FOOTER -->
<footer>
    © 2026 <span>AIMRELAX-PUBG</span> — PUBG MOBILE ESPORTS CLAN
</footer>

</body>
</html>
