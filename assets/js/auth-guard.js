const isLogin = localStorage.getItem("isLogin");
const path = window.location.pathname;

const authPages = ["login.html", "register.html"];

if (!isLogin && !authPages.some((p) => path.includes(p))) {
  window.location.href = "pages/login.html";
}

if (isLogin && authPages.some((p) => path.includes(p))) {
  window.location.href = "../index.html";
}
