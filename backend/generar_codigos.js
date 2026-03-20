const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Setup Mongoose
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/april-store';

const productoSchema = new mongoose.Schema({
  nombre: String,
  sku: String,
  precio_venta: Number,
  estatus: String
}, { collection: 'productos' }); // Force collection name to avoid issues

const Producto = mongoose.models.Producto || mongoose.model('Producto', productoSchema);

async function generarCodigos() {
  try {
    console.log('Conectando a la base de datos...');
    await mongoose.connect(MONGO_URI);
    console.log('Obteniendo productos activos...');
    
    const productos = await Producto.find({ estatus: 'activo' });
    console.log(`Se encontraron ${productos.length} productos activos.`);

    let html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Códigos de Barras - April Store</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
  <style>
    body { font-family: 'Inter', sans-serif; padding: 20px; background: #f8fafc; }
    h1 { text-align: center; color: #0f172a; }
    .print-btn { 
      display: block; 
      margin: 0 auto 30px auto; 
      padding: 12px 24px; 
      font-size: 16px; 
      background: #000; 
      color: #fff; 
      border: none; 
      border-radius: 8px; 
      cursor: pointer; 
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    .print-btn:hover { background: #333; }
    .grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
      gap: 20px; 
      max-width: 1200px; 
      margin: 0 auto;
    }
    .card { 
      background: white; 
      border: 1px solid #e2e8f0; 
      border-radius: 12px; 
      padding: 20px; 
      text-align: center; 
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }
    .product-name { 
      font-weight: 600; 
      font-size: 14px; 
      color: #0f172a; 
      margin-bottom: 8px; 
      height: 40px; 
      overflow: hidden; 
      text-overflow: ellipsis; 
      display: -webkit-box; 
      -webkit-line-clamp: 2; 
      -webkit-box-orient: vertical;
    }
    .product-price { 
      color: #10b981; 
      font-weight: 700; 
      font-size: 18px; 
      margin-bottom: 16px; 
    }
    .barcode { width: 100%; height: auto; }
    
    @media print {
      body { background: white; padding: 0; }
      .print-btn, h1 { display: none; }
      .grid { display: block; max-width: none; }
      .card { 
        display: inline-block; 
        width: 45%; /* Dos por fila en impresion */
        margin: 2%; 
        border: 1px dashed #ccc; 
        box-shadow: none;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>Catálogo de Códigos de Barras</h1>
  <button class="print-btn" onclick="window.print()">🖨️ Imprimir Códigos</button>
  
  <div class="grid">
`;

    for (const p of productos) {
      if (p.sku) {
        html += `
    <div class="card">
      <div class="product-name">${p.nombre}</div>
      <div class="product-price">$${(p.precio_venta || 0).toFixed(2)}</div>
      <svg class="barcode"
        jsbarcode-value="${p.sku}"
        jsbarcode-textmargin="0"
        jsbarcode-fontoptions="bold">
      </svg>
    </div>
`;
      }
    }

    html += `
  </div>
  <script>
    window.addEventListener('load', function() {
      JsBarcode(".barcode").init();
    });
  </script>
</body>
</html>
`;

    const outputPath = path.join(__dirname, '../codigos_de_barras.html');
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log('✅ Archivo HTML generado exitosamente en:', outputPath);

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

generarCodigos();
