
import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"Video not found ")
    }
    let likeVideo
    let dislikeVideo

    // find video to like and dislike
    const video = await Video.findById({
        _id : videoId
    })
    if (!video) {
     throw new ApiError(400,"Dont have video")   
    }
   
    const isLiked = await Like.findById(req.user._id)

    if (isLiked) {
        dislikeVideo = await Like.findByIdAndDelete(req.user._id)
        return res
        .status(200)
        .json(
            200,
            
            "video dislike successfully"
        )
    }
    else{
        likeVideo = await Like.create({
            video:videoId,
            likedBy:req.user?._id
        })

       if (!likeVideo) {
        throw new ApiError(400,"Something went wrong to like the video")
       }
       return res
       .status(200)
       .json(
           200,
           
           "Video liked successfully"
       )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
      //TODO: toggle like on video
      if (!isValidObjectId(commentId)) {
        throw new ApiError(400,"comment not found ")
    }
     let likeComment
     let dislikeComment

    // find comment liked or not 
    const isLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if (isLiked) {
        dislikeComment = await Like.findOneAndDelete({
            comment:commentId,
            likedBy:req.user._id
        })
        return res
        .status(200)
        .json(
            200,
            
            "comment dislike successfully"
        )
    }

    else{
        likeComment = await Like.create({ 
            comment:commentId,
            likedBy:req.user?._id
    })
    return res
    .status(200)
    .json(
        200,
        
        "comment like successfully"
    )
    }
    

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400,"tweet not found ")
    }

    // find tweet like or not
    const isLiked = await Like.findOne({
        tweet: tweetId,
        likedBy:req.user._id
    })
   let liketweet
   let disliketweet

    if (isLiked) {
        disliketweet = await Like.findOneAndDelete({
            tweet: tweetId,
            likedBy:req.user._id
        })
        return res
        .status(200)
        .json(
            200,
            
            "comment dislike successfully"
        )
    }
    else{
        liketweet = await Like.create({
            tweet: tweetId,
            likedBy:req.user._id
        })
        return res
        .status(200)
        .json(
            200,
            
            "tweet like successfully"
        )
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const {userId}  = req.user._id

    // find video which is like 
    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(userId)
            }
        },

        {
          $lookup:{
            from :"videos",
            localField:"video",
            foreignField:"_id",
            as:"likedVideos",
           pipeline:[{
            $lookup:{

                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"videoOwner",
                pipeline:[{
                    $project:{
                        fullname:1,
                        username:1,
                        avatar:1
                    }
                }]
            }
           }]
          }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideos,
            "Get all videos successfully"
        )
    )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
