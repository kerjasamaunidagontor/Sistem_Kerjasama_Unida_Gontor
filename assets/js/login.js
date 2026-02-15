document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("errorMsg");

    errorMsg.classList.add("hidden");

    try {
      const res = await fetch(API.auth, {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          username,
          password,
        }),
      }).then((r) => r.json());

      if (!res.success) {
        errorMsg.innerText = res.message || "Login gagal";
        errorMsg.classList.remove("hidden");
        return;
      }

      localStorage.setItem("isLogin", "true");
      localStorage.setItem("username", res.username);
      localStorage.setItem("role", res.role);
      localStorage.setItem("lastActive", Date.now());

      window.location.href = "../index.html";
    } catch (err) {
      errorMsg.innerText = "Gagal terhubung ke server";
      errorMsg.classList.remove("hidden");
    }
  });
