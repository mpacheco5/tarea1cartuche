const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

// Configura la conexión a PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'baraurita',
  password: 'admin1',
  port: 5433,
});

// Middleware para permitir el acceso desde el frontend (CORS)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
const jwt = require('jsonwebtoken'); 
app.use(express.json());

// Ruta para obtener los productos
app.get('/productos', async (req, res) => {
    try {
      const result = await pool.query('SELECT pro_id, pro_nombre, pro_descripcion, pro_ruta, pro_estado, pro_precio, pro_stock FROM public.productos');
      res.json(result.rows);
    } catch (err) {
      console.error('Error al obtener los productos', err);
      res.status(500).send('Error al obtener los productos');
    }
  });

  app.get('/usuarios', async (req, res) => {
    try {
      const result = await pool.query('SELECT user_id, user_cedula, user_nombre, user_apellido, user_correo, "user_foto_url", user_rol FROM public.usuario');
      res.json(result.rows);
    } catch (err) {
      console.error('Error al obtener los usuarios', err);
      res.status(500).send('Error al obtener los usuarios');
    }
  });
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const result = await pool.query('SELECT * FROM usuario WHERE user_correo = $1', [username]);
      const user = result.rows[0];
  
      if (user) {
        if (password === user.user_contrasenia) {  // Comparación directa de la contraseña en texto plano
          const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: '1h' });
          res.json({ token });
        } else {
          res.status(401).send('Credenciales incorrectas');
        }
      } else {
        res.status(404).send('Usuario no encontrado');
      }
    } catch (error) {
      console.error('Error al autenticar al usuario', error);
      res.status(500).send('Error interno del servidor');
    }
  });
  
  // Verificar JWT (protege las rutas)
  const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send('Token no proporcionado');
  
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).send('Token inválido');
      req.userId = decoded.userId;
      next();
    });
  };
  
  // Ruta protegida (solo accesible con token válido)
  app.get('/protected', verifyToken, (req, res) => {
    res.send('Acceso concedido a contenido protegido');
  });

  app.post('/comprar', async (req, res) => {
    const { pro_id, cantidad } = req.body;

    try {
        const query = `
            UPDATE productos
            SET pro_stock = pro_stock - $1
            WHERE pro_id = $2 AND pro_stock >= $1
        `;

        const result = await pool.query(query, [cantidad, pro_id]);

        if (result.rowCount === 0) {
            return res.status(400).json({ error: 'Stock insuficiente o producto no encontrado' });
        }

        res.status(200).json({ message: 'Stock actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el stock:', error);
        res.status(500).json({ error: 'Error al actualizar el stock' });
    }
});


// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});




// Token 
const JWT_SECRET ="AuKFXSLCc51IZGuwv1ksAnzuBXjtKRDRWQF8lPKj9sygXtlF6jxHv8S7HyZz2qh5"
