// step 1:- SERVER SE TO FILE AA CHUKI H
// STEP2:-ab server se app mujhe loacl path doge aur mai uss file ko cloudnairy pe upload kr dunga
// step 3:- at last hmlog us file ko local storage se delete kr denge
//  :- unlink mtlb delete in file system bina koi prlm create kie after successfully upload on cloudinary
import {v2 as cloudinary} from "cloudinary"
import fs from "fs" //file system h, node k andr milta h, help krta h read write remove etc file system ko

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDNAIRY_API_SECRET,
});

// ek method bna lenge uske parameter m hmlog local sile storage ka path denge aur successfully upload ho gya cloudinary pe to usko unkink kr denge
const uploadFileOnCloudinary = async (loacalFilePath)=>{
    try {
        if(!loacalFilePath) return null;
        // upload file on cloudinary
        const response= await cloudinary.uploader.upload(loacalFilePath , {
            resource_type: "auto" //resource_type:- kon sa file h audio h, video h , pdf h ,etc {auto mtlb apne se detect krlo kya h}
        })
        fs.unlinkSync(loacalFilePath)
        return response;
    } catch (error) {
        // agr file upload ni hua h clouda.. pe kisi prlm k wjh se to hmlog usko local storage ya server se to hta denge kyuki bhoot file aa jygi
        fs.unlinkSync(loacalFilePath) // synchonous way m htyge
        // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}
const deleteFileOnCloudinary = async (loacalFilePath) =>{
    cloudinary.uploader.destroy('sample', function(result) { console.log(result) });
}
export {uploadFileOnCloudinary}