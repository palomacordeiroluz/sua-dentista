/* ============================================================
   SUA DENTISTA — Dra. Emilly Oliveira
   Script principal
   ------------------------------------------------------------
   - Cabeçalho: estado "scrolled" (fundo sólido ao rolar)
   - Navegação mobile: abrir/fechar painel em tela cheia
   - Galeria: lightbox simples (clique para ampliar)
   Sem dependências externas.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Header: estado ao rolar ---------- */
  const header = document.querySelector(".header");
  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  /* ---------- Navegação mobile ---------- */
  const navToggle = document.querySelector(".nav-toggle");
  const mobilePanel = document.querySelector(".mobile-panel");
  const mobilePanelClose = document.querySelector(".mobile-panel__close");

  function closeMobilePanel() {
    if (!mobilePanel || !navToggle) return;
    mobilePanel.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function openMobilePanel() {
    if (!mobilePanel || !navToggle) return;
    mobilePanel.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  if (navToggle && mobilePanel) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      isOpen ? closeMobilePanel() : openMobilePanel();
    });

    if (mobilePanelClose) mobilePanelClose.addEventListener("click", closeMobilePanel);

    mobilePanel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobilePanel);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobilePanel();
    });
  }

  /* ---------- Revelação de texto (palavra a palavra) ----------
     Aplica-se a qualquer elemento com a classe .js-reveal: o texto é
     dividido em palavras, cada uma entra com um leve deslize + rotação.
     Elementos com .reveal-up fazem um fade + subida simples (sem split).
     Tudo é disparado por IntersectionObserver, então funciona tanto no
     carregamento (hero, já visível) quanto ao rolar a página. */
  function splitIntoWords(el) {
    if (el.dataset.split === "true") return;
    if (el.children.length > 0) {
      // Elemento tem marcação interna (ex.: <br>) — evita corromper o texto,
      // aplica só um fade simples em vez do split por palavra.
      el.classList.add("reveal-up");
      el.classList.remove("js-reveal");
      el.dataset.split = "true";
      return;
    }
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((word, i) => {
      const wrap = document.createElement("span");
      wrap.className = "word";
      wrap.style.setProperty("--word-i", i);

      const inner = document.createElement("span");
      inner.className = "word__inner";
      inner.textContent = word;

      wrap.appendChild(inner);
      el.appendChild(wrap);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    el.dataset.split = "true";
  }

  const wordRevealEls = document.querySelectorAll(".js-reveal");
  wordRevealEls.forEach(splitIntoWords);

  const fadeRevealEls = document.querySelectorAll(".reveal-up");
  const allRevealEls = [...new Set([...wordRevealEls, ...fadeRevealEls])];

  if ("IntersectionObserver" in window && allRevealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
    );
    allRevealEls.forEach((el) => revealObserver.observe(el));
  } else {
    allRevealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Comparador antes / depois ---------- */
  const compareItems = document.querySelectorAll("[data-compare]");

  compareItems.forEach((compare) => {
    const range = compare.querySelector(".compare-range");
    if (!range) return;

    const updateCompare = (value) => {
      let position = Number(value);
      if (!Number.isFinite(position)) position = 50;
      position = Math.max(0, Math.min(100, position));

      /*
       * O tamanho das imagens NÃO muda.
       * O CSS usa --pos apenas para recortar/revelar a foto Antes.
       */
      compare.style.setProperty("--pos", `${position}%`);
      range.value = String(position);
    };

    const updateFromPointer = (event) => {
      const rect = compare.getBoundingClientRect();
      if (!rect.width) return;

      const position = ((event.clientX - rect.left) / rect.width) * 100;
      updateCompare(position);
    };

    let dragging = false;

    range.addEventListener("pointerdown", (event) => {
      dragging = true;
      range.setPointerCapture?.(event.pointerId);
      updateFromPointer(event);
    });

    range.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      updateFromPointer(event);
    });

    const stopDragging = (event) => {
      dragging = false;
      try {
        range.releasePointerCapture?.(event.pointerId);
      } catch (_) {}
    };

    range.addEventListener("pointerup", stopDragging);
    range.addEventListener("pointercancel", stopDragging);

    range.addEventListener("input", (event) => {
      updateCompare(event.target.value);
    });

    updateCompare(range.value || 50);
  });

  /* ---------- Lightbox da galeria de resultados ---------- */
  const lightbox = document.querySelector(".lightbox");
  const lightboxImg = lightbox ? lightbox.querySelector("img") : null;
  const lightboxCaption = lightbox ? lightbox.querySelector(".lightbox__caption") : null;
  const lightboxClose = lightbox ? lightbox.querySelector(".lightbox__close") : null;
  const galleryItems = document.querySelectorAll("[data-lightbox]");

  function openLightbox(src, alt, caption) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    if (lightboxCaption) lightboxCaption.textContent = caption || "";
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  galleryItems.forEach((item) => {
    item.addEventListener("click", () => {
      const img = item.querySelector("img");
      const captionEl = item.querySelector(".gallery__caption");
      if (!img) return;
      openLightbox(img.src, img.alt, captionEl ? captionEl.textContent : "");
    });

    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        item.click();
      }
    });
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
})();
