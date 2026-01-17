const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// ============================
//   CONEXIÓN A SUPABASE
// ============================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/* ============================
   USUARIOS (LOGIN ORIGINAL)
============================ */
const USUARIOS = [
  { id: "101", usuario: "jimmy", clave: "1234" },
  { id: "102", usuario: "lazaro", clave: "1234" },
  { id: "103", usuario: "william", clave: "1234" },
  { id: "104", usuario: "mary", clave: "1234" }
];

/* ============================
   LOGIN
============================ */
app.post("/login", async (req, res) => {
  const { usuario, clave } = req.body;

  if (!usuario || !clave) {
    return res.status(400).json({ ok: false, mensaje: "Faltan datos" });
  }

  const u = USUARIOS.find(
    x => x.usuario === usuario && x.clave === clave
  );

  if (!u) {
    return res.status(401).json({ ok: false, mensaje: "Usuario o clave incorrectos" });
  }

  const { data: empleado } = await supabase
    .from("employees")
    .select("name")
    .eq("id", u.id)
    .single();

  res.json({
    ok: true,
    id: u.id,
    nombre: empleado?.name || "Empleado"
  });
});

/* ============================
   EMPLEADOS
============================ */
app.get("/empleados", async (req, res) => {
  const { data, error } = await supabase.from("employees").select("*");
  if (error) return res.status(400).json(error);
  res.json(data);
});

/* ============================
   CATALOGO (MODIFICADO)
============================ */
app.get("/catalogo", async (req, res) => {
  const { data, error } = await supabase.from("catalogo").select("*");
  if (error) return res.status(400).json(error);

  const agrupado = {};
  data.forEach(item => {
    if (!agrupado[item.categoria]) agrupado[item.categoria] = [];
    agrupado[item.categoria].push(item.tarea);
  });

  res.json(agrupado);
});

/* ============================
   TAREAS DEL DÍA (empleado)
============================ */
app.get("/tareas-del-dia/:id", async (req, res) => {
  const id = req.params.id;
  const fecha = req.query.fecha;

  const { data, error } = await supabase
    .from("historial")
    .select("*")
    .eq("id", id)
    .eq("fecha", fecha);

  if (error) return res.status(400).json(error);

  res.json({ tareas: data });
});

/* ============================
   ADMIN: TAREAS POR FECHA
============================ */
app.get("/admin/tareas-completas", async (req, res) => {
  const fecha = req.query.fecha;
  if (!fecha) return res.json([]);

  const { data, error } = await supabase
    .from("historial")
    .select("*")
    .eq("fecha", fecha);

  if (error) return res.status(400).json(error);

  res.json(data);
});

/* ============================
   ADMIN: AGREGAR TAREA
============================ */
app.post("/admin/agregar-tarea", async (req, res) => {
  const { id, fecha, tarea } = req.body;

  const { data: empleado } = await supabase
    .from("employees")
    .select("name")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("historial").insert([
    {
      id,
      nombre: empleado?.name || "Desconocido",
      fecha,
      tarea,
      estado: "pendiente",
      obsEmpleado: "",
      obsAdmin: "",
      motivoNoRealizada: ""
    }
  ]);

  if (error) return res.status(400).json(error);

  res.json({ ok: true });
});

/* ============================
   ADMIN: APROBAR
============================ */
app.post("/admin/aprobar", async (req, res) => {
  const { id, fecha, tarea, observacionAdmin } = req.body;

  const { error } = await supabase
    .from("historial")
    .update({
      estado: "terminada",
      obsAdmin: observacionAdmin || ""
    })
    .eq("id", id)
    .eq("fecha", fecha)
    .eq("tarea", tarea);

  if (error) return res.status(400).json(error);

  res.json({ ok: true });
});

/* ============================
   ADMIN: DEVOLVER
============================ */
app.post("/admin/devolver", async (req, res) => {
  const { id, fecha, tarea, motivo } = req.body;

  const { error } = await supabase
    .from("historial")
    .update({
      estado: "devuelto",
      motivoNoRealizada: motivo || ""
    })
    .eq("id", id)
    .eq("fecha", fecha)
    .eq("tarea", tarea);

  if (error) return res.status(400).json(error);

  res.json({ ok: true });
});

/* ============================
   EMPLEADO: GUARDAR ESTADO
============================ */
app.post("/guardar-estado", async (req, res) => {
  const { empleado, fecha, tarea, estado, motivoNoRealizada } = req.body;

  let nuevoEstado = estado;
  if (estado === "terminada" || estado === "no_realizada") {
    nuevoEstado = "en_revision";
  }

  const { error } = await supabase
    .from("historial")
    .update({
      estado: nuevoEstado,
      motivoNoRealizada: motivoNoRealizada || ""
    })
    .eq("id", empleado)
    .eq("fecha", fecha)
    .eq("tarea", tarea);

  if (error) return res.status(400).json(error);

  res.json({ ok: true });
});

/* ============================
   OBS EMPLEADO
============================ */
app.post("/guardar-observacion", async (req, res) => {
  const { empleado, fecha, tarea, observacion } = req.body;

  const { error } = await supabase
    .from("historial")
    .update({ obsEmpleado: observacion })
    .eq("id", empleado)
    .eq("fecha", fecha)
    .eq("tarea", tarea);

  if (error) return res.status(400).json(error);

  res.json({ ok: true });
});

/* ============================
   OBS ADMIN
============================ */
app.post("/guardar-observacion-admin", async (req, res) => {
  const { id, fecha, tarea, observacionAdmin } = req.body;

  const { error } = await supabase
    .from("historial")
    .update({ obsAdmin: observacionAdmin })
    .eq("id", id)
    .eq("fecha", fecha)
    .eq("tarea", tarea);

  if (error) return res.status(400).json(error);

  res.json({ ok: true });
});

/* ============================
   ADMIN: REPROGRAMAR
============================ */
app.post("/admin/reprogramar", async (req, res) => {
  const { id, fecha, tarea, nuevaFecha, observacionAdmin } = req.body;

  await supabase
    .from("historial")
    .update({
      estado: "no_realizada",
      obsAdmin: observacionAdmin || ""
    })
    .eq("id", id)
    .eq("fecha", fecha)
    .eq("tarea", tarea);

  const { data: empleado } = await supabase
    .from("employees")
    .select("name")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("historial").insert([
    {
      id,
      nombre: empleado?.name || "Desconocido",
      fecha: nuevaFecha,
      tarea,
      estado: "pendiente",
      obsEmpleado: "",
      obsAdmin: "",
      motivoNoRealizada: ""
    }
  ]);

  if (error) return res.status(400).json(error);

  res.json({ ok: true });
});

/* ============================
   HISTORIAL COMPLETO
============================ */
app.get("/admin/historial", async (req, res) => {
  const { data, error } = await supabase.from("historial").select("*");
  if (error) return res.status(400).json(error);
  res.json(data);
});

/* ============================
   PUERTO DINÁMICO (RENDER)
============================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor corriendo en puerto " + PORT));
