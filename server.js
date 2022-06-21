import express from 'express'
import dotenv from 'dotenv'
import cors from "cors";
import authSchema from './validation/validation_schema.js'


//dotenv=dotenv.config()
//npm run devStart
const app=express();
app.use(cors());
app.use(express.json())

app.get('/',(req,res)=>{
    res.send('oi')
})

app.post('/participants',async(req,res)=>{
    
        //const {name}=req.body;
        try{
             //validação dos dados:
            const result=await authSchema.validateAsync(req.body)
            console.log(result)
        }
       catch (err){
        console.log(err)
       }   
})

app.listen(5000)