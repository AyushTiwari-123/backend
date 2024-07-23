import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400,"channelId is important")
    }
    
    // find channel to toggle
    const channel = await Subscription.findById({
        _id: channelId
    })
    
    if (!channel) {
        throw new ApiError(400,"channel does not exist")
    }

    let subscribe
    let unsubscribe

    const isSubscribed  = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id
    })
    if (isSubscribed) {
        unsubscribe  = await Subscription.findOneAndDelete({
            channel: channelId,
        subscriber: req.user?._id
        })

        if (!unsubscribe) {
            throw new ApiError(404,"Something went wrong to unsubscribe")
        }

        return res
        .status(200)
        .json(
            200,
            unsubscribe,
            "Channel unsubscribe successfully"
        )
    }
    else{
        // subscribe 
        subscribe = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })

        if(!subscribe){
            throw new ApiError(500, "something went wrong while subscribe the channel")
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                subscribe,
                "channel subscribe successfully!!"
            )
        )
    }
   


})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) {
      throw new ApiError(400,"Invalid channelId")  
    }

    const subscription = await Subscription.aggregate([
        {
            $match:{
                channel : new mongoose.Types.ObjectId(channelId)
            }

        },

        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
                pipeline: [
                    {
                        $project:{
                            fullname:1,
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        200,
        subscription[0].su,
        "Subscriber count fetched"
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400,"Invalid subscriberId")
    }

    const subscription = await Subscription.aggregate([
        {
            $match:{
                subscriber : new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from : "users",
                localField:"channel",
                foreignField:"_id",
                as:"channelList",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        }
    ])
return res
.status(200),
json(
    200,
    channelList,
    "Subscribed channel fetced succesfully"
)
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}