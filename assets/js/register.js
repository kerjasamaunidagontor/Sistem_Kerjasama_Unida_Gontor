document
  .getElementById("registerForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("errorMsg");

    errorMsg.classList.add("hidden");

    try {
      const res = await fetch(API.auth, {
        method: "POST",
        body: JSON.stringify({
          action: "register",
          username,
          email,
          password,
        }),
      }).then((r) => r.json());

      if (!res.success) {
        errorMsg.innerText = res.message || "Register gagal";
        errorMsg.classList.remove("hidden");
        return;
      }

      alert("Registrasi berhasil, silakan login");
      window.location.href = "login.html";
    } catch (err) {
      console.error(err);
      errorMsg.innerText = "Gagal terhubung ke server";
      errorMsg.classList.remove("hidden");
    }
  });
