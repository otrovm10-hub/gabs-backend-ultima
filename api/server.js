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

// ===============================
//   RUTA: OBTENER EMPLEADOS
// ===============================
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

// ===============================
//   RUTA: AGREGAR TAREA (ADMIN)
// ===============================
app.post("/admin/agregar-tarea", (req, res) => {
  const { empleadoId, fecha, tarea } = req.body;

  if (!empleadoId || !fecha || !tarea) {
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

  if (!excepciones[empleadoId]) excepciones[empleadoId] = {};
  if (!excepciones[empleadoId][fecha]) excepciones[empleadoId][fecha] = [];

  excepciones[empleadoId][fecha].push({
    id: Date.now().toString(),
    tarea,
    estado: "pendiente",
    obsEmpleado: "",
    obsAdmin: ""
  });

  fs.writeFileSync(filePath, JSON.stringify(excepciones, null, 2));

  res.json({ ok: true });
});

// ===========================================
//   RUTA: OBTENER TAREAS COMPLETAS POR FECHA
// ===========================================
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
          empleadoId,
          fecha,
          ...t
        });
      });
    }
  });

  res.json(resultado);
});

// ===========================================
//   RUTA: OBTENER HISTORIAL COMPLETO (FORMATO LISTA)
// ===========================================
app.get("/admin/historial", (req, res) => {
  const filePath = path.join(__dirname, "data", "Historial.json");

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
    res.status(500).json({ error: "Error leyendo Historial.json" });
  }
});

// ===============================
//   INICIAR SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));