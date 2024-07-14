import connectDB from "./db/index.js";
import "dotenv/config";
import { app } from "./app.js";

connectDB()
.then(() => {
    app.listen(process.env.PORT || 4000, () => {
        console.log(`Server started successfully on port ${process.env.PORT || 4000}`);
    })
})
.catch((error) => {
    console.log("MongoDB connection failed!!", error);
})