const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const path = require("path");
const db = require("./database/database");

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  const sql = `
    SELECT Produk.id, Produk.nama, Produk.harga, 
           IFNULL(StokProduk.jumlah, 0) AS stok
    FROM Produk
    LEFT JOIN StokProduk ON Produk.id = StokProduk.produk_id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.send("Error ambil data produk");
    res.render("index", { produk: rows });
  });
});

app.get("/tambah", (req, res) => {
  res.render("tambah");
});

app.post("/tambah", (req, res) => {
  const { nama, harga, stok } = req.body;

  db.run("INSERT INTO Produk (nama, harga) VALUES (?, ?)", [nama, harga], function (err) {
    if (err) return res.send("Gagal tambah produk");
    const produkId = this.lastID;
    db.run("INSERT INTO StokProduk (produk_id, jumlah) VALUES (?, ?)", [produkId, stok], (err2) => {
      if (err2) return res.send("Gagal tambah stok");
      res.redirect("/");
    });
  });
});

app.delete("/hapus/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM Produk WHERE id = ?", [id], (err) => {
    if (err) return res.send("Gagal hapus produk");
    db.run("DELETE FROM StokProduk WHERE produk_id = ?", [id]);
    res.redirect("/");
  });
});

app.get("/beli/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM Produk WHERE id = ?", [id], (err, produk) => {
    if (err || !produk) return res.send("Produk tidak ditemukan");
    res.render("beli", { produk });
  });
});

app.post("/beli/:id", (req, res) => {
  const id = req.params.id;
  const jumlah = parseInt(req.body.jumlah);

  db.get("SELECT * FROM Produk WHERE id = ?", [id], (err, produk) => {
    if (err || !produk) return res.send("Produk tidak ditemukan");

    const total = produk.harga * jumlah;

    db.run(
      "INSERT INTO Pembelian (produk_id, jumlah, total_harga) VALUES (?, ?, ?)",
      [id, jumlah, total],
      (err2) => {
        if (err2) return res.send("Gagal simpan pembelian");

        db.run(
          "UPDATE StokProduk SET jumlah = jumlah - ? WHERE produk_id = ?",
          [jumlah, id],
          () => res.redirect("/riwayat")
        );
      }
    );
  });
});

app.get("/riwayat", (req, res) => {
  const sql = `
    SELECT Pembelian.id, Produk.nama, Pembelian.jumlah, Pembelian.total_harga, Pembelian.status, Pembelian.tanggal
    FROM Pembelian
    JOIN Produk ON Pembelian.produk_id = Produk.id
    ORDER BY Pembelian.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.send("Gagal ambil riwayat");
    res.render("riwayat", { pembelian: rows });
  });
});

app.post("/cancel/:id", (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM Pembelian WHERE id = ?", [id], (err, pembelian) => {
    if (err || !pembelian) return res.send("Data pembelian tidak ditemukan");

    db.run("UPDATE Pembelian SET status = 'DIBATALKAN' WHERE id = ?", [id]);
    db.run(
      "UPDATE StokProduk SET jumlah = jumlah + ? WHERE produk_id = ?",
      [pembelian.jumlah, pembelian.produk_id],
      () => res.redirect("/riwayat")
    );
  });
});


app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
