import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js" //error throw krne k lie isko import kie h
import { User } from "../models/user.model.js" // ye user databse se direct contact kr skta h kyuki ye mongoose k through bna h jitne bar hme chahiye utni bar ye bat kr lega mongoose se 
import { uploadFileOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"; //response bhejne k lie
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
// 5. (login) generate acc and ref token
// refresh token aur access token bs isliye use krte h kyuki user ko bar bar apna email aur password na dena pde
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        //    add refreshtoken into databse 
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false }) // validation mt lgao sidha save kr do ni to kidi hone lgta h password kickin hone lgta h
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while genrating tokens ")
    }
}
const registerUser = asyncHandler(async (req, res) => {
    //1. take details of user from frontend
    // 2.validation (not empty)  
    // 3. check if user already exist
    // 4. check for images , check for avatar
    // 5. upload them to cloudinary(specilaay avatar)
    // 6. create user object - CREATE ENTRY iN DB (kyuki noSQL(MongoDB) databse h to object hi jyada bnay jate h)
    // 7. remove password , refreshtoken from response 
    // 8. check for user creation 

    // 9. return response 


    // 1. take detail
    const { fullname, username, email, password } = req.body //form data and json data directly hmlog ko req.body se mil jyga
    //  2. validation
    if (
        [fullname, email, username, password].some((field) =>
            field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are neccesarry")
    }
    // 3. user already exist
    const existedUser = await User.findOne({ //findOne- isme se jo phle milega usko return kr dega  
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //  4. check for images 
    // req.files - ye hme middleware k wjs se milta h req k andr extra property add kr deta h 
    // multer hme req.files ka access de deta h jo 
    // [0]- first property leta h jisme ek object milta h 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //    const coverImageLocalPath= req.files?.coverimage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is important ")
    }
    //  5.Upload on cloudinary
    const avatar = await uploadFileOnCloudinary(avatarLocalPath)
    const coverImage = await uploadFileOnCloudinary(coverImageLocalPath)

    // checking avatar specillay is that uploaded successfully
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    // 6. make object (sara kam hone k bad database m entry marne k lie object bnate h )
    // isiliye hmlog User se bolege kyuki hi bs databse se bat kr rha h
    const user = await User.create({ // yhi(databse) create krega kyuki yhi(User) hi databse se bat kr rha h
        // create ek method h jo database m entry krata h aur ek object leta h
        fullname,
        avatar: avatar.url,  //(shirf url store krayge kyuki aese pura avatar m bhoot kuch hota h) ,(ye compulsory hai kyuki hmlog upr check kie h)
        coverImage: coverImage?.url || "", //agr cover image h to url dedo agr ni h to empty chor do
        email,
        password,
        username: username.toLowerCase()
        // user create ho gya aur uski entry bhi ho gyi database m
    })
    // 7 & 8 (remove password and check for user creation)
    // check the user created or not or entry happen or not 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken")
    //findById-agr user milta h to user create hua h ni to  ni hua h
    //select - agr user mil gya h to jo jo field ni chahiye usko hta do


    if (!createdUser) {
        throw new ApiError(500, "Error during registering the user ")
    }
    // 9. response sending 
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User register successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // 1. taking details
    // 2. username or email (kisse login krway)
    // 3. find the user
    //4. password check
    //5. access and refresh token generate 
    // 6. send cookie

    // 1. taking detail
    const { email, username, password } = req.body


    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    // 2.
    const user = await User.findOne({

        $or: [{ username }, { email }] // ya to username dundh do ya to email dundh do
    })
    if (!user) {
        throw new ApiError(404, "user does not exist")
    }
    // user hmara user hai jo hmlog n databse se wps(instance )lia h , hmara bnay hua method lgega 
    // User mongoose ka user ka to ispr bs mongoose k dia hua method lgega (eg: findOne)
    // 4. pass check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "invalid password")
    }
    // 5. acc and ref token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInuser = await User.findById(user._id).select("-password -refreshToken")

    // 6. send cookie
    // cookies bhete time hme kuch options desing krne pdte h
    const options = {
        // agrr hmlog isko true ni krege to isko koi bhi fronted se modify kr lega pr true krne k bad bs server se moidfy hoga

        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)//cookie bna h
        .cookie("refreshToken", refreshToken, options)//cookie bna h
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInuser, accessToken, refreshToken
                },
                "User loggedIn successfully"
            )
        )
})
// logout process
// cookie gyb kro
// access aur refresh token ko bhi htao
const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { // jo bhi change ya update krna h bta do
                refreshToken: 1
            }
        },
        {
            new: true //new value milegi
        }
    )
    const options = {
        // agrr hmlog isko true ni krege to isko koi bhi fronted se modify kr lega pr true krne k bad bs server se moidfy hoga

        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully "))
})
// ab frontend wala ek aur request bhej k token k nya le elta h to usko ek end point to dena pdega n yrr bs yhi krege hm abhi yha pe
// end point bnyge (access token aur refresh token nya bna lenge)----
const refreshAccessToken = asyncHandler(async (req, res) => {
    // refresh token hmlog cookie se access kr lenge 
    // agr koi mobile app use kr rha h to body se
    // incoming nam isiliye dia h ki hmare pas bhi to ek refesh token hai ye database wala ni h
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    // incoming token ko verification
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        // kon sa suer find krna h yo  decodedtoken m rkha hua h usme se id nikal lete h
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token ")
        }
        // match krege incoming refresh token aur jo decode krke hmlog n user find kia h uske pas bhi ek refresh token hoga un dono ko match kr lenge 
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
        //cookies m bhejna h isiliye hmlog options bnate h
        const options = {
            httpOnly: true,
            secure: true
        }

        // nya generate krke de denge agr match ho gya h to
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token refreshed"
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    //   sbse phle hme user chahiye hoga tbhi hmlog uske field m jake password verify kra pauga 
    // agr yo apna pssword bdl pa rha h to yo loggedin hai loggedIn kaise h kyuki midlleware lga h
    // middleware(authMidlleware) chla h to jrur se uske user.req m user h uske se user._id nikal lenge
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid pass")
    }

    user.password = newPassword //pass set hua
    await user.save({ validateBeforeSave: false }) // pass save ho rha h

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password change successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(200, req.user, "Current user fetched succssfully ")
})
// text update
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { email, fullname } = req.body;
    if (!(email || fullname)) {
        throw new ApiError(400, "All filed is important")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        { new: true } // updater hone k bad information milegi
    ).select("-password")
    return res
        .status
        .json(new ApiResponse(200, user, "Account details updated successfully"))

})

