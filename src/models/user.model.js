import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
// direct encryption krna possible ni h isiliye hmlog ko help leni pdti h mongoose ki hooks ki(eg: pre,post)
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true //search kne m easy ho jyga
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,

    },
    fullname: {
        type: String,

        unique: true,

        trim: true,
        index: true //search kne m easy ho jyga
    },
    avatar:{
        type:String, //cloudanary url
        required:true
    },
    coverImage:{
        type:String, //cloudanary url
        
    },
    watchHistory:{
        type:Schema.Types.ObjectId, 
        ref:"Video"
    },
    password:{
        type:String, 
        required:[true, "Pass is important"]
    },
    refreshToken:{
        type:String,
    },
   



},
{
    timestamps:true,
}
)
// normal function k pas this ka refrence context hota h isiliye hmlog normal function use krte h
userSchema.pre("save", async function (next){
    if (!this.isModified("password")) return next(); 
        
    this.password = await bcrypt.hash(this.password,10)
    next()
})
// methods : methods hme bhoot sare method methods bnane ka facilities deta h (.) lgate jao method bnate jao
// compare : ye method 2 value leta h ek string value jo user bjejega aur ek jo database m store h aur true aur false value return krta h 
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}
// sign: jwt ka ek method h jo token create krta h aur information leta h , Access token leta h , object leta h jisme access token ki expiry 
// _id is naomal name , key ka nam h bs
// this._id =  databse se aa rha h
// ye method access token generate krta h aur fir hmlog usko return krwa lete h
userSchema.methods.generateAccessToken= function(){
    return jwt.sign({
        _id:this._id,
        email: this.email,
        username:this.username,
        fullname:this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}

userSchema.methods.generateRefreshToken= function(){
    return jwt.sign({
        _id: this._id,
    
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}
export const User = mongoose.model("User", userSchema)