const themeStorageKey = "deniz-theme";
const themeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

const getStoredTheme = () => {
  try {
    const storedTheme = window.localStorage.getItem(themeStorageKey);
    return storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : null;
  } catch {
    return null;
  }
};

const getCurrentTheme = () => {
  return (
    getStoredTheme() ||
    (themeMediaQuery.matches ? "dark" : "light")
  );
};

const updateThemeToggle = (theme) => {
  const toggle = document.querySelector("[data-theme-toggle]");

  if (!toggle) {
    return;
  }

  const nextTheme = theme === "dark" ? "light" : "dark";
  toggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
  toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  toggle.title = `Switch to ${nextTheme} mode`;
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  updateThemeToggle(theme);
};

const persistTheme = (theme) => {
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    return;
  }
};

applyTheme(getCurrentTheme());

const headerInner = document.querySelector(".site-header-inner");
const siteNav = document.querySelector(".site-nav");
const menuToggle = document.querySelector("[data-menu-toggle]");

if (headerInner) {
  const themeToggle = document.createElement("button");
  themeToggle.className = "theme-toggle";
  themeToggle.type = "button";
  themeToggle.dataset.themeToggle = "";
  themeToggle.innerHTML = `
    <svg class="theme-icon-dark" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 7.5 9 9 0 1 1-9-7.5Z"></path>
    </svg>
    <svg class="theme-icon-light" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2"></path>
      <path d="M12 20v2"></path>
      <path d="m4.93 4.93 1.41 1.41"></path>
      <path d="m17.66 17.66 1.41 1.41"></path>
      <path d="M2 12h2"></path>
      <path d="M20 12h2"></path>
      <path d="m6.34 17.66-1.41 1.41"></path>
      <path d="m19.07 4.93-1.41 1.41"></path>
    </svg>
  `;

  themeToggle.addEventListener("click", () => {
    const nextTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";

    persistTheme(nextTheme);
    applyTheme(nextTheme);
  });

  headerInner.append(themeToggle);
  updateThemeToggle(getCurrentTheme());
}

const closeMenu = () => {
  if (!siteNav || !menuToggle) {
    return;
  }

  siteNav.dataset.open = "false";
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
};

if (siteNav && menuToggle) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.dataset.open === "true";
    siteNav.dataset.open = isOpen ? "false" : "true";
    menuToggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation menu" : "Close navigation menu",
    );
  });
}

themeMediaQuery.addEventListener("change", (event) => {
  if (!getStoredTheme()) {
    applyTheme(event.matches ? "dark" : "light");
  }
});

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const revealItems = document.querySelectorAll(".reveal");

if (revealItems.length > 0 && !prefersReducedMotion) {
  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index * 45, 420)}ms`);
  });

  window.requestAnimationFrame(() => {
    document.documentElement.classList.add("has-motion");
  });
}

const sectionLinks = document.querySelectorAll("[data-section-link]");

if (sectionLinks.length > 0) {
  const sections = Array.from(sectionLinks)
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const getScrollOffset = () => {
    const header = document.querySelector(".site-header");
    return (header?.offsetHeight || 0) + 18;
  };

  const setActiveLink = (id) => {
    sectionLinks.forEach((link) => {
      const target = link.getAttribute("href");
      link.dataset.active = target === `#${id}` ? "true" : "false";
    });
  };

  const scrollToSection = (section) => {
    const top =
      window.scrollY + section.getBoundingClientRect().top - getScrollOffset();

    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const updateActiveSection = () => {
    if (sections.length === 0) {
      return;
    }

    const scrollMarker = window.scrollY + getScrollOffset() + 24;
    let activeSection = sections[0];

    sections.forEach((section) => {
      if (section.offsetTop <= scrollMarker) {
        activeSection = section;
      }
    });

    setActiveLink(activeSection.id);
  };

  sectionLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href")?.slice(1);
      const targetSection = targetId
        ? document.getElementById(targetId)
        : null;

      if (!targetId || !targetSection) {
        return;
      }

      event.preventDefault();
      history.replaceState(null, "", `#${targetId}`);
      setActiveLink(targetId);
      closeMenu();
      scrollToSection(targetSection);
    });
  });

  window.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", () => {
    updateActiveSection();

    if (window.matchMedia("(min-width: 431px)").matches) {
      closeMenu();
    }
  });
  window.addEventListener("hashchange", updateActiveSection);

  updateActiveSection();
}
