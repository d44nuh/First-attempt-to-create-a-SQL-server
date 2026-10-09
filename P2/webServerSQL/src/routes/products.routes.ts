import { Router } from "express";
import {
  getAll,
  getById,
  create,
  update,
  remove,
  changePrice,
} from "../controllers/products.controller";

const router = Router();

router.get("/getAll", getAll);
router.get("/getById/:id", getById);
router.post("/create", create);
router.put("/update/:id", update);
router.delete("/delete/:id", remove);
router.patch("/change-price/:id", changePrice);

export default router;