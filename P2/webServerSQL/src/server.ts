import express, { Application, NextFunction, Request, Response } from "express";
import routes from "./routes";

export class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = Number(process.env.PORT ?? 3000);
    this.middlewares();
    this.routes();
    this.errorHandlers();
  }

  private middlewares(): void {
    this.app.use(express.json()); // antes de registrar las rutas
  }

  private routes(): void {
    this.app.use("/api/v1", routes);
  }

  private errorHandlers(): void {
    // JSON malformado u otros errores
    this.app.use(
      (err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
        if (err.status === 400) {
          return res.status(400).json({ message: "JSON inválido" });
        }
        console.error(err);
        return res.status(500).json({ message: "Error interno del servidor" });
      }
    );
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`Servidor escuchando en http://localhost:${this.port}`);
    });
  }
}