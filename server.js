const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

/* ============================
   CARGA DE ARCHIVOS JSON
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
   ENDPOINT: EMPLEADOS
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
   ENDPOINT: TAREAS DEL DÍA (empleado)
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
    obsAdmin: ""
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ============================
   ADMIN: APROBAR TAREA (CORREGIDO)
============================ */
app.post("/admin/aprobar", (req, res) => {
  const { id, fecha, tarea, observacionAdmin } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);

  historial.forEach(t => {
    if (t.id == id && t.fecha === fecha && t.tarea === tarea) {
      t.estado = "terminada";     // ⭐ YA NO APARECE EN EL PANEL DEL ADMIN
      t.obsAdmin = observacionAdmin || "";
    }
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ============================
   GUARDAR ESTADO (empleado) — CORREGIDO
============================ */
app.post("/guardar-estado", (req, res) => {
  const { empleado, fecha, tarea, estado, motivoNoRealizada } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);

  historial.forEach(t => {
    if (t.id == empleado && t.fecha === fecha && t.tarea === tarea) {

      // ⭐ Cuando el empleado marca terminada o no realizada
      if (estado === "terminada" || estado === "no_realizada") {
        t.estado = "en_revision";   // ⭐ AHORA EL ADMIN LA VE
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

  // Marcar la original como no realizada
  historial.forEach(t => {
    if (t.id == id && t.fecha === fecha && t.tarea === tarea) {
      t.estado = "no_realizada";
      t.obsAdmin = observacionAdmin || "";
    }
  });

  // Crear nueva tarea
  historial.push({
    id,
    nombre: empleados[id] || "Desconocido",
    fecha: nuevaFecha,
    tarea,
    estado: "pendiente",
    obsEmpleado: "",
    obsAdmin: ""
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