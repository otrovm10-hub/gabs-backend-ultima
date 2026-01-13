// ===============================
//  IMPORTS
// ===============================
import express from "express";
import fs from "fs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
//  PATHS
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RUTINAS_PATH = path.join(__dirname, "rutinas.json");
const EMPLEADOS_PATH = path.join(__dirname, "empleados.json");
const CATALOGO_PATH = path.join(__dirname, "catalogo.json");

// ===============================
//  CARGAR ARCHIVOS
// ===============================
let rutinas = fs.existsSync(RUTINAS_PATH)
  ? JSON.parse(fs.readFileSync(RUTINAS_PATH))
  : {};

let empleados = fs.existsSync(EMPLEADOS_PATH)
  ? JSON.parse(fs.readFileSync(EMPLEADOS_PATH))
  : {};

let catalogo = fs.existsSync(CATALOGO_PATH)
  ? JSON.parse(fs.readFileSync(CATALOGO_PATH))
  : {};

function guardarRutinas() {
  fs.writeFileSync(RUTINAS_PATH, JSON.stringify(rutinas, null, 2));
}

// ===============================
//  RUTAS BÁSICAS
// ===============================
app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente");
});

app.get("/empleados", (req, res) => {
  res.json(empleados);
});

app.get("/catalogo", (req, res) => {
  res.json(catalogo);
});

// ===============================
//  TAREAS DEL EMPLEADO
// ===============================
app.get("/tareas-del-dia/:id", (req, res) => {
  const { id } = req.params;
  const { fecha } = req.query;

  const tareas = rutinas[id]?.[fecha] || [];
  res.json({ tareas });
});

// ===============================
//  GUARDAR ESTADO (CORREGIDO)
// ===============================
app.post("/guardar-estado", (req, res) => {
  const { empleado, fecha, tarea, estado, motivoNoRealizada } = req.body;

  if (!rutinas[empleado]) rutinas[empleado] = {};
  if (!rutinas[empleado][fecha]) rutinas[empleado][fecha] = [];

  const t = rutinas[empleado][fecha].find(x => x.tarea === tarea);

  if (!t) {
    return res.json({ ok: false, msg: "Tarea no encontrada" });
  }

  t.estado = estado;

  if (estado === "no_realizada") {
    t.motivoNoRealizada = motivoNoRealizada || "";
  }

  // ⭐ IMPORTANTE: marcar para revisión del admin
  t.revisarAdmin = true;

  guardarRutinas();
  res.json({ ok: true });
});

// ===============================
//  ADMIN: TAREAS COMPLETAS
// ===============================
app.get("/admin/tareas-completas", (req, res) => {
  const { fecha } = req.query;

  let lista = [];

  Object.entries(rutinas).forEach(([id, dias]) => {
    if (dias[fecha]) {
      dias[fecha].forEach(t => {
        lista.push({
          id,
          fecha,
          tarea: t.tarea,
          estado: t.estado,
          obsEmpleado: t.observacion || "",
          obsAdmin: t.obsAdmin || "",
          motivoNoRealizada: t.motivoNoRealizada || "",
          revisarAdmin: t.revisarAdmin || false
        });
      });
    }
  });

  res.json(lista);
});

// ===============================
//  ADMIN: AGREGAR TAREA
// ===============================
app.post("/admin/agregar-tarea", (req, res) => {
  const { id, fecha, tarea } = req.body;

  if (!rutinas[id]) rutinas[id] = {};
  if (!rutinas[id][fecha]) rutinas[id][fecha] = [];

  rutinas[id][fecha].push({
    tarea,
    estado: "pendiente",
    revisarAdmin: false
  });

  guardarRutinas();
  res.json({ ok: true });
});

// ===============================
//  ADMIN: APROBAR TAREA (CORREGIDO)
// ===============================
app.post("/admin/aprobar", (req, res) => {
  const { id, fecha, tarea, observacionAdmin } = req.body;

  const t = rutinas[id][fecha].find(x => x.tarea === tarea);
  if (!t) return res.json({ ok: false });

  t.estado = "terminada";
  t.obsAdmin = observacionAdmin || "";
  t.revisarAdmin = false; // ⭐ YA NO APARECE EN EL PANEL

  guardarRutinas();
  res.json({ ok: true });
});

// ===============================
//  ADMIN: DEVOLVER TAREA
// ===============================
app.post("/guardar-estado-admin", (req, res) => {
  const { id, fecha, tarea, motivo } = req.body;

  const t = rutinas[id][fecha].find(x => x.tarea === tarea);
  if (!t) return res.json({ ok: false });

  t.estado = "no_realizada";
  t.motivoNoRealizada = motivo || "";
  t.revisarAdmin = true;

  guardarRutinas();
  res.json({ ok: true });
});

// ===============================
//  ADMIN: OBSERVACIÓN
// ===============================
app.post("/guardar-observacion-admin", (req, res) => {
  const { id, fecha, tarea, observacionAdmin } = req.body;

  const t = rutinas[id][fecha].find(x => x.tarea === tarea);
  if (!t) return res.json({ ok: false });

  t.obsAdmin = observacionAdmin;
  t.revisarAdmin = true;

  guardarRutinas();
  res.json({ ok: true });
});

// ===============================
//  ADMIN: REPROGRAMAR
// ===============================
app.post("/admin/reprogramar", (req, res) => {
  const { id, fecha, tarea, nuevaFecha, observacionAdmin } = req.body;

  const tareasDia = rutinas[id][fecha];
  const t = tareasDia.find(x => x.tarea === tarea);

  if (!t) return res.json({ ok: false });

  // Eliminar de la fecha actual
  rutinas[id][fecha] = tareasDia.filter(x => x.tarea !== tarea);

  // Crear en la nueva fecha
  if (!rutinas[id][nuevaFecha]) rutinas[id][nuevaFecha] = [];

  rutinas[id][nuevaFecha].push({
    tarea,
    estado: "pendiente",
    obsAdmin: observacionAdmin || "",
    revisarAdmin: true
  });

  guardarRutinas();
  res.json({ ok: true });
});

// ===============================
//  SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});