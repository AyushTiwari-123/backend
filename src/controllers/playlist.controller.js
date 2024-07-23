import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, discription } = req.body
    const { videoId } = req.params

    //TODO: create playlist
    if (
        [name, discription].some((field) =>
            field?.trim() === ""
        )) {
        throw new ApiError(400, "All field is neccesary")
    }

    const playlist = await Playlist.create({
        name,
        discription,
        videos: videoId,
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError(500, "Something wet wrong to vcreate a playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlist created successfully"
            )
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "UserId not correct")
    }
    const playlist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [{
                    $project: {
                        thumbnail: 1,
                        title: 1,
                        discription: 1,
                        duration: 1,
                        view: 1,


                    }
                }]
            }

        },

    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist fetched successfully")
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "playlistId not correct")
    }

    // find playlist by id
    const playlist = await Playlist.findById({
        _id: playlistId
    })
    if (!playlist) {
        throw new ApiError(500, "Something went wrong to find playlist")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200,
                playlist,
                "Playlist fetched by Id"
            )
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "playlistId not correct")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "videodd not correct")
    }

    // find playlist where we add video

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Not found playlist")
    }
    //    find video to add into playlist
    const video = await Playlist.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Not found playlist")
    }

    // you are able to add video in playlist or not
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to add video in this playlist!");
    }

    // add video to playlist 
    const addVideoToPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $push: {
            video: videoId
        }

    }, { new: true })

    return res
        .status(200)
        .json(
            new ApiResponse(200,
                addVideoToPlaylist,
                "video add to playlist successfully "
            )
        )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "playlistId not correct")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "videodd not correct")
    }

    // find playlist from where we remove video

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Not found playlist")
    }
    //    find video to remove from playlist
    const video = await Playlist.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Not found playlist")
    }

    // you are able to remove video in playlist or not
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to add video in this playlist!");
    }

    const removeVideoFromPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $pull: { video: videoId }
    })

    if (!removeVideoFromPlaylist) {
        throw new ApiError(500, "Video not remove from playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "videp remove successfully")
        )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "playlistId not correct")
    }
    // find playlist to delete
    const deletePlaylist = await Playlist.findByIdAndDelete({
        _id:playlistId
    })

    if (!deletePlaylist) {
        throw new ApiError(500,"Unable to delete playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "playlist remove successfully")
    )
   


})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, discription } = req.body
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "playlistId not correct")
    }

    if (!(name || discription)) {
        throw new ApiError(400,"Require field to update")
    }

   const playlist = await findByIdAndUpdate(playlistId,{
        $set:{
            name,
            discription
        }
    },{new:true}
)
return res
.status(200)
.json(
    new ApiResponse(200, {playlist}, "playlist remove successfully")
)

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}