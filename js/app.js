const API_URL = "http://localhost:3000";
const SESSION_KEY = "foodsync_session";

let pendingChallengeToken = null;
let pendingTwoFactorSetup = null;

function guardarSesion(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function obtenerSesion() {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
}

function cerrarSesion() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

function authHeaders() {
  const session = obtenerSesion();
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
}

function requiereAutenticacion() {
  const currentPage = window.location.pathname.split("/").pop();
  const protectedPages = ["", "index.html", "publicar.html", "panel.html"];

  if (protectedPages.includes(currentPage) && !obtenerSesion()) {
    const redirectPage = currentPage || "index.html";
    alert("Debes registrarte o iniciar sesion para continuar.");
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectPage)}`;
  }
}

function obtenerPaginaRedireccion() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  const allowedPages = ["index.html", "publicar.html", "panel.html"];

  return allowedPages.includes(redirect) ? redirect : "index.html";
}

async function manejarRespuesta(res) {
  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      Array.isArray(data.message) ? data.message.join(", ") : data.message,
    );
  }

  return data;
}

function actualizarVistaLogin() {
  const group = document.getElementById("twoFactorLoginGroup");
  const button = document.getElementById("loginButton");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");

  if (!group || !button || !emailInput || !passwordInput) {
    return;
  }

  if (pendingChallengeToken) {
    group.hidden = false;
    button.textContent = "Verificar codigo";
    emailInput.disabled = true;
    passwordInput.disabled = true;
  } else {
    group.hidden = true;
    button.textContent = "Entrar";
    emailInput.disabled = false;
    passwordInput.disabled = false;
  }
}

async function refrescarSesion() {
  const session = obtenerSesion();

  if (!session?.token) {
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: {
        ...authHeaders(),
      },
    });

    const data = await manejarRespuesta(res);
    const updatedSession = {
      ...session,
      user: data.user,
    };

    guardarSesion(updatedSession);
    return updatedSession;
  } catch (error) {
    cerrarSesion();
    return null;
  }
}

function renderTwoFactorStatus() {
  const session = obtenerSesion();
  const status = document.getElementById("twoFactorStatus");
  const startButton = document.getElementById("startTwoFactorSetup");
  const disableButton = document.getElementById("disableTwoFactor");

  if (!status || !startButton || !disableButton || !session?.user) {
    return;
  }

  if (session.user.twoFactorEnabled) {
    status.textContent = "Google Authenticator esta activado en tu cuenta.";
    startButton.hidden = true;
    disableButton.hidden = false;
  } else {
    status.textContent = "Google Authenticator aun no esta configurado.";
    startButton.hidden = false;
    disableButton.hidden = true;
  }
}

function renderTwoFactorSetup(data) {
  const container = document.getElementById("twoFactorSetupBox");
  const image = document.getElementById("twoFactorQr");
  const secret = document.getElementById("twoFactorSecret");

  if (!container || !image || !secret) {
    return;
  }

  container.hidden = false;
  image.src = data.qrCodeUrl;
  image.alt = "QR de Google Authenticator";
  secret.textContent = data.secret;
}

function limpiarTwoFactorSetup() {
  pendingTwoFactorSetup = null;

  const container = document.getElementById("twoFactorSetupBox");
  const codeInput = document.getElementById("twoFactorCode");

  if (container) {
    container.hidden = true;
  }

  if (codeInput) {
    codeInput.value = "";
  }
}

document.getElementById("registroForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    nombre: e.target[0].value,
    email: e.target[1].value,
    password: e.target[2].value,
    tipo: e.target[3].value,
  };

  try {
    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    await manejarRespuesta(res);
    alert("Usuario registrado correctamente.");
    e.target.reset();
    window.location.href = "login.html";
  } catch (error) {
    alert(error.message || "Error al registrar.");
  }
});

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    if (pendingChallengeToken) {
      const code = document.getElementById("loginTwoFactorCode").value;
      const res = await fetch(`${API_URL}/auth/login/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken: pendingChallengeToken,
          code,
        }),
      });

      const session = await manejarRespuesta(res);
      guardarSesion(session);
      pendingChallengeToken = null;
      actualizarVistaLogin();
      alert(`Bienvenido, ${session.user.nombre}.`);
      window.location.href = obtenerPaginaRedireccion();
      return;
    }

    const data = {
      email: document.getElementById("loginEmail").value,
      password: document.getElementById("loginPassword").value,
    };

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const response = await manejarRespuesta(res);

    if (response.requiresTwoFactor) {
      pendingChallengeToken = response.challengeToken;
      actualizarVistaLogin();
      alert("Ingresa el codigo generado en Google Authenticator.");
      return;
    }

    guardarSesion(response);
    alert(`Bienvenido, ${response.user.nombre}.`);
    window.location.href = obtenerPaginaRedireccion();
  } catch (error) {
    alert(error.message || "Error al iniciar sesion.");
  }
});

