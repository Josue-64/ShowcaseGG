window.onload = function () {
  startHomePage();
  startProfilePage();
};

// home page
function startHomePage() {
  const usernameInput = document.getElementById("username");
  const searchButton = document.getElementById("searchButton");

  if (!searchButton || !usernameInput) return;

  searchButton.onclick = function () {
    const username = usernameInput.value;

    if (username === "") {
      alert("Enter a username");
      return;
    }

    window.location.href = "/profile?user=" + username;
  };
}

// profile page
function startProfilePage() {
  const usernameDisplay = document.getElementById("usernameDisplay");

  if (!usernameDisplay) return;

  const urlParameters = new URLSearchParams(window.location.search);
  const username = urlParameters.get("user");

  if (!username) {
    usernameDisplay.innerText = "No username found";
    return;
  }

  loadProfile(username);
}

// load steam profile
async function loadProfile(username) {
  console.log("Loading profile:", username);

  let steamId = "";

  if (/^\d+$/.test(username)) {

    steamId = username;

  } else {
  const resolveResponse = await fetch("/api/resolve?username=" + username);
  const resolveData = await resolveResponse.json();

  console.log(resolveData);

  if (!resolveData.response || resolveData.response.success !== 1) {
    document.getElementById("usernameDisplay").innerText = "User not found";
    return;
  }
    steamId = resolveData.response.steamid;
}

  const profileResponse = await fetch("/api/profile?steamId=" + steamId);
  const profileData = await profileResponse.json();

  console.log(profileData);

  if (
    !profileData.response ||
    !profileData.response.players ||
    profileData.response.players.length === 0
  ) {
    document.getElementById("usernameDisplay").innerText = "Profile not found";
    return;
  }

  const player = profileData.response.players[0];

  renderProfile(player);
  loadGames(steamId);
}

// show profile info
function renderProfile(player) {
  document.getElementById("usernameDisplay").innerText = player.personaname;
  document.getElementById("avatarImage").src = player.avatarfull;
}

// load games
async function loadGames(steamId) {
  const gamesResponse = await fetch("/api/games?steamId=" + steamId);
  const gamesData = await gamesResponse.json();

  console.log(gamesData);

  if (gamesData.response && gamesData.response.games) {
    renderGames(gamesData.response.games);

    const totalHoursElement = document.getElementById("totalHours");

    if (totalHoursElement) {
      const totalMinutes = gamesData.response.games.reduce(
        (sum, game) => sum + game.playtime_forever,
        0,
      );

      const totalHours = Math.round(totalMinutes / 60);

      totalHoursElement.innerText = `Total hours: ${totalHours}`;
    }
  } else {
    document.getElementById("gamesList").innerText =
      "No games found (profile may be private)";
  }
}

// render games icons
function renderGames(games) {
  const gamesList = document.getElementById("gamesList");
  gamesList.innerHTML = "";

  const topGames = games
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 5);

  topGames.forEach((game) => {
    const iconUrl =
      "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/" +
      game.appid +
      "/" +
      game.img_icon_url +
      ".jpg";

    const div = document.createElement("div");

    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">

        <img 
          src="${iconUrl}" 
          width="40" 
          height="40"
        >

        <div>
          <p style="margin:0;"><b>${game.name}</b></p>
          <p style="margin:0; font-size:12px;">
            ${Math.round(game.playtime_forever / 60)} hours
          </p>
        </div>

      </div>
    `;

    gamesList.appendChild(div);
  });
}
