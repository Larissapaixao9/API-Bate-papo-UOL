import express from 'express'
import dotenv from 'dotenv'
import cors from "cors";
import { MongoClient } from 'mongodb';
import authSchema from './validation/validation_schema.js'
import authSchema2 from './validation/validation_schema_2.js'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dotenv.config(); //inicializa dotenv

//npm run devStart
const app=express();
app.use(cors());
app.use(express.json())


let now=dayjs().locale('pt-br').format("hh:mm:ss");
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
           let hour=dayjs().locale('pt-br').format("hh:mm:ss")
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
                time:hour
            })
            console.log(hour)
        }
     
})

app.get('/participants',(req,res)=>{
    db.collection("users").find().toArray().then(item=>{
        res.send(item).status(200)
    })
})

app.post('/messages',async(req,res)=>{
    let verifyUser=null;
    let sucesso=false;
    const {to, text, type}=req.body;
    const { user }=req.headers
    let from_user;
    await db.collection("users").find().toArray().then(item=>{
        verifyUser=item.some(element=>element.name===user)
    })

    if(!verifyUser){
       // from_user=user;
         res.status(422).send("erro")
         return;
    }
    try{
        //validação dos dados:
        const result2=await authSchema2.validateAsync(req.body)
        console.log(result2)
        sucesso=true;
    }
    catch(err){
        res.status(422).send('erro na validação das mensagens');
        console.log(err)
        return;
    }
    if(sucesso===true){
        sendMessage();
    }

    function sendMessage(){
        let time_access=dayjs().locale('pt-br').format("hh:mm:ss")
        //time_access.format("hh:mm:ss")
        db.collection("mensages").insertOne({
            from:user,
            ...req.body,
            time:dayjs().format("hh:mm:ss")
        })
        console.log(req.body)
        
    }
    res.sendStatus(201)
})


app.get('/messages',async(req,res)=>{
    const { limit }=req.query;
    parseInt(limit)
    const messages_array=[]
    const { user }=req.headers
   
    // if(!limit){
        
    //         db.collection("mensages").find().toArray().then(item=>{
    //             res.send(item).status(200)
            
    //         })
    // }

    // else{
    //     db.collection("mensages").find().toArray().then(item=>{
    //         let item_reverse=item.reverse()
    //         for(let i=0;i<limit;i++){
    //             //res.send(item[i])
    //             messages_array.push(item_reverse[i])
    //         }
    //         res.send(messages_array)
            
    //     })
    // }

        //guardando resultado da coleção mensages na variavel all_messages
        const all_messages=await db.collection("mensages").find().toArray()
  
        //verificar quais mensagens podem ser vistas pelo usuario e armazando-as em messages_for_user
        const messages_for_user=all_messages.filter(item=>(item.to===user) || (item.to=='Todos') || (item.from==user))
        const arraylength=messages_for_user.length;
         const m=messages_for_user.slice(arraylength-limit)
            if(!limit){
                return res.send(messages_for_user)
            }
            else{
                res.send(m)
            }
    //res.send(all_messages)
})

app.post('/status',async(req,res)=>{
    const { user }=req.headers;
    let success=false

    //varificar se user está na lista de participantes:
    const participants_array=await db.collection("users").find().toArray();


    //Utilização da função some (retornando true ou false) caso o usuario esteja na coleção "users"
    const is_user=participants_array.some(item=>item.name===user);
    if(!is_user){
        res.status(404).send("participante não está na lista de participantes")
        return;
    }
    else{
        //caso o users esteja presente, realizamos a atualização com updateOne
        await db.collection("users").updateOne(
            {
                name:user //usar id?
            },
            {
                $set: {lastStatus:Date.now() }
            }
        )
        success=true;
    }
       
    if(success===true){
        return res.status(200).send("Tudo certo na rota status")

    }
})

//  setInterval(() => {
//     let right_now=Date.now();
//     let hour=dayjs().locale('pt-br').format("hh:mm:ss")

//     db.collection("users").find().toArray().then(item=>{
        
//         item.map(user=>{
//             const { from }=item;
//             if(right_now-user.lastStatus>10000){
//                db.collection("users").deleteOne(user)
//             }
//         })
        
//     })

// }, 15000);

async function RemoveUser(){
    const allUsers=await db.collection("users").find({}).toArray();
    let right_now=Date.now();

    try{
        //armazena usuarios inativos na variavel offlineUser
        const offlineUser=allUsers.filter((item)=>
        
        (right_now-item.lastStatus)>10000
    )

        //para cada usuario inativo, deletamos o usuario e enviamos a mensagem de saida
    offlineUser.forEach(async user=>{
        await db.collection("users").deleteOne({ id:user.id })
        await db.collection("mensages").insertOne({
            from: user.name,
            to: 'Todos',
            text: 'sai da sala...',
            type:'status',
            time:dayjs().locale('pt-br').format("hh:mm:ss")
        })
    })
    }

    catch(err){
        console.log(err)
    }
}

setInterval(RemoveUser, 15000);

app.listen(5000)