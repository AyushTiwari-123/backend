// iska kam ye h ki ye ek method bnayga aur usko export kr dega
// hmlog database se bhoot bat krege isiliye usko uske krege iska wrapper lga denge

// DEKHO JB BHI YO METHOD USE KRNA H JHA PE TYM LGE YA PROMISES USE YA HMLOG KO DATABASE SE BAT KRNA HOGA YHA PE HM,LOG YE MEETHOD CLL KR DENGE
// is method k aparameter m hmlog function bhejege(higher order function h)
// requestHandler ek function h mtlb bs iska nam requestHandler hai 
const asyncHandler = (requestHandler)=>{
return (req,res,next)=>{
    Promise.resolve(requestHandler(req,res,next)).catch((err) =>next(err))
}

}

export {asyncHandler}

