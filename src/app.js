import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser" //iska kam ye h ki mai apne server jo user ka browser h n uske andr ki ncookie access kr apu aur set bji kr pau
const app = express()
// confriguation of cors 
// ye sb confriguation hmlog app bnne krte h tbhi to app.use , app.get use krte h 
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))
// dekho data bhoot jgh se ayega koi url pe request bhejega,koi body pe request bhjega, koi dat json m bhegea, koi form m bhejega to uske lie setting krna hoga :-
app.use(express.json({limit: "16kb"})) //form bhrege to data ese lenge
app.use(express.urlencoded({extended:true,limit:"16kb"}))  //url m jb bhi data ja rha h 
app.use(express.static("public"))
app.use(cookieParser()) //cookieParser jo h hme allow krtwata h req and res k pas access hota h cookie ka 


// routes import
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
// routes declaration
// app.get phle hmlog aese kr lete the ab isliye ni kr pyge kyuki ab routes alg jgh h aur controller alg 
// ab router ko lane k lie middleware lana pdega (app.get k jgh app.use krege)
app.use("/api/v1/users",userRouter) // jaise hi koi user type krega /users to app control de doge userRouter ko ab user router jyga user router file m aur bolega kis route pe user ko leke jna h

// http://localhost:8000/api/user/register


app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)
export {app}