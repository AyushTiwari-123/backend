
import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { json } from "express"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body

    if (!content) {
        throw new ApiError(400,"Content is required to create a tweet")
    }
    const tweet  = await Tweet.create({
        content,
        owner : req.user._id, 
    })

    if (!tweet) {
        throw new ApiError(500,"Tweet is not created")
    }

    return res
    .status(201)
    .json(
        200,
        tweet,
        "Tweet created successfully"
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(404,"Invalid tweetId")
    }

    const user = await Tweet.findById({
        _id: userId
    })

    if (!user) {
        throw new ApiError(400,"Tweet is missing")
    }
    // match and find all the tweets
    const tweet  = await Tweet.aggregate([
        {
            $match:{
                owner: user._id
            }
        },
        {
            $project:{
                content:1
            }
        }
    ])

    if (!tweet) {
        throw new ApiError(500,"Cannot find tweets")
    }
    return res
    .status(200)
    .json(
        200,
        user,
        "Tweet fetched successfully"
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {content} = req.body
    const {tweetId} = req.params

    if (!content) {
        throw new ApiError(404,"content is required to update")
    }
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404,"Invalid tweetId")
    }
//    able to update a tweet or not
    if (!tweet.owner.toString() != req.user._id.toString()) {
        throw new ApiError(403,"Not able to update a tweet")
    }
    const tweet = await findById(
        tweetId,
        {
        $set:{
            content
        }
         
    },
    { new:true })

   return res
   .status(200),
   json(
    200,
    tweet,
    " Tweet updated successfully"
   )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}  = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404,"Not valid tweetId to delete")
    }

    // find tweet in databse
    const tweet  = await Tweet.findById({
        _id: tweetId
    })
    if (!tweet) {
        throw new ApiError(400,"Cannot find tweet")
    }
    // able to delete a tweet or not
    if (tweet.owner.toString() != req.user._id.toString()) {
        throw new ApiError(400,"Not able to delete the tweet")
    }

    // find tweet to delete
   const deleteResponse  = await Tweet.findOneAndDelete(tweetId)

   if (!deleteResponse) {
    throw new ApiError(404,"Tweet is not deleted")
   }
 return res
 .status(200)
 .json(
    200,
    deleteResponse,
    "Tweet deleted successfully"
 )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
