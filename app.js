(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const invitationUrl = () => CONFIG.siteUrl || window.location.href.split("#")[0];
  const coupleName = `${CONFIG.couple.bride.en} & ${CONFIG.couple.groom.en}`;
  let language = "en";
  let repaintScratchSurface = () => {};

  try {
    const storedLanguage = localStorage.getItem("wedding-language");
    if (storedLanguage === "pa" || storedLanguage === "en") language = storedLanguage;
  } catch (error) {
    console.warn("Language preference could not be read from storage.", error);
  }

  function localize() {
    const translations = I18N[language];
    document.documentElement.lang = language === "pa" ? "pa" : "en";
    document.body.classList.toggle("punjabi-interface", language === "pa");
    $$("[data-i18n]").forEach((element) => {
      element.textContent = translations[element.dataset.i18n];
    });
    $$("[data-language-toggle]").forEach((button) => {
      button.textContent = language === "en" ? "ਪੰਜਾਬੀ" : "English";
      button.setAttribute("aria-label", language === "en" ? "Switch to Punjabi" : "Switch to English");
    });
    $("#scratch-surface").setAttribute("aria-label", translations.scratchAria);
    syncMusicControl();
    if (usingFallbackMusic) $("#music-status").textContent = translations.musicFallback;
    else if (audio.error) $("#music-status").textContent = translations.musicUnavailable;
    document.title = `${coupleName} · ${translations.invitationHeading}`;
    renderEvents(translations);
    renderVenueLinks(translations);
    renderWhatsAppLinks(translations);
    renderShareLinks(translations);
    renderTraditionalInvitation();
    repaintScratchSurface();
    updateCountdown();
  }

  function renderTraditionalInvitation() {
    const invitation = CONFIG.invitation;
    $("#traditional-verse-heading").textContent = invitation.verse[0];
    $("#traditional-verse").replaceChildren(...invitation.verse.slice(1).map((line) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      return paragraph;
    }));
    $("#traditional-quote").replaceChildren(...invitation.quotation.map((line) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      return paragraph;
    }));
    $("#traditional-rsvp-names").replaceChildren(...invitation.rsvpNames.map((name) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = name;
      return paragraph;
    }));
    $("#traditional-rsvp-phones").textContent = `M: ${invitation.phones.join(", ")}`;
    $("#traditional-compliments-heading").replaceChildren(
      document.createTextNode("WITH BEST COMPLIMENTS"),
      document.createElement("br"),
      document.createTextNode("FROM:"),
    );
    $("#traditional-compliments-lines").replaceChildren(...invitation.compliments.slice(1).map((line) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      return paragraph;
    }));
  }

  function renderEvents(translations) {
    const eventList = $("#event-list");
    eventList.replaceChildren(...CONFIG.events.map((event, index) => {
      const card = document.createElement("article");
      card.className = "event-card reveal-item";
      card.dataset.event = event.id;

      const number = document.createElement("p");
      number.className = "event-number";
      number.textContent = `0${index + 1}`;
      const title = document.createElement("h3");
      title.className = "event-title";
      title.textContent = event.title[language];
      const date = document.createElement("p");
      date.className = "event-date";
      date.textContent = event.date[language];
      const schedule = document.createElement("ul");
      schedule.className = "event-schedule";
      event.times.forEach((item) => {
        const row = document.createElement("li");
        const name = document.createElement("span");
        const time = document.createElement("strong");
        if (typeof item === "string") {
          name.textContent = item;
          time.textContent = "";
        } else {
          name.textContent = item[language];
          time.textContent = item.time;
        }
        row.append(name, time);
        schedule.append(row);
      });
      const venue = document.createElement("p");
      venue.className = "event-venue";
      venue.textContent = event.venue;
      const address = document.createElement("p");
      address.className = "event-address";
      address.textContent = event.address;
      const actions = document.createElement("div");
      actions.className = "event-actions";
      const mapLink = document.createElement("a");
      mapLink.className = "button";
      mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.mapQuery)}`;
      mapLink.target = "_blank";
      mapLink.rel = "noopener noreferrer";
      mapLink.textContent = translations.getDirections;
      const calendarLink = document.createElement("a");
      calendarLink.className = "text-link";
      calendarLink.href = googleCalendarUrl(event);
      calendarLink.target = "_blank";
      calendarLink.rel = "noopener noreferrer";
      calendarLink.textContent = translations.addToCalendar;
      const calendarDownload = document.createElement("button");
      calendarDownload.type = "button";
      calendarDownload.className = "text-link";
      calendarDownload.textContent = translations.downloadCalendar;
      calendarDownload.addEventListener("click", () => downloadCalendarFile(event));
      actions.append(mapLink, calendarLink, calendarDownload);
      card.append(number, title, date, schedule, venue, address);
      if (event.note) {
        const note = document.createElement("p");
        note.className = "event-note";
        note.textContent = event.note;
        card.append(note);
      }
      card.append(actions);
      return card;
    }));
    observeRevealItems();
  }

  function renderVenueLinks(translations) {
    const list = $("#venue-directions");
    list.replaceChildren(...CONFIG.events.map((event) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.mapQuery)}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `${event.venue} · ${translations.getDirections}`;
      item.append(link);
      return item;
    }));
  }

  function renderWhatsAppLinks(translations) {
    const container = $("#whatsapp-links");
    container.replaceChildren(...CONFIG.invitation.phones.map((phone) => {
      const link = document.createElement("a");
      link.className = "button button-filled";
      link.href = `https://wa.me/91${phone}?text=${encodeURIComponent(translations.rsvpDraft)}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `${translations.rsvpWhatsApp} · ${phone}`;
      return link;
    }));
  }

  function renderShareLinks(translations) {
    $("#share-whatsapp").href = `https://wa.me/?text=${encodeURIComponent(`${translations.shareMessage}\n${invitationUrl()}`)}`;
  }

  function googleCalendarUrl(event) {
    const format = (date) => date.slice(0, 19).replace(/[-:]/g, "");
    const query = new URLSearchParams({
      action: "TEMPLATE",
      text: `${coupleName} · ${event.title.en}`,
      dates: `${format(event.start)}/${format(event.end)}`,
      ctz: "Asia/Kolkata",
      location: `${event.venue}, ${event.address}`,
    });
    return `https://calendar.google.com/calendar/render?${query}`;
  }

  function downloadCalendarFile(event) {
    const toUtcStamp = (date) => new Date(date).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const escapeIcs = (text) => text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Taranpreet and Harjasjot//Wedding Invitation//EN",
      "BEGIN:VEVENT",
      `UID:${event.id}@taranpreet-harjasjot`,
      `DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
      `DTSTART:${toUtcStamp(event.start)}`,
      `DTEND:${toUtcStamp(event.end)}`,
      `SUMMARY:${escapeIcs(`${coupleName} - ${event.title.en}`)}`,
      `LOCATION:${escapeIcs(`${event.venue}, ${event.address}`)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.id}.ics`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function updateCountdown() {
    const now = Date.now();
    const target = Date.parse(CONFIG.ceremony.start);
    const labels = I18N[language];
    const message = $("#countdown-message");
    const clock = $("#countdown-clock");
    if (now >= target) {
      clock.hidden = true;
      message.textContent = now >= Date.parse(CONFIG.ceremony.end) ? labels.countdownDone : labels.countdownNow;
      return;
    }

    clock.hidden = false;
    message.textContent = "";
    const totalSeconds = Math.max(0, Math.floor((target - now) / 1000));
    const values = [
      Math.floor(totalSeconds / 86400),
      Math.floor((totalSeconds % 86400) / 3600),
      Math.floor((totalSeconds % 3600) / 60),
      totalSeconds % 60,
    ];
    ["#count-days", "#count-hours", "#count-minutes", "#count-seconds"].forEach((selector, index) => {
      $(selector).textContent = String(values[index]).padStart(2, "0");
    });
  }

  function observeRevealItems() {
    const targets = $$(".reveal-item");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }
    if (!window.revealObserver) {
      window.revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18 });
    }
    targets.forEach((target) => {
      if (!target.classList.contains("is-visible")) window.revealObserver.observe(target);
    });
  }

  function setupScratchCard() {
    const canvas = $("#scratch-surface");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const card = $("#scratch-card");
    let drawing = false;
    let revealed = false;
    let previousPoint = null;
    let resizeFrame = 0;

    const paintSurface = () => {
      if (revealed) return;
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.round(bounds.width * scale);
      canvas.height = Math.round(bounds.height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      const gradient = context.createLinearGradient(0, 0, bounds.width, bounds.height);
      gradient.addColorStop(0, "#D99B85");
      gradient.addColorStop(0.48, "#F0D6C3");
      gradient.addColorStop(1, "#D99B85");
      context.fillStyle = gradient;
      context.fillRect(0, 0, bounds.width, bounds.height);
      context.strokeStyle = "rgba(255, 247, 234, .5)";
      context.lineWidth = 1;
      for (let x = -bounds.height; x < bounds.width; x += 16) {
        context.beginPath();
        context.moveTo(x, bounds.height);
        context.lineTo(x + bounds.height, 0);
        context.stroke();
      }
      context.fillStyle = "rgba(99, 61, 53, .78)";
      context.font = "500 12px Jost, sans-serif";
      context.textAlign = "center";
      context.fillText(language === "en" ? "SCRATCH TO REVEAL" : "ਖੁਰਚ ਕੇ ਤਾਰੀਖ਼ ਵੇਖੋ", bounds.width / 2, bounds.height - 18);
    };

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      card.classList.add("is-revealed");
      canvas.setAttribute("aria-hidden", "true");
      canvas.tabIndex = -1;
      canvas.style.pointerEvents = "none";
      $("#revealed-date").setAttribute("aria-label", "24 January 2027");
    };
    const getPoint = (event) => {
      const bounds = canvas.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };
    const eraseAt = (point) => {
      context.globalCompositeOperation = "destination-out";
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 54;
      if (previousPoint) {
        context.beginPath();
        context.moveTo(previousPoint.x, previousPoint.y);
        context.lineTo(point.x, point.y);
        context.stroke();
      } else {
        context.beginPath();
        context.arc(point.x, point.y, 27, 0, Math.PI * 2);
        context.fill();
      }
      previousPoint = point;
    };
    const checkRevealProgress = () => {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const stride = Math.max(16, Math.floor((canvas.width * canvas.height) / 12000));
      let erased = 0;
      let samples = 0;
      for (let i = 3; i < pixels.length; i += stride * 4) {
        samples += 1;
        if (pixels[i] < 128) erased += 1;
      }
      if (samples > 0 && erased / samples >= 0.42) reveal();
    };

    canvas.addEventListener("pointerdown", (event) => {
      if (revealed || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
      event.preventDefault();
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      previousPoint = null;
      eraseAt(getPoint(event));
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!drawing) return;
      event.preventDefault();
      eraseAt(getPoint(event));
    });
    const finishStroke = () => {
      if (!drawing) return;
      drawing = false;
      previousPoint = null;
      checkRevealProgress();
    };
    canvas.addEventListener("pointerup", finishStroke);
    canvas.addEventListener("pointercancel", finishStroke);
    canvas.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        reveal();
      }
    });
    const resize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(paintSurface);
    };
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas.parentElement);
    window.addEventListener("resize", resize);
    if (document.fonts?.ready) document.fonts.ready.then(resize);
    resize();
    return () => paintSurface();
  }

  function setupEnvelope() {
    const overlay = $("#envelope");
    const openButton = $("#open-invitation");
    const main = $("#main-content");
    let opened = false;
    const focusableControls = () => $$("button:not([disabled])", overlay);
    overlay.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const controls = focusableControls();
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    openButton.addEventListener("click", () => {
      if (opened) return;
      opened = true;
      overlay.classList.add("is-opening");
      document.body.classList.add("is-unlocked");
      playMusic();
      window.setTimeout(() => {
        overlay.remove();
        document.body.classList.remove("locked");
        main.removeAttribute("inert");
        main.removeAttribute("aria-hidden");
        $("#scratch-surface").focus();
      }, reducedMotion ? 30 : 1250);
    });
  }

  const audio = $("#background-music");
  audio.src = CONFIG.assets.song;
  audio.volume = 0.45;
  const musicButton = $("#music-toggle");
  let musicWanted = false;
  let usingFallbackMusic = false;
  let fallbackPlaying = false;
  let fallbackContext = null;
  let fallbackOutput = null;
  let fallbackOscillators = [];
  let fallbackTimer = 0;
  let fallbackChord = 0;
  const fallbackChords = [
    [130.81, 164.81, 196.0],
    [110.0, 164.81, 220.0],
    [130.81, 174.61, 220.0],
    [98.0, 146.83, 196.0],
  ];

  function syncMusicControl() {
    const playing = usingFallbackMusic ? fallbackPlaying : !audio.paused && !audio.ended;
    musicButton.setAttribute("aria-pressed", String(playing));
    musicButton.setAttribute("aria-label", I18N[language][playing ? "pauseMusic" : "playMusic"]);
    $("span[aria-hidden]", musicButton).textContent = playing ? "Ⅱ" : "♪";
  }

  async function startFallbackMusic() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error("Web Audio is not supported in this browser.");
    if (!fallbackContext) {
      fallbackContext = new AudioContext();
      fallbackOutput = fallbackContext.createGain();
      fallbackOutput.gain.value = 0.0001;
      fallbackOutput.connect(fallbackContext.destination);
      fallbackOscillators = fallbackChords[0].map((frequency, index) => {
        const oscillator = fallbackContext.createOscillator();
        const voice = fallbackContext.createGain();
        const panner = fallbackContext.createStereoPanner ? fallbackContext.createStereoPanner() : null;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        voice.gain.value = 0.42;
        oscillator.connect(voice);
        if (panner) {
          panner.pan.value = (index - 1) * 0.45;
          voice.connect(panner);
          panner.connect(fallbackOutput);
        } else {
          voice.connect(fallbackOutput);
        }
        oscillator.start();
        return oscillator;
      });
    }

    await fallbackContext.resume();
    fallbackPlaying = true;
    usingFallbackMusic = true;
    fallbackChord = 0;
    const now = fallbackContext.currentTime;
    fallbackOutput.gain.cancelScheduledValues(now);
    fallbackOutput.gain.setTargetAtTime(0.055, now, 0.8);
    const changeChord = () => {
      if (!fallbackPlaying) return;
      fallbackChord = (fallbackChord + 1) % fallbackChords.length;
      const chord = fallbackChords[fallbackChord];
      const time = fallbackContext.currentTime;
      fallbackOscillators.forEach((oscillator, index) => {
        oscillator.frequency.cancelScheduledValues(time);
        oscillator.frequency.setTargetAtTime(chord[index], time, 0.9);
      });
    };
    window.clearInterval(fallbackTimer);
    fallbackTimer = window.setInterval(changeChord, 6000);
    musicWanted = true;
    $("#music-status").textContent = I18N[language].musicFallback;
    syncMusicControl();
  }

  function pauseFallbackMusic() {
    if (!fallbackContext || !fallbackPlaying) return;
    fallbackPlaying = false;
    window.clearInterval(fallbackTimer);
    fallbackOutput.gain.setTargetAtTime(0.0001, fallbackContext.currentTime, 0.18);
    window.setTimeout(() => {
      if (!fallbackPlaying) fallbackContext.suspend();
    }, 750);
  }

  async function playMusic() {
    if (usingFallbackMusic) {
      try {
        await fallbackContext.resume();
        fallbackPlaying = true;
        musicWanted = true;
        fallbackOutput.gain.setTargetAtTime(0.055, fallbackContext.currentTime, 0.8);
        fallbackTimer = window.setInterval(() => {
          if (!fallbackPlaying) return;
          fallbackChord = (fallbackChord + 1) % fallbackChords.length;
          const chord = fallbackChords[fallbackChord];
          const time = fallbackContext.currentTime;
          fallbackOscillators.forEach((oscillator, index) => {
            oscillator.frequency.cancelScheduledValues(time);
            oscillator.frequency.setTargetAtTime(chord[index], time, 0.9);
          });
        }, 6000);
        syncMusicControl();
        return;
      } catch (error) {
        musicWanted = false;
        $("#music-status").textContent = I18N[language].musicUnavailable;
        console.warn("The temporary music placeholder could not be resumed.", error);
        syncMusicControl();
        return;
      }
    }
    try {
      await audio.play();
      musicWanted = true;
      syncMusicControl();
      $("#music-status").textContent = "";
    } catch (error) {
      console.warn("The supplied soundtrack could not be started; trying the generated placeholder.", error);
      try {
        await startFallbackMusic();
      } catch (fallbackError) {
        musicWanted = false;
        syncMusicControl();
        $("#music-status").textContent = I18N[language].musicUnavailable;
        console.warn("The temporary music placeholder could not be started.", fallbackError);
      }
    }
  }

  musicButton.addEventListener("click", () => {
    if (usingFallbackMusic && fallbackPlaying) {
      musicWanted = false;
      pauseFallbackMusic();
      syncMusicControl();
      return;
    }
    if (!usingFallbackMusic && !audio.paused) {
      musicWanted = false;
      audio.pause();
      syncMusicControl();
      return;
    }
    playMusic();
  });
  audio.addEventListener("pause", () => {
    syncMusicControl();
  });
  audio.addEventListener("playing", () => {
    syncMusicControl();
  });
  audio.addEventListener("error", () => {
    if (!usingFallbackMusic) $("#music-status").textContent = I18N[language].musicUnavailable;
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      audio.pause();
      pauseFallbackMusic();
    }
    else if (musicWanted) playMusic();
  });

  $$("[data-language-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      language = language === "en" ? "pa" : "en";
      try {
        localStorage.setItem("wedding-language", language);
      } catch (error) {
        console.warn("Language preference could not be saved.", error);
      }
      localize();
    });
  });

  const setStatus = (message) => {
    $("#share-status").textContent = message;
    window.setTimeout(() => {
      $("#share-status").textContent = "";
    }, 3500);
  };
  $("#share-button").addEventListener("click", async () => {
    if (!navigator.share) {
      $("#share-whatsapp").click();
      return;
    }
    try {
      await navigator.share({ title: document.title, text: I18N[language].shareMessage, url: invitationUrl() });
    } catch (error) {
      if (error.name !== "AbortError") {
        console.warn("The invitation could not be shared.", error);
        setStatus(I18N[language].copyUnavailable);
      }
    }
  });
  $("#copy-link").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(invitationUrl());
      setStatus(I18N[language].linkCopied);
    } catch (error) {
      console.warn("The invitation URL could not be copied.", error);
      setStatus(I18N[language].copyUnavailable);
    }
  });
  $$(".print-button").forEach((button) => button.addEventListener("click", () => window.print()));

  document.documentElement.style.setProperty("--motion-duration", reducedMotion ? "0ms" : "800ms");
  if (!reducedMotion) document.body.classList.add("motion-ready");
  repaintScratchSurface = setupScratchCard();
  setupEnvelope();
  localize();
  observeRevealItems();
  updateCountdown();
  window.setInterval(updateCountdown, 1000);
})();
