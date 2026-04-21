const sectionLinks = document.querySelectorAll("[data-section-link]");

if (sectionLinks.length > 0) {
  const sections = Array.from(sectionLinks)
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const setActiveLink = (id) => {
    sectionLinks.forEach((link) => {
      const target = link.getAttribute("href");
      link.dataset.active = target === `#${id}` ? "true" : "false";
    });
  };

  const getScrollOffset = () => {
    const taskbar = document.querySelector(".taskbar");
    return (taskbar?.offsetHeight || 0) + 28;
  };

  const updateActiveSection = () => {
    if (sections.length === 0) {
      return;
    }

    const scrollMarker = window.scrollY + getScrollOffset();
    let activeSection = sections[0];

    sections.forEach((section) => {
      if (section.offsetTop <= scrollMarker) {
        activeSection = section;
      }
    });

    setActiveLink(activeSection.id);
  };

  sectionLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const targetId = link.getAttribute("href")?.slice(1);

      if (!targetId) {
        return;
      }

      setActiveLink(targetId);
      window.setTimeout(updateActiveSection, 0);
    });
  });

  window.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", updateActiveSection);
  window.addEventListener("hashchange", updateActiveSection);

  updateActiveSection();
}
