const API_URL = "https://cautious-garbanzo-jj6q96pwqwjfppvg-3000.app.github.dev"; // en Codespaces cambia luego

// REGISTRO
document.getElementById("registroForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    nombre: e.target[0].value,
    email: e.target[1].value,
    password: e.target[2].value,
    tipo: e.target[3].value
  };

  try {
    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    alert("Usuario registrado correctamente ✅");
    e.target.reset();
  } catch (error) {
    alert("Error al registrar ❌");
  }
});

// PUBLICAR DONACIÓN
document.getElementById("publicarForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    nombreAlimento: e.target[0].value,
    cantidad: e.target[1].value,
    fecha: e.target[2].value,
    descripcion: e.target[3].value
  };

  try {
    const res = await fetch(`${API_URL}/donations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    alert("Donación publicada ✅");
    e.target.reset();
  } catch (error) {
    alert("Error al publicar ❌");
  }
});

// Cargar usuarios
async function cargarUsuarios() {
  const res = await fetch(`${API_URL}/users`);
  const data = await res.json();

  const lista = document.getElementById("usuariosList");
  lista.innerHTML = "";

  data.forEach(user => {
    const li = document.createElement("li");
    li.textContent = `${user.nombre} (${user.tipo})`;
    lista.appendChild(li);
  });
}

// Cargar donaciones
async function cargarDonaciones() {
  const res = await fetch(`${API_URL}/donations`);
  const data = await res.json();

  const lista = document.getElementById("donacionesList");
  lista.innerHTML = "";

  data.forEach(don => {
    const li = document.createElement("li");
    li.textContent = `${don.nombreAlimento} - ${don.cantidad}`;
    lista.appendChild(li);
  });
}

// Ejecutar al cargar la página
window.onload = () => {
  cargarUsuarios();
  cargarDonaciones();
};