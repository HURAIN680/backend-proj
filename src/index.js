import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { DB_NAME } from "./constants.js";

dotenv.config({
    path: "./config/.env"
});


connectDB();



/*
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (err) => {
            console.error("Failed to connect to MongoDB", err);
            throw err;
        });
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.error("Error connecting to MongoDB", error);
        throw error;
    }
})();
*/