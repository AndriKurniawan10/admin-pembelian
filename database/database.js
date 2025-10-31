const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database/toko.db", (err) => {
  if (err) {
    console.error("Gagal konek ke database:", err.message);
  } else {
    console.log("Berhasil konek ke database SQLite.");
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS Produk (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    harga INTEGER NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS StokProduk (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produk_id INTEGER,
    jumlah INTEGER,
    FOREIGN KEY(produk_id) REFERENCES Produk(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Pembelian (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produk_id INTEGER,
    jumlah INTEGER,
    total_harga INTEGER,
    status TEXT DEFAULT 'SUKSES',
    tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(produk_id) REFERENCES Produk(id)
  )`);
});

module.exports = db;
