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

  const steamProfileUrl = `https://steamcommunity.com/profiles/${player.steamid}`;

  const qrContainer = document.getElementById("qrcode");
  qrContainer.innerHTML = "";

  const qr = new QRCodeStyling({
    width: 80,
    height: 80,
    data: steamProfileUrl,
    dotsOptions: {
      color: "#111827",
      type: "rounded",
    },
    backgroundOptions: {
      color: "#ffffff",
    },
  });

  qr.append(qrContainer);
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
let allGames = [];

function renderGames(games) {
  allGames = games.sort((a, b) => b.playtime_forever - a.playtime_forever);
  buildCheckboxes(allGames);

  const slider = document.getElementById("gameCount");
  const display = document.getElementById("gameCountDisplay");
  if (slider) {
    slider.oninput = function () {
      display.innerText = this.value;
    };
  }

  const search = document.getElementById("gamesSearch");
  if (search) {
    search.oninput = function () {
      const query = this.value.toLowerCase();
      buildCheckboxes(allGames.filter(g => g.name.toLowerCase().includes(query)));
    };
  }

  displayGames(allGames.slice(0, 6));
}

function buildCheckboxes(games) {
  const container = document.getElementById("gamesCheckboxes");
  container.innerHTML = "";
  games.forEach((game) => {
    container.innerHTML += `
      <label>
        <input type="checkbox" value="${game.appid}" onchange="enforceLimit()" />
        ${game.name}
      </label>
    `;
  });
}

function enforceLimit() {
  const all = document.querySelectorAll("#gamesCheckboxes input[type='checkbox']");
  const checked = document.querySelectorAll("#gamesCheckboxes input[type='checkbox']:checked");
  
  all.forEach(box => {
    if (!box.checked) {
      box.disabled = checked.length >= 6;
    }
  });
}

function displayGames(games) {
  const gamesList = document.getElementById("gamesList");
  gamesList.innerHTML = "";
  games.forEach((game) => {
    const iconUrl = "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/" +
      game.appid + "/" + game.img_icon_url + ".jpg";
    const div = document.createElement("div");
    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <img src="${iconUrl}" width="64" height="64"
          onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/5/5a/Black_question_mark.png'">
        <div>
          <p style="margin:0;"><b>${game.name}</b></p>
          <p style="margin:0; font-size:18px; font-weight:bold;">${Math.round(game.playtime_forever / 60)} hours</p>
        </div>
      </div>
    `;
    gamesList.appendChild(div);
  });
}

function applyCustomization() {
  const customName = document.getElementById("customName").value;
  const customGrade = document.getElementById("customGrade").value;
  const count = parseInt(document.getElementById("gameCount").value);

  if (customName) document.getElementById("usernameDisplay").innerText = customName;
  if (customGrade) {
  const truncated = customGrade.toString().slice(0, 4);
  document.getElementById("gradeDisplay").innerText = truncated;
}

  const checkboxes = document.querySelectorAll("#gamesCheckboxes input[type='checkbox']:checked");
  const selectedIds = Array.from(checkboxes).map(box => box.value);

  const selectedGames = selectedIds.length > 0
    ? allGames.filter(g => selectedIds.includes(String(g.appid)))
    : allGames;

  displayGames(selectedGames.slice(0, count));
}

// Toggle 3D effect on the profile card
let tiltEnabled = false;

function toggleTilt() {
  const tiltButton = document.getElementById("tiltButton");
  const card = document.querySelector(".js-tilt");
  tiltEnabled = !tiltEnabled;

  if (tiltEnabled) {
    VanillaTilt.init(card, {
      max: 10,
      speed: 400,
      scale: 1.05,
      glare: true,
      "max-glare": 1,
    });

  } else {
    if (card.vanillaTilt) {
      card.vanillaTilt.destroy();
    }
  }
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}