// files update
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path //multer pe upload file(image ya avatar) ho gya bhai
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file s missing")
    }
    const avatar = await uploadFileOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading file on cloudinary")
    }

    //   updatation
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url //avatar bhoiot bda hota h isliye pura avatar n bs url hi chnage ya update krege
            }
        },
        { new: true }

    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path //multer pe upload file(image ya avatar) ho gya bhai
    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage file s missing")
    }
    const coverImage = await uploadFileOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading file on cloudinary")
    }

    //   updatation
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url //avatar bhoiot bda hota h isliye pura avatar n bs url hi chnage ya update krege
            }
        },
        { new: true }

    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "CoverImage updated successfully")
    )
})
const getUserChannelProfile = asyncHandler( async (req, res)=>{
// jb apko kisi bhi channel ki profile chahiye to ap uss channel ki url(eg: / chai aur code) pe jate ho
// url se username le lia--
const {username} = req.params //url ka chuz access krne k lie hm params use krte h
if (!username?.trim) {
    throw new ApiError(400,"username is missing")
}

const channel = await User.aggregate([
    {
        $match: {
            username : username?.toLowerCase()
        }
    },
    {
        $lookup:{
            from : "subscriptions",
            localField: "_id",
            foreignField:"channel",
            as:"subscribers"
        }
    },
    {
        $lookup:{
            from : "subscriptions",
            localField: "_id",
            foreignField:"subscriber",
            as:"subscribedTo" //maine kitno ko subscribed kr rkha h
        }
    },
    // ye dono feld alg alg h ab in dono ko add krna hoga
    // user model k andr jitne h yo to rhege hi pr additional field bhi add kr dega 
    {
        $addFields: {
            subscriberCount: {
                $size: "$subscribers"
            },
            channelsSubscribedToCount:{
                $size: "subscribedTo"
            },
            isSubscribed:{
                $cond:{ //$in iska mtlb hai ki present hai ki ni
                    if: {$in: [req.user?._id, "$subscribers.subscriber"]},//isme hmlog ko dekhna h ki jo apke pas document aya h "subscriber" usme mai hu li ni
                    then: true,
                    else: false
                }
            }
        }
    },
    {   // jop jo value show krna h uske smne lekh denge 1 
        $project:{
            fullname: 1,
            username:1,
            subscriberCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1


        }
    }
])
// chsnnel hme array return krega isilie .length
if (!channel?.length) {
    throw new ApiError(404," channel does not exist")
}
return res
.status(200)
.json(
    new ApiResponse(200,channel[0],"user channel fetched successfully")
)
})

// watch history
const getWatchHistory = asyncHandler( async (req, res)=>{
const user = await User.aggregate([
    {
        $match: {
            _id: new mongoose.Types.ObjectId(req.user._id) //mongoose se bol rhe h ki objectId dede 
        }

    },
    {
        $lookup:{
            from: "videos",
            localField:"watchHistory",
            foreignField:"_id",
            as: "watchHistory",
            pipeline: [
                {
                    $lookup:{
                        from: "users",
                        localField:"owner",
                        foreignField:"_id",
                        as: "owner",
                        pipeline:[ //yja pe pipeline lgai h ki mtlb jojo project krna yha se owner field k andr chla jyga 
                            {
                                $project:{
                                    fullname: 1,
                                    username:1,
                                    avatar: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields:{ // kuch ni bs frontened k lie kr rhe h 
                        owner:{
                            $first: "$owner"
                        }
                    }
                }
            ]

        }
    }
])
return res 
.status(200)
.json(
    new ApiResponse(
        200,
        user[0].getWatchHistory,
        "watch history fetched successfully"
    )
)
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}