window.onload = function () {

  console.log("JS loaded");

  // home page
  const usernameInput = document.getElementById("username");
  const searchButton = document.getElementById("searchButton");

  if (searchButton && usernameInput) {

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
  const usernameDisplay = document.getElementById("usernameDisplay");
  const avatarImage = document.getElementById("avatarImage");
  const statusText = document.getElementById("statusText");

  if (usernameDisplay) {

    const urlParameters = new URLSearchParams(window.location.search);

    const username = urlParameters.get("user");

    if (!username) {
      usernameDisplay.innerText = "No username found";
      return;
    }

    loadProfile(username);
  }

  async function loadProfile(username) {

    console.log("Loading profile:", username);

    // get steam id
    const resolveResponse = await fetch(
      "/api/resolve?username=" + username
    );

    const resolveData = await resolveResponse.json();

    console.log(resolveData);

    if (
      !resolveData.response ||
      resolveData.response.success !== 1
    ) {
      usernameDisplay.innerText = "User not found";
      return;
    }

    const steamId = resolveData.response.steamid;

    // get profile
    const profileResponse = await fetch(
      "/api/profile?steamId=" + steamId
    );

    const profileData = await profileResponse.json();

    console.log(profileData);

    const player = profileData.response.players[0];

    if (!player) {
      usernameDisplay.innerText = "Profile not found";
      return;
    }

    // display profile
    usernameDisplay.innerText = player.personaname;

    avatarImage.src = player.avatarfull;

    if (player.personastate === 1) {
      statusText.innerText = "Online";
    } else {
      statusText.innerText = "Offline";
    }
  }
};