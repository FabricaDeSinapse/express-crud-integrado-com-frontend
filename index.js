const express = require("express");
const mongodb = require("mongodb");
require("dotenv").config();

const ObjectId = mongodb.ObjectId;

(async () => {
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;
    const dbName = process.env.DB_NAME;

    const connectionString = `mongodb://${dbHost}:${dbPort}/${dbName}`;

    console.info("Conectando ao banco de dados MongoDB...");

    const options = {
        useUnifiedTopology: true,
    };

    const client = await mongodb.MongoClient.connect(connectionString, options);

    const app = express();

    const port = process.env.PORT || 3000;

    app.use(express.json());

    app.get("/", (req, res) => {
        res.send("Olá, Fábrica de Sinapse!");
    });

    /*
    Lista de Endpoints da aplicação CRUD de personagens
    CRUD: Create, Read (Single & All), Update and Delete
    CRUD: Criar, Ler (Individual e Tudo), Atualizar e Remover
    - [GET] /personagens - Retorna a lista de personagens
    - [GET] /personagens/{id} - Retorna apenas uma única personagem pelo ID
    - [POST] /personagens - Cria uma nova personagem
    - [PUT] /personagens/{id} - Atualiza uma personagem pelo ID
    - [DELETE] /personagens/{id} - Remover uma personagem pelo ID
    */

    const db = client.db("fabrica_db");
    const personagens = db.collection("personagens");

    const getpersonagensValidas = () => personagens.find({}).toArray();

    const getPersonagemById = async id =>
        personagens.findOne({ _id: ObjectId(id) });

    // - [GET] /personagens - Retorna a lista de personagens
    app.get("/personagens", async (req, res) => {
        res.send(await getpersonagensValidas());
    });

    // - [GET] /personagens/{id} - Retorna apenas uma única personagem pelo ID
    app.get("/personagens/:id", async (req, res) => {
        const id = req.params.id;

        const personagem = await getPersonagemById(id);

        if (!personagem) {
            res.send("Personagem não encontrado.");

            return;
        }

        res.send(personagem);
    });

    // - [POST] /personagens - Cria uma nova personagem
    app.post("/personagens", async (req, res) => {
        const objeto = req.body;

        if (!objeto || !objeto.nome || !objeto.imagemUrl) {
            res.send("Objeto inválido.");

            return;
        }

        const { insertedCount } = await personagens.insertOne(objeto);

        if (insertedCount !== 1) {
            res.send("Ocorreu um erro ao criar a personagem.");

            return;
        }

        res.send(objeto);
    });

    // - [PUT] /personagens/{id} - Atualiza uma personagem pelo ID
    app.put("/personagens/:id", async (req, res) => {
        const id = req.params.id;

        const objeto = req.body;

        if (!objeto || !objeto.nome || !objeto.imagemUrl) {
            res.send("Personagem inválido.");

            return;
        }

        const quantidade_personagens = await personagens.countDocuments({
            _id: ObjectId(id),
        });

        if (quantidade_personagens !== 1) {
            res.send("Personagem não encontrado.");

            return;
        }

        const { result } = await personagens.updateOne(
            {
                _id: ObjectId(id),
            },
            {
                $set: objeto,
            }
        );

        if (result.ok !== 1) {
            res.send("Ocorreu um erro ao atualizar o personagem.");

            return;
        }

        res.send(await getPersonagemById(id));
    });

    // - [DELETE] /personagens/{id} - Remover uma personagem pelo ID
    app.delete("/personagens/:id", async (req, res) => {
        const id = req.params.id;

        const quantidade_personagens = await personagens.countDocuments({
            _id: ObjectId(id),
        });

        if (quantidade_personagens !== 1) {
            res.send("Personagem não encontrado.");

            return;
        }

        const { deletedCount } = await personagens.deleteOne({
            _id: ObjectId(id),
        });

        if (deletedCount !== 1) {
            res.send("Ocorreu um erro ao remover o personagem.");

            return;
        }

        res.send("Personagem removido com sucesso.");
    });

    app.listen(port, () => {
        console.info(`App rodando em http://localhost:${port}`);
    });
})();
