const express = require("express");
const path = require("path");
const app = express();
const supabaseClient = require("@supabase/supabase-js");
require("dotenv").config();

const port = 3000;

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);

app.use(express.json());
app.use(express.static(__dirname + '/public'));


// pages
app.get('/', (req, res) => {
  res.sendFile('public/home.html', { root: __dirname });
});

app.get('/profile', (req, res) => {
  res.sendFile('public/profile.html', { root: __dirname });
});

app.get('/gallery', (req, res) => {
  res.sendFile('public/gallery.html', { root: __dirname });
});

app.get('/about', (req, res) => {
  res.sendFile('public/about.html', { root: __dirname });
});

// resolve steam username
app.get("/api/resolve", async (request, response) => {
  const username = request.query.username;

  if (!username) {
    return response.json({ error: "No username provided" });
  }

  const steamUrl =
    "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/" +
    "?key=" +
    STEAM_API_KEY +
    "&vanityurl=" +
    username;

  try {
    const steamResponse = await fetch(steamUrl);

    const contentType = steamResponse.headers.get("content-type");

    const rawData = await steamResponse.text();

    console.log("Steam response content-type:", contentType);
    console.log("Steam raw response:", rawData);

    // If Steam sends HTML, stop here and show error
    if (!contentType || !contentType.includes("application/json")) {
      return response.status(500).json({
        error: "Steam did not return JSON",
        raw: rawData,
      });
    }

    const steamData = JSON.parse(rawData);

    return response.json(steamData);
  } catch (error) {
    console.log("Resolve error:", error);

    return response.status(500).json({
      error: "Steam API failed",
      message: error.message,
    });
  }
});

// get steam profile
app.get("/api/profile", async function (request, response) {
  const steamId = request.query.steamId;

  if (!steamId) {
    response.status(400).json({ error: "No steamId provided" });
    return;
  }

  const fetchUrl =
    "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/" +
    "?key=" +
    STEAM_API_KEY +
    "&steamids=" +
    steamId;

  try {
    const result = await fetch(fetchUrl);
    const data = await result.json();

    response.json(data);
  } catch (error) {
    console.log("Profile error:", error);

    response.status(500).json({
      error: "Steam API failed",
      message: error.message,
    });
  }
});

// get games
app.get("/api/games", async (request, response) => {
  const steamId = request.query.steamId;

  if (!steamId) {
    return response.status(400).json({ error: "Steam ID missing" });
  }

  const steamUrl =
    "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/" +
    "?key=" +
    STEAM_API_KEY +
    "&steamid=" +
    steamId +
    "&include_appinfo=true" +
    "&include_played_free_games=true";

  try {
    const steamResponse = await fetch(steamUrl);
    const steamData = await steamResponse.json();

    return response.json(steamData);
  } catch (error) {
    console.log("Games error:", error);

    return response.status(500).json({
      error: "Steam games request failed",
      message: error.message,
    });
  }
});

// save card
app.post("/api/save", async (request, response) => {
  const card = request.body;

  const { data: existing } = await supabase
    .from("cards")
    .select("id")
    .eq("steamid", card.steamid)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from("cards")
      .update({
        username: card.username,
        avatar_url: card.avatar_url,
        total_hours: card.total_hours,
        grade: card.grade,
        top_games: card.top_games
      })
      .eq("steamid", card.steamid);

    if (error) {
      console.log(`Error: ${JSON.stringify(error)}`);
      response.statusCode = 500;
      response.send(error);
    } else {
      response.json({ success: true, updated: true });
    }
  } else {
    const { data, error } = await supabase
      .from("cards")
      .insert([{
        steamid: card.steamid,
        username: card.username,
        avatar_url: card.avatar_url,
        total_hours: card.total_hours,
        grade: card.grade,
        top_games: card.top_games
      }]);

    if (error) {
      console.log(`Error: ${JSON.stringify(error)}`);
      response.statusCode = 500;
      response.send(error);
    } else {
      response.json({ success: true, updated: false });
    }
  }
});

// get all cards for gallery
app.get("/api/gallery", async (request, response) => {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log(`Error: ${JSON.stringify(error)}`);
    response.statusCode = 500;
    response.send(error);
  } else {
    response.json(data);
  }
});

// 404
app.use((request, response) => {
  response.status(404).send("Page not found");
});

// server start
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
