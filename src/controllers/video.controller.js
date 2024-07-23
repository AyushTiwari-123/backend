import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadFileOnCloudinary } from "../utils/cloudinary.js"
import { json } from "express"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination
 
    const pipeline = []
    // find user
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }
    const user = await User.findById({
        _id: userId
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }
//based on userId

    if (userId) {

        pipeline.push({
            $match: new mongoose.Types.ObjectId(userId)
        })
    }

    // based on query
    if (query) {
        $match:{
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        }
    }
    // based on sortby
    if (sortBy && sortType) {
      const sortTypeVal =   sortType==='desc'?-1:1
      pipeline.push({
        $sort:{sortBy:[sortTypeVal]}
      })
    } 

 pipeline.push({
    $lookup:{
        from:"users",
        localField:"owner",
        foreignField:"_id",
        as:"video",
        pipeline:[
            {
                $project:{
                    username:1,
                    avatar:1,
                    fullname:1
                }
            }
        ]
    },

    
    
 })

 const video  = await Video.aggregate(pipeline)

 Video.aggregatePaginate(video,{page,limit})
 .then(function(result){
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {result},
        "Get all video"
    ))
    .catch(function(err){
        throw new ApiError(500,"something went wrong to get the video")
    })
 })
    



})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, discription } = req.body
    // TODO: get video, upload to cloudinary, create video
    if (
        [title, discription].some((field) =>
            field?.trim() === ""
        )) {
        throw new ApiError(400, "All field is neccesary")
    }
    // get a video(upload on multer)
    const videoLocalPath = req.files?.videofile[0]?.path;
    const thumbnailLoaclPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Problem on uploading in multer")
    }
    if (!thumbnailLoaclPath) {
        throw new ApiError(400, "Probleem on uploading on multer thumbanail")
    }
    // upload on cloudinairy
    const videoFile = uploadFileOnCloudinary(videoLocalPath)
    const thumbnail = uploadFileOnCloudinary(thumbnailLoaclPath)

    if (!videoFile) {
        throw new ApiError(400, "Video is required")
    }
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const video = await Video.create({
        videoFile: {
            public_id: videoFile?.public_id,
            url: videoFile?.url
        },
        thumbnail: {
            public_id: thumbnail?.public_id,
            url: thumbnail?.url
        },
        title,
        discription,
        duration: videoFile?.duration,
        owner: req.user._id,
    })

    if (!video) {
        throw new ApiError(500, "Something went wrong while storing video on database")
    }
    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                video,
                "video uploaded successfully"
            )
        )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "VideoId is not correct")
    }

    const video = await Video.findById({
        _id: videoId
    })
    if (!video) {
        throw new ApiError(404, "Video is not present")
    }
    return res
        .status(200)
        .json(
            200,
            video,
            "Video fetched successfully"
        )


})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, discription } = req.body
    const { thumbnailLoaclPath } = req.files?.path
    //TODO: update video details like title, description, thumbnail
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "not valid videoId")
    }
    if (!(!title || title?.trim() === "") || !(!discription || discription?.trim() === "")) {
        throw new ApiError("Field required to update")
    }
    if (!thumbnailLoaclPath) {
        throw new ApiError("Thumbail url is required to update")
    }
    const thumbnail = await uploadFileOnCloudinary(thumbnailLoaclPath)
    if (!thumbnail.url) {
        throw new ApiError(400, "Error on uploaidng in cloudinairy")
    }

    //   find video

    let previousVideo = findById(
        {
            _id: videoId
        }
    )
    if (!previousVideo) {
        throw new ApiError(400, "Video not found")
    }
    let updateFields = {
        $set: {
            title,
            discription
        }
    }
    updateFields.$set = {
        public_id: thumbnail.public_id,
        url: thumbnail.url
    }
    const video = await Video.findByIdAndUpdate(
        videoId,
        updateFields,
        {
            new: true
        }
    )
    if (!video) {
        throw new ApiError(400, "Something went wrong while updating the video")

    }

    return res
        .status(200)
        .json(
            200,
            video,
            "Video update successfully"
        )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (isValidObjectId(videoId)) {
        throw new ApiError(400, "VideoId is wrong")
    }

    // find video in db
    const video = await Video.findById(
        {
            _id: videoId
        }
    )

    if (!video) {
        throw new ApiError(400, "Video is not in database")
    }

    // only owner can delete video
    if (video.owner.toString() != req.user._id.toString()) {
        throw new ApiError(40, "You dont have permission to dele the video")
    }

    if (!video.thumbnail) {
        throw new ApiError(40, "Please provide thumbnail to delete")
    }

    // delete video
    if (video.videoFile) {

    }

    // delete thumbnail
    if (video.thumbnail) {

    }
    const deleteResponse = await Video.findOneAndDelete(videoId)
    if (!deleteResponse) {
        throw new ApiError(40, "Somethng went wrong while deleting the video")
    }
    return res
        .status(200),
        json(
            200,
            deleteResponse,
            "Video delete successfully"
        )





})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "videoId is missing")
    }

    // find video in db
    const video = await Video.findById({
        _id: videoId
    })

    if (!video) {
        throw new ApiError(400, "Video is not there")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to toggle this video!")
    }
    //   toggle
    video.isPublished = !video.isPublished

    await video.save({ validateBeforeSave: false })
    return res
        .status(200)
        .json(
            200,
            video,
            "Video toggle successfully"
        )




})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}