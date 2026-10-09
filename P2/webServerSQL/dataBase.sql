CREATE DATABASE IF NOT EXISTS products_db;
USE products_db;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL,
  description TEXT NOT NULL,
  brand VARCHAR(100) NULL,
  img VARCHAR(255) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO products (name, price, stock, description, brand, img) VALUES
('Hojas de maquina PAQ 500H', 150.00, 3, 'Paquete de hojas blancas 50g 500', 'Scribe', NULL),
('Toner de impresora RICOH IMP', 999.00, 1, 'Toner de impresora RICOH IMP 430f NEGRO', 'electrica', NULL);

