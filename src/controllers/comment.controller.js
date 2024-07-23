import mongoose, {isValidObjectId} from "mongoose"
import { Video } from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
        
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"Invalid videoId ")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "video not found");
    }
    const comment = await Comment.aggregate([
        {
            $match: new mongoose.Types.ObjectId(videoId)
        },
    ])
    
    Comment.aggregatePaginate(comment,{
        page,
        limit
    })
    .then((result)=>{
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {comment},
            "Comment fetched successfully"
        ))
        
    })
    .catch((err)=>{
        throw new ApiError(500,"Cnanot get comments")
    })


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content}  = req.body
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"Invalid videoId ")
    }
    if (!isValidObjectId(content)) {
        throw new ApiError(400,"Invalid videoId ")
    }
    // find video in db to comment
    const video = await Video.findById({
        _id : videoId
    })
    
//    write comment
   const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id
   })


   if (!comment) {
    throw new ApiError(500,"Something went wrong to add the comment")
   }
   return res
   .status(200)
   .json(
    200,
    comment,
    "Comment write successfully"
   )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {content} = req.body
    const{commentId} = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400,"Comment not found")
    }
    
    if (!content) {
        throw new ApiError(400,"Content is important to update comment")
    }
    
    // find comment to update

    const comment = await Comment.findByIdAndUpdate(
         commentId,
         {
            $set:{
                content
            }
         },{new:true}
        
    )
    return res
    .status(200)
    .json(
        200,
        comment,
        "Comment update successfully"
    )






})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}  = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400,"comment not found")
    }

    // find comment in db
    const comment  =  await Comment.findByIdAndDelete(commentId,
        {new: true}

    )
     return res
     .status(200)
     .json(
        200,
        comment,
        "Comment deleted successfully"
     )
    
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
