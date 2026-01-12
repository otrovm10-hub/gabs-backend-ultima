import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// HABILITAR CORS PARA QUE VERCEL PUEDA ACCEDER AL BACKEND
app.use(cors());
app.use(bodyParser.json());

/* ============================================================
   RUTA: OBTENER EMPLEADOS
============================================================ */
app.get("/empleados", (req, res) => {
  const filePath = path.join(__dirname, "data", "empleados.json");

  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: "Archivo empleados.json no encontrado" });
  }

  try {
    const data = fs.readFileSync(filePath, "utf8");
    const empleados = JSON.parse(data);
    res.json(empleados);
  } catch (error) {
    res.status(500).json({ error: "Error leyendo empleados.json" });
  }
});

/* ============================================================
   RUTA: OBTENER CATALOGO DE TAREAS
============================================================ */
app.get("/catalogo", (req, res) => {
  const filePath = path.join(__dirname, "data", "catalogo_tareas.json");

  if (!fs.existsSync(filePath)) {
    return res.json({});
  }

  try {
    const data = fs.readFileSync(filePath, "utf8");
    res.json(JSON.parse(data));
  } catch {
    res.json({});
  }
});

/* ============================================================
   RUTA: AGREGAR TAREA (ADMIN)
============================================================ */
app.post("/admin/agregar-tarea", (req, res) => {
  const { id, fecha, tarea } = req.body;

  if (!id || !fecha || !tarea) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const filePath = path.join(__dirname, "data", "excepciones.json");

  let excepciones = {};

  if (fs.existsSync(filePath)) {
    try {
      excepciones = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      excepciones = {};
    }
  }

  if (!excepciones[id]) excepciones[id] = {};
  if (!excepciones[id][fecha]) excepciones[id][fecha] = [];

  excepciones[id][fecha].push({
    id: Date.now().toString(),
    tarea,
    estado: "pendiente",
    obsEmpleado: "",
    obsAdmin: ""
  });

  fs.writeFileSync(filePath, JSON.stringify(excepciones, null, 2));

  res.json({ ok: true });
});

/* ============================================================
   RUTA: TAREAS COMPLETAS POR FECHA
============================================================ */
app.get("/admin/tareas-completas", (req, res) => {
  const { fecha } = req.query;

  const filePath = path.join(__dirname, "data", "excepciones.json");

  if (!fs.existsSync(filePath)) {
    return res.json([]);
  }

  let excepciones = {};

  try {
    excepciones = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    excepciones = {};
  }

  const resultado = [];

  Object.entries(excepciones).forEach(([empleadoId, fechas]) => {
    if (fechas[fecha]) {
      fechas[fecha].forEach(t => {
        resultado.push({
          id: empleadoId,
          nombre: "",
          fecha,
          ...t
        });
      });
    }
  });

  res.json(resultado);
});

/* ============================================================
   RUTA: APROBAR TAREA
============================================================ */
app.post("/admin/aprobar", (req, res) => {
  const { id, fecha, tarea, observacionAdmin } = req.body;

  const filePath = path.join(__dirname, "data", "Historial2.json");

  let historial = {};

  if (fs.existsSync(filePath)) {
    historial = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  if (!historial[id]) historial[id] = [];

  historial[id].push({
    tarea,
    fecha,
    estado: "terminada",
    obsAdmin: observacionAdmin || "",
    obsEmpleado: "",
    motivoNoRealizada: ""
  });

  fs.writeFileSync(filePath, JSON.stringify(historial, null, 2));

  res.json({ ok: true });
});

/* ============================================================
   RUTA: DEVOLVER TAREA
============================================================ */
app.post("/guardar-estado", (req, res) => {
  const { empleado, fecha, tarea, estado, motivoNoRealizada } = req.body;

  const filePath = path.join(__dirname, "data", "Historial2.json");

  let historial = {};

  if (fs.existsSync(filePath)) {
    historial = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  if (!historial[empleado]) historial[empleado] = [];

  historial[empleado].push({
    tarea,
    fecha,
    estado,
    motivoNoRealizada,
    obsEmpleado: "",
    obsAdmin: ""
  });

  fs.writeFileSync(filePath, JSON.stringify(historial, null, 2));

  res.json({ ok: true });
});

/* ============================================================
   RUTA: GUARDAR OBSERVACIÓN ADMIN
============================================================ */
app.post("/guardar-observacion-admin", (req, res) => {
  const { id, fecha, tarea, observacionAdmin } = req.body;

  const filePath = path.join(__dirname, "data", "Historial2.json");

  let historial = {};

  if (fs.existsSync(filePath)) {
    historial = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  if (!historial[id]) historial[id] = [];

  historial[id].push({
    tarea,
    fecha,
    estado: "observada",
    obsAdmin: observacionAdmin,
    obsEmpleado: "",
    motivoNoRealizada: ""
  });

  fs.writeFileSync(filePath, JSON.stringify(historial, null, 2));

  res.json({ ok: true });
});

/* ============================================================
   RUTA: REPROGRAMAR TAREA
============================================================ */
app.post("/admin/reprogramar", (req, res) => {
  const { id, fecha, tarea, nuevaFecha, observacionAdmin } = req.body;

  const filePath = path.join(__dirname, "data", "Historial2.json");

  let historial = {};

  if (fs.existsSync(filePath)) {
    historial = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  if (!historial[id]) historial[id] = [];

  historial[id].push({
    tarea,
    fecha: nuevaFecha,
    estado: "reprogramada",
    obsAdmin: observacionAdmin || "",
    obsEmpleado: "",
    motivoNoRealizada: ""
  });

  fs.writeFileSync(filePath, JSON.stringify(historial, null, 2));

  res.json({ ok: true });
});

/* ============================================================
   RUTA: HISTORIAL COMPLETO
============================================================ */
app.get("/admin/historial", (req, res) => {
  const filePath = path.join(__dirname, "data", "Historial2.json");

  if (!fs.existsSync(filePath)) {
    return res.json([]);
  }

  try {
    const data = fs.readFileSync(filePath, "utf8");
    const historialOriginal = JSON.parse(data);

    const historialFormateado = [];

    Object.entries(historialOriginal).forEach(([empleadoId, tareas]) => {
      tareas.forEach(t => {
        historialFormateado.push({
          id: empleadoId,
          nombre: t.nombre || "",
          tarea: t.tarea,
          fecha: t.fecha,
          estado: t.estado,
          obsEmpleado: t.obsEmpleado || "",
          obsAdmin: t.obsAdmin || "",
          motivoNoRealizada: t.motivoNoRealizada || ""
        });
      });
    });

    res.json(historialFormateado);
  } catch (error) {
    res.status(500).json({ error: "Error leyendo Historial2.json" });
  }
});

/* ============================================================
   INICIAR SERVIDOR
============================================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));