// require('dotenv').config()
// hm ye chate h ki jitna jldi hmari application load ho utna hi jldi sare envronment variable hrr jgh load ho jane chahiye
// to isiliye jo first file load ho rhi h hm chahte h ussi m hmare env variavle load ho jay
import dotenv from "dotenv"

import connecctDB from  "./db/index.js"
import {app} from "./app.js"
dotenv.config({
    path:'./.env'
})


connecctDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{ //hmari app n database ka use krte hue listen krna suru kr dia h uske lie (app.listen)
      console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
 console.log("MONGO DB coonection failed")
})





























































// Aprorach 1 


// import express from "express"
// const app = express()
// iffe()()
// (ye function h)(isko turnt execute kr do )


// (async ()=>{
//     try{
//         mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         app.on("error",(e)=>{
//             console.log("err",e)
//             throw e
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })
//     }
//     catch (e){
//         console.error("ERROR :",e)
//         throw e
//     }
// })()