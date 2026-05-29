const SESSION_KEY = "smika_session_id";

function createSessionId() {
  return `smika_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getSmikaSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = createSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}