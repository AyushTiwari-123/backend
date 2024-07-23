import multer from "multer";
const storage = multer.diskStorage({
    destination: function (req, file, cb) { //dekho req jo h jaise json wgera ye to hmlog configure kr lete h pr file (audio, video,pdf , images etc) iske lie multer use kr rhe h
      cb(null, "./public/temp") //cb(call back) 
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  
  export const upload = multer({ 
    storage,
 })