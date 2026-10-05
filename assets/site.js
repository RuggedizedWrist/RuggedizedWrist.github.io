const page = document.body;
const outline = document.querySelector("#outline");
const outlineButton = document.querySelector("[data-outline]");
const themeButton = document.querySelector("[data-theme-toggle]");
const storedTheme = localStorage.getItem("distalshift-theme");

if (storedTheme === "day" || storedTheme === "night") {
  page.dataset.theme = storedTheme;
}

themeButton.addEventListener("click", () => {
  const next = page.dataset.theme === "day" ? "night" : "day";
  page.dataset.theme = next;
  localStorage.setItem("distalshift-theme", next);
});

outlineButton.addEventListener("click", () => {
  const open = outline.hasAttribute("hidden");
  outline.toggleAttribute("hidden", !open);
  outlineButton.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll("#outline a").forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth < 1100) {
      outline.setAttribute("hidden", "");
      outlineButton.setAttribute("aria-expanded", "false");
    }
  });
});

const sections = [...document.querySelectorAll("main section, .hero")];
const outlineLinks = [...document.querySelectorAll("#outline a")];
const observer = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  outlineLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
  });
}, { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.4] });
sections.forEach((section) => observer.observe(section));

const modal = document.querySelector("#player");
const modalVideo = modal.querySelector("video");

document.querySelectorAll("[data-expand]").forEach((button) => {
  button.addEventListener("click", () => {
    const source = button.parentElement.querySelector("video");
    modalVideo.src = source.currentSrc || source.querySelector("source").src;
    modalVideo.currentTime = source.currentTime || 0;
    modal.removeAttribute("hidden");
    modalVideo.play();
    source.pause();
  });
});

function closeModal() {
  modalVideo.pause();
  modalVideo.removeAttribute("src");
  modalVideo.load();
  modal.setAttribute("hidden", "");
}

modal.querySelector("[data-close]").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hasAttribute("hidden")) closeModal();
});

document.querySelector("[data-copy]").addEventListener("click", async (event) => {
  const text = document.querySelector("#bibtex").textContent.trim();
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  button.textContent = "Copied";
  setTimeout(() => { button.textContent = "Copy BibTeX"; }, 1400);
});
