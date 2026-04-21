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
    return (taskbar?.offsetHeight || 0) + 10;
  };

  const getSectionAnchor = (section) => {
    return section.querySelector(".section-heading") || section;
  };

  const scrollToSection = (section) => {
    const anchor = getSectionAnchor(section);
    const top =
      window.scrollY + anchor.getBoundingClientRect().top - getScrollOffset();

    window.scrollTo({
      top,
      behavior: "auto",
    });
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
      scrollToSection(targetSection);
      window.setTimeout(updateActiveSection, 0);
    });
  });

  window.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", updateActiveSection);
  window.addEventListener("hashchange", updateActiveSection);

  updateActiveSection();
}
