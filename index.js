window.NorthSky = (() => {

  const API = "https://your-api.com";

  function id(key) {
    let v = localStorage.getItem(key);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(key, v);
    }
    return v;
  }

  const session = id("ns_session_id");
  const user = id("ns_user_id");

  function getScore() {
    return Number(localStorage.getItem("ns_score") || 0);
  }

  function setScore(v) {
    localStorage.setItem("ns_score", v);
    return v;
  }

  const map = {
    page_view: 1,
    click: 3,
    funnel: 8,
    checkout: 20,
    lead: 10
  };

  function track(event, data = {}) {

    const score = setScore(getScore() + (map[event] || 0));

    fetch(`${API}/event`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        event,
        data,
        user_id: user,
        session_id: session,
        score,
        url: location.href,
        time: new Date().toISOString()
      })
    });

    if (score >= 15) {
      hotRoute(score);
    }
  }

  function hotRoute(score) {
    fetch(`${API}/hot-lead`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        user_id: user,
        session_id: session,
        score,
        url: location.href
      })
    });

    // funnel push (money trigger)
    window.location.href = "/skymaster-offer.html";
  }

  document.addEventListener("click", (e) => {
    const el = e.target.closest("a,button");
    if (!el) return;

    track("click", {
      text: el.innerText,
      href: el.href || null
    });
  });

  track("page_view");

  return {
    track,
    score: getScore
  };

})();