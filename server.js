import express from 'express'
import dotenv from 'dotenv'
import cors from "cors";
import { MongoClient } from 'mongodb';
import authSchema from './validation/validation_schema.js'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dotenv.config(); //inicializa dotenv

//npm run devStart
const app=express();
app.use(cors());
app.use(express.json())


let now=dayjs().locale('pt-br');
now.format("hh:mm:ss")


console.log(now)

//inicia mongoCLient
const mongoclient=new MongoClient(process.env.URL_CONNECT_MONGO) 
let db;


//conecta a variavel db ao banco de dados
//Banco de dados armazena as coleções
mongoclient.connect().then(
    ()=>{
        db=mongoclient.db("bancodedados")
    }
)

app.get('/',(req,res)=>{
    res.send('oi')
})

app.post('/participants',async(req,res)=>{
    
        const {name}=req.body;
        const lastStatus=Date.now()
        try{
             //validação dos dados:
            const result=await authSchema.validateAsync(req.body)
            console.log(result)

            //armazena todos os dados da coleção users na variavel item
            db.collection("users").find().toArray().then(item=>{
                item.map((user)=>{
                    if(user.name===name){
                        res.status(409).send('Esse nome já foi utilizado')
                        return;
                    }
                })
                    res.status(201).send('deu bom')
                    add_new_participant()
            })
            
        }
       catch (err){
        res.status(422).send('deu ruim')
        console.log(err)
        return;
       }
       
       function add_new_participant(){
            //insere nome e lastStatus na coleção Users
            db.collection("users").insertOne({
                name,
                lastStatus
            })

            //insere mensagem na coleção mensages
            db.collection("mensages").insertOne({
                from:name,
                to:"Todos",
                text:"entra na sala...",
                type:"status",
                time:now
            })
        }
     
})

app.listen(5000)