document.getElementById("publicarForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    nombreAlimento: e.target[0].value,
    cantidad: e.target[1].value,
    fecha: e.target[2].value,
    descripcion: e.target[3].value,
  };

  try {
    const res = await fetch(`${API_URL}/donations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(data),
    });

    await manejarRespuesta(res);
    alert("Donacion publicada correctamente.");
    e.target.reset();
  } catch (error) {
    alert(error.message || "Error al publicar.");
  }
});

document.getElementById("startTwoFactorSetup")?.addEventListener("click", async () => {
  try {
    const res = await fetch(`${API_URL}/auth/2fa/setup`, {
      method: "POST",
      headers: {
        ...authHeaders(),
      },
    });

    pendingTwoFactorSetup = await manejarRespuesta(res);
    renderTwoFactorSetup(pendingTwoFactorSetup);
    alert("Escanea el QR o usa la clave manual en Google Authenticator.");
  } catch (error) {
    alert(error.message || "No fue posible iniciar la configuracion.");
  }
});

document.getElementById("verifyTwoFactorSetup")?.addEventListener("click", async () => {
  const code = document.getElementById("twoFactorCode")?.value;

  try {
    const res = await fetch(`${API_URL}/auth/2fa/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ code }),
    });

    const data = await manejarRespuesta(res);
    const currentSession = obtenerSesion();
    guardarSesion({
      ...currentSession,
      user: data.user,
    });
    limpiarTwoFactorSetup();
    renderTwoFactorStatus();
    alert("Google Authenticator activado correctamente.");
  } catch (error) {
    alert(error.message || "No fue posible verificar el codigo.");
  }
});

document.getElementById("disableTwoFactor")?.addEventListener("click", async () => {
  const code = prompt("Ingresa el codigo actual de Google Authenticator para desactivar el segundo factor.");

  if (!code) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/2fa/disable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ code }),
    });

    const data = await manejarRespuesta(res);
    const currentSession = obtenerSesion();
    guardarSesion({
      ...currentSession,
      user: data.user,
    });
    limpiarTwoFactorSetup();
    renderTwoFactorStatus();
    alert("Google Authenticator desactivado correctamente.");
  } catch (error) {
    alert(error.message || "No fue posible desactivar el segundo factor.");
  }
});

document.getElementById("logoutButton")?.addEventListener("click", (e) => {
  e.preventDefault();
  cerrarSesion();
});

async function cargarUsuarios() {
  const lista = document.getElementById("usuariosList");
  if (!lista) return;

  const res = await fetch(`${API_URL}/users`, {
    headers: {
      ...authHeaders(),
    },
  });
  const data = await manejarRespuesta(res);
  lista.innerHTML = "";

  data.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = `${user.nombre} (${user.tipo})`;
    lista.appendChild(li);
  });
}

async function cargarDonaciones() {
  const lista = document.getElementById("donacionesList");
  if (!lista) return;

  const res = await fetch(`${API_URL}/donations`, {
    headers: {
      ...authHeaders(),
    },
  });
  const data = await manejarRespuesta(res);
  lista.innerHTML = "";

  data.forEach((donacion) => {
    const li = document.createElement("li");
    li.textContent = `${donacion.nombreAlimento} - ${donacion.cantidad}`;
    lista.appendChild(li);
  });
}

window.addEventListener("load", async () => {
  requiereAutenticacion();
  actualizarVistaLogin();

  if (document.getElementById("twoFactorStatus")) {
    await refrescarSesion();
    renderTwoFactorStatus();
  }

  try {
    await Promise.all([cargarUsuarios(), cargarDonaciones()]);
  } catch (error) {
    console.error(error);
  }
});

window.foodsyncAuth = {
  cerrarSesion,
  obtenerSesion,
};
