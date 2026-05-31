document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("errorMsg");
    
    // 🔥 ELEMEN BUTTON & SPINNER
    const btnLogin = document.getElementById("btnLogin");
    const btnText = document.getElementById("btnText");
    const btnSpinner = document.getElementById("btnSpinner");

    errorMsg.classList.add("hidden");

    // 🔥 FUNGSI TOGGLE LOADING
    function setLoading(isLoading) {
      if (isLoading) {
        btnText.textContent = "Memproses...";
        btnSpinner.classList.remove("hidden");
        btnLogin.disabled = true;
        btnLogin.classList.add("opacity-75", "cursor-not-allowed");
      } else {
        btnText.textContent = "Login";
        btnSpinner.classList.add("hidden");
        btnLogin.disabled = false;
        btnLogin.classList.remove("opacity-75", "cursor-not-allowed");
      }
    }

    // 🔥 AKTIFKAN LOADING
    setLoading(true);

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
      
    } finally {
      // 🔥 PASTIKAN LOADING MATI (success/error)
      setLoading(false);
    }
  });
