(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#site-nav");
  const themeButton = document.querySelector("#theme-toggle");
  const year = document.querySelector("#year");

  if (year) year.textContent = new Date().getFullYear();

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
      });
    });
  }

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      const light = document.body.classList.toggle("light-theme");
      themeButton.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
      themeButton.title = light ? "Switch to dark theme" : "Switch to light theme";
    });
  }
})();
