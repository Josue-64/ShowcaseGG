window.onload = function () {
  startHomePage();
  startProfilePage(); 
  startGalleryPage();
};

let currentSteamId = "";
let allGames = [];

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
      document.getElementById("usernameDisplay").innerText = "Invalid username";
      return;
    }
    steamId = resolveData.response.steamid;
  }

   currentSteamId = steamId;

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

    div.dataset.game = JSON.stringify({
      appid: game.appid,
      name: game.name,
      playtime_forever: game.playtime_forever,
      img_icon_url: game.img_icon_url
    });

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

function getSaveData() {
  const gameDivs = document.querySelectorAll("#gamesList > div");
  const top_games = Array.from(gameDivs).map(div => JSON.parse(div.dataset.game));

  return {
    steamid: currentSteamId,
    username: document.getElementById("usernameDisplay").innerText,
    avatar_url: document.getElementById("avatarImage").src,
    total_hours: parseInt(document.getElementById("totalHours").innerText.replace("Total hours: ", "")),
    grade: document.getElementById("gradeDisplay").innerText,
    top_games: top_games
  };
}

async function saveCard() {
  const card = getSaveData();

  const response = await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card)
  });

  const result = await response.json();
  if (result.success) {
    if (result.updated) {
      alert("Card updated!");
    } else {
      alert("Card saved!");
    }
  } else {
    alert("Failed to save card.");
  }
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

// gallery page
function startGalleryPage() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;
   console.log("grid:", grid);

  loadGallery();
}

async function loadGallery() {
  const response = await fetch("/api/gallery");
  const result = await response.json();

  const grid = document.getElementById("galleryGrid");

  if (!result || result.length === 0) {
    grid.innerText = "No cards saved yet.";
    return;
  }

  allCards = result;
  renderCards(allCards);

  document.getElementById("filterName").oninput = applyFilters;
  document.getElementById("filterSort").onchange = applyFilters;
}

let allCards = [];

function applyFilters() {
  const nameQuery = document.getElementById("filterName").value.toLowerCase();
  const sort = document.getElementById("filterSort").value;

  let filtered = allCards.filter(card => card.username.toLowerCase().includes(nameQuery));

  if (sort === "nameAsc") filtered.sort((a, b) => a.username.localeCompare(b.username));
  if (sort === "nameDesc") filtered.sort((a, b) => b.username.localeCompare(a.username));
  if (sort === "hoursDesc") filtered.sort((a, b) => b.total_hours - a.total_hours);
if (sort === "hoursAsc") filtered.sort((a, b) => a.total_hours - b.total_hours);

  renderCards(filtered);
}
// renders cards in gallery
function renderCards(cards) {
  const grid = document.getElementById("galleryGrid");
  grid.innerHTML = "";

  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "galleryCard";

    div.innerHTML = `
      <div class="profileHeader">
        <div class="profileLabel">
          <p>STEAM PROFILE</p>
          <h1>${card.username}</h1>
        </div>
        <div class="cardLogoText">Showcase<span>GG</span></div>
        <div class="profileGradeBox">
          <div id="qr-${card.id}"></div>
          <div class="gradeText">
            <p>GRADE</p>
            <h2>${card.grade}</h2>
          </div>
        </div>
      </div>
      <div class="profileAvatar">
        <img src="${card.avatar_url}" width="100%" />
      </div>
      <div class="profileHours">
        <p>Total hours: ${card.total_hours}</p>
      </div>
      <div class="profileGames">
        <h2>Most Played Games</h2>
        <div class="gamesList">
          ${card.top_games.map(game => {
            const iconUrl = "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/" +
              game.appid + "/" + game.img_icon_url + ".jpg";
            return `
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <img src="${iconUrl}" width="64" height="64"
                  onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/5/5a/Black_question_mark.png'">
                <div>
                  <p style="margin:0;"><b>${game.name}</b></p>
                  <p style="margin:0; font-size:14px; font-weight:bold;">${Math.round(game.playtime_forever / 60)} hours</p>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    grid.appendChild(div);

    const steamProfileUrl = `https://steamcommunity.com/profiles/${card.steamid}`;
    const qr = new QRCodeStyling({
      width: 80,
      height: 80,
      data: steamProfileUrl,
      dotsOptions: { color: "#111827", type: "rounded" },
      backgroundOptions: { color: "#ffffff" }
    });
    qr.append(document.getElementById(`qr-${card.id}`));
  });
}
