import mongoose, { Types } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
 

    const totalLikes = await Like.aggregate([
        {
            $match:new mongoose.Types.ObjectId(req.user._id)
        },
        {
            $group:{
                _id:null,
                totalVideoLike:{
                    $sum:{
                        $cond:[
                            {ifNull:["$video", false]},
                            1,
                            0
                        ]

                        
                    }
                },
                totalTweetLike:{
                    $sum:{
                        $cond:[
                            {ifNull:["$tweet",false]},
                            1,
                            0
                        ]
                    }
                },
                totalCommentLikes:{
                    $sum:{
                        $cond:[
                            {ifNull:["$comment",false]},
                            1,
                            0
                        ]
                    }
                }
            }
        }

        
    ])

    const totalSubscriber = await Subscription.aggregate([
        {
            $match:new mongoose.Types.ObjectId(req.user?._id)
        },
      
       {
        $count: "totalSubscriber"
       } 
    ])
    const totalVideo = await Video.aggregate([
        {
            $group:new mongoose.Types.ObjectId(req.user?._id)
        },
        {
            $count:"Total video on channel "
        }
    ])
    const totalView = await Video.aggregate([
        {
            $match: new mongoose.Types.ObjectId(req.user._id)
        },
        {
            $group:{
                _id:null,
                totalVideoView:{$sum:"$view"}
            }
        }
    ])
    
const channelStats = {
    totalLikes: totalLikes[0]?.totalLikes || 0,
    totalSubscriber:totalSubscriber[0]?.totalSubscriber,
    totalVideo:totalVideo[0]?.totalVideo,
    totalView:totalView[0]?.totalView,


}
return res
.status(200)
.json(
    new ApiResponse(200,{channelStats},"Stats fetched successfully")
)
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const {userId}= req.user?._id
   const allVideos = await Video.findById({
    owner: req.user?._id
   })
   if (!allVideos) {
    throw new ApiError(500,"Not find videos")
   }

   return res
   .status(200)
   .json(new ApiResponse(
    200,
    {allVideos},
    "Videos fetched successfully"
   ))

    
})

export {
    getChannelStats, 
    getChannelVideos
    }