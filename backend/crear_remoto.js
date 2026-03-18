const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Usamos la cadena Hardcodeada temporalmente para poder crear la cajera en la BBDD Real del Cliente
const MONGODB_URI = process.env.MONGODB_URI || process.argv[2];

if (!MONGODB_URI) {
  console.log('Error: Necesitas pasar la URI de Atlas de produccion como primer argumento');
  process.exit(1);
}

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true },
  password_hash: { type: String, required: true },
  rol: { type: String, default: 'cajera' },
  activo: { type: Boolean, default: true }
});

const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', usuarioSchema);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    try {
      console.log('Conectado a la BD Produccion en Atlas...');
      const exist = await Usuario.findOne({ email: 'cajera@aprilstore.mx' });
      
      if (!exist) {
        const hash = await bcrypt.hash('cajera123', 12);
        await Usuario.create({
          nombre: 'Cajera Tienda',
          email: 'cajera@aprilstore.mx',
          password_hash: hash,
          rol: 'cajera'
        });
        console.log('✅ Cuenta de cajera creada exitosamente (cajera@aprilstore.mx)');
      } else {
        const hash = await bcrypt.hash('cajera123', 12);
        await Usuario.updateOne({ email: 'cajera@aprilstore.mx' }, { password_hash: hash });
        console.log('✅ Cuenta restaurada exitosamente (clave reseteada a: cajera123)');
      }
    } catch (e) {
      console.error(e);
    }
    await mongoose.disconnect();
  });
