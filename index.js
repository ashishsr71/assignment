const express=require("express");
const pool = require("./config/database.config");
const z=require("zod")
require("dotenv").config();


const app=express();

app.use(express.json());
app.post("/addSchool",async(req,res)=>{
   
    const body=z.object({
        name:z.string({message:"name must be string"}),
        address:z.string({message:"address must be a string"}),
        latitude:z.number().refine(lati=>lati %1 !==0,{
            message:"latitude must be a float "
        }),
        longitude:z.number().refine(long=>long % 1 !==0,{
            message:"longtitude must be a string"
        }),
        });

try {
    const result=body.safeParse(req.body);
    
    if(result.success){
         const {name,address,latitude,longitude}=req.body;
        
       const query = `INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)`;
       
    const [r]= await  pool.execute(query,[name,address,latitude,longitude]);
    return res.status(200).json({msg:"school saved succesfully"})
      
    }else{
        return res.status(400).json({msg:result.error.errors[0].code})
    }
} catch (error) {
    console.log(error)
    res.status(500).json({msg:"internal server error"})
}

});



app.get('/listSchools',async(req,res)=>{
    const { latitude, longitude } = req.query;
     if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }
  const lat=parseFloat(latitude);
  const lon=parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Latitude and longitude must be valid numbers' });
  };

    try {
         const query = `
      SELECT
        id,
        name,
        address,
        latitude,
        longitude,
        (
          6371 * acos(
            cos(radians(?)) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians(?)) +
            sin(radians(?)) *
            sin(radians(latitude))
          )
        ) AS distance
      FROM schools
      ORDER BY distance ASC;
    `;
        const [schools]=await pool.execute(query,[lat,lon,lat]);
        res.status(200).json(schools);
    } catch (error) {
        res.status(500).json({msg:"internal server error"})
    }


})


const port=process.env.PORT||3000;

app.listen(port,()=>{
    console.log(`Server is listening on ${port}`);
});