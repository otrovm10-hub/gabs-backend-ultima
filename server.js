const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

/* ============================
   ARCHIVOS JSON
============================ */
const EMPLEADOS_FILE = "./data/empleados.json";
const CATALOGO_FILE = "./data/catalogo_tareas.json";
const HISTORIAL_FILE = "./data/Historial2.json";

function cargarJSON(path) {
  if (!fs.existsSync(path)) return [];
  const contenido = fs.readFileSync(path, "utf8");
  try {
    return JSON.parse(contenido);
  } catch (e) {
    return [];
  }
}

function guardarJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

/* ============================
   USUARIOS (LOGIN)
   - usuario + clave + id
============================ */
const USUARIOS = [
  { id: "101", usuario: "jimmy", clave: "1234" },
  { id: "102", usuario: "lazaro", clave: "1234" },
  { id: "103", usuario: "william", clave: "1234" },
  { id: "104", usuario: "mary", clave: "1234" }
];

/* ============================
   ENDPOINT: LOGIN
============================ */
app.post("/login", (req, res) => {
  const { usuario, clave } = req.body;
  if (!usuario || !clave) {
    return res.status(400).json({ ok: false, mensaje: "Faltan datos" });
  }

  const empleados = cargarJSON(EMPLEADOS_FILE); // { "101": "Jimmy", ... }

  const u = USUARIOS.find(
    x => x.usuario === usuario && x.clave === clave
  );

  if (!u) {
    return res.status(401).json({ ok: false, mensaje: "Usuario o clave incorrectos" });
  }

  const nombre = empleados[u.id] || "Empleado";

  res.json({
    ok: true,
    id: u.id,
    nombre
  });
});

/* ============================
   ENDPOINT: EMPLEADOS (crudo)
============================ */
app.get("/empleados", (req, res) => {
  res.json(cargarJSON(EMPLEADOS_FILE));
});

/* ============================
   ENDPOINT: CATALOGO
============================ */
app.get("/catalogo", (req, res) => {
  res.json(cargarJSON(CATALOGO_FILE));
});

/* ============================
   TAREAS DEL DÍA (empleado)
============================ */
app.get("/tareas-del-dia/:id", (req, res) => {
  const historial = cargarJSON(HISTORIAL_FILE);
  const id = req.params.id;
  const fecha = req.query.fecha;

  const tareas = historial.filter(t => t.id == id && t.fecha === fecha);

  res.json({ tareas });
});

/* ============================
   ADMIN: TAREAS COMPLETAS POR FECHA
============================ */
app.get("/admin/tareas-completas", (req, res) => {
  const fecha = req.query.fecha;
  if (!fecha) return res.json([]);

  const historial = cargarJSON(HISTORIAL_FILE);

  const tareas = historial.filter(t => t.fecha === fecha);

  res.json(tareas);
});

/* ============================
   ADMIN: AGREGAR TAREA
============================ */
app.post("/admin/agregar-tarea", (req, res) => {
  const { id, fecha, tarea } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);
  const empleados = cargarJSON(EMPLEADOS_FILE);

  historial.push({
    id,
    nombre: empleados[id] || "Desconocido",
    fecha,
    tarea,
    estado: "pendiente",
    obsEmpleado: "",
    obsAdmin: "",
    motivoNoRealizada: ""
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ============================
   ADMIN: APROBAR TAREA
============================ */
app.post("/admin/aprobar", (req, res) => {
  const { id, fecha, tarea, observacionAdmin } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);

  historial.forEach(t => {
    if (t.id == id && t.fecha === fecha && t.tarea === tarea) {
      t.estado = "terminada";
      t.obsAdmin = observacionAdmin || "";
    }
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ============================
   ADMIN: DEVOLVER TAREA
   - cambia estado a "devuelto"
   - guarda motivoNoRealizada
============================ */
app.post("/admin/devolver", (req, res) => {
  const { id, fecha, tarea, motivo } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);

  historial.forEach(t => {
    if (t.id == id && t.fecha === fecha && t.tarea === tarea) {
      t.estado = "devuelto";
      t.motivoNoRealizada = motivo || "";
    }
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ============================
   GUARDAR ESTADO (empleado)
============================ */
app.post("/guardar-estado", (req, res) => {
  const { empleado, fecha, tarea, estado, motivoNoRealizada } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);

  historial.forEach(t => {
    if (t.id == empleado && t.fecha === fecha && t.tarea === tarea) {

      if (estado === "terminada" || estado === "no_realizada") {
        t.estado = "en_revision";
      } else {
        t.estado = estado;
      }

      if (motivoNoRealizada) {
        t.motivoNoRealizada = motivoNoRealizada;
      }
    }
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ============================
   GUARDAR OBSERVACIÓN EMPLEADO
============================ */
app.post("/guardar-observacion", (req, res) => {
  const { empleado, fecha, tarea, observacion } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);

  historial.forEach(t => {
    if (t.id == empleado && t.fecha === fecha && t.tarea === tarea) {
      t.obsEmpleado = observacion;
    }
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ============================
   GUARDAR OBSERVACIÓN ADMIN
============================ */
app.post("/guardar-observacion-admin", (req, res) => {
  const { id, fecha, tarea, observacionAdmin } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);

  historial.forEach(t => {
    if (t.id == id && t.fecha === fecha && t.tarea === tarea) {
      t.obsAdmin = observacionAdmin;
    }
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ============================
   ADMIN: REPROGRAMAR TAREA
============================ */
app.post("/admin/reprogramar", (req, res) => {
  const { id, fecha, tarea, nuevaFecha, observacionAdmin } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);
  const empleados = cargarJSON(EMPLEADOS_FILE);

  historial.forEach(t => {
    if (t.id == id && t.fecha === fecha && t.tarea === tarea) {
      t.estado = "no_realizada";
      t.obsAdmin = observacionAdmin || "";
    }
  });

  historial.push({
    id,
    nombre: empleados[id] || "Desconocido",
    fecha: nuevaFecha,
    tarea,
    estado: "pendiente",
    obsEmpleado: "",
    obsAdmin: "",
    motivoNoRealizada: ""
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ============================
   ADMIN: HISTORIAL COMPLETO
============================ */
app.get("/admin/historial", (req, res) => {
  res.json(cargarJSON(HISTORIAL_FILE));
});

/* ============================
   INICIAR SERVIDOR
============================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor corriendo en puerto " + PORT));