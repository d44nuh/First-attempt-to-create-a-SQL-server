import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../conf/dbConection";

interface Product extends RowDataPacket {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  brand: string | null;
  img: string | null;
  active: boolean;
}

interface ProductBody {
  name?: unknown;
  price?: unknown;
  stock?: unknown;
  description?: unknown;
  brand?: unknown;
  img?: unknown;
}

const parseId = (value: string | string[] | undefined): number | null => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const parsePrice = (value: unknown): number | null => {
  if (typeof value === "string" && value.trim() === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return null;
  if (Math.round(price * 100) / 100 !== price) return null;
  if (price > 99999999.99) return null;
  return price;
};

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

const isOptionalString = (v: unknown): v is string | null | undefined =>
  v === undefined || v === null || typeof v === "string";

interface ValidProduct {
  name: string;
  price: number;
  stock: number;
  description: string;
  brand: string | null;
  img: string | null;
}

const validateProductBody = (
  body: ProductBody
): { data?: ValidProduct; error?: string } => {
  if (!isNonEmptyString(body.name)) return { error: "El nombre es obligatorio" };
  const price = parsePrice(body.price);
  if (price === null)
    return { error: "El precio debe ser un numero, mayor a cero, con dos decimales" };
  if (
    typeof body.stock !== "number" ||
    !Number.isInteger(body.stock) ||
    body.stock < 0
  )
    return { error: "El stock debe ser mayor o igual a 0" };
  if (!isNonEmptyString(body.description))
    return { error: "Es necesario agregar una descripcion" };
  if (!isOptionalString(body.brand)) return { error: "La marca debe ser texto" };
  if (!isOptionalString(body.img)) return { error: "LA img debe ser texto" };

  return {
    data: {
      name: body.name.trim(),
      price,
      stock: body.stock,
      description: body.description.trim(),
      brand: body.brand ?? null,
      img: body.img ?? null,
    },
  };
};

const serverError = (res: Response, err: unknown) => {
  console.error(err);
  return res.status(500).json({ message: "Error interno del servidor" });
};

//controladores
export const getAll = async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<Product[]>(
      "SELECT id, name, price, stock, description, brand, img, active FROM products WHERE active = ?",
      [true]
    );
    return res.status(200).json(rows);
  } catch (err) {
    return serverError(res, err);
  }
};

export const getById = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ message: "ID invalido" });

  try {
    const [rows] = await pool.query<Product[]>(
      "SELECT id, name, price, stock, description, brand, img, active FROM products WHERE id = ? AND active = ?",
      [id, true]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Producto no encontrado" });
    return res.status(200).json(rows[0]);
  } catch (err) {
    return serverError(res, err);
  }
};

export const create = async (req: Request, res: Response) => {
  const { data, error } = validateProductBody(req.body ?? {});
  if (!data) return res.status(400).json({ message: error });

  try {
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO products (name, price, stock, description, brand, img) VALUES (?, ?, ?, ?, ?, ?)",
      [data.name, data.price, data.stock, data.description, data.brand, data.img]
    );
    return res
      .status(201)
      .json({ message: "Producto agregado", id: result.insertId, ...data });
  } catch (err) {
    return serverError(res, err);
  }
};

export const update = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ message: "ID inválido" });

  const { data, error } = validateProductBody(req.body ?? {});
  if (!data) return res.status(400).json({ message: error });

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE products
       SET name = ?, price = ?, stock = ?, description = ?, brand = ?, img = ?
       WHERE id = ? AND active = ?`,
      [data.name, data.price, data.stock, data.description, data.brand, data.img, id, true]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Producto no encontrado" });
    return res.status(200).json({ message: "Producto actualizado", id, ...data });
  } catch (err) {
    return serverError(res, err);
  }
};

export const remove = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ message: "ID inválido" });

  try {
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE products SET active = ? WHERE id = ? AND active = ?",
      [false, id, true]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Producto no encontrado" });
    return res.status(200).json({ message: "Producto dado de baja", id });
  } catch (err) {
    return serverError(res, err);
  }
};

export const changePrice = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ message: "ID invalido" });

  const body = (req.body ?? {}) as Record<string, unknown>;
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== "price")
    return res.status(400).json({ message: "El cuerpo debe contener solamente el precio" });

  const price = parsePrice(body.price);
  if (price === null)
    return res
      .status(400)
      .json({ message: "El precio debe ser mayor a cero con dos decimales" });

  try {
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE products SET price = ? WHERE id = ? AND active = ?",
      [price, id, true]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Producto no encontrado" });
    return res.status(200).json({ message: "Precio actualizado", id, price });
  } catch (err) {
    return serverError(res, err);
  }
};